// test/embed.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { EMBED_HEIGHT_MESSAGE, readEmbedHeight } from '../ui/embed-message.js'

// Automatische Höhe eingebetteter Seiten (Idee Q10): nur aus genau dem iFrame, von dessen Origin, im richtigen Format.
const frameWindow = {}
const iframe = { contentWindow: frameWindow, src: 'https://rsvp.example.de/sommerfest?x=1' }
const message = (over: Partial<{ source: unknown; origin: string; data: unknown }> = {}) =>
  ({ source: frameWindow, origin: 'https://rsvp.example.de', data: { type: EMBED_HEIGHT_MESSAGE, height: 640 }, ...over })

test('gültige Nachricht aus dem iFrame: Höhe', () => {
  assert.equal(readEmbedHeight(message(), iframe), 640)
})

test('anderes Fenster, anderer Origin, kein iFrame: ignoriert', () => {
  assert.equal(readEmbedHeight(message({ source: {} }), iframe), null)
  assert.equal(readEmbedHeight(message({ origin: 'https://boese.example' }), iframe), null)
  assert.equal(readEmbedHeight(message(), null), null)
  assert.equal(readEmbedHeight(message(), { contentWindow: null, src: iframe.src }), null)
  assert.equal(readEmbedHeight(message(), { contentWindow: frameWindow, src: 'kein link' }), null)
  assert.equal(readEmbedHeight(message({ origin: 'null' }), { contentWindow: frameWindow, src: 'data:text/html,x' }), null)
})

test('falsches Format: ignoriert', () => {
  for (const data of [null, 'suite:height', { type: 'abstimmungstool:hoehe', height: 640 }, { type: EMBED_HEIGHT_MESSAGE, height: '640' },
    { type: EMBED_HEIGHT_MESSAGE, height: 0 }, { type: EMBED_HEIGHT_MESSAGE, height: -5 }, { type: EMBED_HEIGHT_MESSAGE, height: 12.5 },
    { type: EMBED_HEIGHT_MESSAGE, height: 1e9 }, { type: EMBED_HEIGHT_MESSAGE }]) {
    assert.equal(readEmbedHeight(message({ data }), iframe), null, JSON.stringify(data))
  }
})
