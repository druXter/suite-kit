// test/mail.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isSafeMailHref, mailHtml, mailText, renderMail, type Mail } from '../web/mail.js'

const evil = `<img src=x onerror=alert(1)>"'&`

function sample(extra: Partial<Mail> = {}): Mail {
  return {
    brand: { letter: 'R', name: 'RSVP' },
    heading: `Zusage bestätigt, ${evil}`,
    preheader: 'Vorschau',
    blocks: [
      { kind: 'p', text: ['Hallo ', { strong: evil }, ',\nzweite Zeile'] },
      { kind: 'rows', rows: [['Wann', 'Sa, 1.11.'], { label: 'Verwendungszweck', value: 'E2E-123', mono: true, strong: true }] },
      { kind: 'list', items: ['Anna', ['Ben ', { mono: 'X1' }]] },
      { kind: 'button', label: 'Antwort bearbeiten', href: 'https://rsvp.example.de/x?token=a&b=1' },
      { kind: 'button', label: 'Zeitplan', href: 'https://zeitplan.example.de/', secondary: true },
      { kind: 'box', tone: 'pink', title: 'Bitte überweisen', blocks: [{ kind: 'p', text: 'Betrag 25 €' }] },
      { kind: 'image', src: 'cid:checkinqr', alt: 'QR', width: 200, height: 200, caption: 'Am Einlass zeigen' },
      { kind: 'small', text: [{ link: 'Datenschutz', href: 'https://rsvp.example.de/datenschutz' }] }
    ],
    footer: 'Du bekommst diese Mail, weil du zugesagt hast.',
    ...extra
  }
}

test('HTML: alles escapet, Bausteine vollständig, Marke und Fußzeile', () => {
  const html = mailHtml(sample())
  assert.ok(!html.includes('<img src=x'), 'eingeschleustes HTML')
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;&quot;&#39;&amp;'))
  assert.ok(html.includes('<strong>&lt;img'))
  assert.ok(html.includes(',<br>zweite Zeile'))
  assert.ok(html.includes('href="https://rsvp.example.de/x?token=a&amp;b=1"'))
  assert.ok(html.includes('Falls der Knopf nicht funktioniert'))
  assert.equal(html.match(/Falls der Knopf/g)!.length, 1, 'Ersatzlink nur unter der Hauptaktion')
  assert.ok(html.includes('src="cid:checkinqr"') && html.includes('width="200"'))
  assert.ok(html.includes('#fdf2f8'), 'Ton pink')
  assert.ok(html.includes('>RSVP</span>') && html.includes('>R</span>'))
  assert.ok(html.includes('Du bekommst diese Mail'))
  assert.ok(html.startsWith('<!DOCTYPE html>') && html.includes('<html lang="de">'))
})

test('Links nur mit http(s), mailto, tel, cid - sonst Text', () => {
  for (const href of ['https://a.de', 'http://localhost:3000/x', 'mailto:a@b.de', 'tel:+49', 'cid:qr']) assert.ok(isSafeMailHref(href), href)
  for (const href of ['javascript:alert(1)', ' JavaScript:alert(1)', 'data:text/html,x', '//evil.de', '/relativ']) assert.ok(!isSafeMailHref(href), href)
  const html = mailHtml(sample({ blocks: [
    { kind: 'button', label: 'Klick', href: 'javascript:alert(1)' },
    { kind: 'p', text: [{ link: 'Link', href: 'data:text/html,x' }] },
    { kind: 'image', src: 'https://tracker.example/x.png" onload="x', alt: 'a', width: 1, height: 1 }
  ] }))
  assert.ok(!html.includes('javascript:') && !html.includes('data:text'))
  assert.ok(html.includes('>Klick</p>') && html.includes('>Link</p>'))
  assert.ok(!html.includes('onload="x"'))
})

test('Klartext aus denselben Bausteinen', () => {
  const text = mailText(sample())
  assert.ok(text.startsWith(`Hallo ${evil},\nzweite Zeile`), 'unescapet im Klartext')
  assert.ok(text.includes('Wann: Sa, 1.11.\nVerwendungszweck: E2E-123'))
  assert.ok(text.includes('- Anna\n- Ben X1'))
  assert.ok(mailText(sample({ blocks: [{ kind: 'rows', rows: [['Gäste', 'Anna\nBen']] }] })).startsWith('Gäste:\n  Anna\n  Ben'))
  assert.ok(text.includes('Antwort bearbeiten:\nhttps://rsvp.example.de/x?token=a&b=1'))
  assert.ok(text.includes('Bitte überweisen\n\nBetrag 25 €'))
  assert.ok(text.includes('Am Einlass zeigen'))
  assert.ok(text.includes('Datenschutz (https://rsvp.example.de/datenschutz)'))
  assert.ok(text.endsWith('-- \nDu bekommst diese Mail, weil du zugesagt hast.\nRSVP\n'))
  assert.deepEqual(renderMail(sample()), { html: mailHtml(sample()), text })
})

test('Einzeilige Stellen bleiben einzeilig, Fließtext und Werte nicht', () => {
  const mail: Mail = {
    brand: { letter: 'R', name: 'RSVP' },
    heading: 'Hallo\nAnna',
    blocks: [
      { kind: 'rows', rows: [['Name\nBitte überweisen', 'Anna\nBen']] },
      { kind: 'button', label: 'Öffnen\nJetzt', href: 'https://example.de' },
      { kind: 'box', title: 'Titel\nZweite', blocks: [{ kind: 'p', text: ['Zeile 1\nZeile 2', { link: 'Link\ntext', href: 'https://example.de/x' }] }] }
    ]
  }
  const html = mailHtml(mail)
  assert.ok(html.includes('>Hallo Anna</h1>') && html.includes('<title>Hallo Anna</title>'))
  assert.ok(html.includes('>Name Bitte überweisen</td>') && html.includes('Anna<br>Ben'))
  assert.ok(html.includes('>Öffnen Jetzt</a>') && html.includes('>Titel Zweite</p>') && html.includes('>Link text</a>'))
  assert.ok(html.includes('Zeile 1<br>Zeile 2'))
  const text = mailText(mail)
  assert.ok(text.includes('Name Bitte überweisen:\n  Anna\n  Ben') && text.includes('Öffnen Jetzt:\n') && text.includes('Titel Zweite'))
})
