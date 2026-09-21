// src/authorize.ts
import { randomBytes } from 'node:crypto'
import { normalizeOrigin } from './origin.js'

/**
 * Der Redirect-Ablauf zwischen zwei Tools - framework-unabhängig, hier stecken nur die
 * Regeln (was ist eine gültige Anfrage, wohin darf zurückgeleitet werden). Cookies,
 * Sessions und Kontoanlage sind Sache der jeweiligen App.
 *
 *   1. Empfänger (RP) erzeugt `state`, legt ihn in ein Cookie im Browser und leitet zu
 *      `{Anbieter}/api/suite/authorize?app={RP-Origin}&state={state}` weiter.
 *   2. Anbieter (IdP): ist im Browser ein lokales Konto eingeloggt, stellt er eine
 *      Login-Bestätigung (assertion.ts) mit `nonce = state` aus und leitet zu
 *      `{RP-Origin}/api/suite/callback?assertion=...&state=...` zurück. Sonst zeigt er
 *      erst seinen normalen Login und setzt danach den Ablauf fort.
 *   3. Empfänger prüft Signatur, Audience und dass `nonce` zum `state` im Cookie des
 *      Browsers passt, löscht das Cookie (einmalig!) und legt seine eigene Session an.
 *
 * Die Bestätigung reist in der URL, ist aber ungefährlich, wenn sie abgegriffen wird
 * (Logs, Verlauf): sie ist nur 60 s gültig und ohne das state-Cookie desselben
 * Browsers wertlos.
 */

export const AUTHORIZE_PATH = '/api/suite/authorize'
export const CALLBACK_PATH = '/api/suite/callback'

const STATE_PATTERN = /^[A-Za-z0-9_-]{22,128}$/

export function randomState(): string {
  return randomBytes(32).toString('base64url')
}

/** RP-Seite: Adresse, zu der der Browser für den Login weitergeleitet wird. */
export function buildAuthorizeRequestUrl(authorizeUrl: string, input: { app: string; state: string }): string {
  const url = new URL(authorizeUrl)
  url.searchParams.set('app', input.app)
  url.searchParams.set('state', input.state)
  return url.toString()
}

export type AuthorizeRequest = {
  /** Origin des anfragenden Tools = `aud` der auszustellenden Bestätigung. */
  app: string
  state: string
}

export type AuthorizeRequestResult =
  | { ok: true; request: AuthorizeRequest }
  | { ok: false; reason: 'missing-params' | 'invalid-state' | 'untrusted-app' }

/**
 * IdP-Seite: prüft eine eingehende Anfrage. `trustedApps` ist die Allowlist der
 * Tools, die Bestätigungen empfangen dürfen (Env SUITE_TRUSTED_APPS) - eine
 * unbekannte `app` bekommt NIE eine Weiterleitung, sondern eine Fehlerseite, sonst
 * wäre der Endpunkt ein offener Redirect, der Bestätigungen an Fremde schickt.
 */
export function parseAuthorizeRequest(url: URL | string, trustedApps: string[]): AuthorizeRequestResult {
  const params = (typeof url === 'string' ? new URL(url) : url).searchParams
  const appParam = params.get('app')
  const state = params.get('state')
  if (!appParam || !state) return { ok: false, reason: 'missing-params' }
  if (!STATE_PATTERN.test(state)) return { ok: false, reason: 'invalid-state' }

  const app = normalizeOrigin(appParam)
  if (!app || !trustedApps.includes(app)) return { ok: false, reason: 'untrusted-app' }

  return { ok: true, request: { app, state } }
}

/** IdP-Seite: Rücksprung-Adresse - der Pfad ist fest, nur der Origin kommt aus der Allowlist. */
export function buildAuthorizeResponseUrl(request: AuthorizeRequest, assertion: string): string {
  const url = new URL(CALLBACK_PATH, request.app)
  url.searchParams.set('assertion', assertion)
  url.searchParams.set('state', request.state)
  return url.toString()
}

/**
 * Für den "wohin nach dem Login"-Parameter der eigenen App (nicht Teil des
 * Tool-zu-Tool-Protokolls): lässt nur relative Pfade der eigenen App zu. Alles andere
 * (`//evil.de`, `/\evil.de`, `https://...`) fällt auf `fallback` zurück - sonst wäre
 * der Login ein Open Redirect.
 */
export function sanitizeNextPath(value: string | null | undefined, fallback = '/'): string {
  if (!value || !value.startsWith('/')) return fallback
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (/[\u0000-\u001f]/.test(value)) return fallback
  return value
}
