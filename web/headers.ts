// web/headers.ts - Bausteine für die Sicherheits-Header in next.config.ts (docs/KONVENTIONEN.md, „Sicherheits-Header“).
//
// Die Pfad-Regeln bleiben im Tool, weil jedes Tool andere Seiten hat. Bei mehreren passenden Regeln gewinnt für
// denselben Header die spätere; ein Header lässt sich nur überschreiben, nicht entfernen. Deshalb setzt
// `BASE_HEADERS` keine Framing-Header, sonst stünde `X-Frame-Options: DENY` auch auf einbettbaren Seiten.

export type Header = { key: string; value: string }
export type HeaderRule = { source: string; headers: Header[] }

/** Für alle Pfade: kein MIME-Sniffing, sparsamer Referer, HSTS nur für diesen Host (ohne includeSubDomains). */
export const BASE_HEADERS: Header[] = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' }
]

/** Nie in einem fremden iFrame (Clickjacking). Voreinstellung für alles außer einbettbaren Gästeseiten. */
export const NO_FRAMING: Header[] = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" }
]

/** Nicht in Suchmaschinen, nicht in Caches. */
export const NOT_STORED: Header[] = [
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  { key: 'Cache-Control', value: 'no-store' }
]

/** Verwaltung, Konto, Login. */
export const PRIVATE_PAGE: Header[] = [...NO_FRAMING, ...NOT_STORED]

/** Gästeseiten, die z.B. in ein CMS eingebettet werden. `*` lässt sich durch die Adresse des CMS ersetzen. */
export const EMBEDDABLE: Header[] = [{ key: 'Content-Security-Policy', value: 'frame-ancestors *' }]

/** Geheimnis in der URL (Einmal-Links, persönliche Links, Anzeige-Schlüssel): nie per Referer weitergeben. */
export const NO_REFERRER: Header[] = [{ key: 'Referrer-Policy', value: 'no-referrer' }]

/** Seite mit Geheimnis in der URL: nicht einbetten, nicht speichern, kein Referer. */
export const SECRET_URL_PAGE: Header[] = [...PRIVATE_PAGE, ...NO_REFERRER]

/**
 * Service Worker: nie aus einem Cache (Browser, Cloudflare), sonst bleiben Geräte auf einer alten Version hängen.
 * Eigene CSP, er lädt nur Skripte derselben Herkunft.
 */
export const SERVICE_WORKER: Header[] = [
  { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
  { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; frame-ancestors 'none'" }
]

/** Erste Regel jeder `headers()`-Liste. */
export const BASE_RULE: HeaderRule = { source: '/:path*', headers: BASE_HEADERS }

/**
 * Letzte Regeln jeder `headers()`-Liste: Service Worker und Föderations-Endpunkte (Einmal-Werte in der URL). Sie
 * stehen am Ende, damit sie Einbett- und Referer-Regeln davor überschreiben.
 */
export const SUITE_RULES: HeaderRule[] = [
  { source: '/sw.js', headers: SERVICE_WORKER },
  { source: '/api/suite/:path*', headers: NO_REFERRER }
]
