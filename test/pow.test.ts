// test/pow.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPowChallenge, powChallengeResponse, powError, verifyPowSolution } from '../src/pow.js'
import { POW_FIELD, POW_MESSAGE, solvePowChallenge } from '../web/pow.js'

test('Proof-of-Work: lösen, einmal gültig, dann verbraucht', async () => {
  const challenge = createPowChallenge({ maxNumber: 2000 })
  const solution = await solvePowChallenge(challenge)
  assert.ok(solution)
  assert.equal(verifyPowSolution(solution), 'ok')
  assert.equal(verifyPowSolution(solution), 'used')
})

test('Proof-of-Work: fehlend, manipuliert, abgelaufen', async () => {
  assert.equal(verifyPowSolution(null), 'missing')
  assert.equal(verifyPowSolution(''), 'missing')
  assert.equal(verifyPowSolution('irgendwas'), 'invalid')

  const challenge = createPowChallenge({ maxNumber: 2000, ttlMs: 1000 })
  const solution = (await solvePowChallenge(challenge))!
  const [salt, number, signature] = solution.split(':')
  assert.equal(verifyPowSolution(`${salt}:${Number(number) + 1}:${signature}`), 'invalid')
  // Eigene, leichte Aufgabe mit selbst gewähltem Salt: Die Signatur passt nicht.
  const forged = `${'0'.repeat(24)}.${challenge.expiresAt}:${number}:${signature}`
  assert.equal(verifyPowSolution(forged), 'invalid')
  assert.equal(verifyPowSolution(solution, challenge.expiresAt + 1), 'expired')
  // Abgelaufen verbraucht nichts; innerhalb der Frist gilt sie noch.
  assert.equal(verifyPowSolution(solution, challenge.expiresAt), 'ok')
})

test('Proof-of-Work: Abbruch und Antwort der Route', async () => {
  const controller = new AbortController()
  controller.abort()
  assert.equal(await solvePowChallenge(createPowChallenge(), { signal: controller.signal }), null)

  const response = powChallengeResponse({ maxNumber: 10 })
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const body = await response.json()
  assert.equal(body.algorithm, 'SHA-256')
  assert.equal(body.maxNumber, 10)
  assert.match(body.salt, /^[0-9a-f]{24}\.\d{13}$/)
  assert.ok(await solvePowChallenge(body))
})

test('Proof-of-Work: Voreinstellung in vertretbarer Zeit lösbar', async () => {
  const challenge = createPowChallenge()
  const started = performance.now()
  assert.ok(await solvePowChallenge(challenge))
  // Schlimmster Fall 50 000 Hashes; in Node deutlich unter 2 s.
  assert.ok(performance.now() - started < 3000)
})

test('powError: Formular mit gültiger Lösung, ohne und mit verbrauchter', async () => {
  const form = new FormData()
  assert.equal(powError(form), POW_MESSAGE)
  form.set(POW_FIELD, (await solvePowChallenge(createPowChallenge({ maxNumber: 100 })))!)
  assert.equal(powError(form), null)
  assert.equal(powError(form), POW_MESSAGE)
})
