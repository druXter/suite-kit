// test/participant.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { b64uDecode } from '../src/base64url.js'
import { issueLoginAssertion, verifyLoginAssertion, type VerifyExpectation } from '../src/assertion.js'
import { issueParticipantAssertion, PARTICIPANT_TYP, verifyParticipantAssertion } from '../src/participant.js'
import { generateKeyPair, loadSigner } from '../src/keys.js'

const ISSUER = 'https://rsvp.example.de'
const AUDIENCE = 'https://vote.example.de'
const NONCE = 'p'.repeat(43)
const NOW = 1_800_000_000
const signer = loadSigner(generateKeyPair().privateKey)
const expectation = (over: Partial<VerifyExpectation> = {}): VerifyExpectation => ({
  issuer: ISSUER, audience: AUDIENCE, nonce: NONCE, keys: [{ kid: signer.kid, publicKey: signer.publicKey }], now: NOW, ...over
})
const input = { issuer: ISSUER, audience: AUDIENCE, subject: 'paarweise-123', name: 'Anna', nonce: NONCE }

test('Teilnehmenden-Bestätigung: eigener typ, nur Kennung und Name', () => {
  const token = issueParticipantAssertion(signer, input, { now: NOW })
  const header = JSON.parse(b64uDecode(token.split('.')[0])!.toString())
  assert.equal(header.typ, PARTICIPANT_TYP)
  const payload = JSON.parse(b64uDecode(token.split('.')[1])!.toString())
  assert.deepEqual(Object.keys(payload).sort(), ['aud', 'exp', 'iat', 'iss', 'name', 'nonce', 'sub'])

  const result = verifyParticipantAssertion(token, expectation())
  assert.equal(result.ok, true)
  if (result.ok) assert.deepEqual([result.claims.sub, result.claims.name], ['paarweise-123', 'Anna'])
})

test('Nie verwechselbar: Teilnehmende sind kein Login und umgekehrt', () => {
  const participant = issueParticipantAssertion(signer, input, { now: NOW })
  assert.deepEqual(verifyLoginAssertion(participant, expectation()), { ok: false, reason: 'unsupported-header' })
  const login = issueLoginAssertion(signer, { ...input, email: 'a@example.de', role: 'ADMIN' }, { now: NOW })
  assert.deepEqual(verifyParticipantAssertion(login, expectation()), { ok: false, reason: 'unsupported-header' })
})

test('Teilnehmenden-Bestätigung: gleiche Prüfungen wie beim Login', () => {
  const token = issueParticipantAssertion(signer, input, { now: NOW })
  assert.deepEqual(verifyParticipantAssertion(token, expectation({ audience: 'https://plaetze.example.de' })), { ok: false, reason: 'wrong-audience' })
  assert.deepEqual(verifyParticipantAssertion(token, expectation({ nonce: 'q'.repeat(43) })), { ok: false, reason: 'wrong-nonce' })
  assert.deepEqual(verifyParticipantAssertion(token, expectation({ now: NOW + 200 })), { ok: false, reason: 'expired' })
  assert.deepEqual(verifyParticipantAssertion(token, expectation({ keys: [] })), { ok: false, reason: 'unknown-key' })
  const other = loadSigner(generateKeyPair().privateKey)
  const forged = issueParticipantAssertion({ ...other, kid: signer.kid }, input, { now: NOW })
  assert.deepEqual(verifyParticipantAssertion(forged, expectation()), { ok: false, reason: 'bad-signature' })
  const noName = issueParticipantAssertion(signer, { ...input, name: '' }, { now: NOW })
  assert.deepEqual(verifyParticipantAssertion(noName, expectation()), { ok: false, reason: 'bad-claims' })
})
