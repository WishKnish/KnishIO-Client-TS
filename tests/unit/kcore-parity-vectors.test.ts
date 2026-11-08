/**
 * kcore parity vectors: full signed molecules (metadata, value transfer, token creation, wallet
 * creation × OTS v1/v2 × unique/colliding createdAt) that must verify and re-sign byte for byte
 * under whichever backend this run uses (KNISHIO_KCORE=off for the built-in path, =require for kcore).
 *
 * The fixture tests/fixtures/kcore-parity-vectors.json is vendored from the shared master
 * ../shared-test-results/kcore-parity-vectors.json; a missing fixture fails the file.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import * as kcore from '../../src/libraries/kcore'
import Wallet from '../../src/core/Wallet'
import Molecule from '../../src/core/Molecule'
import CheckMolecule from '../../src/libraries/CheckMolecule'

type ParityCase = {
  name: string
  kind: 'metadata' | 'valueTransfer' | 'tokenCreation' | 'walletCreation'
  otsVersion: 1 | 2
  timestamps: 'unique' | 'collide'
  secret: string
  sourceToken: string
  sourcePosition: string
  molecule: { atoms: Array<{ otsFragment?: string | null }> }
  expected: { molecularHash: string, otsFragments: string[] }
}
type MoleculeInput = Parameters<typeof Molecule.fromJSON>[0]

const VECTORS_PATH = resolve(__dirname, '../fixtures/kcore-parity-vectors.json')
const cases: ParityCase[] = JSON.parse(readFileSync(VECTORS_PATH, 'utf8')).vectors.molecules.tests
const REQUIRE = (process.env.KNISHIO_KCORE ?? '').toLowerCase() === 'require'

const parse = (json: unknown): Molecule => Molecule.fromJSON(json as MoleculeInput, {
  includeValidationContext: true,
  validateStructure: true,
  strictMode: false
})

describe('kcore parity vectors', () => {
  it('runs on the backend KNISHIO_KCORE selects', () => {
    if (REQUIRE) {
      expect(kcore.available()).toBe(true)
      expect(kcore.backend()).not.toBeNull()
    } else if ((process.env.KNISHIO_KCORE ?? '').toLowerCase() === 'off') {
      expect(kcore.available()).toBe(false)
      expect(kcore.backend()).toBeNull()
    }
  })

  it('covers all 16 cases', () => {
    expect(cases).toHaveLength(16)
    expect(new Set(cases.map(c => c.name)).size).toBe(16)
  })

  it.each(cases)('$name verifies (molecular hash and OTS)', (vector) => {
    const molecule = parse(vector.molecule)
    const check = new CheckMolecule(molecule)
    expect(molecule.molecularHash, vector.name).toBe(vector.expected.molecularHash)
    expect(check.molecularHash(), vector.name).toBe(true)
    expect(check.ots(), vector.name).toBe(true)
  })

  it.each(cases)('$name re-signs to the expected hash and fragments', (vector) => {
    const { secret, sourceToken, sourcePosition, otsVersion } = vector
    if (REQUIRE) {
      // kcore takes this signing key's shape, so sign() below runs its chains in kcore, not the fallback
      const key = Wallet.generateKey({ secret, token: sourceToken, position: sourcePosition, otsVersion })
      expect(kcore.chainsHex(key, new Array<number>(key.length / 128).fill(0)), vector.name).toBe(key)
    }
    const molecule = parse(vector.molecule)
    molecule.secret = secret
    molecule.sourceWallet = new Wallet({ secret, token: sourceToken, position: sourcePosition, otsVersion })
    // Drop the parsed fragments so every compared byte comes from this sign()
    molecule.atoms.forEach((atom) => { atom.otsFragment = null })
    molecule.sign()
    expect(molecule.molecularHash, vector.name).toBe(vector.expected.molecularHash)
    expect(molecule.atoms.map(atom => atom.otsFragment), vector.name).toEqual(vector.expected.otsFragments)
  })
})
