// src/keys.ts
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, type KeyObject } from 'node:crypto'
import { b64uDecode, b64uEncode } from './base64url.js'

/**
 * Jedes Tool der Suite hat ein eigenes Ed25519-Schlüsselpaar. Der private Schlüssel
 * verlässt das Tool nie (Env-Variable SUITE_SIGNING_KEY), die anderen Tools bekommen
 * nur den öffentlichen Teil über das Discovery-Dokument (siehe discovery.ts) - anders
 * als bei einem gemeinsamen HMAC-Secret kann ein kompromittiertes Tool dadurch keine
 * Logins im Namen eines anderen Tools fälschen.
 *
 * Schlüssel werden als base64url-kodiertes DER (PKCS#8 bzw. SPKI) gespeichert - eine
 * einzeilige Zeichenkette, die problemlos in eine .env passt.
 */

export type SuiteKeyPair = { privateKey: string; publicKey: string; kid: string }

export type Signer = { kid: string; publicKey: string; privateKeyObject: KeyObject }

/** Kurze, stabile Kennung eines öffentlichen Schlüssels (für Schlüsselrotation). */
export function keyId(publicKey: string): string {
  const der = b64uDecode(publicKey)
  if (!der) throw new Error('Ungültiger öffentlicher Schlüssel (kein base64url)')
  return b64uEncode(createHash('sha256').update(der).digest().subarray(0, 8))
}

export function generateKeyPair(): SuiteKeyPair {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519')
  const pub = b64uEncode(publicKey.export({ type: 'spki', format: 'der' }))
  return {
    privateKey: b64uEncode(privateKey.export({ type: 'pkcs8', format: 'der' })),
    publicKey: pub,
    kid: keyId(pub)
  }
}

/** Gibt null bei einem ungültigen/nicht-Ed25519-Schlüssel zurück statt zu werfen. */
export function importPublicKey(publicKey: string): KeyObject | null {
  const der = b64uDecode(publicKey)
  if (!der) return null
  try {
    const key = createPublicKey({ key: der, format: 'der', type: 'spki' })
    return key.asymmetricKeyType === 'ed25519' ? key : null
  } catch {
    return null
  }
}

/** Wirft bei ungültigem Schlüssel - ein falsch konfigurierter Signierschlüssel soll laut scheitern. */
export function loadSigner(privateKey: string): Signer {
  const der = b64uDecode(privateKey)
  if (!der) throw new Error('SUITE_SIGNING_KEY ist kein gültiges base64url')
  let privateKeyObject: KeyObject
  try {
    privateKeyObject = createPrivateKey({ key: der, format: 'der', type: 'pkcs8' })
  } catch {
    throw new Error('SUITE_SIGNING_KEY ist kein gültiger PKCS#8-Schlüssel')
  }
  if (privateKeyObject.asymmetricKeyType !== 'ed25519') {
    throw new Error('SUITE_SIGNING_KEY muss ein Ed25519-Schlüssel sein')
  }
  const publicKey = b64uEncode(createPublicKey(privateKeyObject).export({ type: 'spki', format: 'der' }))
  return { kid: keyId(publicKey), publicKey, privateKeyObject }
}

/**
 * Liest SUITE_SIGNING_KEY (und optional SUITE_SIGNING_KEY_PREVIOUS während einer
 * Schlüsselrotation, damit der alte öffentliche Schlüssel noch im Discovery-Dokument
 * bleibt). Gibt eine leere Liste zurück, wenn kein Schlüssel gesetzt ist - das Tool
 * ist dann nur Empfänger, nie Anbieter von Logins (oder gar nicht föderiert).
 * Der ERSTE Eintrag ist der aktive Signierschlüssel.
 */
export function loadSignersFromEnv(env: Record<string, string | undefined> = process.env): Signer[] {
  const signers: Signer[] = []
  for (const name of ['SUITE_SIGNING_KEY', 'SUITE_SIGNING_KEY_PREVIOUS']) {
    const value = env[name]?.trim()
    if (value) signers.push(loadSigner(value))
  }
  return signers
}
