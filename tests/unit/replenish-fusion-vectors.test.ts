/**
 * Token replenish (contract 9.1), stackable fusion (contract 9.2) and createToken units — verifies
 * the TS SDK against the shared canonical-patent-vectors.json (token_replenish +
 * stackable_fusion_conservation + create_token_units).
 * Siblings: JS patent-vectors.test.js, PHP/Kotlin PatentVectorValidationTest, Python/Rust
 * patent_vector tests, C/C++ self-tests.
 *
 * Replenish emits C (signed by the USER wallet; action = add; the credited wallet's address,
 * position, pubkey) then the I ContinuID atom. Fusion emits V(S -B) V(burn +(M-1)) F(+1) V(+(B-M))
 * with no I atom. createToken with units sends the C atom meta tokenUnits as compact
 * [id, name, metas] triples; it is driven through the public client over a stubbed transport.
 * Every built molecule must also pass the SDK's own check().
 *
 * Standalone-CI note: the monorepo-parent master is ABSENT in a standalone GitHub checkout. The
 * fixture is read at runtime; when it is missing this file registers one skipped test naming the
 * absent path (mirrors buffer-conservation.test.ts).
 */

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect, afterEach, vi } from 'vitest'
import KnishIOClient from '../../src/KnishIOClient'
import Atom from '../../src/core/Atom'
import Molecule from '../../src/core/Molecule'
import TokenUnit from '../../src/core/TokenUnit'
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

type CreateTokenUnitsVector = {
  name: string
  token: string
  units: string[]
  expectedCValue: string
  expectedMetaType: string
  expectedMetaId: string
  expectedTokenUnits: string
  expectedTokenUnitIds: string[]
}

type Vectors = {
  vectors: {
    token_replenish: { tests: ReplenishVector[] }
    stackable_fusion_conservation: { tests: FusionVector[] }
    create_token_units: { tests: CreateTokenUnitsVector[] }
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

const CONTINUID_POSITION = 'c0ffee0000000000c0ffee0000000000c0ffee0000000000c0ffee0000000000'

/**
 * A client whose GraphQL transport is stubbed (ContinuID query + accepted ProposeMolecule), so the
 * public createToken builds, signs and "sends" its molecule offline. Returns the token-creation
 * molecule, after asserting it was proposed exactly once.
 */
const createTokenOffline = async (params: Parameters<KnishIOClient['createToken']>[0]): Promise<Molecule> => {
  const client = new KnishIOClient({ uri: 'https://test.local/graphql', cellSlug: 'vectors', logging: false })
  client.setSecret(SECRET)
  const pointer = new Wallet({ secret: SECRET, token: 'USER', position: CONTINUID_POSITION })
  const transport = client.client()
  const mutate = vi.spyOn(transport, 'mutate').mockResolvedValue({
    data: { ProposeMolecule: { molecularHash: 'stub', status: 'accepted', reason: null, payload: null } }
  })
  vi.spyOn(transport, 'query').mockResolvedValue({
    data: {
      ContinuId: {
        address: pointer.address,
        bundleHash: client.getBundle(),
        tokenSlug: 'USER',
        position: CONTINUID_POSITION,
        batchId: null,
        characters: null,
        pubkey: null,
        amount: 0
      }
    }
  })
  const initTokenCreation = vi.spyOn(Molecule.prototype, 'initTokenCreation')

  await client.createToken(params)

  expect(initTokenCreation).toHaveBeenCalledTimes(1)
  expect(mutate).toHaveBeenCalledTimes(1)
  const molecule = initTokenCreation.mock.contexts[0]
  if (!(molecule instanceof Molecule)) {
    throw new Error('createToken did not build its molecule through Molecule.initTokenCreation')
  }
  return molecule
}

/**
 * Frozen copy of vectors.create_token_units.tests. A standalone checkout (TS CI) has no
 * ../shared-test-results, so these cases run from this copy; in the monorepo the copy is pinned
 * equal to the master below, so it cannot drift.
 */
const CREATE_TOKEN_UNITS_TESTS: CreateTokenUnitsVector[] = [
  { name: 'ids_to_triples', token: 'CRTSTK', units: ['U1', 'U2', 'U3'], expectedCValue: '3', expectedMetaType: 'token', expectedMetaId: 'CRTSTK', expectedTokenUnits: '[["U1","U1",{}],["U2","U2",{}],["U3","U3",{}]]', expectedTokenUnitIds: ['U1', 'U2', 'U3'] },
  { name: 'single_id', token: 'CRTONE', units: ['solo'], expectedCValue: '1', expectedMetaType: 'token', expectedMetaId: 'CRTONE', expectedTokenUnits: '[["solo","solo",{}]]', expectedTokenUnitIds: ['solo'] }
]

describe('create_token_units', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(CREATE_TOKEN_UNITS_TESTS)('createToken $name: C atom tokenUnits are [id, name, metas] triples', async (vector) => {
    const molecule = await createTokenOffline({
      token: vector.token,
      amount: null,
      meta: { fungibility: 'stackable' },
      units: vector.units
    })
    expect(molecule.check()).toBe(true)

    const cAtom = molecule.atoms[0]!
    expect(cAtom.isotope).toBe('C')
    expect(cAtom.value).toBe(vector.expectedCValue)
    expect(cAtom.metaType).toBe(vector.expectedMetaType)
    expect(cAtom.metaId).toBe(vector.expectedMetaId)
    // Byte-exact cross-SDK form: the same literal in all eight SDKs
    expect(cAtom.aggregatedMeta().tokenUnits).toBe(vector.expectedTokenUnits)
    expect(unitIds(cAtom)).toEqual(vector.expectedTokenUnitIds)
  })

  it('keeps a triple or TokenUnit input\'s own name and metas, in caller order', async () => {
    const molecule = await createTokenOffline({
      token: 'CRTTRI',
      meta: { fungibility: 'stackable' },
      units: [['X1', 'Name X', { k: 'v' }], ['X2'], new TokenUnit('X3', 'Name 3')]
    })
    expect(molecule.check()).toBe(true)

    const cAtom = molecule.atoms[0]!
    expect(cAtom.value).toBe('3')
    expect(cAtom.aggregatedMeta().tokenUnits).toBe('[["X1","Name X",{"k":"v"}],["X2","X2",{}],["X3","Name 3",{}]]')
  })
})

if (!fixture) {
  it.skip('replenish-fusion-vectors.test.ts: master-vector families skipped — ../shared-test-results/canonical-patent-vectors.json not found (standalone checkout); create_token_units runs from its frozen copy', () => {})
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

  it('create_token_units: the frozen copy above equals the master vectors', () => {
    expect(vectors.create_token_units.tests).toEqual(CREATE_TOKEN_UNITS_TESTS)
  })
}
