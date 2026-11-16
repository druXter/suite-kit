// web/input.ts - Eingaben prüfen, die in mehreren Tools gleich behandelt werden müssen.

// Zeichen, mit denen nodemailer (und Mailprogramme) aus einem Feld mehr als eine nackte Adresse lesen: Anzeigenamen
// (`x<a@b.c>`), Kommentare (`(x)a@b.c`), Gruppen (`a:a@b.c;`), Listen (`a@b.c, d@e.f`), Zitate und Literale.
const NOT_IN_EMAIL = String.raw`\s\u0000-\u001f\u007f@<>()"[\]\\,;:`
const SINGLE_EMAIL = new RegExp(`^[^${NOT_IN_EMAIL}]+@[^${NOT_IN_EMAIL}]+\\.[^${NOT_IN_EMAIL}]+$`)

/**
 * Genau EINE nackte E-Mail-Adresse (höchstens 254 Zeichen, RFC 5321)? Prüft nur die Form, normalisiert nicht - Tools
 * schneiden vorher Ränder ab und schreiben klein.
 *
 * Warum so streng: nodemailer stellt `x<vera@example.org>`, `(x)vera@example.org` und `vera@example.org;` an
 * vera@example.org zu, `a@x.de, b@y.de` an zwei Empfänger. Für Drosselung („5 Mails je Adresse“) und „eine Adresse je
 * Termin“ wäre jede Schreibweise aber eine neue Adresse, und der Text vor der spitzen Klammer stünde als Anzeigename
 * im Empfängerfeld unserer Mail (Audit Wichteln W-08, rsvp-app R-07).
 */
export function isSingleEmail(value: string): boolean {
  return value.length <= 254 && SINGLE_EMAIL.test(value)
}

/**
 * Kennung eines Besuchers für die Drosselung „pro IP“. Bei IPv6 das /64: Ein gewöhnlicher Anschluss bekommt ein ganzes
 * Netz mit 2^64 Adressen - zählte jede einzeln, hätte jede Anfrage einen eigenen Zähler und keine Regel „pro IP“
 * bremste (Audit rsvp-app R-08, Wichteln W-09). IPv4 (auch als `::ffff:a.b.c.d`) bleibt, wie es ist; Klammern und
 * Zonen-Angabe (`%eth0`) fallen weg. Was keine gültige IPv6-Adresse ist, kommt unverändert zurück.
 */
export function visitorOf(ip: string): string {
  const address = ip.trim().toLowerCase().replace(/^\[|\]$/g, '').replace(/%.*$/, '')
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(address)
  if (mapped) return mapped[1]
  if (!address.includes(':')) return address
  const halves = address.split('::')
  if (halves.length > 2) return address
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const groups = halves.length === 2 ? [...head, ...Array<string>(Math.max(0, 8 - head.length - tail.length)).fill('0'), ...tail] : head
  if (groups.length !== 8 || !groups.every(g => /^[0-9a-f]{1,4}$/.test(g))) return address
  return `${groups.slice(0, 4).map(g => Number.parseInt(g, 16).toString(16)).join(':')}::/64`
}

/**
 * E-Mail-Adresse aus einem Formular: Ränder weg, klein geschrieben, und nur, wenn es genau EINE nackte Adresse ist
 * (`isSingleEmail`) - sonst null. Die fertige Funktion für `app/lib/form.ts` der Tools (seit v0.17.0), damit die Regel
 * nicht je Tool nachgebaut wird: Dieselbe Lücke stand in mehreren Audits (rsvp-app R-07, Wichteln W-08, Termine
 * T-10), jeweils in einer eigenen Kopie.
 */
export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase()
  return isSingleEmail(email) ? email : null
}

/**
 * Besucher-Kennung für die Drosselung aus `X-Forwarded-For` (seit v0.17.0) - die fertige Rechnung für `clientIp` der
 * Tools: `clientIpFrom((await headers()).get('x-forwarded-for'), process.env.TRUST_PROXY_HOPS)`.
 *
 * Jeder Proxy HÄNGT die Adresse, die er sieht, hinten an; der Wert ganz links kann vom Client erfunden sein. Gezählt
 * wird deshalb von rechts: `hops` eigene Proxys (Standard 1). 0 oder Ungültiges ignoriert den Header - alle Besucher
 * teilen sich dann die Kennung "unknown" (sicher, aber grob). IPv6 kommt als /64 zurück (`visitorOf`).
 */
export function clientIpFrom(forwardedFor: string | null | undefined, hops: string | number | undefined = 1): string {
  const count = typeof hops === 'number' ? hops : Number.parseInt(hops ?? '1', 10)
  if (!Number.isInteger(count) || count < 1 || !forwardedFor) return 'unknown'
  const parts = forwardedFor.split(',').map(part => part.trim()).filter(Boolean)
  const ip = parts[parts.length - count]
  return ip ? visitorOf(ip) : 'unknown'
}
