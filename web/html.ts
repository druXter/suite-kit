// web/html.ts

/**
 * Für alles in HTML-Mails, was nicht wörtlich im Code steht: Namen und Angaben von Gästen, aber auch Titel, Ort und
 * Texte der Verwaltung. Gäste können sich mit fremder Adresse anmelden - ohne Escaping ließe sich so über unseren
 * (DKIM-signierten) Absender beliebiges HTML an fremde Postfächer schicken. Nicht für Betreff und Textteil.
 * Ohne Server-Abhängigkeiten, also auch im Browser nutzbar (Mail-Vorschau).
 */
export function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '').replace(/[&<>"']/g, c => HTML_ENTITIES[c]!)
}

const HTML_ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
