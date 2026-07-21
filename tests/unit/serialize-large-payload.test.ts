import { afterEach, describe, it, expect, vi } from 'vitest'
import Wallet from '../../src/core/Wallet'

/**
 * Production regression (knish-kits, 2026-07-21): uploading a deal document crashed with
 * `RangeError: Maximum call stack size exceeded` in `serializeKey`. The old implementation
 * spread every byte of the AES-GCM ciphertext as a function argument
 * (`String.fromCharCode(...key)`), which exceeds the engine's argument limit (~64–125K)
 * for any payload past ~100KB — long before any application-level size cap.
 *
 * Serialization must stay byte-identical to the legacy output: blobs encrypted before this
 * fix (and by other-language SDKs) must still deserialize to the same bytes.
 */
describe('stack-safe key serialization', () => {
  const wallet = new Wallet({ secret: 'a1b2c3d4e5f6'.repeat(8), token: 'AUTH' })

  it('encrypts and round-trips a payload far beyond the V8 argument limit', async () => {
    const message = {
      content_b64: 'A'.repeat(1_500_000),
      mime_type: 'application/pdf',
      file_name: 'large-document.pdf'
    }

    const envelope = await wallet.encryptMessage(message, wallet.pubkey as string)
    expect(typeof envelope.cipherText).toBe('string')
    expect(typeof envelope.encryptedMessage).toBe('string')

    const decrypted = await wallet.decryptMessage(envelope)
    expect(decrypted).toEqual(message)
  })

  it('keeps serializeKey byte-identical to the legacy spread implementation', () => {
    const bytes = new Uint8Array(4096)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = (i * 31 + 7) % 256
    }

    expect(wallet.serializeKey(bytes)).toBe(btoa(String.fromCharCode(...bytes)))
  })

  it('round-trips serializeKey → deserializeKey byte-for-byte', () => {
    const bytes = new Uint8Array(4096)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = (i * 131 + 17) % 256
    }

    const restored = wallet.deserializeKey(wallet.serializeKey(bytes))
    expect(Array.from(restored)).toEqual(Array.from(bytes))
  })

  describe('browser fallback (no Buffer global)', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('chunked conversion handles large payloads and matches the Buffer fast path', () => {
      const bytes = new Uint8Array(300_000)
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = (i * 7 + 3) % 256
      }
      const nodeSerialized = wallet.serializeKey(bytes)

      vi.stubGlobal('Buffer', undefined)
      const browserSerialized = wallet.serializeKey(bytes)
      expect(browserSerialized).toBe(nodeSerialized)

      const restored = wallet.deserializeKey(browserSerialized)
      expect(restored.length).toBe(bytes.length)
      expect(Array.from(restored.subarray(0, 1000))).toEqual(Array.from(bytes.subarray(0, 1000)))
      expect(Array.from(restored.subarray(bytes.length - 1000))).toEqual(Array.from(bytes.subarray(bytes.length - 1000)))
    })
  })
})
