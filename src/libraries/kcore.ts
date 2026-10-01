/**
 * Optional kcore backend (KnishIO-Crypto-Core through `@wishknish/knishio-kcore`).
 *
 * When the package is installed next to the SDK, the WOTS+ hot paths (wallet address, signature
 * and verification chains) and ML-KEM keygen / encapsulation / decapsulation run in kcore. Every
 * function returns `null` when kcore is off, failed to load, or the input is not one kcore takes;
 * the caller then runs its own implementation, so results never depend on whether kcore is present.
 *
 * Environment, read on first use:
 * - `KNISHIO_KCORE` = `auto` (default: use kcore when it loads) | `off` | `require` (a failed load
 *   throws {@link KcoreUnavailable} on every call).
 * - `KNISHIO_KCORE_MODULE` overrides the module specifier (an absolute directory path works).
 *
 * This module imports nothing from the SDK.
 */

export class KcoreUnavailable extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'KcoreUnavailable'
  }
}

type KemSet = 1024 | 768

interface KcoreLib {
  backend: 'napi' | 'wasm'
  abiVersion(): number
  chainsHex(chunks: string, counts: ArrayLike<number>): string
  wotsAddress(key: string): string
  mlkemKeypair(set: KemSet, seed: Uint8Array): { publicKey: Uint8Array; secretKey: Uint8Array }
  mlkemEncaps(set: KemSet, publicKey: Uint8Array, coins: Uint8Array): { cipherText: Uint8Array; sharedSecret: Uint8Array }
  mlkemDecaps(set: KemSet, cipherText: Uint8Array, secretKey: Uint8Array): Uint8Array
}

type Host = {
  process?: {
    env?: Record<string, string | undefined>
    getBuiltinModule?: (id: string) => any
  }
}

const ABI_VERSION = 1
const DEFAULT_MODULE = '@wishknish/knishio-kcore'
const HEX = /^[0-9a-f]+$/
const SEED_BYTES = 64
const COINS_BYTES = 32
const KEM_SIZES: Record<KemSet, { pk: number; sk: number; ct: number }> = {
  1024: { pk: 1568, sk: 3168, ct: 1568 },
  768: { pk: 1184, sk: 2400, ct: 1088 }
}

let state: 'off' | 'ok' | 'failed' | null = null
let mode: 'auto' | 'off' | 'require' = 'auto'
let lib: KcoreLib | null = null
let reason = ''

function readMode(env: Record<string, string | undefined>): 'auto' | 'off' | 'require' {
  const value = (env.KNISHIO_KCORE ?? 'auto').toLowerCase()
  if (value !== 'auto' && value !== 'off' && value !== 'require') {
    throw new Error(`KNISHIO_KCORE must be auto, off or require, got '${value}'`)
  }
  return value
}

function load(specifier: string): string | null {
  const proc = (globalThis as unknown as Host).process
  const gbm = proc?.getBuiltinModule
  if (typeof gbm !== 'function') {
    return 'process.getBuiltinModule unavailable (Node >= 20.16 or 22.3 required)'
  }
  try {
    const { createRequire } = gbm.call(proc, 'node:module')
    const loaded = createRequire(import.meta.url)(specifier) as KcoreLib
    const abi = loaded.abiVersion()
    if (abi !== ABI_VERSION) {
      return `ABI version ${abi}, expected ${ABI_VERSION} (${specifier})`
    }
    lib = loaded
    return null
  } catch (e) {
    return `${e instanceof Error ? e.message : String(e)} (${specifier})`
  }
}

/** The loaded package, or null. In `require` mode a failed load throws on every call. */
function ensure(): KcoreLib | null {
  if (state === null) {
    const env = (globalThis as unknown as Host).process?.env ?? {}
    mode = readMode(env)
    if (mode === 'off') {
      state = 'off'
    } else {
      const failure = load(env.KNISHIO_KCORE_MODULE || DEFAULT_MODULE)
      reason = failure ?? ''
      state = failure === null ? 'ok' : 'failed'
    }
  }
  if (state === 'failed' && mode === 'require') {
    throw new KcoreUnavailable(`kcore unavailable: ${reason}`)
  }
  return state === 'ok' ? lib : null
}

