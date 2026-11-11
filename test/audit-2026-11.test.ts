// test/audit-2026-11.test.ts
//
// Sicherheitsprüfung vom November 2026 (docs/AUDIT-2026-11.md): je Fund ein Test, der HEUTE fehlschlägt und mit der
// Behebung grün wird. Die Kennung im Titel (A-01 …) ist die aus dem Bericht. Jeder Test beginnt mit einer Gegenprobe
// (der erlaubte Fall geht durch), damit er nicht aus dem falschen Grund rot ist - rot wird erst die Zeile danach.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer, type IncomingMessage, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { beforeEach, test } from 'node:test'
import { parse as legacyUrlParse } from 'node:url'
import { aiSettings, askAi, type AiTask } from '../src/ai.js'
import { ASSERTION_TYP, issueLoginAssertion, signCompact, verifyLoginAssertion } from '../src/assertion.js'
import { parseIdpConfig } from '../src/config.js'
import { buildDiscoveryDocument, clearDiscoveryCache, fetchDiscovery } from '../src/discovery.js'
import { generateKeyPair, loadSigner, loadSignersFromEnv } from '../src/keys.js'
import { issueParticipantAssertion, verifyParticipantAssertion } from '../src/participant.js'
import { csvCell } from '../web/csv.js'
import { SUITE_RULES } from '../web/headers.js'
import { validPushSubscription } from '../web/push.js'

const ISSUER = 'https://rsvp.example.de'
const AUDIENCE = 'https://vote.example.de'
const NONCE = 'n'.repeat(43)
const NOW = 1_800_000_000

const pair = generateKeyPair()
const signer = loadSigner(pair.privateKey)
const keys = [{ kid: signer.kid, publicKey: signer.publicKey }]
const expectation = { issuer: ISSUER, audience: AUDIENCE, nonce: NONCE, keys, now: NOW }
const discoveryDoc = buildDiscoveryDocument({ issuer: ISSUER, name: 'rsvp-app', signers: [signer] })

/** Datei aus dem Repository (die Tests laufen aus dist/test/). */
const repoFile = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

const readBody = (request: IncomingMessage) => new Promise<string>(resolve => {
  let data = ''
  request.on('data', chunk => (data += chunk))
  request.on('end', () => resolve(data))
})
const listen = (server: Server) => new Promise<number>(resolve => server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port)))

/** console.error bzw. console.warn für die Dauer von `run` einsammeln. */
async function captureLog<T>(method: 'error' | 'warn', run: () => T | Promise<T>): Promise<{ value: T; lines: string[] }> {
  const lines: string[] = []
  const original = console[method]
  console[method] = (...parts: unknown[]) => void lines.push(parts.map(String).join(' '))
  try {
    return { value: await run(), lines }
  } finally {
    console[method] = original
  }
}

beforeEach(() => clearDiscoveryCache())

// ---------------------------------------------------------------------------------------------------------------------
// A-01 (mittel) web/push.ts - die Prüfung liest den Endpoint mit `new URL`, gespeichert wird die rohe Zeichenkette.
// web-push (rsvp-app) liest sie später mit `url.parse` - und kommt bei ; ' ` { zu einem ANDEREN Host.
// ---------------------------------------------------------------------------------------------------------------------
test('A-01 Push-Endpoint: was die Prüfung besteht, führt auch mit url.parse (web-push) nur zu einem Push-Dienst', () => {
  const pushKeys = { p256dh: 'B' + 'a'.repeat(86), auth: 'c'.repeat(22) }
  // Gegenprobe: ein echter Endpoint geht durch, und beide Parser sehen denselben Host.
  const real = 'https://fcm.googleapis.com/fcm/send/abc'
  assert.ok(validPushSubscription({ endpoint: real, keys: pushKeys }))
  assert.equal(legacyUrlParse(real).hostname, 'fcm.googleapis.com')

  const attacks = [
    'https://evil.example;.fcm.googleapis.com/x',
    "https://127.0.0.1'.web.push.apple.com/x",
    'https://intern.lan`.notify.windows.com/x',
    'https://evil.example{.updates.push.services.mozilla.com/x'
  ]
  for (const endpoint of attacks) {
    const accepted = validPushSubscription({ endpoint, keys: pushKeys })
    assert.equal(accepted, null,
      `${endpoint} gilt als Push-Dienst (new URL: ${new URL(endpoint).hostname}), web-push verbindet aber zu ${legacyUrlParse(endpoint).hostname}`)
  }
})

