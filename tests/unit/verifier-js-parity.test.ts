/**
 * Verifier behaviour that must match the JS reference (CheckMolecule.js):
 * - the exported verifyOTSSignature takes the base17 molecular hash a molecule is signed over,
 *   uncompressed or base64-compressed fragments, OTS v1 and v2;
 * - fromServerData keeps a null object-meta value null, so it is not hashed as "null";
 * - isotopeV without a sender wallet rejects a V-only molecule that leaves a remainder and does
 *   not reject a balanced cross-isotope (B/F) molecule.
 */
import { describe, it, expect } from 'vitest'
import Atom from '../../src/core/Atom'
import Molecule from '../../src/core/Molecule'
import Wallet from '../../src/core/Wallet'
import CheckMolecule from '../../src/libraries/CheckMolecule'
import TransferRemainderException from '../../src/exception/TransferRemainderException'
import {
  convertToBase17,
  generateSecret,
  isSignableMolecularHash,
  validateMolecularHashForSignature,
  verifyOTSSignature
} from '../../src/libraries/crypto'

const SECRET = generateSecret('verifier-js-parity')

const signedMeta = (otsVersion: 1 | 2, compressed: boolean, meta: Record<string, unknown> = { note: 'x' }): Molecule => {
  const sourceWallet = new Wallet({ secret: SECRET, token: 'USER', position: 'aa'.repeat(32), otsVersion })
  const remainderWallet = new Wallet({ secret: SECRET, token: 'USER', position: 'bb'.repeat(32), otsVersion })
  const molecule = new Molecule({ secret: SECRET, sourceWallet, remainderWallet, cellSlug: 'parity' })
  molecule.initMeta({ meta, metaType: 'parity', metaId: 'one' })
  molecule.sign({ compressed })
  return molecule
}

describe('verifyOTSSignature', () => {
  it.each([
    [1, false],
    [1, true],
    [2, false],
    [2, true]
  ] as const)('accepts the base17 hash of a molecule signed at OTS v%s (compressed %s)', (otsVersion, compressed) => {
    const molecule = signedMeta(otsVersion, compressed)
    const ots = molecule.atoms.map(atom => atom.otsFragment).join('')
    const address = molecule.atoms[0]!.walletAddress!

    expect(isSignableMolecularHash(molecule.molecularHash)).toBe(true)
    expect(verifyOTSSignature(ots, molecule.molecularHash!, address)).toBe(true)
    // A different signer's address never verifies
    expect(verifyOTSSignature(ots, molecule.molecularHash!, 'f'.repeat(64))).toBe(false)
  })

  it('accepts a molecular hash containing g', () => {
    let molecule = signedMeta(1, false)
    for (let i = 0; i < 20 && !molecule.molecularHash!.includes('g'); i++) {
      molecule = signedMeta(1, false, { note: `x${i}` })
    }
    expect(molecule.molecularHash).toContain('g')
    const ots = molecule.atoms.map(atom => atom.otsFragment).join('')
    expect(verifyOTSSignature(ots, molecule.molecularHash!, molecule.atoms[0]!.walletAddress!)).toBe(true)
  })

  it('validateMolecularHashForSignature accepts exactly what signing accepts', () => {
    expect(validateMolecularHashForSignature('g'.repeat(64))).toBe(true)
    expect(validateMolecularHashForSignature('0'.repeat(64))).toBe(true)
    expect(validateMolecularHashForSignature('G'.repeat(64))).toBe(false)
    expect(validateMolecularHashForSignature('h'.repeat(64))).toBe(false)
    expect(validateMolecularHashForSignature('0'.repeat(63))).toBe(false)
    expect(validateMolecularHashForSignature(convertToBase17('ab'.repeat(32)))).toBe(true)
  })
})

describe('CheckMolecule.fromServerData', () => {
  it('verifies an object-meta molecule with a null value', () => {
    const molecule = signedMeta(1, false, { note: 'x', empty: null })
    expect(molecule.atoms[0]!.meta.some(item => item.value === null)).toBe(true)
    molecule.check()

    const served = {
      molecularHash: molecule.molecularHash,
      bundleHash: molecule.bundle ?? molecule.sourceWallet!.bundle,
      cellSlug: molecule.cellSlug,
      createdAt: molecule.createdAt,
      atoms: molecule.atoms.map(atom => ({
        position: atom.position,
        walletAddress: atom.walletAddress,
        isotope: atom.isotope,
        tokenSlug: atom.token,
        value: atom.value,
        batchId: atom.batchId,
        metaType: atom.metaType,
        metaId: atom.metaId,
        metasJson: JSON.stringify(Object.fromEntries(atom.meta.map(item => [item.key, item.value]))),
        index: atom.index,
        otsFragment: atom.otsFragment,
        createdAt: atom.createdAt
      }))
    }

    expect(CheckMolecule.verifyFromServerData(served)).toMatchObject({ verified: true, error: null })
  })
})

describe('CheckMolecule.isotopeV without a sender wallet', () => {
  const wallet = (position: string, token = 'TEST') => new Wallet({ secret: SECRET, token, position })

  const build = (atoms: Array<[string, Wallet, number]>): CheckMolecule => {
    const molecule = new Molecule({ secret: SECRET })
    for (const [isotope, w, value] of atoms) {
      molecule.addAtom(Atom.create({ isotope: isotope as 'V', wallet: w, value }))
    }
    molecule.molecularHash = '0'.repeat(64)
    return new CheckMolecule(molecule as never)
  }

  it('rejects a balanced V-only molecule that leaves a remainder', () => {
    const check = build([['V', wallet('aa'.repeat(32)), -10], ['V', wallet('bb'.repeat(32)), 4], ['V', wallet('cc'.repeat(32)), 6]])
    expect(() => check.isotopeV(null)).toThrow(TransferRemainderException)
  })

  it('accepts a balanced V-only molecule whose last V atom is zero', () => {
    const check = build([['V', wallet('aa'.repeat(32)), -10], ['V', wallet('bb'.repeat(32)), 10], ['V', wallet('cc'.repeat(32)), 0]])
    expect(check.isotopeV(null)).toBe(true)
  })

  it('accepts a balanced cross-isotope (B) molecule', () => {
    const check = build([['V', wallet('aa'.repeat(32)), -10], ['B', wallet('bb'.repeat(32)), 4], ['V', wallet('cc'.repeat(32)), 6]])
    expect(check.isotopeV(null)).toBe(true)
  })
})
