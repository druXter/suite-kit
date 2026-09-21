// test/assertion.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { b64uEncode } from '../src/base64url.js'
import { issueLoginAssertion, verifyLoginAssertion, MAX_TTL_SECONDS, type VerifyExpectation } from '../src/assertion.js'
import { generateKeyPair, loadSigner } from '../src/keys.js'

const ISSUER = 'https://rsvp.example.de'
const AUDIENCE = 'https://vote.example.de'
const NONCE = 'a'.repeat(43)
const NOW = 1_800_000_000

const pair = generateKeyPair()
const signer = loadSigner(pair.privateKey)

const input = { issuer: ISSUER, audience: AUDIENCE, subject: 'user-1', email: 'Admin@Example.de', name: 'Alex', role: 'ADMIN', nonce: NONCE }
const expectation = (over: Partial<VerifyExpectation> = {}): VerifyExpectation => ({
  issuer: ISSUER, audience: AUDIENCE, nonce: NONCE, keys: [{ kid: signer.kid, publicKey: signer.publicKey }], now: NOW, ...over
})
const issue = (over: Partial<typeof input> = {}, ttl?: number) => issueLoginAssertion(signer, { ...input, ...over }, { now: NOW, ttlSeconds: ttl })

test('gültige Bestätigung wird akzeptiert, E-Mail kleingeschrieben', () => {
  const result = verifyLoginAssertion(issue(), expectation())
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.claims.sub, 'user-1')
    assert.equal(result.claims.email, 'admin@example.de')
    assert.equal(result.claims.role, 'ADMIN')
    assert.equal(result.claims.exp - result.claims.iat, 60)
  }
})

test('falsche Audience wird abgelehnt (für anderes Tool ausgestellt)', () => {
  const result = verifyLoginAssertion(issue({ audience: 'https://plaetze.example.de' }), expectation())
  assert.deepEqual(result, { ok: false, reason: 'wrong-audience' })
})

test('falscher Issuer wird abgelehnt', () => {
  const result = verifyLoginAssertion(issue({ issuer: 'https://evil.example.de' }), expectation())
  assert.deepEqual(result, { ok: false, reason: 'wrong-issuer' })
})

test('falscher state/nonce wird abgelehnt (Replay aus fremdem Browser)', () => {
  const result = verifyLoginAssertion(issue(), expectation({ nonce: 'b'.repeat(43) }))
  assert.deepEqual(result, { ok: false, reason: 'wrong-nonce' })
})

test('abgelaufene Bestätigung wird abgelehnt, kleine Uhrenabweichung toleriert', () => {
  assert.deepEqual(verifyLoginAssertion(issue(), expectation({ now: NOW + 60 + 11 })), { ok: false, reason: 'expired' })
  assert.equal(verifyLoginAssertion(issue(), expectation({ now: NOW + 60 + 5 })).ok, true)
})

test('Bestätigung aus der Zukunft wird abgelehnt', () => {
  assert.deepEqual(verifyLoginAssertion(issue(), expectation({ now: NOW - 30 })), { ok: false, reason: 'not-yet-valid' })
})

test('Lebensdauer wird beim Ausstellen gedeckelt', () => {
  const result = verifyLoginAssertion(issue({}, 100_000), expectation())
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.claims.exp - result.claims.iat, MAX_TTL_SECONDS)
})

test('manipulierte Nutzlast (z. B. anderes Konto) bricht die Signatur', () => {
  const [h, , s] = issue().split('.')
  const forgedPayload = b64uEncode(JSON.stringify({ iss: ISSUER, aud: AUDIENCE, sub: 'admin-of-everything', email: 'x@example.de', nonce: NONCE, iat: NOW, exp: NOW + 60 }))
  assert.deepEqual(verifyLoginAssertion(`${h}.${forgedPayload}.${s}`, expectation()), { ok: false, reason: 'bad-signature' })
})

test('Signatur eines anderen Schlüssels wird abgelehnt', () => {
  const other = loadSigner(generateKeyPair().privateKey)
  const token = issueLoginAssertion({ ...other, kid: signer.kid }, input, { now: NOW })
  assert.deepEqual(verifyLoginAssertion(token, expectation()), { ok: false, reason: 'bad-signature' })
})

test('unbekannte kid meldet unknown-key (Aufrufer lädt Discovery neu)', () => {
  assert.deepEqual(verifyLoginAssertion(issue(), expectation({ keys: [] })), { ok: false, reason: 'unknown-key' })
})

test('Schlüsselrotation: alter und neuer Schlüssel gleichzeitig gültig', () => {
  const next = loadSigner(generateKeyPair().privateKey)
  const keys = [next, signer].map(s => ({ kid: s.kid, publicKey: s.publicKey }))
  assert.equal(verifyLoginAssertion(issue(), expectation({ keys })).ok, true)
  assert.equal(verifyLoginAssertion(issueLoginAssertion(next, input, { now: NOW }), expectation({ keys })).ok, true)
})

test('fremder Algorithmus/Typ im Header wird abgelehnt (kein alg:none, kein HMAC)', () => {
  const [, p] = issue().split('.')
  for (const header of [{ alg: 'none', typ: 'suite-login+v1', kid: signer.kid }, { alg: 'HS256', typ: 'suite-login+v1', kid: signer.kid }, { alg: 'EdDSA', typ: 'JWT', kid: signer.kid }]) {
    const token = `${b64uEncode(JSON.stringify(header))}.${p}.`
    assert.deepEqual(verifyLoginAssertion(token, expectation()), { ok: false, reason: 'unsupported-header' })
  }
})

test('kaputte Eingaben werfen nie, sondern liefern malformed/bad-signature', () => {
  for (const token of ['', 'abc', 'a.b', 'a.b.c.d', '....', '!!!.???.***']) {
    const result = verifyLoginAssertion(token, expectation())
    assert.equal(result.ok, false)
  }
})

test('leere Pflicht-Claims -> bad-claims, auch bei gültiger Signatur', () => {
  assert.deepEqual(verifyLoginAssertion(issue({ subject: '' }), expectation()), { ok: false, reason: 'bad-claims' })
  assert.deepEqual(verifyLoginAssertion(issue({ email: '' }), expectation()), { ok: false, reason: 'bad-claims' })
})
