// test/rotation.test.ts
import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { issueLoginAssertion, verifyLoginAssertion } from '../src/assertion.js'
import { buildDiscoveryDocument, clearDiscoveryCache, fetchDiscovery } from '../src/discovery.js'
import { generateKeyPair, loadSignersFromEnv } from '../src/keys.js'

// Der Schlüsselwechsel aus docs/PROTOCOL.md ("Schlüsselwechsel") einmal ganz durchgespielt: Der
// Anbieter ändert seine Env, der Empfänger hat das alte Discovery-Dokument im Cache und verhält
// sich wie vorgeschrieben (bei unknown-key genau einmal mit force neu laden).

const ISSUER = 'https://rsvp.example.de'
const AUDIENCE = 'https://vote.example.de'
const NONCE = 'n'.repeat(43)

const oldKey = generateKeyPair().privateKey
const newKey = generateKeyPair().privateKey

/** Der Anbieter: seine Env bestimmt, womit signiert und was veröffentlicht wird. */
let providerEnv: Record<string, string> = { SUITE_SIGNING_KEY: oldKey }
const signers = () => loadSignersFromEnv(providerEnv)
const fetchImpl = (async () =>
  new Response(JSON.stringify(buildDiscoveryDocument({ issuer: ISSUER, name: 'rsvp-app', signers: signers() })))) as typeof fetch
const issue = () => issueLoginAssertion(signers()[0], { issuer: ISSUER, audience: AUDIENCE, subject: 'u1', email: 'a@example.de', nonce: NONCE })

/** Der Empfänger, wie ein Callback-Endpunkt (Sicherheitsregel 6). */
async function receive(assertion: string) {
  const check = async (force: boolean) => {
    const doc = await fetchDiscovery(ISSUER, { fetchImpl, force })
    assert.ok(doc)
    return verifyLoginAssertion(assertion, { issuer: ISSUER, audience: AUDIENCE, nonce: NONCE, keys: doc.keys })
  }
  const first = await check(false)
  return !first.ok && first.reason === 'unknown-key' ? check(true) : first
}

beforeEach(() => {
  clearDiscoveryCache()
  providerEnv = { SUITE_SIGNING_KEY: oldKey }
})

test('Wechsel: neuer Schlüssel nach einmaligem Neuladen, alter bleibt bis zum Entfernen gültig', async () => {
  const inFlight = issue() // noch mit dem alten Schlüssel ausgestellt
  assert.equal((await receive(inFlight)).ok, true) // Empfänger cached das alte Dokument

  // Schritt 1: neuer Schlüssel aktiv, alter als PREVIOUS veröffentlicht, Neustart des Anbieters.
  providerEnv = { SUITE_SIGNING_KEY: newKey, SUITE_SIGNING_KEY_PREVIOUS: oldKey }
  assert.equal((await receive(issue())).ok, true) // unknown-key -> force -> ok
  assert.equal((await receive(inFlight)).ok, true) // die alte Bestätigung gilt weiter

  // Schritt 2: PREVIOUS entfernen. Sobald der Empfänger neu lädt, ist der alte Schlüssel ungültig.
  providerEnv = { SUITE_SIGNING_KEY: newKey }
  clearDiscoveryCache() // = Cache abgelaufen (5 Minuten) oder Empfänger neu gestartet
  const stale = await receive(inFlight)
  assert.equal(stale.ok, false)
  if (!stale.ok) assert.equal(stale.reason, 'unknown-key')
  assert.equal((await receive(issue())).ok, true)
})

test('Notfall: ohne Neuladen nimmt der Empfänger den alten Schlüssel aus dem Cache noch an', async () => {
  const leaked = issue()
  assert.equal((await receive(leaked)).ok, true)
  providerEnv = { SUITE_SIGNING_KEY: newKey } // alter Schlüssel sofort weg, ohne PREVIOUS
  // Genau deshalb müssen bei einem kompromittierten Schlüssel auch die Empfänger neu starten.
  assert.equal((await receive(leaked)).ok, true)
  clearDiscoveryCache()
  assert.equal((await receive(leaked)).ok, false)
})
