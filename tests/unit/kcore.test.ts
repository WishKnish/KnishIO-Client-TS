/**
 * Optional kcore backend (src/libraries/kcore.ts).
 *
 * The parity tests run when the environment loads kcore, e.g.
 *   KNISHIO_KCORE=require KNISHIO_KCORE_MODULE=$PWD/../KnishIO-Kcore-JS npm test
 * and are skipped otherwise. Each one computes the same value with kcore and with
 * KNISHIO_KCORE=off and requires both to agree. The mode tests set their own environment.
 */
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ml_kem768, ml_kem1024 } from '@noble/post-quantum/ml-kem.js'
import * as kcore from '../../src/libraries/kcore'
import Wallet from '../../src/core/Wallet'
import Molecule from '../../src/core/Molecule'
import Atom from '../../src/core/Atom'
import AtomMeta from '../../src/core/AtomMeta'
import CheckMolecule from '../../src/libraries/CheckMolecule'
import { convertToBase17, generateOTSSignature, verifyOTSSignature } from '../../src/libraries/crypto'

const ENV_KEYS = ['KNISHIO_KCORE', 'KNISHIO_KCORE_MODULE'] as const
const SAVED = Object.fromEntries(ENV_KEYS.map(k => [k, process.env[k]])) as Record<(typeof ENV_KEYS)[number], string | undefined>
const MISSING_MODULE = resolve(__dirname, 'no-such-kcore')
const SECRET = 'e'.repeat(2048)
const POSITION = 'c0ffee0000000000c0ffee0000000000c0ffee0000000000c0ffee0000000000'

// A require-mode load failure throws here, so a broken install fails the file instead of skipping.
const KCORE_ON = kcore.available()
kcore._reset()

const hexKey = (seed: string): string => createHash('shake256', { outputLength: 1024 }).update(seed).digest('hex')

function restoreEnv(): void {
  for (const k of ENV_KEYS) {
    if (SAVED[k] === undefined) delete process.env[k]
    else process.env[k] = SAVED[k]
  }
}

/** Runs fn with kcore as the environment configured it ('on') or with KNISHIO_KCORE=off. */
function under<T>(mode: 'on' | 'off', fn: () => T): T {
  restoreEnv()
  if (mode === 'off') process.env.KNISHIO_KCORE = 'off'
  kcore._reset()
  try {
    expect(kcore.available()).toBe(mode === 'on')
    return fn()
  } finally {
    restoreEnv()
    kcore._reset()
  }
}

function signedMolecule(): Molecule {
  const signer = new Wallet({ secret: SECRET, token: 'USER', position: POSITION })
  const molecule = new Molecule({ secret: SECRET, sourceWallet: signer, cellSlug: 'kcore' })
  molecule.addAtom(Atom.create({ isotope: 'M', wallet: signer, metaType: 'KcoreProbe', metaId: 'p1', meta: new AtomMeta({ k: 'v' }) }))
  molecule.sign({ compressed: false })
  return molecule
}

function otsOutcome(molecule: Molecule): string {
  try {
    return `returned ${String(new CheckMolecule(molecule).ots())}`
  } catch (e) {
    return `threw ${e instanceof Error ? e.constructor.name : String(e)}`
  }
}

beforeEach(() => {
  restoreEnv()
  kcore._reset()
})

afterEach(() => {
  restoreEnv()
  kcore._reset()
})

