// test/link-message.test.ts
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import { b64uEncode } from '../src/base64url.js'
import { signLinkMessage, verifyLinkMessage } from '../src/link-message.js'

const SECRET = 'nur-fuer-tests-0123456789abcdef'
const AUD = 'https://vote.example.de'
const NOW = new Date('2026-10-24T10:00:00Z')
const at = (seconds: number) => new Date(NOW.getTime() + seconds * 1000)

/** Feste Prüfnachricht: ändert sich das Format, bricht dieser Test (und die Gegenseite muss mitziehen). */
const FIXED = 'eyJ0eXAiOiJwb2xsLWFjY2VzcyIsImF1ZCI6Imh0dHBzOi8vdm90ZS5leGFtcGxlLmRlIiwiZW1haWwiOiJhbm5hQGV4YW1wbGUuZGUiLCJpYXQiOjE3OTI4MzYwMDAsImV4cCI6MTc5MjgzNjYwMH0._jcdotVtdIMYvLtZ3k_NToECjlKrzM6-5v1BFXliIc8'

function forge(payload: object, secret = SECRET): string {
  const part = b64uEncode(JSON.stringify(payload))
  return `${part}.${b64uEncode(createHmac('sha256', secret).update(part).digest())}`
}

test('Format: { typ, aud, ...felder, iat, exp }, Standard 10 Minuten', () => {
  const token = signLinkMessage('poll-access', AUD, { email: 'anna@example.de' }, SECRET, { now: NOW })
  assert.equal(token, FIXED)
  assert.deepEqual(verifyLinkMessage(token, { typ: 'poll-access', audience: AUD, secret: SECRET, now: NOW }), {
    typ: 'poll-access', aud: AUD, email: 'anna@example.de', iat: 1792836000, exp: 1792836600
  })
})

test('falsche Art, falscher Empfänger, falsches Secret: null; voriges Secret gilt beim Wechsel', () => {
  const token = signLinkMessage('poll-access', AUD, { email: 'a@b.de' }, SECRET, { now: NOW })
  const expect = { typ: 'poll-access', audience: AUD, secret: SECRET, now: NOW }
  assert.ok(verifyLinkMessage(token, expect))
  assert.equal(verifyLinkMessage(token, { ...expect, typ: 'poll-result' }), null)
  assert.equal(verifyLinkMessage(token, { ...expect, audience: 'https://rsvp.example.de' }), null)
  assert.equal(verifyLinkMessage(token, { ...expect, secret: 'anderes-secret' }), null)
  assert.ok(verifyLinkMessage(token, { ...expect, secret: ['neues-secret', null, SECRET] }))
  assert.equal(verifyLinkMessage(token, { ...expect, secret: ['', null] }), null)
  assert.equal(verifyLinkMessage(token + 'x', expect), null)
  assert.equal(verifyLinkMessage(token.replace('.', '.x'), expect), null)
  assert.equal(verifyLinkMessage(null, expect), null)
})

test('Gültigkeit: abgelaufen, mehr als eine Stunde, aus der Zukunft', () => {
  const expect = { typ: 't', audience: AUD, secret: SECRET, now: NOW }
  const iat = Math.floor(NOW.getTime() / 1000)
  assert.ok(verifyLinkMessage(forge({ typ: 't', aud: AUD, iat, exp: iat + 3600 }), expect))
  assert.equal(verifyLinkMessage(forge({ typ: 't', aud: AUD, iat, exp: iat + 3601 }), expect), null)
  assert.equal(verifyLinkMessage(forge({ typ: 't', aud: AUD, iat: iat - 700, exp: iat }), expect), null)
  assert.equal(verifyLinkMessage(forge({ typ: 't', aud: AUD, iat: iat + 120, exp: iat + 600 }), expect), null)
  assert.equal(verifyLinkMessage(forge({ typ: 't', aud: AUD, iat: String(iat), exp: iat + 60 }), expect), null)
  // ttlSeconds über dem Höchstwert wird gekappt.
  const capped = signLinkMessage('t', AUD, {}, SECRET, { now: NOW, ttlSeconds: 86400 })
  assert.equal(verifyLinkMessage(capped, expect)!.exp, iat + 3600)
  assert.equal(verifyLinkMessage(capped, { ...expect, now: at(3600) }), null)
})

test('maxTtlSeconds: kürzer oder ausdrücklich länger, auf beiden Seiten', () => {
  const iat = Math.floor(NOW.getTime() / 1000)
  const expect = { typ: 't', audience: AUD, secret: SECRET, now: NOW }
  const fiveMinutes = signLinkMessage('t', AUD, {}, SECRET, { now: NOW, ttlSeconds: 300 })
  assert.ok(verifyLinkMessage(fiveMinutes, { ...expect, maxTtlSeconds: 300 }))
  assert.equal(verifyLinkMessage(signLinkMessage('t', AUD, {}, SECRET, { now: NOW }), { ...expect, maxTtlSeconds: 300 }), null)
  const twelveHours = signLinkMessage('t', AUD, {}, SECRET, { now: NOW, ttlSeconds: 12 * 3600, maxTtlSeconds: 24 * 3600 })
  assert.equal(verifyLinkMessage(twelveHours, { ...expect, maxTtlSeconds: 24 * 3600 })!.exp, iat + 12 * 3600)
  assert.equal(verifyLinkMessage(twelveHours, expect), null)
})

test('reservierte Felder und fehlendes Secret werfen beim Signieren', () => {
  assert.throws(() => signLinkMessage('t', AUD, { exp: 1 }, SECRET))
  assert.throws(() => signLinkMessage('t', AUD, { typ: 'x' }, SECRET))
  assert.throws(() => signLinkMessage('t', AUD, {}, ''))
})
