// src/assertion.ts
import { sign, timingSafeEqual, verify } from 'node:crypto'
import { b64uDecode, b64uEncode } from './base64url.js'
import { importPublicKey, type Signer } from './keys.js'

/**
 * Die "Login-Bestätigung": ein signierter Beleg eines Tools (Anbieter, `iss`), dass
 * gerade ein bestimmtes lokales Konto (`sub`) bei ihm eingeloggt ist, ausgestellt für
 * genau ein anderes Tool (Empfänger, `aud`) und genau einen Login-Versuch (`nonce`).
 *
 * Format: kompaktes JWS (`header.payload.signature`, alle Teile base64url), Algorithmus
 * ausschließlich EdDSA (Ed25519). Es wird bewusst NUR dieses eine Format akzeptiert
 * (feste `alg`/`typ`) - keine Algorithmus-Aushandlung, damit die klassischen
 * "alg: none"/HMAC-statt-RSA-Verwechslungen gar nicht erst möglich sind.
 *
 * Die Bestätigung trägt nur IDENTITÄT, keine Rechte: `role` ist die Rolle im
 * ausstellenden Tool und wird vom Empfänger nur informativ genutzt (siehe
 * IdpConfig.mapAdminRole in config.ts) - welche Rechte das Konto beim Empfänger hat,
 * entscheidet allein der Empfänger.
 */

export const ASSERTION_ALG = 'EdDSA'
export const ASSERTION_TYP = 'suite-login+v1'
export const DEFAULT_TTL_SECONDS = 60
export const MAX_TTL_SECONDS = 120
export const CLOCK_SKEW_SECONDS = 10

export type LoginClaims = {
  iss: string
  aud: string
  sub: string
  email: string
  name?: string
  role?: string
  nonce: string
  iat: number
  exp: number
}

export type LoginAssertionInput = {
  issuer: string
  audience: string
  subject: string
  email: string
  name?: string
  role?: string
  nonce: string
}

export function issueLoginAssertion(
  signer: Signer,
  input: LoginAssertionInput,
  opts: { ttlSeconds?: number; now?: number } = {}
): string {
  const now = opts.now ?? Math.floor(Date.now() / 1000)
  const ttl = Math.min(Math.max(1, opts.ttlSeconds ?? DEFAULT_TTL_SECONDS), MAX_TTL_SECONDS)

  const claims: LoginClaims = {
    iss: input.issuer,
    aud: input.audience,
    sub: input.subject,
    email: input.email.toLowerCase(),
    ...(input.name ? { name: input.name } : {}),
    ...(input.role ? { role: input.role } : {}),
    nonce: input.nonce,
    iat: now,
    exp: now + ttl
  }

  const header = b64uEncode(JSON.stringify({ alg: ASSERTION_ALG, typ: ASSERTION_TYP, kid: signer.kid }))
  const payload = b64uEncode(JSON.stringify(claims))
  const signature = b64uEncode(sign(null, Buffer.from(`${header}.${payload}`), signer.privateKeyObject))
  return `${header}.${payload}.${signature}`
}

export type VerifyFailure =
  | 'malformed'
  | 'unsupported-header'
  | 'unknown-key'
  | 'bad-signature'
  | 'bad-claims'
  | 'wrong-issuer'
  | 'wrong-audience'
  | 'wrong-nonce'
  | 'expired'
  | 'not-yet-valid'
  | 'lifetime-too-long'

export type VerifyResult = { ok: true; claims: LoginClaims } | { ok: false; reason: VerifyFailure }

export type VerifyExpectation = {
  /** Origin des Anbieters, bei dem die Bestätigung angefordert wurde. */
  issuer: string
  /** Origin des Empfängers (also des Tools, das gerade verifiziert). */
  audience: string
  /** Der `state`-Wert aus dem Cookie des Browsers, der den Login gestartet hat. */
  nonce: string
  /** Öffentliche Schlüssel aus dem Discovery-Dokument des Anbieters. */
  keys: { kid: string; publicKey: string }[]
  now?: number
}

const isNonEmptyString = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max

function parseJsonObject(bytes: Buffer | null): Record<string, unknown> | null {
  if (!bytes) return null
  try {
    const value = JSON.parse(bytes.toString('utf8'))
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/**
 * Gibt statt zu werfen ein Ergebnis mit Grund zurück - "Login nicht gültig" ist ein
 * normaler Zustand (abgelaufener Link, Tab zu lange offen), der Grund hilft nur beim
 * Loggen/Debuggen und gehört NICHT ungefiltert in eine Fehlermeldung für den Nutzer.
 * `unknown-key` bedeutet: der Aufrufer sollte das Discovery-Dokument EINMAL frisch
 * laden und erneut prüfen (Schlüsselrotation).
 */
export function verifyLoginAssertion(token: string, expect: VerifyExpectation): VerifyResult {
  const fail = (reason: VerifyFailure): VerifyResult => ({ ok: false, reason })

  const parts = token.split('.')
  if (parts.length !== 3) return fail('malformed')
  const [headerPart, payloadPart, signaturePart] = parts

  const header = parseJsonObject(b64uDecode(headerPart))
  if (!header) return fail('malformed')
  if (header.alg !== ASSERTION_ALG || header.typ !== ASSERTION_TYP || typeof header.kid !== 'string') {
    return fail('unsupported-header')
  }

  const keyEntry = expect.keys.find(k => k.kid === header.kid)
  const key = keyEntry ? importPublicKey(keyEntry.publicKey) : null
  if (!key) return fail('unknown-key')

  const signature = b64uDecode(signaturePart)
  if (!signature || !verify(null, Buffer.from(`${headerPart}.${payloadPart}`), key, signature)) {
    return fail('bad-signature')
  }

  const payload = parseJsonObject(b64uDecode(payloadPart))
  if (!payload) return fail('malformed')

  const { iss, aud, sub, email, name, role, nonce, iat, exp } = payload
  if (
    !isNonEmptyString(iss, 300) || !isNonEmptyString(aud, 300) || !isNonEmptyString(sub, 128) ||
    !isNonEmptyString(email, 254) || !isNonEmptyString(nonce, 128) ||
    (name !== undefined && !isNonEmptyString(name, 200)) ||
    (role !== undefined && !isNonEmptyString(role, 64)) ||
    !Number.isInteger(iat) || !Number.isInteger(exp)
  ) {
    return fail('bad-claims')
  }

  const now = expect.now ?? Math.floor(Date.now() / 1000)
  const issuedAt = iat as number
  const expiresAt = exp as number

  if (iss !== expect.issuer) return fail('wrong-issuer')
  if (aud !== expect.audience) return fail('wrong-audience')
  if (!safeEqual(nonce, expect.nonce)) return fail('wrong-nonce')
  if (expiresAt - issuedAt > MAX_TTL_SECONDS) return fail('lifetime-too-long')
  if (issuedAt > now + CLOCK_SKEW_SECONDS) return fail('not-yet-valid')
  if (expiresAt + CLOCK_SKEW_SECONDS < now) return fail('expired')

  return {
    ok: true,
    claims: {
      iss, aud, sub,
      email: email.toLowerCase(),
      ...(name !== undefined ? { name: name as string } : {}),
      ...(role !== undefined ? { role: role as string } : {}),
      nonce,
      iat: issuedAt,
      exp: expiresAt
    }
  }
}