// ---------------------------------------------------------------------------------------------------------------------
// A-02 (mittel) scripts/auskunft.sh, scripts/update-apps.mjs - das zehnte Tool (haushaltsbuch, Port 3014) fehlt in
// beiden Listen: Auskunft und Löschung nach Art. 15/17 lassen es aus, neue suite-kit-Versionen erreichen es nicht.
// ---------------------------------------------------------------------------------------------------------------------
test('A-02 Skripte: Auskunft/Löschung und Verteilung kennen alle Tools der Suite', () => {
  const shellTools = /^TOOLS=\(([^)]*)\)/m.exec(repoFile('scripts/auskunft.sh'))?.[1].trim().split(/\s+/) ?? []
  const nodeTools = [.../^const TOOLS = \[([^\]]*)\]/m.exec(repoFile('scripts/update-apps.mjs'))?.[1].matchAll(/'([^']+)'/g) ?? []].map(m => m[1])
  // So viele Tools nennt die Port-Liste in docs/KONVENTIONEN.md („Ports auf dem Server“, 3005 bis 3014).
  const ports = /\*\*Ports auf dem Server:\*\*([\s\S]*?)Das nächste Tool/.exec(repoFile('docs/KONVENTIONEN.md'))?.[1].match(/\b30\d\d\b/g) ?? []
  // Gegenprobe: die Listen werden gefunden und enthalten ein altes Tool.
  assert.ok(shellTools.includes('inventur') && nodeTools.includes('inventur'))
  assert.ok(ports.length >= 10)

  assert.ok(shellTools.includes('haushaltsbuch'), `scripts/auskunft.sh fragt haushaltsbuch nicht ab (${shellTools.join(' ')})`)
  assert.ok(nodeTools.includes('haushaltsbuch'), `scripts/update-apps.mjs verteilt nicht an haushaltsbuch (${nodeTools.join(' ')})`)
  assert.equal(shellTools.length, ports.length, 'auskunft.sh: so viele Tools wie Ports in KONVENTIONEN.md')
  assert.equal(nodeTools.length, ports.length, 'update-apps.mjs: so viele Tools wie Ports in KONVENTIONEN.md')
})

// ---------------------------------------------------------------------------------------------------------------------
// A-03 (niedrig) src/discovery.ts - `await res.text()` holt das ganze Dokument in den Speicher, erst danach greift
// das Limit von 16 KiB. Genau das Muster, das KONVENTIONEN.md für Bodies verbietet (`readLimitedText`).
// ---------------------------------------------------------------------------------------------------------------------
test('A-03 Discovery: das Größenlimit bricht das Lesen ab, statt erst alles zu laden', async () => {
  const stream = (total: number, chunk: Uint8Array, counter: { sent: number }) => new ReadableStream<Uint8Array>({
    pull(controller) {
      if (counter.sent >= total) return controller.close()
      counter.sent += chunk.byteLength
      controller.enqueue(chunk)
    }
  }, { highWaterMark: 0 })

  // Gegenprobe: ein normales Dokument, als Stream geliefert, wird angenommen.
  const small = new TextEncoder().encode(JSON.stringify(discoveryDoc))
  const ok = await fetchDiscovery(ISSUER, { fetchImpl: (async () => new Response(stream(small.byteLength, small, { sent: 0 }))) as typeof fetch })
  assert.equal(ok?.issuer, ISSUER)
  clearDiscoveryCache()

  // Ein Anbieter (oder wer an seiner Stelle antwortet) schickt 8 MiB Leerzeichen.
  const counter = { sent: 0 }
  const flood = stream(8 * 1024 * 1024, new Uint8Array(64 * 1024).fill(0x20), counter)
  assert.equal(await fetchDiscovery(ISSUER, { fetchImpl: (async () => new Response(flood)) as typeof fetch }), null)
  assert.ok(counter.sent <= 256 * 1024, `${counter.sent} Bytes gelesen, bevor das Limit von 16 KiB griff`)
})

