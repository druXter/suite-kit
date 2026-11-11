// src/ai.ts
//
// KI-Aufrufe über die OpenAI Responses API (POST /v1/responses), gemeinsam für alle Tools (Bilderkennung in der
// Inventur, Zusammenfassungen im Abstimmungstool). Ohne OPENAI_API_KEY ist die KI aus: `aiSettings()` ist dann null und
// das Tool zeigt die Funktion nicht an. Die Antwort kommt immer als JSON nach einem festen Schema (Structured Outputs,
// strict) - das Tool prüft sie trotzdem selbst (zod o.ä.) und ordnet Nummern wieder seinen eigenen Daten zu.
//
// Regeln (docs/KONVENTIONEN.md „KI-Funktionen“): `store: false` (OpenAI hebt die Antwort nicht auf), nur so viel
// schicken wie nötig, keine Namen oder Adressen, keine Gesundheitsdaten; Fehler ins Log ohne Inhalt und Schlüssel.

import { readLimitedText } from '../web/body.js'

/** Voreinstellung: das günstige Modell für viele kleine Aufgaben (Stand 11/2026). Mit OPENAI_MODEL änderbar. */
export const AI_DEFAULT_MODEL = 'gpt-6-luna'
export const AI_DEFAULT_TIMEOUT_MS = 45_000

export type AiSettings = {
  apiKey: string
  /** Ohne Slash am Ende, z.B. https://api.openai.com/v1 (OPENAI_BASE_URL, für Tests eine Attrappe). */
  baseUrl: string
  model: string
  /** reasoning.effort; leer = keine Angabe (für Modelle ohne diese Einstellung). Voreinstellung 'none'. */
  effort: string
}

let warnedBrokenKey = false

/**
 * Einstellungen aus der Umgebung; null ohne OPENAI_API_KEY. Ein Schlüssel mit Leer- oder Steuerzeichen in der Mitte
 * (zwei Zeilen zusammenkopiert) gilt als nicht gesetzt: `fetch` würde ihn als ungültigen Header samt Wert in die
 * Fehlermeldung schreiben, also ins Log. Gemeldet wird das einmal, ohne den Wert.
 */
export function aiSettings(env: Record<string, string | undefined> = process.env): AiSettings | null {
  const apiKey = env.OPENAI_API_KEY?.trim()
  if (!apiKey) return null
  if (!/^[\x21-\x7e]+$/.test(apiKey)) {
    if (!warnedBrokenKey) console.warn('KI aus: OPENAI_API_KEY enthält Leer- oder Steuerzeichen (z.B. Zeilenumbruch), bitte prüfen')
    warnedBrokenKey = true
    return null
  }
  return {
    apiKey,
    baseUrl: (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
    model: env.OPENAI_MODEL || AI_DEFAULT_MODEL,
    effort: env.OPENAI_REASONING_EFFORT ?? 'none'
  }
}

export function aiConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return aiSettings(env) !== null
}

export type AiInput =
  | { type: 'input_text'; text: string }
  | { type: 'input_image'; image_url: string; detail: 'auto' | 'low' | 'high' }

export type AiTask = {
  /** Anweisung an das Modell (Systemteil). */
  instructions: string
  /** Inhalt der Anfrage: Text und/oder Bilder (Bilder als data:-URL, vom Tool vorher verkleinert und ohne Metadaten). */
  input: AiInput[]
  /** Name und JSON-Schema der Antwort (strict: alle Felder required, additionalProperties false). */
  schemaName: string
  schema: Record<string, unknown>
  maxOutputTokens?: number
}

/** Body für POST /responses. */
export function aiRequestBody(task: AiTask, settings: Pick<AiSettings, 'model' | 'effort'>) {
  return {
    model: settings.model,
    store: false,
    instructions: task.instructions,
    input: [{ role: 'user', content: task.input }],
    text: { format: { type: 'json_schema', name: task.schemaName, strict: true, schema: task.schema } },
    ...(settings.effort ? { reasoning: { effort: settings.effort } } : {}),
    max_output_tokens: task.maxOutputTokens ?? 1500
  }
}

