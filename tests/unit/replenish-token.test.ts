/**
 * Wallet.getTokenUnits and Molecule.replenishToken.
 *
 * Before 0.9.6, getTokenUnits returned its raw input and Molecule.replenishToken did not exist —
 * KnishIOClient.replenishToken silently delegated to requestTokens, submitting a different
 * molecule type. Both are now faithful ports of the JavaScript SDK (Wallet.js:190-196,
 * Molecule.js:521-566).
 *
 * The digest below was produced by BOTH this SDK and the JavaScript SDK from identical pinned
 * inputs (see the 0.9.6 cross-SDK parity check) and is pasted in deliberately.
 */
import { describe, it, expect } from 'vitest'
import Atom from '../../src/core/Atom'
import Molecule from '../../src/core/Molecule'
import TokenUnit from '../../src/core/TokenUnit'
import Wallet from '../../src/core/Wallet'
import { generateSecret } from '../../src/libraries/crypto'
import NegativeAmountException from '../../src/exception/NegativeAmountException'

const SEED = 'parity-probe-fixed-seed'
const TOKEN = 'TEST'
const SOURCE_POSITION = '1'.repeat(64)
const REMAINDER_POSITION = '2'.repeat(64)
const FIXED_CREATED_AT = '1700000000000'

const buildWallets = () => {
  const secret = generateSecret(SEED)
  const source = new Wallet({ secret, token: TOKEN, position: SOURCE_POSITION })
  const remainder = new Wallet({ secret, token: TOKEN, position: REMAINDER_POSITION })
  return { secret, source, remainder }
}

describe('Wallet.getTokenUnits returns TokenUnit instances', () => {
  it('maps raw tuples through TokenUnit.createFromDB', () => {
    const units = Wallet.getTokenUnits([
      ['u1', 'Unit One'],
      ['u2', 'Unit Two', { color: 'red' }]
    ])

    expect(units).toHaveLength(2)
    expect(units.every(unit => unit instanceof TokenUnit)).toBe(true)
    expect(units[0]!.id).toBe('u1')
    expect(units[0]!.name).toBe('Unit One')
    expect(units[0]!.metas).toEqual({})
    expect(units[1]!.metas).toEqual({ color: 'red' })
  })

  it('serialises to objects, not arrays — the shape that reaches hashed atom meta', () => {
    // AtomMeta.setAtomWallet does JSON.stringify(wallet.getTokenUnitsData()), so a raw tuple
    // would be hashed as ["u1","Unit One"] instead of {"id":...,"name":...,"metas":...}.
    const serialised = JSON.parse(JSON.stringify(Wallet.getTokenUnits([['u1', 'Unit One']])))

    expect(Array.isArray(serialised[0])).toBe(false)
    expect(Object.keys(serialised[0]).sort()).toEqual(['id', 'metas', 'name'])
  })
})

describe('Molecule.replenishToken builds two V-atoms', () => {
  it('sets source to the replenished amount and remainder to the sum', () => {
    const { secret, source, remainder } = buildWallets()
    source.balance = '5'

    const molecule = new Molecule({ secret, sourceWallet: source, remainderWallet: remainder, cellSlug: 'test' })
    molecule.replenishToken({ amount: 10 })

    expect(molecule.atoms).toHaveLength(2)
    expect(molecule.atoms.every(atom => atom.isotope === 'V')).toBe(true)
    expect(molecule.atoms[0]!.value).toBe('10')
    expect(molecule.atoms[1]!.value).toBe('15')
    expect(molecule.atoms[1]!.metaType).toBe('walletBundle')
    expect(molecule.atoms[1]!.metaId).toBe(remainder.bundle)
  })

  it('rejects a negative amount', () => {
    const { secret, source, remainder } = buildWallets()
    source.balance = '5'
    const molecule = new Molecule({ secret, sourceWallet: source, remainderWallet: remainder, cellSlug: 'test' })

    expect(() => molecule.replenishToken({ amount: -1 })).toThrow(NegativeAmountException)
  })

  it('merges token units: source carries the new ones, remainder the originals plus new', () => {
    const { secret, source, remainder } = buildWallets()
    source.tokenUnits = Wallet.getTokenUnits([['existing', 'Existing Unit']])
    source.balance = '1'

    const molecule = new Molecule({ secret, sourceWallet: source, remainderWallet: remainder, cellSlug: 'test' })
    molecule.replenishToken({ amount: 0, units: [['new1', 'New One'], ['new2', 'New Two']] })

    expect(source.tokenUnits.map((unit: TokenUnit) => unit.id)).toEqual(['new1', 'new2'])
    expect(source.balance).toBe('2')
    expect(remainder.tokenUnits.map((unit: TokenUnit) => unit.id)).toEqual(['existing', 'new1', 'new2'])
    expect(remainder.balance).toBe('3')
  })

  it('hashes its atoms to the JS SDK digest', () => {
    const { secret, source, remainder } = buildWallets()
    source.balance = '5'

    const molecule = new Molecule({ secret, sourceWallet: source, remainderWallet: remainder, cellSlug: 'test' })
    molecule.createdAt = FIXED_CREATED_AT
    molecule.replenishToken({ amount: 10 })
    for (const atom of molecule.atoms) {
      atom.createdAt = FIXED_CREATED_AT
    }

    // Produced identically by sdks/KnishIO-Client-JS from the same pinned inputs.
    expect(Atom.hashAtoms({ atoms: molecule.atoms }))
      .toBe('01a01bf0bec1e9151d0494b46g9f5dg9d58593fb3fe3g6gfag57a57b14fbf7g0')
  })
})
