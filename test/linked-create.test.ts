// test/linked-create.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { signLinkMessage } from '../src/link-message.js'
import {
  LINKED_CREATE, LINKED_CREATE_STATUS, linkedCreateSlug, readLinkedCreateResult, signLinkedCreate, verifyLinkedCreate
} from '../src/linked-create.js'

const SECRET = 'x'.repeat(40)
const TOOL = 'https://zeitplan.example.de'
const NOW = new Date('2026-10-24T12:00:00Z')
const request = { rsvpEventId: 'cmabcdefghij', rsvpUserId: 'cmuser123456', toolUserId: null }

test('Anlegen: signieren und prüfen, beide Arten', () => {
  const status = signLinkedCreate({ kind: LINKED_CREATE_STATUS, request }, TOOL, SECRET, { now: NOW })
  assert.deepEqual(verifyLinkedCreate(status, { audience: TOOL, secret: SECRET, now: NOW }), { kind: LINKED_CREATE_STATUS, request })

  const startsAt = new Date('2026-12-05T18:00:00Z')
  const create = signLinkedCreate({ kind: LINKED_CREATE, request: { ...request, toolUserId: 'tooluser1' }, title: ' Winterball ', startsAt }, TOOL, SECRET, { now: NOW })
  assert.deepEqual(verifyLinkedCreate(create, { audience: TOOL, secret: SECRET, now: NOW }),
    { kind: LINKED_CREATE, request: { ...request, toolUserId: 'tooluser1' }, title: 'Winterball', startsAt })
})

test('Anlegen: feste Prüfnachricht (Format darf nicht auseinanderlaufen)', () => {
  const token = signLinkedCreate({ kind: LINKED_CREATE, request, title: 'Ball', startsAt: new Date('2026-12-05T18:00:00Z') }, TOOL, SECRET, { now: NOW })
  assert.equal(token, 'eyJ0eXAiOiJldmVudC1jcmVhdGUiLCJhdWQiOiJodHRwczovL3plaXRwbGFuLmV4YW1wbGUuZGUiLCJyc3ZwRXZlbnRJZCI6ImNtYWJjZGVmZ2hpaiIsInJzdnBVc2VySWQiOiJjbXVzZXIxMjM0NTYiLCJ0b29sVXNlcklkIjpudWxsLCJ0aXRsZSI6IkJhbGwiLCJzdGFydHNBdCI6IjIwMjYtMTItMDVUMTg6MDA6MDAuMDAwWiIsImlhdCI6MTc5Mjg0MzIwMCwiZXhwIjoxNzkyODQzMjYwfQ.ebp3tJl8V6ol8lZLhYLTyPv1iBlwMxvZ_1ENUmcW0AY')
})

test('Anlegen: falscher Empfänger, falsches Secret, abgelaufen, zu lange gültig, kaputte Felder', () => {
  const token = signLinkedCreate({ kind: LINKED_CREATE_STATUS, request }, TOOL, SECRET, { now: NOW })
  assert.equal(verifyLinkedCreate(token, { audience: 'https://schichten.example.de', secret: SECRET, now: NOW }), null)
  assert.equal(verifyLinkedCreate(token, { audience: TOOL, secret: 'y'.repeat(40), now: NOW }), null)
  assert.equal(verifyLinkedCreate(token, { audience: TOOL, secret: SECRET, now: new Date(NOW.getTime() + 61_000) }), null)
  // Andere Art mit gleichem Secret (z.B. ein Webhook) gilt nicht
  assert.equal(verifyLinkedCreate(signLinkMessage('rsvp-change', TOOL, request, SECRET, { now: NOW }), { audience: TOOL, secret: SECRET, now: NOW }), null)
  // Länger als eine Minute gültig: abgelehnt
  assert.equal(verifyLinkedCreate(signLinkMessage(LINKED_CREATE_STATUS, TOOL, request, SECRET, { now: NOW, ttlSeconds: 600 }), { audience: TOOL, secret: SECRET, now: NOW }), null)
  for (const bad of [{ ...request, rsvpEventId: 'X' }, { ...request, rsvpUserId: '' }, { ...request, toolUserId: 'a b' }]) {
    assert.equal(verifyLinkedCreate(signLinkMessage(LINKED_CREATE_STATUS, TOOL, bad, SECRET, { now: NOW, ttlSeconds: 60 }), { audience: TOOL, secret: SECRET, now: NOW }), null)
  }
  for (const extra of [{ title: '', startsAt: '2026-12-05T18:00:00Z' }, { title: 'x'.repeat(201), startsAt: '2026-12-05T18:00:00Z' }, { title: 'Ball', startsAt: 'morgen' }, { title: 'Ball' }, { startsAt: '2026-12-05T18:00:00Z' }]) {
    const fields = { ...request, ...extra }
    assert.equal(verifyLinkedCreate(signLinkMessage(LINKED_CREATE, TOOL, fields, SECRET, { now: NOW, ttlSeconds: 60 }), { audience: TOOL, secret: SECRET, now: NOW }), null)
  }
})

test('Antwort des Tools: nur Links auf den Origin des Tools', () => {
  const ok = { status: 'created', eventId: 'cmevent12345', linkUrl: `${TOOL}/rsvp/cmevent12345`, adminUrl: `${TOOL}/admin/events/cmevent12345` }
  assert.deepEqual(readLinkedCreateResult(ok, TOOL), ok)
  assert.equal(readLinkedCreateResult({ ...ok, linkUrl: 'https://boese.example/rsvp/cmevent12345' }, TOOL), null)
  assert.equal(readLinkedCreateResult({ ...ok, eventId: '../x' }, TOOL), null)
  assert.deepEqual(readLinkedCreateResult({ status: 'no-account', loginUrl: `${TOOL}/login` }, TOOL), { status: 'no-account', loginUrl: `${TOOL}/login` })
  assert.equal(readLinkedCreateResult({ status: 'no-account', loginUrl: 'javascript:alert(1)' }, TOOL), null)
  assert.deepEqual(readLinkedCreateResult({ status: 'ready', extra: 1 }, TOOL), { status: 'ready' })
  assert.equal(readLinkedCreateResult({ status: 'irgendwas' }, TOOL), null)
  assert.equal(readLinkedCreateResult([], TOOL), null)
})

test('Adresse aus dem Titel', () => {
  assert.equal(linkedCreateSlug('Winterball 2026', 'a1b2'), 'winterball-2026-a1b2')
  assert.equal(linkedCreateSlug('Hochzeit Müller & Größe', 'ff00'), 'hochzeit-mueller-groesse-ff00')
  assert.equal(linkedCreateSlug('!!!', 'ff00'), 'event-ff00')
  assert.equal(linkedCreateSlug('x'.repeat(100), 'ff00', 30).length, 30)
})
