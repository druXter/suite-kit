// src/config.ts
import { normalizeOrigin } from './origin.js'

/**
 * Einheitliche Env-Konfiguration für alle Tools der Suite. Ungültige Einträge werden
 * mit einer Warnung verworfen statt das Tool abstürzen zu lassen - beide Listen
 * schränken nur ein (weniger Anbieter, weniger erlaubte Empfänger), verworfene
 * Einträge sind also die sichere Richtung, und ein Tippfehler in der Föderation darf
 * das eigenständige Tool nicht lahmlegen.
 */

export type IdpConfig = {
  /** Origin des Anbieter-Tools. */
  issuer: string
  /** Anzeigename auf dem Login-Button; Fallback ist der Name aus dem Discovery-Dokument. */
  label?: string
  /** Beim ersten Login automatisch ein lokales Konto ohne Passwort anlegen. Standard: ja. */
  autoProvision: boolean
  /** Einen Admin des Anbieters hier ebenfalls als Admin führen. Standard: nein (Creator). */
  mapAdminRole: boolean
}

/**
 * SUITE_TRUSTED_APPS (Anbieter-Seite): kommagetrennte Origins der Tools, die
 * Login-Bestätigungen von diesem Tool empfangen dürfen.
 */
export function parseTrustedApps(value: string | undefined): string[] {
  if (!value?.trim()) return []
  const origins: string[] = []
  for (const raw of value.split(',')) {
    if (!raw.trim()) continue
    const origin = normalizeOrigin(raw)
    if (origin) origins.push(origin)
    else console.warn(`[suite-kit] SUITE_TRUSTED_APPS: "${raw.trim()}" ist kein gültiger Origin und wird ignoriert`)
  }
  return origins
}

/**
 * SUITE_IDPS (Empfänger-Seite): Anbieter, deren Logins dieses Tool akzeptiert. Entweder
 * kommagetrennte Origins (`https://rsvp.example.de,https://plaetze.example.de`) mit
 * den Standardwerten, oder ein JSON-Array für Einzeleinstellungen:
 * `[{"issuer":"https://rsvp.example.de","label":"rsvp-app","autoProvision":true,"mapAdminRole":false}]`
 */
export function parseIdpConfig(value: string | undefined): IdpConfig[] {
  const trimmed = value?.trim()
  if (!trimmed) return []

  let entries: { issuer: string; label?: string; autoProvision?: boolean; mapAdminRole?: boolean }[]
  if (trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (!Array.isArray(parsed)) throw new Error('kein Array')
      entries = parsed.filter((e): e is { issuer: string } => !!e && typeof e === 'object' && typeof (e as { issuer?: unknown }).issuer === 'string')
    } catch {
      console.warn('[suite-kit] SUITE_IDPS ist kein gültiges JSON und wird ignoriert')
      return []
    }
  } else {
    entries = trimmed.split(',').filter(s => s.trim()).map(issuer => ({ issuer }))
  }

  const result: IdpConfig[] = []
  for (const entry of entries) {
    const issuer = normalizeOrigin(entry.issuer)
    if (!issuer) {
      console.warn(`[suite-kit] SUITE_IDPS: "${entry.issuer}" ist kein gültiger Origin und wird ignoriert`)
      continue
    }
    if (result.some(r => r.issuer === issuer)) continue
    result.push({
      issuer,
      label: typeof entry.label === 'string' && entry.label ? entry.label.slice(0, 100) : undefined,
      autoProvision: entry.autoProvision !== false,
      mapAdminRole: entry.mapAdminRole === true
    })
  }
  return result
}
