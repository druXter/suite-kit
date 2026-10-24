// test/web.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { safeEqual } from '../src/secrets.js'
import { readLimitedText } from '../web/body.js'
import { csvCell, csvResponse, toCsv } from '../web/csv.js'
import { BASE_RULE, NO_FRAMING, PRIVATE_PAGE, SECRET_URL_PAGE, SUITE_RULES } from '../web/headers.js'
import { escapeHtml } from '../web/html.js'

test('csvCell: Formeln entschärft, Zahlen bleiben Zahlen, Anführungszeichen nur wo nötig', () => {
  for (const formula of ['=HYPERLINK("x")', '+1', '-2+3', '@SUM(A1)', '\tx', '\rx']) {
    assert.ok(csvCell(formula).replace(/^"/, '').startsWith("'"), formula)
  }
  assert.equal(csvCell('=1+1'), "'=1+1")
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`)
  assert.equal(csvCell(-5), '-5')
  assert.equal(csvCell(2.5), '2.5')
  assert.equal(csvCell(true), 'true')
  assert.equal(csvCell(null), '')
  assert.equal(csvCell(undefined), '')
  assert.equal(csvCell('Anna'), 'Anna')
  assert.equal(csvCell('a;b'), '"a;b"')
  assert.equal(csvCell('Zeile 1\nZeile 2'), '"Zeile 1\nZeile 2"')
  assert.equal(csvCell('Mitte = egal'), 'Mitte = egal')
})

test('toCsv/csvResponse: BOM, Semikolon, CRLF, sicherer Dateiname, kein Cache', async () => {
  assert.equal(toCsv([['Name', 'Anzahl'], ['Anna', 2]]), '﻿Name;Anzahl\r\nAnna;2\r\n')
  const response = csvResponse([['a']], 'Gäste "Liste".csv')
  assert.equal(response.headers.get('content-type'), 'text/csv; charset=utf-8')
  assert.equal(response.headers.get('content-disposition'), 'attachment; filename="G_ste__Liste_.csv"')
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(await response.text(), 'a\r\n') // BOM entfernt der Decoder von Response.text()
})

test('escapeHtml: alle fünf Zeichen, null/undefined leer, Zahlen als Text', () => {
  assert.equal(escapeHtml(`<a href="x" onclick='y'>&</a>`), '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;')
  assert.equal(escapeHtml(null), '')
  assert.equal(escapeHtml(undefined), '')
  assert.equal(escapeHtml(3), '3')
  assert.equal(escapeHtml('Grüße'), 'Grüße')
})

function streamed(text: string, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/', { method: 'POST', body: text, headers })
}

test('readLimitedText: bis zum Limit gelesen, darüber null - auch bei falscher Content-Length', async () => {
  assert.equal(await readLimitedText(streamed('äöü'), 6), 'äöü')
  assert.equal(await readLimitedText(streamed('äöü'), 5), null)
  assert.equal(await readLimitedText(streamed('x'.repeat(10), { 'content-length': '100' }), 50), null)
  // Gelogene Content-Length: gezählt wird, was ankommt.
  const chunks = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < 10; i++) controller.enqueue(new Uint8Array(1000))
      controller.close()
    }
  })
  const lying = new Request('http://localhost/', { method: 'POST', body: chunks, headers: { 'content-length': '10' }, duplex: 'half' } as RequestInit)
  assert.equal(await readLimitedText(lying, 5000), null)
  assert.equal(await readLimitedText(new Request('http://localhost/'), 10), '')
})

test('safeEqual', () => {
  assert.equal(safeEqual('geheim', 'geheim'), true)
  assert.equal(safeEqual('geheim', 'geheiM'), false)
  assert.equal(safeEqual('geheim', 'geheim2'), false)
  assert.equal(safeEqual('', ''), true)
})

test('Header-Bausteine: Reihenfolge und Inhalte', () => {
  assert.equal(BASE_RULE.source, '/:path*')
  assert.ok(!BASE_RULE.headers.some(h => h.key === 'X-Frame-Options' || h.key === 'Content-Security-Policy'))
  assert.deepEqual(PRIVATE_PAGE.slice(0, 2), NO_FRAMING)
  assert.ok(SECRET_URL_PAGE.some(h => h.key === 'Referrer-Policy' && h.value === 'no-referrer'))
  assert.deepEqual(SUITE_RULES.map(r => r.source), ['/sw.js', '/api/suite/:path*'])
})
