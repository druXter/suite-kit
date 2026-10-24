// test/push.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isKnownPushService, validPushSubscription } from '../web/push.js'

const keys = { p256dh: 'B' + 'a'.repeat(86), auth: 'c'.repeat(22) }

test('nur Push-Dienste der Browser-Hersteller', () => {
  for (const ok of ['https://fcm.googleapis.com/fcm/send/abc', 'https://updates.push.services.mozilla.com/wpush/v2/x', 'https://web.push.apple.com/Q', 'https://wns2-par02p.notify.windows.com/w/?token=x']) {
    assert.ok(isKnownPushService(ok), ok)
  }
  for (const bad of ['http://fcm.googleapis.com/x', 'https://fcm.googleapis.com:8443/x', 'https://evilfcm.googleapis.com.evil.de/x',
    'https://192.168.178.126:8123/api', 'https://localhost/x', 'https://user:pw@fcm.googleapis.com/x', 'kein link', 'https://fcm.googleapis.com.evil.de/']) {
    assert.ok(!isKnownPushService(bad), bad)
  }
})

test('validPushSubscription: Endpoint, Schlüssel, Längen, Typen', () => {
  assert.deepEqual(validPushSubscription({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys }), { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', ...keys })
  assert.equal(validPushSubscription({ endpoint: 'http://192.168.178.126:8123/', keys }), null)
  assert.equal(validPushSubscription({ endpoint: 'https://fcm.googleapis.com/' + 'x'.repeat(1000), keys }), null)
  assert.equal(validPushSubscription({ endpoint: 'https://fcm.googleapis.com/x', keys: { p256dh: 'kurz', auth: keys.auth } }), null)
  assert.equal(validPushSubscription({ endpoint: 'https://fcm.googleapis.com/x', keys: { p256dh: keys.p256dh, auth: 5 } }), null)
  assert.equal(validPushSubscription({ endpoint: 'https://fcm.googleapis.com/x', keys: null }), null)
  assert.equal(validPushSubscription(null), null)
  assert.equal(validPushSubscription(undefined), null)
})