function isKemSet(set: unknown): set is KemSet {
  return set === 1024 || set === 768
}

function isBytes(value: unknown, length: number): value is Uint8Array {
  return value instanceof Uint8Array && value.length === length
}

/** True when kcore loaded. Throws {@link KcoreUnavailable} in `require` mode when it did not. */
export function available(): boolean {
  return ensure() !== null
}

/** Backend of the loaded package, or null. */
export function backend(): 'napi' | 'wasm' | null {
  return ensure()?.backend ?? null
}

/** WOTS+ address (64 hex) of a 2048-character lowercase-hex key (`Wallet.generateAddress`). */
export function wotsAddress(key: string): string | null {
  const k = ensure()
  if (k === null || typeof key !== 'string' || key.length !== 2048 || !HEX.test(key)) {
    return null
  }
  try {
    return k.wotsAddress(key)
  } catch {
    return null
  }
}

/**
 * Advances `counts.length` WOTS+ chains of 128 lowercase-hex characters each: chunk i is replaced
 * by hex(SHAKE256(chunk, 64 bytes)) applied `counts[i]` times. Returns the concatenated chunks.
 */
export function chainsHex(chunks: string, counts: readonly number[]): string | null {
  const k = ensure()
  const n = Array.isArray(counts) ? counts.length : 0
  if (k === null || n < 1 || n > 64 || typeof chunks !== 'string' || chunks.length !== 128 * n || !HEX.test(chunks)) {
    return null
  }
  if (!counts.every(c => Number.isInteger(c) && c >= 0 && c <= 64)) {
    return null
  }
  try {
    return k.chainsHex(chunks, counts)
  } catch {
    return null
  }
}

/** Deterministic ML-KEM keypair from a 64-byte seed (d || z). */
export function mlkemKeypair(set: number, seed: Uint8Array): { publicKey: Uint8Array; secretKey: Uint8Array } | null {
  const k = ensure()
  if (k === null || !isKemSet(set) || !isBytes(seed, SEED_BYTES)) {
    return null
  }
  try {
    return k.mlkemKeypair(set, seed)
  } catch {
    return null
  }
}

/** ML-KEM encapsulation with 32 fresh random coins per call. */
export function mlkemEncaps(set: number, publicKey: Uint8Array): { cipherText: Uint8Array; sharedSecret: Uint8Array } | null {
  const k = ensure()
  if (k === null || !isKemSet(set) || !isBytes(publicKey, KEM_SIZES[set].pk)) {
    return null
  }
  // Fresh coins on every call: repeating them against one key repeats the ciphertext and secret.
  const coins = globalThis.crypto.getRandomValues(new Uint8Array(COINS_BYTES))
  try {
    return k.mlkemEncaps(set, publicKey, coins)
  } catch {
    return null
  } finally {
    coins.fill(0)
  }
}

/** ML-KEM decapsulation (implicit rejection: a bad ciphertext yields a pseudo-random secret). */
export function mlkemDecaps(set: number, cipherText: Uint8Array, secretKey: Uint8Array): Uint8Array | null {
  const k = ensure()
  if (k === null || !isKemSet(set) || !isBytes(cipherText, KEM_SIZES[set].ct) || !isBytes(secretKey, KEM_SIZES[set].sk)) {
    return null
  }
  try {
    return k.mlkemDecaps(set, cipherText, secretKey)
  } catch {
    return null
  }
}

/** Forgets the load result so the next call re-reads the environment (tests only). */
export function _reset(): void {
  state = null
  mode = 'auto'
  lib = null
  reason = ''
}
