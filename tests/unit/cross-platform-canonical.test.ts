/**
 * Canonical cross-platform test vectors — verifies the TS SDK against the shared
 * cross-platform-test-vectors.json (the cross-SDK master). Sibling of the family's
 * cross-platform tests (JS cross-platform-canonical.test.js, PHP/Kotlin
 * CrossPlatformVectorsTest, Rust cross_platform_vectors.rs) — asserts SHAKE256 /
 * bundle_hash / wallet_generation / ML-KEM768 against the same committed vectors.
 *
 * Standalone-CI note: this statically imports the monorepo-parent master, which is
 * ABSENT in a standalone GitHub checkout — vitest.config.ts gates it out via
 * `crossPlatformVectorsPresent` (mirrors the generate-secret-parity.test.ts gate).
 */

import { describe, it, expect } from 'vitest'
import Wallet from '../../src/core/Wallet'
import { generateBundleHash, shake256 } from '../../src/libraries/crypto'
import vectorsJson from '../../../shared-test-results/cross-platform-test-vectors.json'

const vectors = (vectorsJson as {
  vectors: {
    shake256: { tests: Array<{ name: string; input: string; outputLength: number; expected: string }> }
    bundle_hash: { tests: Array<{ name: string; secret: string; expected: string }> }
    wallet_generation: { tests: Array<{ name: string; secret: string; token: string; position: string; expectedBundle: string; expectedAddress: string }> }
    mlkem768: {
      keygen: { secret: string; token: string; position: string; expectedPubkey: string }
      decrypt: { secret: string; token: string; position: string; cipherText: string; encryptedMessage: string; expectedPlaintext: string }
    }
  }
}).vectors

describe('Canonical Cross-Platform SHAKE256 Vectors', () => {
  it.each(vectors.shake256.tests)('SHAKE256: $name', (vector) => {
    // Vector outputLength is in BYTES; TS shake256() takes BITS.
    const result = shake256(vector.input, vector.outputLength * 8)
    expect(result).toBe(vector.expected)
  })
})

describe('Canonical Cross-Platform Bundle Hash Vectors', () => {
  // FIXED (cycle 142): TS generateBundleHash() now hashes an empty secret to
  // shake256("") = 46b9dd2b… (removed the "Secret is required" guard), matching
  // JS/PHP/Kotlin/Rust/Python + the committed `empty_secret` vector — so ALL cases
  // (incl. empty_secret) are asserted here, no longer filtered.
  it.each(vectors.bundle_hash.tests)('Bundle hash: $name', (vector) => {
    expect(generateBundleHash(vector.secret)).toBe(vector.expected)
  })
})

describe('Canonical Cross-Platform Wallet Address Vectors', () => {
  it.each(vectors.wallet_generation.tests)('Wallet: $name', (vector) => {
    expect(generateBundleHash(vector.secret)).toBe(vector.expectedBundle)
    const wallet = new Wallet({ secret: vector.secret, token: vector.token, position: vector.position })
    expect(wallet.address).toBe(vector.expectedAddress)
  })
})

describe('Canonical Cross-Platform ML-KEM768 Vectors', () => {
  const mlkem = vectors.mlkem768

  // Keygen-from-seed is deterministic (FIPS-203) → byte-frozen pubkey, like a SHAKE vector.
  it('ML-KEM768 keygen: deterministic pubkey matches canonical', () => {
    const { secret, token, position, expectedPubkey } = mlkem.keygen
    const wallet = new Wallet({ secret, token, position })
    expect(wallet.pubkey).toBe(expectedPubkey)
  })

  // Encapsulation is non-deterministic, but decapsulation + AES-256-GCM decrypt is deterministic →
  // one frozen {cipherText, encryptedMessage} sample must decrypt to the canonical plaintext.
  it('ML-KEM768 decrypt: frozen sample decrypts to canonical plaintext', async () => {
    const { secret, token, position, cipherText, encryptedMessage, expectedPlaintext } = mlkem.decrypt
    const wallet = new Wallet({ secret, token, position })
    const plaintext = await wallet.decryptMessage({ cipherText, encryptedMessage })
    expect(plaintext).toBe(expectedPlaintext)
  })
})
