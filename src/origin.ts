// src/origin.ts

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Normalisiert eine Tool-Adresse auf ihren Origin (`https://vote.example.de`, ohne
 * Pfad/Slash) - die Kennung eines Tools in der ganzen Suite (`iss`/`aud`). Gibt null
 * zurück bei allem, was kein sauberer Origin ist (Pfad, Query, Zugangsdaten in der
 * URL) oder kein HTTPS nutzt; einzige Ausnahme ist localhost für die Entwicklung.
 */
export function normalizeOrigin(value: string): string | null {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return null
  }
  if (url.username || url.password || url.search || url.hash) return null
  if (url.pathname !== '/' && url.pathname !== '') return null
  if (url.protocol === 'https:') return url.origin
  if (url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname)) return url.origin
  return null
}
