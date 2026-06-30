import { describe, it, expect } from 'vitest'
import Wallet from '../../src/core/Wallet'

/**
 * PQ-transport hardening (cycle 174): when a node advertises a non-ML-KEM `key` (e.g. a validator
 * predating the PQ-transport build returns a legacy ~48-byte value), `encryptMessage` must fail with
 * an actionable KnishIO error — NOT @noble's cryptic `"publicKey" expected Uint8Array of length 1184,
 * got length=48`. Regression seen live in knish-kits against a stale :8080 validator.
 */
describe('ML-KEM encrypt guard', () => {
  const wallet = new Wallet({ secret: 'a1b2c3d4e5f6'.repeat(8), token: 'AUTH' })

  it('throws a clear, actionable error when the recipient pubkey is not a 1184-byte ML-KEM key', async () => {
    // 48 bytes — the exact length a pre-PQ validator advertised in its auth `key` field.
    const shortKey = wallet.serializeKey(new Uint8Array(48))
    await expect(wallet.encryptMessage({ q: 1 }, shortKey)).rejects.toThrow(/expected 1184 \(ML-KEM-768\)/)
    await expect(wallet.encryptStringML768('{"q":1}', shortKey)).rejects.toThrow(/did not advertise an ML-KEM/)
  })

  it('still encrypts to a valid 1184-byte ML-KEM key (no false trigger)', async () => {
    const env = await wallet.encryptMessage({ q: 1 }, wallet.pubkey as string)
    expect(typeof env.cipherText).toBe('string')
    expect(typeof env.encryptedMessage).toBe('string')
  })
})