// ---------------------------------------------------------------------------------------------------------------------
// A-04 (niedrig) src/discovery.ts - Fehlschläge werden nicht gemerkt, gleichzeitige Abrufe nicht zusammengelegt.
// `/api/suite/login?idp=…` ist ohne Anmeldung aufrufbar: Ist der Anbieter gestört, löst JEDER Aufruf einen eigenen
// Abruf aus (bis zu 5 s Wartezeit je Anfrage) - die Bremse aus PROTOCOL.md („höchstens einmal pro Minute“) steckt
// nur in den Callback-Routen der Tools, nicht in der Bibliothek.
// ---------------------------------------------------------------------------------------------------------------------
test('A-04a Discovery: ein gestörter Anbieter wird nicht bei jedem Aufruf neu abgefragt', async () => {
  // Gegenprobe: Erfolg wird gecached (ein Abruf für zwei Aufrufe).
  let calls = 0
  const up = (async () => { calls++; return new Response(JSON.stringify(discoveryDoc)) }) as typeof fetch
  await fetchDiscovery(ISSUER, { fetchImpl: up })
  await fetchDiscovery(ISSUER, { fetchImpl: up })
  assert.equal(calls, 1)
  clearDiscoveryCache()

  calls = 0
  const down = (async () => { calls++; return new Response('Bad Gateway', { status: 502 }) }) as typeof fetch
  for (let i = 0; i < 5; i++) assert.equal(await fetchDiscovery(ISSUER, { fetchImpl: down }), null)
  assert.equal(calls, 1, `${calls} Abrufe für 5 Aufrufe direkt nacheinander`)
})

test('A-04b Discovery: gleichzeitige Aufrufe teilen sich einen Abruf', async () => {
  let calls = 0
  const slow = (async () => {
    calls++
    await new Promise(resolve => setTimeout(resolve, 20))
    return new Response(JSON.stringify(discoveryDoc))
  }) as typeof fetch
  const docs = await Promise.all(Array.from({ length: 5 }, () => fetchDiscovery(ISSUER, { fetchImpl: slow })))
  // Gegenprobe: alle bekommen das Dokument.
  assert.ok(docs.every(doc => doc?.issuer === ISSUER))
  assert.equal(calls, 1, `${calls} Abrufe für 5 gleichzeitige Aufrufe`)
})

// ---------------------------------------------------------------------------------------------------------------------
// A-05 (niedrig) src/ai.ts - „Fehler ins Log ohne Inhalt und Schlüssel“ gilt nicht für fremden Text: Die ersten
// 300 Zeichen der Fehlerantwort und die Meldung des fetch-Fehlers landen ungefiltert im Log.
// ---------------------------------------------------------------------------------------------------------------------
const aiTask: AiTask = {
  instructions: 'Sag hallo.',
  input: [{ type: 'input_text', text: 'Hallo?' }],
  schemaName: 'gruss',
  schema: { type: 'object', additionalProperties: false, required: ['gruss'], properties: { gruss: { type: 'string' } } }
}

