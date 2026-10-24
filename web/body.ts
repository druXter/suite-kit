// web/body.ts

/**
 * Liest den Body einer Anfrage, höchstens `max` Bytes - sonst `null` (Antwort dann 413). Bricht schon beim Lesen ab,
 * statt erst alles in den Speicher zu holen: `(await request.text()).slice(...)` begrenzt nichts, der Body ist dann
 * schon vollständig gelesen. Eine falsche Content-Length hilft nicht, gezählt wird, was tatsächlich ankommt.
 */
export async function readLimitedText(request: Request, max: number): Promise<string | null> {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(declared) && declared > max) return null
  if (!request.body) return ''
  const reader = request.body.getReader()
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
  return new TextDecoder().decode(bytes)
}
