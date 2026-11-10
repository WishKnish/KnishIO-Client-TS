/**
 * A failed ML-KEM decryption must not log secret material.
 *
 * `Wallet._mlkemDecryptToString` (behind `decryptMessage` and the CipherHash transport's
 * `decryptMyMessageML`) used to print the ML-KEM shared secret, the deserialized ciphertext and the
 * decrypted bytes through `console.info` whenever a later step failed. The shared secret is the
 * AES-256-GCM key of that message, so anything that captured the console could read it.
 *
 * The test tampers with one character of the AES-GCM payload so decapsulation succeeds and the
 * AES-GCM step fails — the path that logged the secret — and inspects every console argument.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import Wallet from '../../src/core/Wallet'

const SECRET = 'a1b2c3d4e5f6'.repeat(8)
const CONSOLE_METHODS = ['info', 'warn', 'error', 'log'] as const

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Wallet.decryptMessage', () => {
  it('decrypt failure logs no secret material', async () => {
    const wallet = new Wallet({ secret: SECRET, token: 'AUTH' })
    const envelope = await wallet.encryptMessage({ hello: 'world' }, wallet.pubkey as string)

    // Change one base64 character inside the IV/ciphertext so the AES-GCM tag check fails.
    const index = 20
    const flipped = envelope.encryptedMessage[index] === 'A' ? 'B' : 'A'
    const encryptedMessage =
      envelope.encryptedMessage.slice(0, index) + flipped + envelope.encryptedMessage.slice(index + 1)

    const spies = CONSOLE_METHODS.map(method => vi.spyOn(console, method).mockImplementation(() => {}))

    const result = await wallet.decryptMessage({ cipherText: envelope.cipherText, encryptedMessage })

    expect(result).toBeNull()
    const logged = spies.flatMap(spy => spy.mock.calls.flat())
    // The failure is still reported.
    expect(logged.length).toBeGreaterThan(0)
    for (const arg of logged) {
      expect(ArrayBuffer.isView(arg)).toBe(false)
      if (typeof arg === 'string') {
        expect(arg.toLowerCase()).not.toContain('secret')
      }
    }
  })
})
