import { afterEach, describe, it, expect, vi } from 'vitest'
import { hexToBase64, base64ToHex } from '../../src/libraries/strings'
import { chunkArray } from '../../src/libraries/array'

/**
 * Companion to serialize-large-payload.test.ts. The SAME stack-overflow class the Wallet
 * fix addressed (a `String.fromCharCode(...spread)` / unbounded recursion) also lived in
 * the shared, publicly-exported `libraries/strings` + `libraries/array` utils. These pin
 * the fixes: large inputs must not throw, and base64 output must stay byte-identical to
 * the legacy encoding (hexToBase64 feeds Molecule compressed-OTS signatures).
 */
describe('stack-safe string/array utilities', () => {
  // Deterministic hex string of `byteLen` bytes (2 hex chars each).
  function largeHex(byteLen: number): string {
    let hex = ''
    for (let i = 0; i < byteLen; i++) {
      hex += ((i * 31 + 7) % 256).toString(16).padStart(2, '0')
    }
    return hex
  }

  it('hexToBase64 stays byte-identical to the legacy btoa(spread) encoding', () => {
    const hex = largeHex(4096)
    const bytes = Uint8Array.from(Buffer.from(hex, 'hex'))
    expect(hexToBase64(hex)).toBe(btoa(String.fromCharCode(...bytes)))
  })

  it('hexToBase64 handles a payload far beyond the argument limit, byte-identical to Buffer', () => {
    const hex = largeHex(750_000) // 1.5 MB of hex → 750 KB of bytes
    const bytes = Uint8Array.from(Buffer.from(hex, 'hex'))
    expect(() => hexToBase64(hex)).not.toThrow()
    expect(hexToBase64(hex)).toBe(Buffer.from(bytes).toString('base64'))
  })

  it('base64ToHex round-trips a large payload back to the original hex', () => {
    const hex = largeHex(500_000)
    expect(base64ToHex(hexToBase64(hex))).toBe(hex)
  })

  describe('browser fallback (no Buffer global)', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('chunked hexToBase64 matches the Buffer fast path on a large payload', () => {
      const hex = largeHex(300_000)
      const nodeB64 = hexToBase64(hex)

      vi.stubGlobal('Buffer', undefined)
      expect(hexToBase64(hex)).toBe(nodeB64)
    })
  })

  it('chunkArray splits a large array without overflowing the stack', () => {
    const arr = Array.from({ length: 500_000 }, (_, i) => i)
    let chunks: number[][] = []
    expect(() => {
      chunks = chunkArray(arr, 3)
    }).not.toThrow()
    expect(chunks.length).toBe(Math.ceil(arr.length / 3))
    expect(chunks[0]).toEqual([0, 1, 2])
    expect(chunks[chunks.length - 1]).toEqual([499_998, 499_999])
  })

  it('chunkArray returns [] for an empty array', () => {
    expect(chunkArray([], 4)).toEqual([])
  })
})
