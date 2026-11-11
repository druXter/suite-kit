// web/text.ts - Eingaben auf eine Zeile bringen.

/**
 * Für Namen und andere einzeilige Angaben: Zeilenumbrüche (auch U+2028/U+2029), Tabs und andere Steuerzeichen werden
 * zu einem Leerzeichen, Ränder entfernt. Mehrfache Leerzeichen innerhalb bleiben, wie sie sind.
 *
 * Warum: Mails übernehmen Zeilenumbrüche (HTML `<br>`, Klartext wörtlich). Ein Name wie „Anna\n\nBitte überweisen Sie
 * an …“ stünde sonst als eigener Absatz in einer Mail unseres (DKIM-signierten) Absenders. Gilt für alles, was ein Tool
 * annimmt - Formulare, Importe, Anbindungen.
 */
export function singleLine(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f\u0085\u2028\u2029]+/g, ' ').trim()
}
