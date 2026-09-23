/**
 * Cross-SDK parity (Batch AO): generateSecret(seed) must produce the canonical
 * 2048-hex secret, byte-identical to JS/Rust/PHP/Python/Kotlin. Pure-function test
 * against the shared canonical vectors — no validator needed.
 *
 * Standalone-CI note: the monorepo-parent master is ABSENT in a standalone GitHub
 * checkout. The fixture is read at runtime; when it is missing this file registers
 * one skipped test naming the absent path, so the skip is visible in the run.
 */

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'
import { generateSecret } from '../../src/libraries/crypto'

type GenerateSecretVectors = {
  vectors: { generate_secret: { tests: Array<{ name: string; seed: string; length: number; expectedSecret: string }> } }
}

const FIXTURE = resolve(__dirname, '../../../shared-test-results/canonical-patent-vectors.json')
const fixture: GenerateSecretVectors | null = existsSync(FIXTURE) ? JSON.parse(readFileSync(FIXTURE, 'utf8')) : null

if (!fixture) {
  it.skip('generate-secret-parity.test.ts: skipped — ../shared-test-results/canonical-patent-vectors.json not found (standalone checkout)', () => {})
} else {
  describe('generateSecret cross-SDK parity (Batch AO)', () => {
    it.each(fixture.vectors.generate_secret.tests)('$name: secret matches canonical (2048 hex)', (vector) => {
      const secret = generateSecret(vector.seed)
      expect(secret).toBe(vector.expectedSecret)
      expect(secret.length).toBe(vector.length)
    })
  })
}
