// src/linked-create.ts - „Einmal anlegen, überall verknüpfen“ (Idee Q1, docs/KONVENTIONEN.md „Anbindungen“).
//
// rsvp-app lässt ein Tool (Zeitplan, Schichten) ein Event zu einem Termin anlegen, das gleich mit ihm verknüpft ist -
// statt dass die Verwaltung auf beiden Seiten IDs einträgt. Nachrichten im Format von `signLinkMessage`, signiert mit
// dem Secret der Anbindung (rsvp-app `TIMELINE_SECRET` / Zeitplan `RSVP_TIMELINE_SECRET` usw.), per POST an
// `<Tool>/api/rsvp-create` (Body: die Nachricht als Text):
//
//   event-create-status { typ, aud, rsvpEventId, rsvpUserId, toolUserId, iat, exp }   - darf angelegt werden?
//   event-create        { typ, aud, rsvpEventId, rsvpUserId, toolUserId, title, startsAt, iat, exp }
//
// Das Event gehört dem Konto, das im Tool über den Konten-Verbund mit dem rsvp-app-Konto verknüpft ist - nie über die
// E-Mail: entweder hat das Tool eine ExternalIdentity (issuer rsvp-app, subject `rsvpUserId`), oder rsvp-app kennt das
// Konto im Tool aus einer vom Tool signierten Anmeldung (`toolUserId`). Ohne Verknüpfung entsteht nichts
// (`no-account` mit Anmelde-Link). Antwort immer 200 mit `LinkedCreateResult`; 401 ungültige Nachricht, 404 nicht
// eingerichtet, 413 zu groß. Wiederholungen sind harmlos: Gibt es schon ein Event zu diesem Termin, kommt es zurück
// (`linked`), sofern das Konto es verwalten darf (sonst `taken`).
import { signLinkMessage, verifyLinkMessage } from './link-message.js'

export const LINKED_CREATE_PATH = '/api/rsvp-create'
export const LINKED_CREATE_STATUS = 'event-create-status'
export const LINKED_CREATE = 'event-create'
/** Nachrichten werden sofort verarbeitet - eine Minute genügt. */
const TTL_SECONDS = 60
const ID = /^[a-z0-9]{10,40}$/
const USER_ID = /^[A-Za-z0-9_-]{1,100}$/
const TITLE_MAX = 200

export type LinkedCreateKind = typeof LINKED_CREATE_STATUS | typeof LINKED_CREATE

export type LinkedCreateRequest = {
  /** Event.id des Termins in rsvp-app */
  rsvpEventId: string
  /** Konto in rsvp-app, das anlegen lässt (subject seiner Anmeldungen bei anderen Tools) */
  rsvpUserId: string
  /** Konto im Tool, falls rsvp-app es aus einer Anmeldung über das Tool kennt */
  toolUserId: string | null
}

export type LinkedCreateMessage =
  | { kind: typeof LINKED_CREATE_STATUS; request: LinkedCreateRequest }
  | { kind: typeof LINKED_CREATE; request: LinkedCreateRequest; title: string; startsAt: Date }

export type LinkedCreateResult =
  | { status: 'ready' }
  | { status: 'created' | 'linked'; eventId: string; linkUrl: string; adminUrl: string }
  | { status: 'no-account'; loginUrl: string }
  | { status: 'no-permission' }
  | { status: 'taken' }

export function signLinkedCreate(
  message: LinkedCreateMessage, audience: string, secret: string, options: { now?: Date } = {}
): string {
  const fields: Record<string, unknown> = { ...message.request }
  if (message.kind === LINKED_CREATE) {
    fields.title = message.title
    fields.startsAt = message.startsAt.toISOString()
  }
  return signLinkMessage(message.kind, audience, fields, secret, { now: options.now, ttlSeconds: TTL_SECONDS })
}

function readRequest(payload: Record<string, unknown>): LinkedCreateRequest | null {
  const { rsvpEventId, rsvpUserId, toolUserId } = payload
  if (typeof rsvpEventId !== 'string' || !ID.test(rsvpEventId)) return null
  if (typeof rsvpUserId !== 'string' || !USER_ID.test(rsvpUserId)) return null
  if (toolUserId !== null && (typeof toolUserId !== 'string' || !USER_ID.test(toolUserId))) return null
  return { rsvpEventId, rsvpUserId, toolUserId }
}

/** Prüft eine Nachricht an `/api/rsvp-create` (beide Arten). `null` bei jedem Problem. */
export function verifyLinkedCreate(
  token: unknown, expect: { audience: string; secret: string | readonly (string | null | undefined)[]; now?: Date }
): LinkedCreateMessage | null {
  const options = { ...expect, maxTtlSeconds: TTL_SECONDS }
  const status = verifyLinkMessage(token, { ...options, typ: LINKED_CREATE_STATUS })
  if (status) {
    const request = readRequest(status)
    return request ? { kind: LINKED_CREATE_STATUS, request } : null
  }
  const create = verifyLinkMessage(token, { ...options, typ: LINKED_CREATE })
  if (!create) return null
  const request = readRequest(create)
  const { title, startsAt } = create
  if (!request || typeof title !== 'string' || typeof startsAt !== 'string' || startsAt.length > 40) return null
  const trimmed = title.trim()
  const date = new Date(startsAt)
  if (!trimmed || trimmed.length > TITLE_MAX || Number.isNaN(date.getTime())) return null
  return { kind: LINKED_CREATE, request, title: trimmed, startsAt: date }
}

function isUrlOf(value: unknown, origin: string): value is string {
  if (typeof value !== 'string' || value.length > 500) return false
  try {
    return new URL(value).origin === origin
  } catch {
    return false
  }
}

/**
 * Antwort des Tools prüfen (in rsvp-app): Alle Links müssen auf den erwarteten Origin des Tools zeigen, sonst ließe
 * ein falsch eingerichtetes oder fremdes Tool uns beliebige Links speichern bzw. anzeigen. `null` = unbrauchbar.
 */
export function readLinkedCreateResult(value: unknown, toolOrigin: string): LinkedCreateResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const r = value as Record<string, unknown>
  switch (r.status) {
    case 'ready':
    case 'no-permission':
    case 'taken':
      return { status: r.status }
    case 'no-account':
      return isUrlOf(r.loginUrl, toolOrigin) ? { status: 'no-account', loginUrl: r.loginUrl } : null
    case 'created':
    case 'linked':
      if (typeof r.eventId !== 'string' || !ID.test(r.eventId)) return null
      if (!isUrlOf(r.linkUrl, toolOrigin) || !isUrlOf(r.adminUrl, toolOrigin)) return null
      return { status: r.status, eventId: r.eventId, linkUrl: r.linkUrl, adminUrl: r.adminUrl }
    default:
      return null
  }
}

/**
 * Adresse aus dem Titel für ein angelegtes Event: Kleinbuchstaben, Ziffern, Bindestriche, mit Zufallsanhang (die
 * Verwaltung ändert sie danach nach Belieben). Das Tool prüft sie trotzdem mit seinen eigenen Regeln.
 */
export function linkedCreateSlug(title: string, random: string, maxLength = 60): string {
  const base = title.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const room = Math.max(1, maxLength - random.length - 1)
  const head = base.slice(0, room).replace(/-+$/, '') || 'event'
  return `${head}-${random}`
}
