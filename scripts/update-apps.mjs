#!/usr/bin/env node
// scripts/update-apps.mjs - eine Version von suite-kit in allen Tools neben diesem Repository installieren und prüfen.
//
//   node scripts/update-apps.mjs v0.3.0            alle Tools
//   node scripts/update-apps.mjs v0.3.0 seating    nur die genannten
//
// Je Tool: npm install github:druXter/suite-kit#<tag>, dann tsc --noEmit, eslint und - wenn das Tool sie hat - die
// gemeinsamen Regeln (tests/unit/suite-rules.test.ts, suite-kit/rules): Eine Regel, die mit dieser Version dazukam, ist
// damit sofort in jedem Tool rot, das sie nicht erfüllt. Fehlt die Datei, steht das in der Ausgabe. Übrige Tests,
// Commit und Deployment bleiben bewusst Handarbeit je Tool (docs/DESIGN.md, „Änderungen an alle Tools verteilen“).
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const TOOLS = ['rsvp-app', 'abstimmungstool', 'seating', 'zeitplan', 'schichten', 'wichteln', 'termine', 'startseite', 'inventur', 'haushaltsbuch']
const [tag, ...only] = process.argv.slice(2)
if (!tag || !/^v\d+\.\d+\.\d+$/.test(tag)) {
  console.error('Aufruf: node scripts/update-apps.mjs vX.Y.Z [tool ...]')
  process.exit(1)
}

const parent = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const run = (cwd, cmd, args) => execFileSync(cmd, args, { cwd, stdio: 'inherit' })
let failed = false
const missingRules = []

for (const tool of only.length ? only : TOOLS) {
  const dir = join(parent, tool)
  if (!existsSync(join(dir, 'package.json'))) {
    console.log(`- ${tool}: nicht gefunden, übersprungen`)
    continue
  }
  const current = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).dependencies?.['suite-kit']
  console.log(`\n== ${tool} (bisher ${current ?? 'ohne suite-kit'})`)
  try {
    run(dir, 'npm', ['install', `suite-kit@github:druXter/suite-kit#${tag}`])
    run(dir, 'npx', ['tsc', '--noEmit'])
    run(dir, 'npx', ['eslint', 'app'])
    const rules = join('tests', 'unit', 'suite-rules.test.ts')
    const hasRules = existsSync(join(dir, rules))
    if (hasRules) run(dir, 'npx', ['vitest', 'run', rules])
    else missingRules.push(tool)
    console.log(`✓ ${tool}: ${tag} installiert, Typen und Lint in Ordnung${hasRules ? ', gemeinsame Regeln grün' : ' - OHNE gemeinsame Regeln (tests/unit/suite-rules.test.ts fehlt)'}`)
  } catch {
    failed = true
    console.log(`✗ ${tool}: fehlgeschlagen - siehe oben`)
  }
}
if (missingRules.length) console.log(`\nOhne gemeinsame Regeln (docs/KONVENTIONEN.md, „Gemeinsame Regeln“): ${missingRules.join(', ')}`)
process.exit(failed ? 1 : 0)
