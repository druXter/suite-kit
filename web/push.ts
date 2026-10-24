// web/push.ts - Push-Abos aus dem Browser prüfen, bevor ein Tool sie speichert.
//
// Der Server schickt später Anfragen an den gespeicherten Endpoint. Ohne Prüfung könnte jede*r, der ein Abo anlegen darf
// (Konto, Gast mit persönlichem Link), eine beliebige Adresse eintragen - etwa im internen Netz des Servers (SSRF).
// Deshalb nur Endpoints der Push-Dienste der Browser-Hersteller, nur https ohne eigenen Port, und Schlüssel im Format,
// das Browser erzeugen.

/** Chrome/Edge-Chromium/Android, Firefox, Safari, altes Edge. */
export const PUSH_SERVICE_HOSTS = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com', 'notify.windows.com'] as const

export type PushSubscriptionInput = { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } | null } | null | undefined
export type ValidPushSubscription = { endpoint: string; p256dh: string; auth: string }

export function isKnownPushService(endpoint: string): boolean {
  try {
    const url = new URL(endpoint)
    return url.protocol === 'https:' && !url.port && !url.username && !url.password &&
      PUSH_SERVICE_HOSTS.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))
  } catch {
    return false
  }
}

/** Das Abo, wie es gespeichert werden darf - oder null. Alles kommt ungeprüft aus dem Browser. */
export function validPushSubscription(input: PushSubscriptionInput): ValidPushSubscription | null {
  if (!input || typeof input !== 'object') return null
  const { endpoint, keys } = input
  if (typeof endpoint !== 'string' || endpoint.length > 1000 || !isKnownPushService(endpoint)) return null
  if (!keys || typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') return null
  if (!/^[A-Za-z0-9_-]{80,100}$/.test(keys.p256dh) || !/^[A-Za-z0-9_-]{16,32}$/.test(keys.auth)) return null
  return { endpoint, p256dh: keys.p256dh, auth: keys.auth }
}
