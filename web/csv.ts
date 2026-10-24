// web/csv.ts - ein Format für alle CSV-Exporte der Suite.
//
// Semikolon, CRLF und UTF-8 mit BOM, damit ein deutsches Excel die Datei ohne Import-Assistenten richtig öffnet.
// Anführungszeichen nur, wo nötig (Semikolon, Anführungszeichen, Zeilenumbruch).
//
// Formel-Schutz (CSV-Injection, Empfehlung von OWASP): Namen, Notizen und Antworten tippen Gäste selbst ein. Beginnt
// eine Zelle mit = + - @, Tab oder Wagenrücklauf, führte eine Tabellenkalkulation sie als Formel aus - davor kommt
// deshalb ein Hochkomma. Zahlen bleiben Zahlen (auch negative).

export type CsvValue = string | number | boolean | null | undefined

const FORMULA_START = /^[=+\-@\t\r]/

export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return ''
  let text = String(value)
  if (typeof value === 'string' && FORMULA_START.test(text)) text = `'${text}`
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Ganze Datei: Kopfzeile ist einfach die erste Zeile. */
export function toCsv(rows: readonly (readonly CsvValue[])[]): string {
  return '﻿' + rows.map(row => row.map(csvCell).join(';')).join('\r\n') + '\r\n'
}

/** Download-Antwort für Export-Routen; der Dateiname wird auf sichere Zeichen reduziert. */
export function csvResponse(rows: readonly (readonly CsvValue[])[], filename: string): Response {
  return new Response(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename.replace(/[^A-Za-z0-9._-]/g, '_')}"`,
      'Cache-Control': 'no-store'
    }
  })
}
