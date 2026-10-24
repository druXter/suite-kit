// web/pow.ts - Bot-Schutz für öffentliche Formulare (Proof-of-Work), Teil für den Browser. Der Server stellt eine
// Aufgabe aus (`createPowChallenge` in suite-kit), der Browser sucht die Zahl, deren SHA-256 zusammen mit dem Salt den
// vorgegebenen Hash ergibt, und schickt die Lösung im versteckten Feld `POW_FIELD` mit (`verifyPowSolution`).

/** Name des versteckten Formularfelds mit der Lösung. */
export const POW_FIELD = 'pow'

/** Meldung, wenn die Prüfung fehlschlägt - in allen Tools gleich. */
export const POW_MESSAGE = 'Die Sicherheitsprüfung hat nicht geklappt. Bitte schick das Formular noch einmal ab. Ohne JavaScript geht es leider nicht.'

/** Pfad, unter dem jedes Tool die Aufgaben ausgibt (`app/api/suite/pow/route.ts`). */
export const POW_ENDPOINT = '/api/suite/pow'

export type PowChallenge = {
  algorithm: 'SHA-256'
  /** Zufall und Ablaufzeitpunkt: `<24 hex>.<ms>` */
  salt: string
  /** SHA-256(salt + Zahl) als Hex */
  challenge: string
  /** Die gesuchte Zahl liegt zwischen 0 und maxNumber. */
  maxNumber: number
  /** HMAC des Servers über `challenge` - ohne ihn ließe sich keine eigene, leichte Aufgabe unterschieben. */
  signature: string
  expiresAt: number
}

function toBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

function sameBytes(buffer: ArrayBuffer, expected: Uint8Array): boolean {
  const view = new Uint8Array(buffer)
  if (view.length !== expected.length) return false
  for (let i = 0; i < view.length; i++) if (view[i] !== expected[i]) return false
  return true
}

/**
 * Sucht die Zahl und gibt den Wert für `POW_FIELD` zurück (`<salt>:<zahl>:<signatur>`), `null` bei Abbruch oder
 * wenn keine Zahl passt. WebCrypto rechnet asynchron, die Seite bleibt bedienbar; gerechnet wird in Blöcken, weil
 * jeder einzelne Aufruf von `digest` Verwaltungsaufwand kostet.
 */
export async function solvePowChallenge(c: PowChallenge, { signal, batch = 500 }: { signal?: AbortSignal; batch?: number } = {}): Promise<string | null> {
  const encoder = new TextEncoder()
  const target = toBytes(c.challenge)
  for (let start = 0; start <= c.maxNumber; start += batch) {
    if (signal?.aborted) return null
    const end = Math.min(start + batch, c.maxNumber + 1)
    const pending: Promise<ArrayBuffer>[] = []
    for (let n = start; n < end; n++) pending.push(crypto.subtle.digest('SHA-256', encoder.encode(c.salt + n)))
    const hashes = await Promise.all(pending)
    const index = hashes.findIndex(h => sameBytes(h, target))
    if (index >= 0) return `${c.salt}:${start + index}:${c.signature}`
  }
  return null
}
