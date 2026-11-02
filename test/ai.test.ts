// test/ai.test.ts
import assert from 'node:assert/strict'
import { createServer, type IncomingMessage } from 'node:http'
import type { AddressInfo } from 'node:net'
import { test } from 'node:test'
import { AI_DEFAULT_MODEL, aiConfigured, aiOutputJson, aiOutputText, aiRequestBody, aiSettings, askAi, type AiTask } from '../src/ai.js'

const task: AiTask = {
  instructions: 'Sag hallo.',
  input: [{ type: 'input_text', text: 'Hallo?' }, { type: 'input_image', image_url: 'data:image/jpeg;base64,AA', detail: 'auto' }],
  schemaName: 'gruss',
  schema: { type: 'object', additionalProperties: false, required: ['gruss'], properties: { gruss: { type: 'string' } } }
}

/** Body, wie ihn die Responses API liefert. */
function answer(text: string, status = 'completed') {
  return { status, output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text }] }] }
}

test('aiSettings: ohne Schlüssel aus, sonst mit Voreinstellungen', () => {
  assert.equal(aiSettings({}), null)
  assert.equal(aiSettings({ OPENAI_API_KEY: '  ' }), null)
  assert.equal(aiConfigured({}), false)
  assert.deepEqual(aiSettings({ OPENAI_API_KEY: 'k' }), { apiKey: 'k', baseUrl: 'https://api.openai.com/v1', model: AI_DEFAULT_MODEL, effort: 'none' })
  assert.deepEqual(
    aiSettings({ OPENAI_API_KEY: 'k', OPENAI_BASE_URL: 'http://x/v1//', OPENAI_MODEL: 'm', OPENAI_REASONING_EFFORT: '' }),
    { apiKey: 'k', baseUrl: 'http://x/v1', model: 'm', effort: '' }
  )
  // Leeres OPENAI_MODEL heißt Voreinstellung (wie in docker compose ohne Wert).
  assert.equal(aiSettings({ OPENAI_API_KEY: 'k', OPENAI_MODEL: '' })?.model, AI_DEFAULT_MODEL)
})

test('aiRequestBody: speichert nichts bei OpenAI, verlangt das Schema, leere Denk-Einstellung fehlt', () => {
  const body = aiRequestBody(task, { model: 'm', effort: 'low' })
  assert.equal(body.store, false)
  assert.equal(body.model, 'm')
  assert.deepEqual(body.reasoning, { effort: 'low' })
  assert.deepEqual(body.text.format, { type: 'json_schema', name: 'gruss', strict: true, schema: task.schema })
  assert.deepEqual(body.input, [{ role: 'user', content: task.input }])
  assert.equal(body.max_output_tokens, 1500)
  assert.equal('reasoning' in aiRequestBody(task, { model: 'm', effort: '' }), false)
  assert.equal(aiRequestBody({ ...task, maxOutputTokens: 4000 }, { model: 'm', effort: '' }).max_output_tokens, 4000)
})

test('aiOutputText/aiOutputJson: nur fertige Antworten mit Text, sonst null', () => {
  assert.equal(aiOutputText(answer('{"a":1}')), '{"a":1}')
  assert.deepEqual(aiOutputJson(answer('{"a":1}')), { a: 1 })
  assert.equal(aiOutputText(answer('{}', 'incomplete')), null)
  assert.equal(aiOutputText({ output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'nein' }] }] }), null)
  assert.equal(aiOutputText(null), null)
  assert.equal(aiOutputText({ output: 'x' }), null)
  assert.equal(aiOutputJson(answer('kein JSON')), null)
})

test('askAi: schickt Schlüssel und Body, liefert das JSON; Fehler ergeben null', async () => {
  let reply: { status: number; body: unknown } = { status: 200, body: answer('{"gruss":"hallo"}') }
  const seen: { path?: string; auth?: string; body?: Record<string, unknown> } = {}
  const read = (request: IncomingMessage) => new Promise<string>(resolve => {
    let data = ''
    request.on('data', chunk => (data += chunk))
    request.on('end', () => resolve(data))
  })
  const server = createServer(async (request, response) => {
    seen.path = request.url
    seen.auth = request.headers.authorization
    seen.body = JSON.parse(await read(request))
    response.writeHead(reply.status, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(reply.body))
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const settings = aiSettings({ OPENAI_API_KEY: 'geheim', OPENAI_BASE_URL: `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1` })
  const errors: string[] = []
  const originalError = console.error
  console.error = (message: string) => void errors.push(message)
  try {
    assert.deepEqual(await askAi(task, { label: 'Test', settings }), { gruss: 'hallo' })
    assert.equal(seen.path, '/v1/responses')
    assert.equal(seen.auth, 'Bearer geheim')
    assert.equal(seen.body?.store, false)
    assert.equal(seen.body?.model, AI_DEFAULT_MODEL)

    reply = { status: 500, body: { error: 'kaputt' } }
    assert.equal(await askAi(task, { label: 'Test', settings }), null)
    reply = { status: 200, body: answer('kein JSON') }
    assert.equal(await askAi(task, { label: 'Test', settings }), null)
    assert.equal(await askAi(task, { label: 'Test', settings: null }), null)
    assert.equal(await askAi(task, { label: 'Test', settings: { ...settings!, baseUrl: 'http://127.0.0.1:1/v1' } }), null)
  } finally {
    console.error = originalError
    server.close()
  }
  assert.equal(errors.length, 3)
  assert.ok(errors.every(message => message.startsWith('Test: ')))
  assert.ok(errors.every(message => !message.includes('geheim') && !message.includes('Hallo?')))
})
