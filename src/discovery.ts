// src/discovery.ts
import { readLimitedText } from '../web/body.js'
import { AUTHORIZE_PATH } from './authorize.js'
import { importPublicKey, type Signer } from './keys.js'
import { normalizeOrigin } from './origin.js'

/**
 * Discovery: Wie ein Tool einem anderen Tool sagt, wer es ist und mit welchen
 * öffentlichen Schlüsseln seine Login-Bestätigungen zu prüfen sind. Jedes Tool, das
 * Logins ausstellen kann, liefert dieses Dokument unter DISCOVERY_PATH aus. Ein
 * Empfänger-Tool muss dadurch nur die URL des Anbieters kennen (SUITE_IDPS), keine
 * Schlüssel kopieren - und bei einer Schlüsselrotation ändert sich dort nichts.
 *
 * Vertrauen kommt aus zwei Dingen zusammen: (1) die URL steht in der eigenen
 * Konfiguration des Empfängers (nie aus Nutzereingaben - kein SSRF), (2) sie wird per
 * HTTPS abgerufen. Das Dokument muss seinen eigenen Origin als `issuer` nennen, sonst
 * wird es verworfen.
 */

export const DISCOVERY_PATH = '/.well-known/suite-identity'

export type DiscoveryKey = { kid: string; alg: 'EdDSA'; publicKey: string }

export type DiscoveryDocument = {
  version: 1
  issuer: string
  name: string
  authorizeUrl: string
  keys: DiscoveryKey[]
}

/** Erster Signer = aktiver Schlüssel, weitere = noch gültige alte Schlüssel (Rotation). */
export function buildDiscoveryDocument(input: { issuer: string; name: string; signers: Signer[] }): DiscoveryDocument {
  return {
    version: 1,
    issuer: input.issuer,
    name: input.name,
    authorizeUrl: `${input.issuer}${AUTHORIZE_PATH}`,
    keys: input.signers.map(s => ({ kid: s.kid, alg: 'EdDSA' as const, publicKey: s.publicKey }))
  }
}

/** Validiert ein fremdes Dokument streng - gibt bei JEDER Abweichung null zurück. */
export function parseDiscoveryDocument(json: unknown, expectedIssuer: string): DiscoveryDocument | null {
  if (!json || typeof json !== 'object') return null
  const doc = json as Record<string, unknown>

  if (doc.version !== 1) return null
  if (typeof doc.issuer !== 'string' || normalizeOrigin(doc.issuer) !== expectedIssuer) return null
  if (typeof doc.name !== 'string' || !doc.name || doc.name.length > 100) return null

  // authorizeUrl muss auf denselben Origin zeigen - sonst könnte ein Dokument den
  // Login-Redirect (samt state) an eine fremde Adresse umleiten.
  if (typeof doc.authorizeUrl !== 'string') return null
  let authorize: URL
  try {
    authorize = new URL(doc.authorizeUrl)
  } catch {
    return null
  }
  if (authorize.origin !== expectedIssuer || authorize.search || authorize.hash) return null

  if (!Array.isArray(doc.keys) || doc.keys.length === 0 || doc.keys.length > 5) return null
  const keys: DiscoveryKey[] = []
  for (const entry of doc.keys) {
    if (!entry || typeof entry !== 'object') return null
    const { kid, alg, publicKey } = entry as Record<string, unknown>
    if (typeof kid !== 'string' || alg !== 'EdDSA' || typeof publicKey !== 'string') return null
    if (!importPublicKey(publicKey)) return null
    keys.push({ kid, alg: 'EdDSA', publicKey })
  }

  return { version: 1, issuer: expectedIssuer, name: doc.name, authorizeUrl: authorize.toString(), keys }
}

type CacheEntry = { doc: DiscoveryDocument; expiresAt: number }
const cache = new Map<string, CacheEntry>()
/** Bis wann ein Fehlschlag gilt - so lange kein neuer Abruf, sofort null. */
const failedUntil = new Map<string, number>()
/** Laufende Abrufe: gleichzeitige Aufrufe für denselben Anbieter teilen sich einen. */
const inFlight = new Map<string, Promise<DiscoveryDocument | null>>()
/** Wann zuletzt mit `force` neu geladen wurde (Bremse aus PROTOCOL.md, Sicherheitsregel 6). */
const lastForced = new Map<string, number>()

