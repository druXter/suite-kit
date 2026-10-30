// ui/embed-message.ts
//
// Automatische Höhe eingebetteter Suite-Seiten (Idee Q10, README „Einbetten“): Die eingebettete Seite meldet ihre
// Höhe (EmbedHeight), die einbettende Seite prüft die Nachricht hiermit und passt das iFrame an. Rein, ohne React.

/** `type` der Nachricht - nur die Höhe in Pixeln geht hinaus, nichts, was die einbettende Seite nicht ohnehin sähe. */
export const EMBED_HEIGHT_MESSAGE = 'suite:height'
/** Größer meldet keine echte Seite; alles darüber gilt als ungültig. */
export const MAX_EMBED_HEIGHT = 100_000

export type EmbedHeightMessage = { type: typeof EMBED_HEIGHT_MESSAGE; height: number }

/**
 * Höhe aus einer `message` an die einbettende Seite - nur, wenn sie aus genau diesem iFrame kommt (`source`), von dessen
 * Origin (`src` des iFrames) und das erwartete Format hat. Sonst null: Nachrichten anderer Rahmen, Fenster oder Skripte
 * werden ignoriert.
 */
export function readEmbedHeight(
  event: { source: unknown; origin: string; data: unknown },
  iframe: { contentWindow: unknown; src: string } | null
): number | null {
  if (!iframe || !iframe.contentWindow || event.source !== iframe.contentWindow) return null
  let origin: string
  try {
    origin = new URL(iframe.src).origin
  } catch {
    return null
  }
  if (origin === 'null' || event.origin !== origin) return null
  const data = event.data as Partial<EmbedHeightMessage> | null
  if (!data || typeof data !== 'object' || data.type !== EMBED_HEIGHT_MESSAGE) return null
  const height = data.height
  return typeof height === 'number' && Number.isInteger(height) && height > 0 && height <= MAX_EMBED_HEIGHT ? height : null
}
