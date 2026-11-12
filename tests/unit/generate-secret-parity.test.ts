/**
 * Cross-SDK parity (Batch AO): generateSecret(seed) must produce the canonical
 * 2048-hex secret, byte-identical to JS/Rust/PHP/Python/Kotlin. Pure-function test
 * against the shared canonical vectors — no validator needed.
 *
 * The fixture tests/fixtures/canonical-patent-vectors.json is vendored from the shared master
 * (scripts/sync-cross-sdk-fixtures.sh); a missing or unparsable fixture fails the file.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'
import { generateSecret } from '../../src/libraries/crypto'

type GenerateSecretVectors = {
  vectors: { generate_secret: { tests: Array<{ name: string; seed: string; length: number; expectedSecret: string }> } }
}

const FIXTURE = resolve(__dirname, '../fixtures/canonical-patent-vectors.json')
const fixture: GenerateSecretVectors = JSON.parse(readFileSync(FIXTURE, 'utf8'))

describe('generateSecret cross-SDK parity (Batch AO)', () => {
  it.each(fixture.vectors.generate_secret.tests)('$name: secret matches canonical (2048 hex)', (vector) => {
    const secret = generateSecret(vector.seed)
    expect(secret).toBe(vector.expectedSecret)
    expect(secret.length).toBe(vector.length)
  })
})