test('A-05a askAi: die Fehlerantwort von OpenAI (401 nennt Anfang und Ende des Schlüssels) kommt nicht ins Log', async () => {
  const apiKey = 'sk-proj-AuditSchluesselNurFuerDenTest-Zq9X'
  let status = 500
  // Wie api.openai.com bei einem ungültigen Schlüssel: Anfang und die letzten vier Zeichen stehen in der Meldung.
  const server = createServer(async (request, response) => {
    await readBody(request)
    const sent = (request.headers.authorization ?? '').replace(/^Bearer /, '')
    const message = `Incorrect API key provided: ${sent.slice(0, 8)}${'*'.repeat(sent.length - 12)}${sent.slice(-4)}. You can find your API key at https://platform.openai.com/account/api-keys.`
    response.writeHead(status, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ error: status === 401 ? { message, type: 'invalid_request_error', code: 'invalid_api_key' } : { message: 'The server had an error' } }, null, 2))
  })
  const settings = aiSettings({ OPENAI_API_KEY: apiKey, OPENAI_BASE_URL: `http://127.0.0.1:${await listen(server)}/v1` })
  try {
    // Gegenprobe: ein Fehler ohne Schlüssel in der Antwort wird gemeldet, mit Statuscode.
    const plain = await captureLog('error', () => askAi(aiTask, { label: 'Test', settings }))
    assert.equal(plain.value, null)
    assert.ok(plain.lines.length === 1 && plain.lines[0].includes('500'))

    status = 401
    const leaked = await captureLog('error', () => askAi(aiTask, { label: 'Test', settings }))
    assert.equal(leaked.value, null)
    assert.ok(leaked.lines.some(line => line.includes('401')), 'der Statuscode gehört ins Log')
    assert.ok(!leaked.lines.some(line => line.includes(apiKey.slice(-4))), `Ende des Schlüssels im Log: ${leaked.lines.join(' | ')}`)
  } finally {
    server.close()
  }
})

test('A-05b askAi: ein Schlüssel mit Zeilenumbruch (kaputte .env) kommt nicht über die Fehlermeldung ins Log', async () => {
  const server = createServer(async (request, response) => {
    await readBody(request)
    response.writeHead(500).end('{}')
  })
  const baseUrl = `http://127.0.0.1:${await listen(server)}/v1`
  try {
    // Gegenprobe: mit sauberem Schlüssel steht nichts davon im Log.
    const clean = await captureLog('error', () => askAi(aiTask, { label: 'Test', settings: aiSettings({ OPENAI_API_KEY: 'sk-proj-SAUBER', OPENAI_BASE_URL: baseUrl }) }))
    assert.ok(clean.lines.length === 1 && !clean.lines[0].includes('SAUBER'))

    // Zwei Zeilen zusammenkopiert: trim() entfernt nur den Rand, fetch lehnt den Header ab und zitiert ihn in der Meldung.
    const broken = aiSettings({ OPENAI_API_KEY: 'sk-proj-ErsteHaelfteGEHEIM\nsk-proj-ZweiteHaelfte', OPENAI_BASE_URL: baseUrl })
    const leaked = await captureLog('error', () => askAi(aiTask, { label: 'Test', settings: broken }))
    assert.equal(leaked.value, null)
    assert.ok(!leaked.lines.some(line => line.includes('ErsteHaelfteGEHEIM')), `Schlüssel im Log: ${JSON.stringify(leaked.lines)}`)
  } finally {
    server.close()
  }
})

// ---------------------------------------------------------------------------------------------------------------------
// A-06 (niedrig) src/config.ts - `autoProvision` ist alles außer dem Boolean `false`; `participants` und
// `mapAdminRole` gelten dagegen nur bei ausdrücklichem `true`. Ein Tippfehler in SUITE_IDPS öffnet die Kontoanlage.
// ---------------------------------------------------------------------------------------------------------------------
test('A-06 SUITE_IDPS: autoProvision "false", 0 oder null legt keine Konten automatisch an', async () => {
  const config = (autoProvision: unknown) => parseIdpConfig(JSON.stringify([{ issuer: ISSUER, autoProvision }]))
  const { value: results } = await captureLog('warn', () => {
    // Gegenprobe: die dokumentierten Werte.
    assert.equal(config(false)[0].autoProvision, false)
    assert.equal(config(true)[0].autoProvision, true)
    assert.equal(config(undefined)[0].autoProvision, true)
    return ['false', 'nein', 0, null].map(value => ({ value, entry: config(value)[0] }))
  })
  // Erlaubt ist beides: den Wert als „aus“ lesen oder den Eintrag verwerfen - nur nicht stillschweigend „an“.
  for (const { value, entry } of results) {
    assert.notEqual(entry?.autoProvision, true, `autoProvision: ${JSON.stringify(value)} wird als true gelesen`)
  }
})

