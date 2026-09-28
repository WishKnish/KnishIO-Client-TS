/**
 * Token replenish (contract 9.1) and stackable fusion (contract 9.2) — verifies the TS SDK against
 * the shared canonical-patent-vectors.json (token_replenish + stackable_fusion_conservation).
 * Siblings: JS patent-vectors.test.js, PHP/Kotlin PatentVectorValidationTest, Python/Rust
 * patent_vector tests, C/C++ self-tests.
 *
 * Replenish emits C (signed by the USER wallet; action = add; the credited wallet's address,
 * position, pubkey) then the I ContinuID atom. Fusion emits V(S -B) V(burn +(M-1)) F(+1) V(+(B-M))
 * with no I atom. Every built molecule must also pass the SDK's own check().
 *
 * Standalone-CI note: the monorepo-parent master is ABSENT in a standalone GitHub checkout. The
 * fixture is read at runtime; when it is missing this file registers one skipped test naming the
 * absent path (mirrors buffer-conservation.test.ts).
 */

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'
import Atom from '../../src/core/Atom'
import Molecule from '../../src/core/Molecule'
import Wallet from '../../src/core/Wallet'
import { NegativeAmountException, StackableUnitAmountException, TransferBalanceException } from '../../src/exception'

const SECRET = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
const ZERO_BUNDLE = '0'.repeat(64)

type ReplenishVector = {
  name: string
  token: string
  amount: number | null
  units: Array<[string, string, Record<string, unknown>]>
  expectedIsotopes: string[]
  expectedCValue: string
  expectedMetaType: string
  expectedMetaId: string
  expectedAction: string
  expectedTokenUnitIds: string[] | null
}

type FusionVector = {
  name: string
  sourceUnits: string[]
  fuse: string[]
  newUnitId: string
  mustReject?: boolean
  expectedErrorContains?: string
  expectedIsotopes?: string[]
  expectedSourceValue?: string
  expectedSourceUnitIds?: string[]
  expectedBurnValue?: string
  expectedFusionValue?: string
  expectedRemainderValue?: string
  expectedBurnUnitIds?: string[]
  expectedRemainderUnitIds?: string[]
  expectedFusedTokenUnitIds?: string[]
  expectedSum?: string
}

type Vectors = {
  vectors: {
    token_replenish: { tests: ReplenishVector[] }
    stackable_fusion_conservation: { tests: FusionVector[] }
  }
}

const FIXTURE = resolve(__dirname, '../../../shared-test-results/canonical-patent-vectors.json')
const fixture: Vectors | null = existsSync(FIXTURE) ? JSON.parse(readFileSync(FIXTURE, 'utf8')) : null

/** Unit ids carried by an atom's tokenUnits meta; an absent meta is an empty list. */
const unitIds = (atom: Atom): string[] => {
  const raw = atom.aggregatedMeta().tokenUnits
  if (!raw) {
    return []
  }
  const units: Array<[string]> = JSON.parse(raw)
  return units.map(unit => unit[0])
}

const stackableSource = (ids: string[], batchId: string | null = null): Wallet => {
  const source = Wallet.create({ secret: SECRET, token: 'FUSETOK', batchId })
  source.tokenUnits = Wallet.getTokenUnits(ids.map(id => [id, id, {}]))
  source.balance = String(ids.length)
  return source
}

