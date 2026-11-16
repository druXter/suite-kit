// test/rules.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { suiteRules } from '../rules/index.js'
import { clientIpFrom, normalizeEmail } from '../web/input.js'

// Die eigenen Helfer bestehen die Sammlung ...
for (const rule of suiteRules({ clientIp: header => clientIpFrom(header, '1'), normalizeEmail })) test(rule.name, rule.run)

// ... und die Kopien, die bis November 2026 in den Tools standen, fallen durch - sonst prüfte die Sammlung nichts.
test('suiteRules: die alten Kopien aus den Tools fallen durch', async () => {
  const oldClientIp = (header: string) => header.split(',').map(p => p.trim()).filter(Boolean).at(-1) ?? 'unknown'
  const oldNormalizeEmail = (input: string) => {
    const email = input.trim().toLowerCase()
    return email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : email
  }
  const [slash64, proxy] = suiteRules({ clientIp: oldClientIp })
  await assert.rejects(slash64.run(), /dasselbe \/64/)
  await proxy.run()
  const [single] = suiteRules({ normalizeEmail: oldNormalizeEmail })
  await assert.rejects(single.run(), /abgelehnt: <vera@example.org>/)
})

test('suiteRules: nur Regeln für das, was das Tool mitgibt', () => {
  assert.equal(suiteRules({}).length, 0)
  assert.equal(suiteRules({ normalizeEmail }).length, 1)
})

test('clientIpFrom: von rechts gezählt, IPv6 als /64, ohne Header oder Proxy "unknown"', () => {
  assert.equal(clientIpFrom('6.6.6.6, 203.0.113.7', '1'), '203.0.113.7')
  assert.equal(clientIpFrom('6.6.6.6, 203.0.113.7, 10.0.0.2', '2'), '203.0.113.7')
  assert.equal(clientIpFrom('203.0.113.7'), '203.0.113.7')
  assert.equal(clientIpFrom('2001:db8:1:2:aaaa::1', 1), '2001:db8:1:2::/64')
  for (const [header, hops] of [[null, '1'], ['', '1'], ['203.0.113.7', '0'], ['203.0.113.7', 'viele'], ['203.0.113.7', '2']] as const) {
    assert.equal(clientIpFrom(header, hops), 'unknown')
  }
})

test('normalizeEmail: trimmt, schreibt klein, lehnt alles außer einer nackten Adresse ab', () => {
  assert.equal(normalizeEmail('  Vera@Example.ORG '), 'vera@example.org')
  assert.equal(normalizeEmail('x<vera@example.org>'), null)
  assert.equal(normalizeEmail('keine adresse'), null)
})
