// web/mail.ts - eine Mail-Vorlage für alle Tools der Suite (docs/DESIGN.md, „Mails“).
//
// Mails werden aus Bausteinen gebaut, nie aus eigenem HTML. Daraus entstehen HTML-Teil und Klartext mit demselben
// Inhalt. Jeder Text geht durch escapeHtml - Namen, Titel und Angaben von Gästen oder der Verwaltung können kein
// HTML einschleusen. Links gelten nur mit http(s):, mailto:, tel: oder cid:, alles andere wird zu Text.
// Ohne Server-Abhängigkeiten, also auch im Browser nutzbar (Vorschau einer Rundmail).
//
// Gestaltung wie die Oberfläche: weiße Karte auf hellgrauem Grund, Marke wie in der Kopfzeile (Buchstabe im blauen
// Quadrat), Blau nur für die Hauptaktion. Nur Inline-Styles und Tabellen für den Rahmen, damit es auch in Outlook
// und Gmail hält; immer hell (Mail-Programme dunkeln selbst ab, wenn sie wollen).

import { escapeHtml } from './html.js'

/** Ein Stück Fließtext: einfach Text, fett, Festbreite (Codes, IBAN) oder ein Link. */
export type MailInline = string | { strong: string } | { mono: string } | { link: string; href: string }
/** Text eines Bausteins - Zeilenumbrüche (\n) bleiben erhalten. */
export type MailText = string | readonly MailInline[]
export type MailRow = readonly [string, string] | { label: string; value: string; strong?: boolean; mono?: boolean }
/** Bedeutungsfarben wie in DESIGN.md: gray neutral, blue Information, green bestätigt, amber Achtung, red Problem, pink rsvp-app. */
export type MailTone = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'pink'

export type MailBlock =
  | { kind: 'p'; text: MailText }
  | { kind: 'small'; text: MailText }
  | { kind: 'rows'; rows: readonly MailRow[] }
  | { kind: 'list'; items: readonly MailText[] }
  /** Hauptaktion (blau) bzw. `secondary` (weiß mit Rand). Unter der Hauptaktion steht der Link zum Kopieren, außer `fallback: false`. */
  | { kind: 'button'; label: string; href: string; secondary?: boolean; fallback?: boolean }
  /** Hervorgehobener Kasten, z.B. Nachricht der Veranstaltung oder Zahlungsdaten. */
  | { kind: 'box'; tone?: MailTone; title?: string; blocks: readonly MailBlock[] }
  /** Bild aus dem Anhang (`cid:…`), z.B. QR-Code; Breite/Höhe in Pixeln. */
  | { kind: 'image'; src: string; alt: string; width: number; height: number; caption?: string }

export type Mail = {
  /** Marke wie in der Kopfzeile des Tools, z.B. { letter: 'R', name: 'RSVP' }. */
  brand: { letter: string; name: string }
  /** Überschrift in der Karte. */
  heading: string
  /** Vorschauzeile im Posteingang (wird nicht angezeigt). */
  preheader?: string
  blocks: readonly MailBlock[]
  /** Kleingedrucktes unter der Karte, z.B. warum man die Mail bekommt. */
  footer?: string
}

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
const C = { text: '#111827', muted: '#6b7280', border: '#e5e7eb', page: '#f9fafb', blue: '#2563eb' }
const TONES: Record<MailTone, { bg: string; border: string }> = {
  gray: { bg: '#f9fafb', border: '#e5e7eb' },
  blue: { bg: '#eff6ff', border: '#bfdbfe' },
  green: { bg: '#f0fdf4', border: '#bbf7d0' },
  amber: { bg: '#fffbeb', border: '#fde68a' },
  red: { bg: '#fef2f2', border: '#fecaca' },
  pink: { bg: '#fdf2f8', border: '#fbcfe8' }
}

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|cid:)/i