describe.skipIf(!KCORE_ON)('kcore parity with the built-in implementation', () => {
  it('Wallet.generateAddress agrees for 20 keys', () => {
    const keys = Array.from({ length: 20 }, (_, i) => hexKey(String(i)))
    const viaKcore = under('on', () => keys.map(key => {
      expect(kcore.wotsAddress(key)).not.toBeNull()
      return Wallet.generateAddress(key)
    }))
    const builtIn = under('off', () => keys.map(key => Wallet.generateAddress(key)))

    expect(viaKcore).toEqual(builtIn)
  })

  it('generateOTSSignature and verifyOTSSignature agree', () => {
    const key = hexKey('kcore-sign')
    const hash = createHash('sha3-256').update('kcore-sign').digest('hex')
    const base17 = convertToBase17(hash)
    const address = under('off', () => Wallet.generateAddress(key))

    const viaKcore = under('on', () => generateOTSSignature(key, base17))
    const builtIn = under('off', () => generateOTSSignature(key, base17))

    expect(viaKcore).toBe(builtIn)
    expect(under('on', () => verifyOTSSignature(builtIn, hash, address))).toBe(true)
    expect(under('off', () => verifyOTSSignature(viaKcore, hash, address))).toBe(true)
  })

  it('a molecule signed on either side verifies on the other', () => {
    const viaKcore = under('on', signedMolecule)
    const builtIn = under('off', signedMolecule)

    // The atoms carry their createdAt, so the two molecules (and signatures) differ; each must
    // still verify on the other side.
    expect(under('off', () => otsOutcome(viaKcore))).toBe('returned true')
    expect(under('on', () => otsOutcome(builtIn))).toBe('returned true')
  })

  it('odd OTS text gets the same ots() outcome with and without kcore', () => {
    const variants: Record<string, (ots: string) => string> = {
      'unchanged': ots => ots,
      'one hex digit uppercased': ots => {
        const at = ots.search(/[a-f]/)
        return ots.slice(0, at) + ots[at]!.toUpperCase() + ots.slice(at + 1)
      },
      'one non-hex character': ots => ots.slice(0, 700) + 'x' + ots.slice(701),
      'wrong length': ots => ots + 'a'
    }
    const outcomes = Object.entries(variants).map(([name, mutate]) => {
      const molecule = under('off', signedMolecule)
      molecule.atoms[0]!.otsFragment = mutate(molecule.atoms[0]!.otsFragment!)
      return { name, on: under('on', () => otsOutcome(molecule)), off: under('off', () => otsOutcome(molecule)) }
    })

    for (const { name, on, off } of outcomes) {
      expect(on, name).toBe(off)
    }
    expect(outcomes[0]!.on).toBe('returned true')
    expect(outcomes.slice(1).every(o => o.off.startsWith('threw '))).toBe(true)
  })

  it.each([
    [1024, ml_kem1024],
    [768, ml_kem768]
  ] as const)('ML-KEM-%i: keygen matches, fresh coins per encapsulation, decapsulation agrees', (set, noble) => {
    const seed = new Uint8Array(64).map((_, i) => i * 7 + set)
    under('on', () => {
      const pair = kcore.mlkemKeypair(set, seed)!
      expect(pair).not.toBeNull()
      const reference = noble.keygen(seed)
      expect(pair.publicKey).toEqual(reference.publicKey)
      expect(pair.secretKey).toEqual(reference.secretKey)

      const first = kcore.mlkemEncaps(set, pair.publicKey)!
      const second = kcore.mlkemEncaps(set, pair.publicKey)!
      expect(first.cipherText).not.toEqual(second.cipherText)
      expect(kcore.mlkemDecaps(set, first.cipherText, pair.secretKey)).toEqual(first.sharedSecret)
      expect(kcore.mlkemDecaps(set, second.cipherText, pair.secretKey)).toEqual(second.sharedSecret)
      expect(noble.decapsulate(first.cipherText, pair.secretKey)).toEqual(first.sharedSecret)
    })
  })

  it('returns null for inputs kcore does not take', () => {
    const key = hexKey('ineligible')
    const chunk = key.slice(0, 128)
    under('on', () => {
      expect(kcore.wotsAddress(key.slice(1))).toBeNull()
      expect(kcore.wotsAddress(key.toUpperCase())).toBeNull()
      expect(kcore.chainsHex(chunk, [65])).toBeNull()
      expect(kcore.chainsHex(chunk, [-1])).toBeNull()
      expect(kcore.chainsHex(chunk, [1])).not.toBeNull()

      const seed = new Uint8Array(64)
      const pair = kcore.mlkemKeypair(1024, seed)!
      expect(kcore.mlkemKeypair(1024, seed.subarray(1))).toBeNull()
      expect(kcore.mlkemKeypair(512, seed)).toBeNull()
      expect(kcore.mlkemEncaps(768, pair.publicKey)).toBeNull()
      expect(kcore.mlkemDecaps(1024, new Uint8Array(1088), pair.secretKey)).toBeNull()
      expect(kcore.mlkemDecaps(1024, new Uint8Array(1568), pair.secretKey.subarray(1))).toBeNull()
    })
  })
})

describe('kcore modes', () => {
  it('off: unavailable, every call returns null', () => {
    process.env.KNISHIO_KCORE = 'off'
    expect(kcore.available()).toBe(false)
    expect(kcore.backend()).toBeNull()
    expect(kcore.wotsAddress(hexKey('off'))).toBeNull()
  })

  it('require: a failed load throws KcoreUnavailable on every call', () => {
    process.env.KNISHIO_KCORE = 'require'
    process.env.KNISHIO_KCORE_MODULE = MISSING_MODULE
    expect(() => kcore.available()).toThrow(kcore.KcoreUnavailable)
    expect(() => kcore.wotsAddress(hexKey('require'))).toThrow(/^kcore unavailable: /)
  })

  it('auto: a failed load means unavailable', () => {
    process.env.KNISHIO_KCORE = 'auto'
    process.env.KNISHIO_KCORE_MODULE = MISSING_MODULE
    expect(kcore.available()).toBe(false)
    expect(kcore.wotsAddress(hexKey('auto'))).toBeNull()
  })

  it('rejects an unknown mode', () => {
    process.env.KNISHIO_KCORE = 'bogus'
    expect(() => kcore.available()).toThrow("KNISHIO_KCORE must be auto, off or require, got 'bogus'")
  })
})