/** Text der Antwort aus dem Body der Responses API (output[] → message → output_text); null bei Ablehnung oder Abbruch. */
export function aiOutputText(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const { status, output } = body as { status?: unknown; output?: unknown }
  if (status !== undefined && status !== 'completed') return null
  if (!Array.isArray(output)) return null
  for (const entry of output) {
    if (!entry || typeof entry !== 'object' || (entry as { type?: unknown }).type !== 'message') continue
    const content = (entry as { content?: unknown }).content
    if (!Array.isArray(content)) continue
    for (const part of content) {
      if (part && typeof part === 'object' && (part as { type?: unknown }).type === 'output_text') {
        const text = (part as { text?: unknown }).text
        if (typeof text === 'string') return text
      }
    }
  }
  return null
}

/** Die Antwort als JSON-Wert (noch ungeprüft); null, wenn sie fehlt oder kein JSON ist. */
export function aiOutputJson(body: unknown): unknown {
  const text = aiOutputText(body)
  if (text === null) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * Schickt eine Aufgabe an OpenAI und gibt die Antwort als JSON-Wert zurück (ungeprüft - das Tool prüft sie gegen sein
 * Schema). null bei fehlender Einrichtung, Netzfehler, Zeitüberschreitung, HTTP-Fehler, Ablehnung oder kaputter
 * Antwort; der Grund steht im Log mit `label` davor (z.B. "Bilderkennung"), ohne Inhalt der Anfrage und ohne Schlüssel.
 */
export async function askAi(
  task: AiTask,
  { label, settings = aiSettings(), timeoutMs = AI_DEFAULT_TIMEOUT_MS }: { label: string; settings?: AiSettings | null; timeoutMs?: number }
): Promise<unknown> {
  if (!settings) return null
  try {
    const response = await fetch(`${settings.baseUrl}/responses`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(aiRequestBody(task, settings)),
      // Eine Weiterleitung (falsche OPENAI_BASE_URL, Proxy davor) schickte Bilder und Texte an die Adresse aus Location.
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs)
    })
    if (!response.ok) {
      // Nie den Body: OpenAI nennt darin Anfang und Ende des Schlüssels (401) oder zitiert die Anfrage (400).
      console.error(`${label}: OpenAI antwortet ${response.status}${aiErrorCode(await readJson(response))}`)
      return null
    }
    const value = aiOutputJson(await readJson(response))
    if (value === null) console.error(`${label}: Antwort von OpenAI nicht lesbar (abgebrochen, abgelehnt oder kein JSON)`)
    return value
  } catch (error) {
    // Nur Name und Code: die Meldung kann den Authorization-Header samt Schlüssel zitieren.
    const cause = error instanceof Error ? (error.cause as { code?: unknown } | undefined)?.code : undefined
    console.error(`${label}: OpenAI nicht erreichbar: ${error instanceof Error ? error.name : 'Fehler'}${typeof cause === 'string' && SAFE_CODE.test(cause) ? ` (${cause})` : ''}`)
    return null
  }
}

const SAFE_CODE = /^[A-Za-z0-9_]{1,40}$/
/** Antworten sind wenige KiB (auch bei großem max_output_tokens weit unter 1 MiB); größer heißt kaputt oder fremd. */
const MAX_RESPONSE_BYTES = 1024 * 1024

async function readJson(response: Response): Promise<unknown> {
  const text = await readLimitedText(response, MAX_RESPONSE_BYTES)
  if (text === null) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** `error.type`/`error.code` aus einer Fehlerantwort, nur wenn sie wie Kennungen aussehen; sonst leer. */
function aiErrorCode(body: unknown): string {
  const error = body && typeof body === 'object' ? (body as { error?: unknown }).error : undefined
  if (!error || typeof error !== 'object') return ''
  const { type, code } = error as { type?: unknown; code?: unknown }
  const parts = [type, code].filter((part): part is string => typeof part === 'string' && /^[a-z0-9_]{1,40}$/.test(part))
  return parts.length ? ` (${parts.join(', ')})` : ''
}
