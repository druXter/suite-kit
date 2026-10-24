// src/secrets.ts
import { timingSafeEqual } from 'node:crypto'

/**
 * Konstantzeitvergleich für Geheimnisse (Cron-Secret, Tokens, Signaturen als Text) - `===` würde über die
 * Antwortzeit verraten, wie viele Zeichen stimmen. Unterschiedliche Länge ist sofort falsch.
 */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}