export type FetchDiscoveryOptions = {
  fetchImpl?: typeof fetch
  timeoutMs?: number
  cacheTtlMs?: number
  /**
   * Cache umgehen - nötig, wenn eine Bestätigung mit unbekannter `kid` kam (Rotation). Höchstens einmal pro Minute und
   * Anbieter; innerhalb der Minute zählt der Aufruf wie ohne `force`.
   */
  force?: boolean
}

const MAX_DOC_BYTES = 16 * 1024
/** Wie lange ein Fehlschlag gemerkt wird. */
export const DISCOVERY_FAILURE_TTL_MS = 30 * 1000
/** Mindestabstand zwischen zwei erzwungenen Abrufen je Anbieter. */
export const DISCOVERY_FORCE_INTERVAL_MS = 60 * 1000

/**
 * Lädt (und cached) das Discovery-Dokument eines Anbieters. Gibt null zurück, wenn der
 * Anbieter nicht erreichbar oder das Dokument ungültig ist - "Anbieter gerade nicht
 * da" darf ein Tool nie blockieren, der lokale Login bleibt davon unberührt.
 *
 * Gebremst, weil `/api/suite/login?idp=…` ohne Anmeldung aufrufbar ist und eine erfundene `kid` `force` auslöst:
 * Fehlschläge gelten 30 s (dann sofort null), gleichzeitige Aufrufe teilen sich einen Abruf, `force` lädt
 * höchstens einmal pro Minute und Anbieter neu. Gelesen werden höchstens 16 KiB.
 */
export async function fetchDiscovery(issuer: string, opts: FetchDiscoveryOptions = {}): Promise<DiscoveryDocument | null> {
  const origin = normalizeOrigin(issuer)
  if (!origin) return null

  const now = Date.now()
  let force = false
  if (opts.force && now - (lastForced.get(origin) ?? 0) >= DISCOVERY_FORCE_INTERVAL_MS) {
    lastForced.set(origin, now)
    force = true
  }

  const running = inFlight.get(origin)
  if (running) return running
  const cached = cache.get(origin)
  if (!force && cached && cached.expiresAt > now) return cached.doc
  if (!force && (failedUntil.get(origin) ?? 0) > now) return null

  const request = loadDiscovery(origin, opts).then(doc => {
    if (doc) {
      cache.set(origin, { doc, expiresAt: Date.now() + (opts.cacheTtlMs ?? 5 * 60 * 1000) })
      failedUntil.delete(origin)
    } else {
      failedUntil.set(origin, Date.now() + DISCOVERY_FAILURE_TTL_MS)
    }
    return doc
  }).finally(() => {
    if (inFlight.get(origin) === request) inFlight.delete(origin)
  })
  inFlight.set(origin, request)
  return request
}

async function loadDiscovery(origin: string, opts: FetchDiscoveryOptions): Promise<DiscoveryDocument | null> {
  try {
    const res = await (opts.fetchImpl ?? fetch)(`${origin}${DISCOVERY_PATH}`, {
      headers: { Accept: 'application/json' },
      // Keine Weiterleitungen folgen: ein Redirect auf einen anderen Host würde die
      // Origin-Bindung des Dokuments aushebeln.
      redirect: 'error',
      signal: AbortSignal.timeout(opts.timeoutMs ?? 5000)
    })
    if (!res.ok) {
      await res.body?.cancel().catch(() => {})
      return null
    }
    // Begrenzt lesen: ein Body ohne Ende darf den Empfänger nicht in die Speichergrenze treiben.
    const text = await readLimitedText(res, MAX_DOC_BYTES)
    if (text === null) return null
    return parseDiscoveryDocument(JSON.parse(text), origin)
  } catch {
    return null
  }
}

/** Nur für Tests. */
export function clearDiscoveryCache(): void {
  cache.clear()
  failedUntil.clear()
  inFlight.clear()
  lastForced.clear()
}
