// src/link-message.ts - Nachrichten zwischen zwei Tools mit gemeinsamem Secret (docs/KONVENTIONEN.md, „Anbindungen“).
//
// Format: `base64url(JSON).base64url(HMAC-SHA256(payloadPart, secret))`, Nutzlast `{ typ, aud, ...felder, iat, exp }`.
// `typ` hält die Nachrichtenarten einer Anbindung auseinander (eine Nachricht einer Art gilt nie als andere), `aud`
// ist der Origin des Empfängers (eine Nachricht an Tool A gilt nie bei Tool B, auch bei versehentlich gleichem
// Secret). Höchstens eine Stunde gültig, Standard zehn Minuten - gemessen vom Empfänger, nicht vom Absender.
import { createHmac } from 'node:crypto'
import { b64uDecode, b64uEncode } from './base64url.js'
import { safeEqual } from './secrets.js'

export const LINK_MESSAGE_DEFAULT_TTL_SECONDS = 600
export const LINK_MESSAGE_MAX_TTL_SECONDS = 3600
const CLOCK_SKEW_SECONDS = 60
/** Größere Nachrichten verschickt kein Tool; das Limit schützt vor teurem Parsen. */
const MAX_TOKEN_LENGTH = 4_000_000

const RESERVED = ['typ', 'aud', 'iat', 'exp'] as const

function mac(payloadPart: string, secret: string): string {
  return b64uEncode(createHmac('sha256', secret).update(payloadPart).digest())
}

/** Signiert `{ typ, aud, ...fields, iat, exp }`. `fields` darf keines der vier Pflichtfelder enthalten. */
export function signLinkMessage(
  typ: string,
  aud: string,
  fields: Record<string, unknown>,
  secret: string,
  options: { now?: Date; ttlSeconds?: number } = {}
): string {
  if (!secret) throw new Error('signLinkMessage: Secret fehlt')
  for (const key of RESERVED) if (key in fields) throw new Error(`signLinkMessage: Feld ${key} ist reserviert`)
  const iat = Math.floor((options.now ?? new Date()).getTime() / 1000)
  const ttl = Math.min(options.ttlSeconds ?? LINK_MESSAGE_DEFAULT_TTL_SECONDS, LINK_MESSAGE_MAX_TTL_SECONDS)
  const payloadPart = b64uEncode(JSON.stringify({ typ, aud, ...fields, iat, exp: iat + ttl }))
  return `${payloadPart}.${mac(payloadPart, secret)}`
}

export type LinkMessageExpectation = {
  typ: string
  /** Eigener Origin, z.B. `https://vote.example.de`. */
  audience: string
  /** Aktuelles Secret, beim Wechsel zusätzlich das vorige. Leere Einträge zählen nicht. */
  secret: string | readonly (string | null | undefined)[]
  now?: Date
}

/**
 * Prüft Signatur (konstante Laufzeit), `typ`, `aud` und die Gültigkeit. Gibt die Nutzlast zurück - die Felder je
 * Art prüft der Aufrufer. `null` bei jedem Problem: eine ungültige Nachricht ist erwartbar, kein Serverfehler.
 */
export function verifyLinkMessage(token: unknown, expect: LinkMessageExpectation): Record<string, unknown> | null {
  if (typeof token !== 'string' || token.length > MAX_TOKEN_LENGTH) return null
  const parts = token.trim().split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  const [payloadPart, signaturePart] = parts
  const secrets = (Array.isArray(expect.secret) ? expect.secret : [expect.secret]).filter((s): s is string => !!s)
  if (!secrets.some(secret => safeEqual(mac(payloadPart, secret), signaturePart))) return null

  const bytes = b64uDecode(payloadPart)
  if (!bytes) return null
  let payload: unknown
  try {
    payload = JSON.parse(bytes.toString('utf8'))
  } catch {
    return null
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const record = payload as Record<string, unknown>
  if (record.typ !== expect.typ || record.aud !== expect.audience) return null
  const { iat, exp } = record
  if (!Number.isInteger(iat) || !Number.isInteger(exp)) return null
  const now = Math.floor((expect.now ?? new Date()).getTime() / 1000)
  const issued = iat as number
  const expires = exp as number
  if (expires <= now || expires - now > LINK_MESSAGE_MAX_TTL_SECONDS) return null
  if (issued > now + CLOCK_SKEW_SECONDS || issued > expires) return null
  return record
}
