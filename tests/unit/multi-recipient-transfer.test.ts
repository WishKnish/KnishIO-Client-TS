/**
 * Multi-recipient stackable transfer builder (cycle 95)
 *
 * Offline proof that Wallet.splitUnitsMulti + Molecule.initValues build a conserving,
 * N-recipient stackable transfer molecule that passes the client-side V-isotope check.
 * The live per-unit-routing proof is in the cross-SDK gauntlet (docs/...-2026-06-18.md).
 */
import { describe, it, expect } from 'vitest'
import Wallet from '../../src/core/Wallet'
import Molecule from '../../src/core/Molecule'
import TokenUnit from '../../src/core/TokenUnit'
import CheckMolecule from '../../src/libraries/CheckMolecule'
import { generateSecret } from '../../src/libraries/crypto'

const TOKEN = 'TEST'
const R1_BUNDLE = 'a'.repeat(64)
const R2_BUNDLE = 'b'.repeat(64)

const buildSource = (secret: string): Wallet => {
  const source = new Wallet({ secret, token: TOKEN })
  source.balance = '3'
  source.tokenUnits = [
    new TokenUnit('u1', 'Unit One'),
    new TokenUnit('u2', 'Unit Two'),
    new TokenUnit('u3', 'Unit Three')
  ]
  return source
}

describe('Multi-recipient stackable transfer (cycle 95)', () => {
  const secret = generateSecret('mr-test-seed')

  it('splitUnitsMulti partitions N-way: source=SENT union, each recipient=subset, remainder=KEPT', () => {
    const source = buildSource(secret)
    const r1 = Wallet.create({ bundle: R1_BUNDLE, token: TOKEN })
    const r2 = Wallet.create({ bundle: R2_BUNDLE, token: TOKEN })
    const remainder = source.createRemainder(secret)

    source.splitUnitsMulti([['u1'], ['u2']], [r1, r2], remainder)

    expect(source.tokenUnits.map(u => u.id).sort()).toEqual(['u1', 'u2']) // SENT union
    expect(r1.tokenUnits.map(u => u.id)).toEqual(['u1'])
    expect(r2.tokenUnits.map(u => u.id)).toEqual(['u2'])
    expect(remainder.tokenUnits.map(u => u.id)).toEqual(['u3']) // KEPT
  })

  it('splitUnitsMulti is a no-op when no units are sent (fungible)', () => {
    const source = buildSource(secret)
    const r1 = Wallet.create({ bundle: R1_BUNDLE, token: TOKEN })
    const remainder = source.createRemainder(secret)

    source.splitUnitsMulti([[]], [r1], remainder)

    expect(source.tokenUnits.map(u => u.id)).toEqual(['u1', 'u2', 'u3']) // untouched
  })

  it('initValues builds a conserving 4-atom molecule that passes isotopeV', () => {
    const source = buildSource(secret)
    const r1 = Wallet.create({ bundle: R1_BUNDLE, token: TOKEN })
    const r2 = Wallet.create({ bundle: R2_BUNDLE, token: TOKEN })
    const remainder = source.createRemainder(secret)

    source.splitUnitsMulti([['u1'], ['u2']], [r1, r2], remainder)

    const molecule = new Molecule({ secret, sourceWallet: source, remainderWallet: remainder, cellSlug: 'test' })
    molecule.initValues({ recipientWallets: [r1, r2], amounts: [1, 1] })

    // 1 source + 2 recipients + 1 remainder = 4 V-atoms
    expect(molecule.atoms.length).toBe(4)
    expect(molecule.atoms.every(a => a.isotope === 'V')).toBe(true)

    // Conservation: -3 + 1 + 1 + 1 === 0
    const sum = molecule.atoms.reduce((acc, a) => acc + Number(a.value ?? 0), 0)
    expect(sum).toBe(0)

    // Source atom (value < 0) carries the SENT union of token units as meta
    const sourceAtom = molecule.atoms.find(a => Number(a.value) < 0)!
    const sourceMetaJson = JSON.stringify(sourceAtom.meta ?? [])
    expect(sourceMetaJson).toContain('u1')
    expect(sourceMetaJson).toContain('u2')

    // Sign (sets the molecular hash CheckMolecule's constructor requires), then assert the
    // client-side V-isotope check passes (conservation + full-drain + no self-transfer)
    molecule.sign({})
    expect(new CheckMolecule(molecule).isotopeV(source)).toBe(true)
  })
})
