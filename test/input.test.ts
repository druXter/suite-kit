// test/input.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isSingleEmail, visitorOf } from '../web/input.js'

test('isSingleEmail: gewöhnliche Adressen ja, alles, was nodemailer anders liest, nein', () => {
  for (const ok of ['vera@example.org', 'o\'brien+wichteln@mail.example.de', 'a.b-c_d@sub.example.co.uk']) assert.ok(isSingleEmail(ok), ok)
  for (const bad of [
    'x<vera@example.org>', '"Paket wartet"<vera@example.org>', '(x)vera@example.org', 'vera@example.org;', 'a:vera@example.org;',
    'vera@example.org, zweite@example.org', 'vera@example', 'vera@@example.org', 'vera @example.org', 'vera@exa\nmple.org',
    'vera@[127.0.0.1]', 've\\ra@example.org', `${'a'.repeat(250)}@example.org`, ''
  ]) assert.ok(!isSingleEmail(bad), bad)
})

test('visitorOf: IPv6 als /64, IPv4 unverändert, Ungültiges unverändert', () => {
  assert.equal(visitorOf('203.0.113.7'), '203.0.113.7')
  assert.equal(visitorOf('::ffff:203.0.113.7'), '203.0.113.7')
  assert.equal(visitorOf('2001:db8:1:2:aaaa:bbbb:cccc:1'), '2001:db8:1:2::/64')
  assert.equal(visitorOf('2001:DB8:0001:0002::1'), '2001:db8:1:2::/64')
  assert.equal(visitorOf('[2001:db8:1:2::1%eth0]'), '2001:db8:1:2::/64')
  assert.equal(visitorOf('::1'), '0:0:0:0::/64')
  assert.notEqual(visitorOf('2001:db8:1:2::1'), visitorOf('2001:db8:1:3::1'))
  assert.equal(visitorOf('unknown'), 'unknown')
  assert.equal(visitorOf('1:2:3'), '1:2:3')
})