if (!fixture) {
  it.skip('replenish-fusion-vectors.test.ts: skipped — ../shared-test-results/canonical-patent-vectors.json not found (standalone checkout)', () => {})
} else {
  const vectors = fixture.vectors

  describe('token_replenish', () => {
    it.each(vectors.token_replenish.tests)('replenish $name: C(action add) + I, signed by USER', (vector) => {
      const userWallet = Wallet.create({ secret: SECRET, token: 'USER' })
      const creditedWallet = Wallet.create({ secret: SECRET, token: vector.token })
      const molecule = new Molecule({ secret: SECRET, sourceWallet: userWallet, cellSlug: 'vectors' })

      molecule.replenishToken({ creditedWallet, amount: vector.amount, units: vector.units })
      molecule.sign({})
      expect(molecule.check()).toBe(true)

      expect(molecule.atoms.map(atom => atom.isotope)).toEqual(vector.expectedIsotopes)
      const cAtom = molecule.atoms[0]!
      expect(cAtom.token).toBe('USER')
      expect(cAtom.position).toBe(userWallet.position)
      expect(cAtom.value).toBe(vector.expectedCValue)
      expect(cAtom.metaType).toBe(vector.expectedMetaType)
      expect(cAtom.metaId).toBe(vector.expectedMetaId)

      // Metas in contract order: action, then the credited wallet, then (stackable) the new units
      const expectedKeys = ['action', 'address', 'position', 'pubkey', ...(vector.expectedTokenUnitIds ? ['tokenUnits'] : [])]
      expect(cAtom.meta.map(item => item.key)).toEqual(expectedKeys)
      const metas = cAtom.aggregatedMeta()
      expect(metas.action).toBe(vector.expectedAction)
      expect(metas.address).toBe(creditedWallet.address)
      expect(metas.position).toBe(creditedWallet.position)
      expect(metas.pubkey).toBe(creditedWallet.pubkey)
      if (vector.expectedTokenUnitIds) {
        expect(unitIds(cAtom)).toEqual(vector.expectedTokenUnitIds)
        // Compact [id, name, metas] triples exactly as JSON.stringify produces them
        expect(metas.tokenUnits).toBe(JSON.stringify(vector.units))
      } else {
        expect(metas.tokenUnits).toBeUndefined()
      }
    })

    it('carries the credited wallet batch id on the atom and as the batchId meta after pubkey', () => {
      const userWallet = Wallet.create({ secret: SECRET, token: 'USER' })
      const creditedWallet = Wallet.create({ secret: SECRET, token: 'REPLTOK', batchId: 'batch-credit-1' })
      const molecule = new Molecule({ secret: SECRET, sourceWallet: userWallet, cellSlug: 'vectors' })

      molecule.replenishToken({ creditedWallet, amount: 5 })

      expect(molecule.atoms[0]!.batchId).toBe('batch-credit-1')
      expect(molecule.atoms[0]!.meta.map(item => item.key)).toEqual(['action', 'address', 'position', 'pubkey', 'batchId'])
    })

    it('rejects a non-positive amount and a unit-less replenish of a stackable wallet', () => {
      const userWallet = Wallet.create({ secret: SECRET, token: 'USER' })
      const fungible = Wallet.create({ secret: SECRET, token: 'REPLTOK' })
      const build = () => new Molecule({ secret: SECRET, sourceWallet: userWallet, cellSlug: 'vectors' })

      expect(() => build().replenishToken({ creditedWallet: fungible, amount: 0 })).toThrow(NegativeAmountException)
      expect(() => build().replenishToken({ creditedWallet: fungible, amount: -1 })).toThrow(NegativeAmountException)
      expect(() => build().replenishToken({ creditedWallet: stackableSource(['S1']), amount: 3 })).toThrow(StackableUnitAmountException)
      expect(() => build().replenishToken({ creditedWallet: fungible, amount: 3, units: [['R1', 'R1', {}]] })).toThrow(StackableUnitAmountException)
    })
  })

  describe('stackable_fusion_conservation', () => {
    const accepted = vectors.stackable_fusion_conservation.tests.filter(vector => !vector.mustReject)
    const rejected = vectors.stackable_fusion_conservation.tests.filter(vector => vector.mustReject)

    it.each(accepted)('fuse $name: V V F V conserves and passes check()', (vector) => {
      const source = stackableSource(vector.sourceUnits)
      const recipient = Wallet.create({ secret: SECRET, token: 'FUSETOK' })
      const molecule = new Molecule({ secret: SECRET, sourceWallet: source, cellSlug: 'vectors' })

      molecule.fuseToken({ fusedTokenUnitIds: vector.fuse, newTokenUnit: vector.newUnitId, recipientWallet: recipient })
      molecule.sign({})
      expect(molecule.check(source)).toBe(true)

      expect(molecule.atoms.map(atom => atom.isotope)).toEqual(vector.expectedIsotopes)
      const [sourceAtom, burnAtom, fusionAtom, remainderAtom] = molecule.atoms as [Atom, Atom, Atom, Atom]

      expect(sourceAtom.walletAddress).toBe(source.address)
      expect(sourceAtom.value).toBe(vector.expectedSourceValue)
      expect(unitIds(sourceAtom)).toEqual(vector.expectedSourceUnitIds)

      expect(burnAtom.value).toBe(vector.expectedBurnValue)
      expect([burnAtom.metaType, burnAtom.metaId]).toEqual(['walletBundle', ZERO_BUNDLE])
      expect(unitIds(burnAtom)).toEqual(vector.expectedBurnUnitIds)

      expect(fusionAtom.value).toBe(vector.expectedFusionValue)
      expect([fusionAtom.metaType, fusionAtom.metaId]).toEqual(['walletBundle', recipient.bundle])
      expect(fusionAtom.walletAddress).toBe(recipient.address)
      // Compact triples exactly as JSON.stringify produces them, fused units in caller order
      expect(fusionAtom.aggregatedMeta().tokenUnits).toBe(JSON.stringify([
        [vector.newUnitId, vector.newUnitId, { fusedTokenUnits: vector.expectedFusedTokenUnitIds!.map(id => [id, id, {}]) }]
      ]))

      expect(remainderAtom.value).toBe(vector.expectedRemainderValue)
      expect([remainderAtom.metaType, remainderAtom.metaId]).toEqual(['walletBundle', source.bundle])
      expect(remainderAtom.position).not.toBe(source.position)
      expect(unitIds(remainderAtom)).toEqual(vector.expectedRemainderUnitIds)

      const sum = [sourceAtom, burnAtom, fusionAtom, remainderAtom].reduce((total, atom) => total + BigInt(atom.value ?? '0'), 0n)
      expect(sum.toString()).toBe(vector.expectedSum)
      expect(molecule.getIsotopes('I')).toHaveLength(0)
    })

    it.each(rejected)('fuse $name: refused client-side', (vector) => {
      const molecule = new Molecule({ secret: SECRET, sourceWallet: stackableSource(vector.sourceUnits), cellSlug: 'vectors' })
      const recipient = Wallet.create({ secret: SECRET, token: 'FUSETOK' })

      expect(() => molecule.fuseToken({ fusedTokenUnitIds: vector.fuse, newTokenUnit: vector.newUnitId, recipientWallet: recipient }))
        .toThrow(vector.expectedErrorContains!)
      expect(molecule.atoms).toHaveLength(0)
    })

    it('a batch-bearing source: fresh batch ids on burn and F, the source batch id on the remainder', () => {
      const source = stackableSource(['U1', 'U2', 'U3'], 'batch-source-1')
      const recipient = Wallet.create({ secret: SECRET, token: 'FUSETOK' })
      const molecule = new Molecule({ secret: SECRET, sourceWallet: source, cellSlug: 'vectors' })

      molecule.fuseToken({ fusedTokenUnitIds: ['U1', 'U2'], newTokenUnit: 'FUSED', recipientWallet: recipient })
      molecule.sign({})
      expect(molecule.check(source)).toBe(true)

      const [sourceAtom, burnAtom, fusionAtom, remainderAtom] = molecule.atoms as [Atom, Atom, Atom, Atom]
      expect(sourceAtom.batchId).toBe('batch-source-1')
      expect(remainderAtom.batchId).toBe('batch-source-1')
      expect(burnAtom.batchId).toBeTruthy()
      expect(fusionAtom.batchId).toBeTruthy()
      expect(new Set([sourceAtom.batchId, burnAtom.batchId, fusionAtom.batchId]).size).toBe(3)
    })

    it('refuses an unknown unit id and a new unit id the source already holds', () => {
      const recipient = Wallet.create({ secret: SECRET, token: 'FUSETOK' })
      const build = () => new Molecule({ secret: SECRET, sourceWallet: stackableSource(['U1', 'U2', 'U3']), cellSlug: 'vectors' })

      expect(() => build().fuseToken({ fusedTokenUnitIds: ['U1', 'U9'], newTokenUnit: 'FUSED', recipientWallet: recipient }))
        .toThrow(TransferBalanceException)
      expect(() => build().fuseToken({ fusedTokenUnitIds: ['U1', 'U2'], newTokenUnit: 'U3', recipientWallet: recipient }))
        .toThrow('Token fusion unit id already exists in the source wallet')
    })
  })
}
