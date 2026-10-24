// src/pow.ts - Bot-Schutz für öffentliche Formulare (Proof-of-Work), Teil für den Server. Nach dem Muster von ALTCHA:
// Der Server wählt eine Zufallszahl, gibt nur SHA-256(salt + zahl) samt HMAC heraus, der Browser probiert die Zahlen
// durch (web/pow.ts). Kein Drittanbieter, keine Cookies, keine Daten über die Person.
//
// Was es bringt: Ein Bot ohne JavaScript kommt nicht mehr durch, jeder Versuch kostet Rechenzeit, und eine Lösung gilt
// nur einmal. Gegen einen entschlossenen Angreifer, der die Aufgabe nachbaut, hilft es nur begrenzt (für ihn sind es
// Millisekunden) - die Drosselung pro IP und E-Mail bleibt deshalb bestehen.
//
// Schlüssel und verbrauchte Lösungen leben nur im Speicher des Prozesses: Nach einem Neustart gelten offene Aufgaben
// nicht mehr (die Seite holt sich dann eine neue), und eine alte Lösung kann nicht wiederverwendet werden.
import { createHash, createHmac, randomBytes, randomInt } from 'node:crypto'
import { safeEqual } from './secrets.js'
import { POW_FIELD, POW_MESSAGE, type PowChallenge } from '../web/pow.js'

export type { PowChallenge } from '../web/pow.js'

/** Voreinstellung: im Schnitt 25 000 Hashes, im Browser je nach Gerät etwa 0,1-1 s. */
export const POW_MAX_NUMBER = 50_000
/** So lange gilt eine Aufgabe. Die Formular-Komponente holt vorher eine neue. */
export const POW_TTL_MS = 10 * 60_000

type PowState = { key: Buffer; used: Map<string, number> }
const STATE = Symbol.for('suite-kit.pow')

/** Auf globalThis, weil Next.js Route Handler und Server Actions in getrennten Modul-Instanzen laden kann. */
function state(): PowState {
  const g = globalThis as typeof globalThis & { [STATE]?: PowState }
  return (g[STATE] ??= { key: randomBytes(32), used: new Map() })
}

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')
const sign = (challenge: string) => createHmac('sha256', state().key).update(`suite-pow\u0000${challenge}`).digest('hex')

export function createPowChallenge({ maxNumber = POW_MAX_NUMBER, ttlMs = POW_TTL_MS, now = Date.now() }: { maxNumber?: number; ttlMs?: number; now?: number } = {}): PowChallenge {
  const expiresAt = now + ttlMs
  const salt = `${randomBytes(12).toString('hex')}.${expiresAt}`
  const challenge = sha256(salt + randomInt(0, maxNumber + 1))
  return { algorithm: 'SHA-256', salt, challenge, maxNumber, signature: sign(challenge), expiresAt }
}

/** Antwort für `GET /api/suite/pow`: eine frische Aufgabe, nie zwischengespeichert. */
export function powChallengeResponse(options?: Parameters<typeof createPowChallenge>[0]): Response {
  return Response.json(createPowChallenge(options), { headers: { 'cache-control': 'no-store' } })
}

/**
 * `missing`: Feld leer (kein JavaScript oder vor dem Laden abgeschickt), `expired`: Aufgabe abgelaufen, `used`: Lösung
 * schon einmal verwendet, `invalid`: falsch, manipuliert oder aus der Zeit vor einem Neustart. Der Person zeigt das
 * Tool in jedem Fall `POW_MESSAGE`.
 */
export type PowResult = 'ok' | 'missing' | 'invalid' | 'expired' | 'used'

const SOLUTION = /^([0-9a-f]{24}\.(\d{13})):(\d{1,9}):([0-9a-f]{64})$/

/** Prüft die Lösung aus dem Feld `POW_FIELD` und verbraucht sie (gilt nur einmal). */
export function verifyPowSolution(value: unknown, now = Date.now()): PowResult {
  if (typeof value !== 'string' || value === '') return 'missing'
  const match = SOLUTION.exec(value)
  if (!match) return 'invalid'
  const [, salt, expiresAt, number, signature] = match
  // Auch nach einem Neustart (neuer Schlüssel): Die Formular-Komponente holt nach jedem Absenden eine neue Aufgabe.
  if (!safeEqual(sign(sha256(salt + number)), signature)) return 'invalid'
  if (Number(expiresAt) < now) return 'expired'

  const { used } = state()
  for (const [key, until] of used) if (until < now) used.delete(key)
  if (used.has(salt)) return 'used'
  used.set(salt, Number(expiresAt))
  return 'ok'
}

/** Für Server Actions: `null`, wenn die Lösung im Formular gilt (und verbraucht ist), sonst die Meldung für die Person. */
export function powError(formData: FormData, now = Date.now()): string | null {
  return verifyPowSolution(formData.get(POW_FIELD), now) === 'ok' ? null : POW_MESSAGE
}
