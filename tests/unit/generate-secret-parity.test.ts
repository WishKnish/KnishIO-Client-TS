/**
 * Cross-SDK parity (Batch AO): generateSecret(seed) must produce the canonical
 * 2048-hex secret, byte-identical to JS/Rust/PHP/Python/Kotlin. Pure-function test
 * against the shared canonical vectors — no validator needed.
 */

import { describe, it, expect } from 'vitest'
import { generateSecret } from '../../src/libraries/crypto'
import vectors from '../../../shared-test-results/canonical-patent-vectors.json'

describe('generateSecret cross-SDK parity (Batch AO)', () => {
  const tests = (vectors as { vectors: { generate_secret: { tests: Array<{ name: string; seed: string; length: number; expectedSecret: string }> } } }).vectors.generate_secret.tests

  it.each(tests)('$name: secret matches canonical (2048 hex)', (vector) => {
    const secret = generateSecret(vector.seed)
    expect(secret).toBe(vector.expectedSecret)
    expect(secret.length).toBe(vector.length)
  })
})
