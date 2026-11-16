// rules/index.ts - Prüfungen, die jedes Tool gegen seine EIGENEN Funktionen laufen lässt (suite-kit/rules, seit v0.17.0).
//
// Warum: Dieselben Lücken standen im November 2026 in fast jedem Audit, weil jedes Tool eine eigene Kopie von
// `clientIp` und `normalizeEmail` hat und eine Korrektur in suite-kit die Kopien nicht erreicht. Diese Sammlung dreht
// das um: Kommt aus einem Audit eine neue Regel dazu, steht sie hier - und ist nach dem nächsten Update von suite-kit
// in jedem Tool rot, das sie nicht erfüllt (scripts/update-apps.mjs lässt die Datei laufen).
//
// Ohne Bindung an einen Test-Runner (Vitest in den Tools, node:test hier): Jede Prüfung ist ein Name und eine Funktion,
// die bei einem Verstoß wirft. Im Tool, `tests/unit/suite-rules.test.ts`:
//
//   import { it } from 'vitest'
//   import { suiteRules } from 'suite-kit/rules'
//   for (const rule of suiteRules({ clientIp: ..., normalizeEmail })) it(rule.name, rule.run)
//
// Nur für Tests gedacht (node:assert) - nicht aus App-Code importieren.
import assert from 'node:assert/strict'

export type SuiteRule = { name: string; run: () => Promise<void> }

export type SuiteRuleSubjects = {
  /**
   * Die Besucher-Kennung, die das Tool für die Drosselung „pro IP“ bildet, wenn `X-Forwarded-For` diesen Wert hat und
   * `TRUST_PROXY_HOPS` 1 ist. Im Tool: Header und Umgebungsvariable setzen (Mock von next/headers), `clientIp()` rufen.
   * Weglassen, wenn das Tool nichts pro IP drosselt.
   */
  clientIp?: (forwardedFor: string) => string | Promise<string>
  /** `normalizeEmail` des Tools: die Adresse, wie sie gespeichert und gezählt wird, oder null/undefined/'' bei Ablehnung. */
  normalizeEmail?: (input: string) => string | null | undefined
}

/** Schreibweisen, die nodemailer an vera@example.org zustellt (oder an mehrere), die aber als eigene Adresse zählten. */
const EMAIL_SPELLINGS = [
  '<vera@example.org>', 'x<vera@example.org>', '"Paket wartet"<vera@example.org>', '(x)vera@example.org', 'vera@example.org;',
  'a:vera@example.org;', 'x,vera@example.org', 'x;vera@example.org', 'vera@example.org,zweite@example.org', 'vera@[127.0.0.1]'
]

/** Die Regeln für das, was das Tool mitgibt. Jede beginnt mit einer Gegenprobe: Das Erlaubte geht durch. */
export function suiteRules(subjects: SuiteRuleSubjects): SuiteRule[] {
  const rules: SuiteRule[] = []
  const { clientIp, normalizeEmail } = subjects

  if (clientIp) {
    rules.push({
      name: 'Suite-Regel: Drosselung „pro IP“ zählt ein IPv6-/64 als einen Besucher (R-08, W-09, T-10)',
      run: async () => {
        // Gegenprobe: verschiedene Anschlüsse bleiben verschieden.
        assert.notEqual(await clientIp('203.0.113.7'), await clientIp('203.0.113.8'), 'zwei IPv4-Adressen sind zwei Besucher')
        assert.notEqual(await clientIp('2001:db8:1:2::1'), await clientIp('2001:db8:1:3::1'), 'zwei /64 sind zwei Besucher')
        // Regel: Ein Anschluss hat 2^64 Adressen - alle zählen zusammen, in jeder Schreibweise.
        assert.equal(await clientIp('2001:db8:1:2:aaaa:bbbb:cccc:1'), await clientIp('2001:db8:1:2:1111:2222:3333:2'), 'dasselbe /64 ist ein Besucher')
        assert.equal(await clientIp('2001:DB8:0001:0002::1'), await clientIp('2001:db8:1:2::9'), 'Schreibweise der Adresse ist egal')
        assert.equal(await clientIp('::ffff:203.0.113.7'), await clientIp('203.0.113.7'), 'IPv4 in IPv6-Schreibweise ist dieselbe Adresse')
      }
    })
    rules.push({
      name: 'Suite-Regel: Drosselung „pro IP“ nimmt den Eintrag des eigenen Proxys, nichts Erfundenes davor',
      run: async () => {
        assert.equal(await clientIp('203.0.113.7'), await clientIp(' 203.0.113.7 '), 'Leerraum ist egal')
        assert.equal(await clientIp('6.6.6.6, 203.0.113.7'), await clientIp('203.0.113.7'), 'links Erfundenes zählt nicht')
        assert.equal(await clientIp('2001:db8:9:9::1, 203.0.113.7'), await clientIp('203.0.113.7'), 'links Erfundenes zählt nicht')
      }
    })
  }

  if (normalizeEmail) {
    rules.push({
      name: 'Suite-Regel: eine E-Mail-Adresse ist genau eine nackte Adresse (R-07, W-08)',
      run: async () => {
        // Gegenprobe: gewöhnliche Adressen gehen durch, Ränder und Großschreibung sind egal.
        assert.equal(normalizeEmail(' Vera@Example.org '), 'vera@example.org')
        assert.equal(normalizeEmail("o'brien+fest@mail.example.de"), "o'brien+fest@mail.example.de")
        // Regel: Was nodemailer als Anzeigename, Kommentar, Gruppe oder Liste liest, ist keine Adresse.
        for (const spelling of EMAIL_SPELLINGS) assert.ok(!normalizeEmail(spelling), `abgelehnt: ${spelling}`)
        for (const broken of ['vera@example', 'vera@@example.org', 'vera @example.org', 'vera@exa\nmple.org', `${'a'.repeat(250)}@example.org`, '']) {
          assert.ok(!normalizeEmail(broken), `abgelehnt: ${JSON.stringify(broken)}`)
        }
      }
    })
  }
  return rules
}
