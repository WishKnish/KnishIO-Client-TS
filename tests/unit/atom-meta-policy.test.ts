/**
 * AtomMeta.addPolicy must normalise through PolicyMeta before serialising.
 *
 * The stored `policy` string is hashed into the atom (Atom.getHashableValues pushes every meta
 * key and String(meta.value)), so a raw JSON.stringify(policy) — which is what this method used
 * to do — produced a molecular hash no other SDK could reproduce. PolicyMeta.fillDefault adds a
 * default entry for every meta key the caller did not cover, so the correct string carries
 * materially more than the input.
 *
 * The digest below was produced by BOTH this SDK and the JavaScript SDK from identical pinned
 * inputs (see the 0.9.6 cross-SDK parity check) and is pasted in deliberately.
 */
import { describe, it, expect } from 'vitest'
import Atom from '../../src/core/Atom'
import AtomMeta from '../../src/core/AtomMeta'
import Wallet from '../../src/core/Wallet'
import { generateSecret } from '../../src/libraries/crypto'

const SEED = 'parity-probe-fixed-seed'
const TOKEN = 'TEST'
const SOURCE_POSITION = '1'.repeat(64)
const FIXED_CREATED_AT = '1700000000000'

const readPolicyString = (meta: AtomMeta): string => {
  const entry = meta.get().find(item => item.key === 'policy')
  expect(entry).toBeDefined()
  return String(entry!.value)
}

describe('AtomMeta.addPolicy normalises through PolicyMeta', () => {
  it('emits the filled-in policy, not the caller input verbatim', () => {
    const meta = new AtomMeta({ foo: 'bar', characters: 'BASE64', pubkey: 'abc' })
    meta.addPolicy({ read: { foo: ['all'] } })

    const parsed = JSON.parse(readPolicyString(meta))

    // The caller's own entry survives.
    expect(parsed.read.foo).toEqual(['all'])

    // fillDefault contributes a write branch and per-key defaults that a raw stringify omits.
    // Note the keys are array indices: `meta` is a NormalizedMeta[] and addPolicy passes
    // Object.keys(this.meta), matching the JS SDK exactly.
    expect(parsed.write).toBeDefined()
    expect(parsed.read['0']).toEqual(['all'])
    expect(parsed.write['0']).toEqual(['self'])
    expect(Object.keys(parsed.write).sort()).toEqual(['0', '1', '2'])
  })

  it('does NOT emit the raw input — the regression guard', () => {
    const input = { read: { foo: ['all'] } }
    const meta = new AtomMeta({ foo: 'bar', characters: 'BASE64', pubkey: 'abc' })
    meta.addPolicy(input)

    const policyString = readPolicyString(meta)

    // This is precisely what the old `JSON.stringify(policy)` produced.
    expect(policyString).not.toBe(JSON.stringify(input))
    expect(JSON.parse(policyString)).not.toEqual(input)
  })

  it('hashes an R atom carrying the policy to the JS SDK digest', () => {
    const secret = generateSecret(SEED)
    const atomMeta = new AtomMeta({ foo: 'bar', characters: 'BASE64', pubkey: 'abc' })
    atomMeta.addPolicy({ read: { foo: ['all'] } })

    const wallet = new Wallet({ secret, token: TOKEN, position: SOURCE_POSITION })
    const atom = Atom.create({
      isotope: 'R',
      wallet,
      metaType: 'walletBundle',
      metaId: 'd'.repeat(64),
      meta: atomMeta
    })
    atom.createdAt = FIXED_CREATED_AT
    atom.index = 0

    // Produced identically by sdks/KnishIO-Client-JS from the same pinned inputs.
    expect(Atom.hashAtoms({ atoms: [atom] }))
      .toBe('03671c54cf0df5d44a0ab752ggb717dddfbga0e744f0289adea6bdca33242b66')
  })
})
