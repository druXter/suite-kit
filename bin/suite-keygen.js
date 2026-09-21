#!/usr/bin/env node
// Erzeugt ein Ed25519-Schlüsselpaar für ein Tool der Suite.
// Nutzung: npx suite-keygen   (Ausgabe in die .env des jeweiligen Tools übernehmen)
import { generateKeyPair } from '../dist/src/index.js'

const { privateKey, kid } = generateKeyPair()
console.log('# Privater Signierschlüssel dieses Tools - geheim halten, nie ins Repo/andere Tools kopieren.')
console.log('# Der öffentliche Teil wird automatisch unter /.well-known/suite-identity veröffentlicht.')
console.log(`SUITE_SIGNING_KEY=${privateKey}`)
console.log(`# kid: ${kid}`)
