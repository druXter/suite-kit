// test/discovery.test.ts
import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { buildDiscoveryDocument, clearDiscoveryCache, fetchDiscovery, parseDiscoveryDocument } from '../src/discovery.js'
import { generateKeyPair, loadSigner, loadSignersFromEnv } from '../src/keys.js'
import { parseIdpConfig, parseTrustedApps } from '../src/config.js'

const ISSUER = 'https://rsvp.example.de'
const signer = loadSigner(generateKeyPair().privateKey)
const doc = buildDiscoveryDocument({ issuer: ISSUER, name: 'rsvp-app', signers: [signer] })

const jsonResponse = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init)

beforeEach(() => clearDiscoveryCache())

test('eigenes Dokument besteht die eigene Validierung', () => {
  assert.deepEqual(parseDiscoveryDocument(doc, ISSUER)?.keys[0].kid, signer.kid)
  assert.equal(doc.authorizeUrl, `${ISSUER}/api/suite/authorize`)
})

test('Dokument mit fremdem issuer oder fremder authorizeUrl wird verworfen', () => {
  assert.equal(parseDiscoveryDocument({ ...doc, issuer: 'https://evil.example.de' }, ISSUER), null)
  assert.equal(parseDiscoveryDocument({ ...doc, authorizeUrl: 'https://evil.example.de/api/suite/authorize' }, ISSUER), null)
  assert.equal(parseDiscoveryDocument({ ...doc, keys: [] }, ISSUER), null)
  assert.equal(parseDiscoveryDocument({ ...doc, keys: [{ kid: 'x', alg: 'EdDSA', publicKey: 'kaputt' }] }, ISSUER), null)
  assert.equal(parseDiscoveryDocument({ ...doc, version: 2 }, ISSUER), null)
  assert.equal(parseDiscoveryDocument(null, ISSUER), null)
})

test('fetchDiscovery lädt, validiert und cached', async () => {
  let calls = 0
  const fetchImpl = (async () => { calls++; return jsonResponse(doc) }) as typeof fetch
  assert.ok(await fetchDiscovery(ISSUER, { fetchImpl }))
  assert.ok(await fetchDiscovery(ISSUER, { fetchImpl }))
  assert.equal(calls, 1)
  await fetchDiscovery(ISSUER, { fetchImpl, force: true })
  assert.equal(calls, 2)
})

test('fetchDiscovery gibt bei Fehlern null zurück statt zu werfen', async () => {
  assert.equal(await fetchDiscovery(ISSUER, { fetchImpl: (async () => { throw new Error('offline') }) as typeof fetch }), null)
  assert.equal(await fetchDiscovery(ISSUER, { fetchImpl: (async () => new Response('nope', { status: 500 })) as typeof fetch }), null)
  assert.equal(await fetchDiscovery(ISSUER, { fetchImpl: (async () => new Response('kein json')) as typeof fetch }), null)
  assert.equal(await fetchDiscovery(ISSUER, { fetchImpl: (async () => new Response('x'.repeat(20_000))) as typeof fetch }), null)
  assert.equal(await fetchDiscovery('http://unsicher.example.de'), null)
})

test('fetchDiscovery folgt keinen Weiterleitungen', async () => {
  let init: RequestInit | undefined
  await fetchDiscovery(ISSUER, { fetchImpl: (async (_u: unknown, i?: RequestInit) => { init = i; return jsonResponse(doc) }) as typeof fetch })
  assert.equal(init?.redirect, 'error')
})

test('loadSignersFromEnv: aktiver + vorheriger Schlüssel, leer ohne Konfiguration', () => {
  const a = generateKeyPair()
  const b = generateKeyPair()
  assert.deepEqual(loadSignersFromEnv({}), [])
  const signers = loadSignersFromEnv({ SUITE_SIGNING_KEY: a.privateKey, SUITE_SIGNING_KEY_PREVIOUS: b.privateKey })
  assert.deepEqual(signers.map(s => s.kid), [a.kid, b.kid])
  assert.throws(() => loadSignersFromEnv({ SUITE_SIGNING_KEY: 'kaputt' }))
})

test('parseTrustedApps verwirft ungültige Einträge', () => {
  const warn = console.warn
  console.warn = () => {}
  try {
    assert.deepEqual(parseTrustedApps('https://vote.example.de, http://unsicher.de,, https://plaetze.example.de/'), ['https://vote.example.de', 'https://plaetze.example.de'])
    assert.deepEqual(parseTrustedApps(undefined), [])
  } finally {
    console.warn = warn
  }
})

test('parseIdpConfig: Kurzform und JSON mit Standardwerten', () => {
  const warn = console.warn
  console.warn = () => {}
  try {
    assert.deepEqual(parseIdpConfig('https://rsvp.example.de'), [{ issuer: ISSUER, label: undefined, autoProvision: true, mapAdminRole: false }])
    const json = JSON.stringify([{ issuer: ISSUER, label: 'rsvp-app', autoProvision: false, mapAdminRole: true }, { issuer: ISSUER }, { issuer: 'http://x.de' }])
    assert.deepEqual(parseIdpConfig(json), [{ issuer: ISSUER, label: 'rsvp-app', autoProvision: false, mapAdminRole: true }])
    assert.deepEqual(parseIdpConfig('[kaputt'), [])
    assert.deepEqual(parseIdpConfig(''), [])
  } finally {
    console.warn = warn
  }
})