// ---------------------------------------------------------------------------------------------------------------------
// A-07 (niedrig) src/keys.ts - „Der ERSTE Eintrag ist der aktive Signierschlüssel“: Fehlt SUITE_SIGNING_KEY (leer,
// vertippt), rückt SUITE_SIGNING_KEY_PREVIOUS nach vorn - das Tool signiert still mit dem Schlüssel, der gerade
// abgelöst werden sollte.
// ---------------------------------------------------------------------------------------------------------------------
test('A-07 Schlüssel: SUITE_SIGNING_KEY_PREVIOUS allein wird nie zum aktiven Signierschlüssel', () => {
  const retired = generateKeyPair()
  const current = generateKeyPair()
  // Gegenprobe: mit beiden Variablen ist der neue Schlüssel aktiv.
  assert.equal(loadSignersFromEnv({ SUITE_SIGNING_KEY: current.privateKey, SUITE_SIGNING_KEY_PREVIOUS: retired.privateKey })[0].kid, current.kid)

  for (const env of [{ SUITE_SIGNING_KEY_PREVIOUS: retired.privateKey }, { SUITE_SIGNING_KEY: '  ', SUITE_SIGNING_KEY_PREVIOUS: retired.privateKey }]) {
    let active: string | undefined
    try {
      active = loadSignersFromEnv(env)[0]?.kid
    } catch {
      continue // laut scheitern ist richtig
    }
    assert.notEqual(active, retired.kid, 'der abgelöste Schlüssel ist aktiver Signierschlüssel')
  }
})

// ---------------------------------------------------------------------------------------------------------------------
// A-08 (niedrig, Fehler) src/assertion.ts, src/participant.ts - der Aussteller prüft seine Eingaben nicht gegen die
// Grenzen des eigenen Prüfers. Ein Konto mit langem Namen bekommt eine gültig signierte Bestätigung, die jeder
// Empfänger als `bad-claims` ablehnt - die Person sieht nur „Anmeldung fehlgeschlagen“.
// ---------------------------------------------------------------------------------------------------------------------
test('A-08 Aussteller: was ausgestellt wird, besteht die eigene Prüfung (oder das Ausstellen scheitert laut)', () => {
  const login = (extra: { subject?: string; email?: string; name?: string; role?: string }) => {
    let token: string
    try {
      token = issueLoginAssertion(signer, { issuer: ISSUER, audience: AUDIENCE, subject: 'u1', email: 'a@example.de', nonce: NONCE, ...extra }, { now: NOW })
    } catch {
      return 'abgelehnt'
    }
    const result = verifyLoginAssertion(token, expectation)
    return result.ok ? 'ok' : result.reason
  }
  const participant = (name: string) => {
    let token: string
    try {
      token = issueParticipantAssertion(signer, { issuer: ISSUER, audience: AUDIENCE, subject: 'p1', name, nonce: NONCE }, { now: NOW })
    } catch {
      return 'abgelehnt'
    }
    const result = verifyParticipantAssertion(token, expectation)
    return result.ok ? 'ok' : result.reason
  }
  // Gegenprobe: an der Grenze geht es durch.
  assert.equal(login({ name: 'x'.repeat(200), role: 'r'.repeat(64), email: `${'a'.repeat(243)}@example.de`, subject: 's'.repeat(128) }), 'ok')
  assert.equal(participant('y'.repeat(500)), 'ok') // hier kürzt der Aussteller schon

  const outcomes = {
    'Name mit 201 Zeichen': login({ name: 'x'.repeat(201) }),
    'Rolle mit 65 Zeichen': login({ role: 'r'.repeat(65) }),
    'E-Mail mit 255 Zeichen': login({ email: `${'a'.repeat(244)}@example.de` }),
    'Kennung (sub) mit 129 Zeichen': login({ subject: 's'.repeat(129) }),
    'Teilnehmende ohne Namen': participant('')
  }
  const broken = Object.entries(outcomes).filter(([, outcome]) => outcome !== 'ok' && outcome !== 'abgelehnt').map(([label, outcome]) => `${label} (${outcome})`)
  assert.deepEqual(broken, [], 'ausgestellt, aber vom eigenen Prüfer abgelehnt')
})

