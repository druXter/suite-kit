// src/participant.ts
import { lifetime, signCompact, verifySigned, type VerifyExpectation, type VerifyFailure } from './assertion.js'
import type { Signer } from './keys.js'

/**
 * Teilnehmenden-Bestätigung: Ein Tool mit Teilnehmendenkonten (Gäste, Abstimmende - ohne jede
 * Verwaltungsrolle, z.B. `GuestUser` in rsvp-app) bestätigt einem anderen Tool, wer gerade bei
 * ihm eingeloggt ist. Gleiches Format und gleiche Prüfung wie die Login-Bestätigung
 * (assertion.ts), aber mit eigenem `typ` - BEWUSST kein Zusatzfeld in der Login-Bestätigung:
 * Ein Empfänger mit älterer suite-kit-Version würde ein unbekanntes Feld ignorieren und die
 * Person als Verwaltungskonto anlegen. Einen unbekannten `typ` lehnt dagegen jede Version ab.
 *
 * Datensparsam: `sub` ist eine PAARWEISE Kennung (für jeden Empfänger eine andere, vom Anbieter
 * festgelegt), dazu nur der Anzeigename - keine E-Mail, keine Rolle. Empfänger dürfen eine
 * Teilnehmenden-Bestätigung nie auf ein Verwaltungskonto abbilden (eigene Tabelle, eigene Sitzung).
 */

export const PARTICIPANT_TYP = 'suite-participant+v1'

export type ParticipantClaims = {
  iss: string
  aud: string
  /** Paarweise Kennung: für diesen Empfänger stabil, für andere Empfänger eine andere. */
  sub: string
  name: string
  nonce: string
  iat: number
  exp: number
}

export type ParticipantAssertionInput = { issuer: string; audience: string; subject: string; name: string; nonce: string }

export function issueParticipantAssertion(
  signer: Signer,
  input: ParticipantAssertionInput,
  opts: { ttlSeconds?: number; now?: number } = {}
): string {
  const claims: ParticipantClaims = {
    iss: input.issuer,
    aud: input.audience,
    sub: input.subject,
    name: input.name.slice(0, 200),
    nonce: input.nonce,
    ...lifetime(opts)
  }
  return signCompact(signer, PARTICIPANT_TYP, claims)
}

export type ParticipantVerifyResult = { ok: true; claims: ParticipantClaims } | { ok: false; reason: VerifyFailure }

/** Wie verifyLoginAssertion, nur für Teilnehmende. Eine Login-Bestätigung scheitert hier an `unsupported-header`. */
export function verifyParticipantAssertion(token: string, expect: VerifyExpectation): ParticipantVerifyResult {
  const result = verifySigned(token, PARTICIPANT_TYP, expect, ({ name, email, role }) =>
    typeof name === 'string' && name.length > 0 && name.length <= 200 && email === undefined && role === undefined
  )
  if (!result.ok) return result
  const { iss, aud, sub, name, nonce } = result.payload as Record<string, string>
  return { ok: true, claims: { iss, aud, sub, name, nonce, iat: result.iat, exp: result.exp } }
}