/** Ist der Link erlaubt? Sonst wird er als Text ausgegeben (kein javascript:, data: …). */
export function isSafeMailHref(href: string): boolean {
  return SAFE_HREF.test(href.trim())
}

function inlines(text: MailText): readonly MailInline[] {
  return typeof text === 'string' ? [text] : text
}

function br(html: string): string {
  return html.replace(/\r?\n/g, '<br>')
}

function inlineHtml(text: MailText): string {
  return inlines(text).map(part => {
    if (typeof part === 'string') return br(escapeHtml(part))
    if ('strong' in part) return `<strong>${br(escapeHtml(part.strong))}</strong>`
    if ('mono' in part) return `<span style="font-family: ${MONO};">${escapeHtml(part.mono)}</span>`
    return isSafeMailHref(part.href)
      ? `<a href="${escapeHtml(part.href.trim())}" style="color: ${C.blue}; text-decoration: underline; word-break: break-all;">${escapeHtml(part.link)}</a>`
      : escapeHtml(part.link)
  }).join('')
}

function inlineText(text: MailText): string {
  return inlines(text).map(part => {
    if (typeof part === 'string') return part
    if ('strong' in part) return part.strong
    if ('mono' in part) return part.mono
    return part.link === part.href ? part.href : `${part.link} (${part.href})`
  }).join('')
}

function row(r: MailRow): { label: string; value: string; strong?: boolean; mono?: boolean } {
  return Array.isArray(r) ? { label: r[0], value: r[1] } : r as Exclude<MailRow, readonly [string, string]>
}

function blockHtml(block: MailBlock): string {
  switch (block.kind) {
    case 'p':
      return `<p style="margin: 0 0 16px;">${inlineHtml(block.text)}</p>`
    case 'small':
      return `<p style="margin: 0 0 16px; font-size: 13px; line-height: 1.5; color: ${C.muted};">${inlineHtml(block.text)}</p>`
    case 'rows':
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 0 16px; font-size: 15px;">${block.rows.map(r => {
        const { label, value, strong, mono } = row(r)
        const style = `padding: 3px 0; vertical-align: top;${strong ? ' font-weight: 600;' : ''}${mono ? ` font-family: ${MONO};` : ''}`
        return `<tr><td style="padding: 3px 16px 3px 0; color: ${C.muted}; vertical-align: top; white-space: nowrap;">${escapeHtml(label)}</td><td style="${style}">${br(escapeHtml(value))}</td></tr>`
      }).join('')}</table>`
    case 'list':
      return `<ul style="margin: 0 0 16px; padding-left: 20px;">${block.items.map(item => `<li style="margin: 0 0 4px;">${inlineHtml(item)}</li>`).join('')}</ul>`
    case 'button': {
      if (!isSafeMailHref(block.href)) return `<p style="margin: 0 0 16px;">${escapeHtml(block.label)}</p>`
      const href = escapeHtml(block.href.trim())
      const style = block.secondary
        ? `background-color: #ffffff; color: ${C.text}; border: 1px solid #d1d5db;`
        : `background-color: ${C.blue}; color: #ffffff; border: 1px solid ${C.blue};`
      const fallback = block.fallback ?? !block.secondary
      return `<p style="margin: 24px 0 ${fallback ? '8px' : '24px'};"><a href="${href}" style="display: inline-block; ${style} padding: 12px 22px; border-radius: 8px; font-weight: 600; font-size: 15px; text-decoration: none;">${escapeHtml(block.label)}</a></p>`
        + (fallback ? `<p style="margin: 0 0 24px; font-size: 13px; line-height: 1.5; color: ${C.muted};">Falls der Knopf nicht funktioniert, diesen Link öffnen:<br><a href="${href}" style="color: ${C.muted}; word-break: break-all;">${href}</a></p>` : '')
    }
    case 'box': {
      const tone = TONES[block.tone ?? 'gray']
      const title = block.title ? `<p style="margin: 0 0 8px; font-weight: 600;">${escapeHtml(block.title)}</p>` : ''
      // Unten kein Innenabstand: den bringt der Abstand des letzten Bausteins mit.
      return `<div style="background-color: ${tone.bg}; border: 1px solid ${tone.border}; border-radius: 8px; padding: 16px 16px 0; margin: 0 0 16px;">${title}${block.blocks.map(blockHtml).join('')}</div>`
    }
    case 'image':
      if (!isSafeMailHref(block.src)) return ''
      return `<p style="margin: 8px 0 ${block.caption ? '4px' : '16px'}; text-align: center;"><img src="${escapeHtml(block.src.trim())}" alt="${escapeHtml(block.alt)}" width="${Math.round(block.width)}" height="${Math.round(block.height)}" style="display: inline-block; width: ${Math.round(block.width)}px; height: ${Math.round(block.height)}px; border: 0;"></p>`
        + (block.caption ? `<p style="margin: 0 0 16px; text-align: center; font-size: 13px; color: ${C.muted};">${escapeHtml(block.caption)}</p>` : '')
  }
}