// ---------------------------------------------------------------------------------------------------------------------
// A-09 (niedrig) web/headers.ts - SUITE_RULES setzt für /api/suite/* nur `no-referrer`. PROTOCOL.md (Regel 7) und
// README („Föderations-Antworten mit Cache-Control: no-store“) verlangen beides; heute hängt `no-store` an jeder
// einzelnen Route.
// ---------------------------------------------------------------------------------------------------------------------
test('A-09 SUITE_RULES: Föderations-Endpunkte mit no-referrer UND no-store', () => {
  const headers = SUITE_RULES.find(rule => rule.source === '/api/suite/:path*')?.headers ?? []
  const value = (key: string) => headers.find(h => h.key.toLowerCase() === key)?.value ?? ''
  // Gegenprobe: die Regel gibt es, no-referrer ist gesetzt.
  assert.equal(value('referrer-policy'), 'no-referrer')
  assert.match(value('cache-control'), /no-store/, 'Cache-Control: no-store fehlt für /api/suite/*')
})

// ---------------------------------------------------------------------------------------------------------------------
// A-10 (niedrig) web/csv.ts - KONVENTIONEN.md: „Textzellen mit = + - @, Tab oder Zeilenumbruch am Anfang mit
// vorangestelltem Hochkomma“. Der Code kennt nur den Wagenrücklauf (\r), nicht den Zeilenvorschub (\n).
// ---------------------------------------------------------------------------------------------------------------------
test('A-10 csvCell: auch ein Zeilenvorschub am Anfang wird entschärft', () => {
  const unquoted = (value: string) => csvCell(value).replace(/^"/, '')
  // Gegenprobe: Wagenrücklauf und Tab sind geschützt, ein Umbruch mitten im Text bleibt, wie er ist.
  assert.ok(unquoted('\r=1+1').startsWith("'"))
  assert.ok(unquoted('\t=1+1').startsWith("'"))
  assert.equal(csvCell('Zeile 1\nZeile 2'), '"Zeile 1\nZeile 2"')

  for (const cell of ['\n=HYPERLINK("https://evil.example";"Liste öffnen")', '\n@SUM(1+1)*cmd|\' /C calc\'!A0']) {
    assert.ok(unquoted(cell).startsWith("'"), `Zelle beginnt mit Zeilenvorschub und bleibt ungeschützt: ${JSON.stringify(csvCell(cell))}`)
  }
})

// ---------------------------------------------------------------------------------------------------------------------
// A-11 (Hinweis) src/base64url.ts - „Strikt“ prüft nur das Alphabet. Die unbenutzten Bits des letzten Zeichens sind
// frei: Zu jeder Bestätigung gibt es andere Zeichenketten, die genauso gültig sind (Signatur formbar).
// ---------------------------------------------------------------------------------------------------------------------
test('A-11 Bestätigung: nur die eine, kanonische Schreibweise der Signatur gilt', () => {
  const token = issueLoginAssertion(signer, { issuer: ISSUER, audience: AUDIENCE, subject: 'u1', email: 'a@example.de', nonce: NONCE }, { now: NOW })
  // Gegenprobe: das Original gilt, eine echte Änderung an der Signatur nicht.
  assert.equal(verifyLoginAssertion(token, expectation).ok, true)
  const flipped = token.slice(0, -2) + (token.at(-2) === 'A' ? 'B' : 'A') + token.at(-1)
  assert.equal(verifyLoginAssertion(flipped, expectation).ok, false)

  // 64 Bytes Signatur = 86 Zeichen, das letzte trägt nur 4 Bits. Die zwei Füllbits lassen sich setzen, ohne dass sich
  // die dekodierten Bytes ändern.
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  const twin = token.slice(0, -1) + alphabet[alphabet.indexOf(token.at(-1)!) ^ 1]
  assert.notEqual(twin, token)
  const result = verifyLoginAssertion(twin, expectation)
  assert.equal(result.ok, false, 'eine zweite Schreibweise derselben Bestätigung wird angenommen')
})

// ---------------------------------------------------------------------------------------------------------------------
// A-12 (Hinweis) src/assertion.ts - `exp` vor `iat` wird angenommen (innerhalb der 10 s Toleranz). link-message.ts
// lehnt dasselbe ab (`issued > expires`).
// ---------------------------------------------------------------------------------------------------------------------
test('A-12 Bestätigung: Ablauf vor Ausstellung ist ungültig', () => {
  const claims = (iat: number, exp: number) => ({ iss: ISSUER, aud: AUDIENCE, sub: 'u1', email: 'a@example.de', nonce: NONCE, iat, exp })
  // Gegenprobe: ein normales Zeitfenster gilt.
  assert.equal(verifyLoginAssertion(signCompact(signer, ASSERTION_TYP, claims(NOW, NOW + 60)), expectation).ok, true)
  assert.equal(verifyLoginAssertion(signCompact(signer, ASSERTION_TYP, claims(NOW, NOW - 5)), expectation).ok, false, 'exp liegt 5 s vor iat und gilt trotzdem')
})

// ---------------------------------------------------------------------------------------------------------------------
// A-13 (Hinweis) src/ai.ts - der einzige Server-zu-Server-Abruf in suite-kit ohne `redirect: 'error'`
// (KONVENTIONEN.md: „Abrufe beim Partner ohne Weiterleitungen“). Bei 307/308 geht der Body - Bilder, Texte -
// an die Adresse aus `Location`.
// ---------------------------------------------------------------------------------------------------------------------
test('A-13 askAi: folgt keiner Weiterleitung mit dem Inhalt der Anfrage', async () => {
  const elsewhere: string[] = []
  const other = createServer(async (request, response) => {
    elsewhere.push(await readBody(request))
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: '{"gruss":"umgeleitet"}' }] }] }))
  })
  const otherPort = await listen(other)
  let redirect = false
  const api = createServer(async (request, response) => {
    await readBody(request)
    if (redirect) return void response.writeHead(307, { Location: `http://127.0.0.1:${otherPort}/sammeln` }).end()
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: '{"gruss":"hallo"}' }] }] }))
  })
  const settings = aiSettings({ OPENAI_API_KEY: 'geheim', OPENAI_BASE_URL: `http://127.0.0.1:${await listen(api)}/v1` })
  try {
    // Gegenprobe: ohne Weiterleitung kommt die Antwort an.
    assert.deepEqual(await askAi(aiTask, { label: 'Test', settings }), { gruss: 'hallo' })

    redirect = true
    const { value } = await captureLog('error', () => askAi(aiTask, { label: 'Test', settings }))
    assert.equal(elsewhere.length, 0, `Anfrage samt Inhalt an fremde Adresse weitergereicht: ${elsewhere[0]?.slice(0, 80)}`)
    assert.equal(value, null)
  } finally {
    api.close()
    other.close()
  }
})
