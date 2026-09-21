// test/authorize.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildAuthorizeRequestUrl, buildAuthorizeResponseUrl, parseAuthorizeRequest, randomState, sanitizeNextPath } from '../src/authorize.js'
import { normalizeOrigin } from '../src/origin.js'

const TRUSTED = ['https://vote.example.de', 'https://plaetze.example.de']

test('Anfrage einer vertrauten App wird akzeptiert', () => {
  const state = randomState()
  const url = buildAuthorizeRequestUrl('https://rsvp.example.de/api/suite/authorize', { app: 'https://vote.example.de', state })
  const result = parseAuthorizeRequest(url, TRUSTED)
  assert.deepEqual(result, { ok: true, request: { app: 'https://vote.example.de', state } })
})

test('unbekannte App bekommt nie eine Weiterleitung', () => {
  const url = `https://rsvp.example.de/api/suite/authorize?app=${encodeURIComponent('https://evil.example.de')}&state=${randomState()}`
  assert.deepEqual(parseAuthorizeRequest(url, TRUSTED), { ok: false, reason: 'untrusted-app' })
})

test('Origin-Tricks werden nicht als vertraut durchgelassen', () => {
  for (const app of ['https://vote.example.de.evil.de', 'https://vote.example.de@evil.de', 'https://vote.example.de/x', 'http://vote.example.de', 'javascript:alert(1)']) {
    const url = `https://rsvp.example.de/api/suite/authorize?app=${encodeURIComponent(app)}&state=${randomState()}`
    assert.equal(parseAuthorizeRequest(url, TRUSTED).ok, false, app)
  }
})

test('fehlende oder ungültige Parameter werden abgelehnt', () => {
  assert.deepEqual(parseAuthorizeRequest('https://x.de/a?app=https://vote.example.de', TRUSTED), { ok: false, reason: 'missing-params' })
  assert.deepEqual(parseAuthorizeRequest('https://x.de/a?app=https://vote.example.de&state=zu-kurz', TRUSTED), { ok: false, reason: 'invalid-state' })
})

test('Rücksprung geht immer auf den festen Callback-Pfad der vertrauten App', () => {
  const state = randomState()
  const back = new URL(buildAuthorizeResponseUrl({ app: 'https://vote.example.de', state }, 'a.b.c'))
  assert.equal(back.origin, 'https://vote.example.de')
  assert.equal(back.pathname, '/api/suite/callback')
  assert.equal(back.searchParams.get('assertion'), 'a.b.c')
  assert.equal(back.searchParams.get('state'), state)
})

test('normalizeOrigin: HTTPS Pflicht (localhost ausgenommen), keine Pfade/Zugangsdaten', () => {
  assert.equal(normalizeOrigin('https://vote.example.de/'), 'https://vote.example.de')
  assert.equal(normalizeOrigin('http://localhost:3600'), 'http://localhost:3600')
  assert.equal(normalizeOrigin('http://vote.example.de'), null)
  assert.equal(normalizeOrigin('https://vote.example.de/pfad'), null)
  assert.equal(normalizeOrigin('https://user:pw@vote.example.de'), null)
  assert.equal(normalizeOrigin('nonsense'), null)
})

test('sanitizeNextPath lässt nur relative Pfade der eigenen App zu', () => {
  assert.equal(sanitizeNextPath('/meine-abstimmungen?x=1'), '/meine-abstimmungen?x=1')
  for (const bad of ['//evil.de', '/\\evil.de', 'https://evil.de', 'evil', '', null, undefined, '/a\nb']) {
    assert.equal(sanitizeNextPath(bad), '/', String(bad))
  }
  assert.equal(sanitizeNextPath('//evil.de', '/start'), '/start')
})

test('randomState erzeugt eindeutige, gültige Werte', () => {
  const a = randomState()
  assert.notEqual(a, randomState())
  assert.match(a, /^[A-Za-z0-9_-]{43}$/)
})