function blockText(block: MailBlock): string {
  switch (block.kind) {
    case 'p': case 'small': return inlineText(block.text)
    case 'rows': return block.rows.map(r => {
      const { label, value } = row(r)
      // Mehrzeilige Werte (z.B. mehrere Namen) eingerückt unter der Bezeichnung.
      return value.includes('\n') ? `${label}:\n${value.split(/\r?\n/).map(line => `  ${line}`).join('\n')}` : `${label}: ${value}`
    }).join('\n')
    case 'list': return block.items.map(item => `- ${inlineText(item)}`).join('\n')
    case 'button': return isSafeMailHref(block.href) ? `${block.label}:\n${block.href.trim()}` : block.label
    case 'box': return [block.title, ...block.blocks.map(blockText)].filter(Boolean).join('\n\n')
    case 'image': return block.caption ?? ''
  }
}

export function mailHtml(mail: Mail): string {
  const brand = `<span style="display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 8px; background-color: ${C.blue}; color: #ffffff; font-weight: 600; font-size: 14px; vertical-align: middle;">${escapeHtml(mail.brand.letter)}</span>`
    + `<span style="margin-left: 8px; font-weight: 600; font-size: 15px; color: ${C.text}; vertical-align: middle;">${escapeHtml(mail.brand.name)}</span>`
  const preheader = mail.preheader
    ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${escapeHtml(mail.preheader)}</div>`
    : ''
  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(mail.heading)}</title></head>
<body style="margin: 0; padding: 0; background-color: ${C.page};">${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${C.page};"><tr><td align="center" style="padding: 24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; font-family: ${FONT};">
<tr><td style="padding: 0 4px 12px;">${brand}</td></tr>
<tr><td style="background-color: #ffffff; border: 1px solid ${C.border}; border-radius: 12px; padding: 28px 24px 12px; color: ${C.text}; font-size: 16px; line-height: 1.55;">
<h1 style="margin: 0 0 16px; font-size: 22px; line-height: 1.3; font-weight: 700; color: ${C.text};">${escapeHtml(mail.heading)}</h1>
${mail.blocks.map(blockHtml).join('\n')}
</td></tr>
${mail.footer ? `<tr><td style="padding: 16px 4px 0; font-size: 12px; line-height: 1.5; color: ${C.muted};">${br(escapeHtml(mail.footer))}</td></tr>\n` : ''}</table>
</td></tr></table>
</body></html>`
}

export function mailText(mail: Mail): string {
  const body = mail.blocks.map(blockText).filter(Boolean).join('\n\n')
  return `${body}\n\n-- \n${mail.footer ? `${mail.footer}\n` : ''}${mail.brand.name}\n`
}

/** HTML- und Klartext-Teil einer Mail aus denselben Bausteinen. */
export function renderMail(mail: Mail): { html: string; text: string } {
  return { html: mailHtml(mail), text: mailText(mail) }
}
