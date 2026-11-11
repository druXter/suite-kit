// web/body.ts

/** Was `readLimitedBytes` liest: eine Anfrage (`Request`) oder eine Antwort (`Response`). */
export type LimitedBodySource = { headers: Headers; body: ReadableStream<Uint8Array> | null }

/**
 * Liest einen Body als Bytes, höchstens `max` - sonst `null`. Bricht schon beim Lesen ab, statt erst alles in den
 * Speicher zu holen: `(await request.text()).slice(...)` begrenzt nichts, der Body ist dann schon vollständig gelesen.
 * Eine falsche Content-Length hilft nicht, gezählt wird, was tatsächlich ankommt. Für Anfragen (Uploads) wie für
 * Antworten (Abrufe bei anderen Diensten).
 */
export async function readLimitedBytes(source: LimitedBodySource, max: number): Promise<Uint8Array | null> {
  const declared = Number(source.headers.get('content-length') ?? 0)
  if (Number.isFinite(declared) && declared > max) {
    await source.body?.cancel().catch(() => {})
    return null
  }
  if (!source.body) return new Uint8Array()
  const reader = source.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > max) {
        await reader.cancel().catch(() => {})
        return null
      }
      chunks.push(value)
    }
  } catch {
    return null
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

/** Wie `readLimitedBytes`, als Text (UTF-8) - `null` heißt zu groß (Antwort dann 413). */
export async function readLimitedText(source: LimitedBodySource, max: number): Promise<string | null> {
  const bytes = await readLimitedBytes(source, max)
  return bytes && new TextDecoder().decode(bytes)
}
