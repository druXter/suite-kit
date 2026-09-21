// src/base64url.ts

export function b64uEncode(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Strikt: Buffer.from(..., 'base64') ignoriert ungültige Zeichen stillschweigend - für
 * signierte Daten wollen wir stattdessen, dass jede Abweichung vom Alphabet als
 * "kaputt" gilt (gibt dann null zurück).
 */
export function b64uDecode(input: string): Buffer | null {
  if (!/^[A-Za-z0-9_-]*$/.test(input)) return null
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4)
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}
