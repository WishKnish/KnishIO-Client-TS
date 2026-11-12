/**
 * Signed atoms that must equal the JS reference byte for byte: requestTokens, burnTokens,
 * TokenUnit.createFromGraphQL and Molecule.fuseToken.
 *
 * Each digest literal below is Atom.hashAtoms over the molecule's atoms, every atom's createdAt
 * set to '1700000000000', positions drawn in order from a fixed queue. The same scenario run
 * against the JS SDK (KnishIOClient-JS dist, KNISHIO_KCORE=off) printed the same digests.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import KnishIOClient from '../../src/KnishIOClient'
import Atom from '../../src/core/Atom'
import Molecule from '../../src/core/Molecule'
import Wallet from '../../src/core/Wallet'
import TokenUnit from '../../src/core/TokenUnit'
import MutationProposeMolecule from '../../src/mutation/MutationProposeMolecule'
import { BatchIdException, StackableUnitAmountException } from '../../src/exception'
import { generateBundleHash, generateSecret } from '../../src/libraries/crypto'

const CREATED_AT = '1700000000000'
const POS = (c: string): string => c.repeat(64)
const SECRET = generateSecret('fleet-audit-2026-11')
const OTHER = generateSecret('fleet-audit-2026-11-other')

const digest = (atoms: Atom[]): string => {
  for (const atom of atoms) atom.createdAt = CREATED_AT
  return Atom.hashAtoms({ atoms })
}

const positions = (...queue: string[]) => {
  const original = Wallet.generatePosition.bind(Wallet)
  vi.spyOn(Wallet, 'generatePosition').mockImplementation(() => queue.shift() ?? original())
}

/**
 * A client whose transport is replaced: the ContinuID pointer is at 'aa'x32, QueryToken answers
 * with the given fungibility, and molecule mutations are captured instead of sent.
 */
const makeClient = (fungibility = 'fungible') => {
  const client = new KnishIOClient({ uri: 'https://probe.invalid/graphql', cellSlug: 'probe', logging: false, otsVersion: 1 })
  client.setSecret(SECRET)
  const captured: Molecule[] = []
  vi.spyOn(client, 'queryContinuId').mockResolvedValue({
    payload: () => new Wallet({ secret: SECRET, token: 'USER', position: POS('a'), otsVersion: 1 })
  } as never)
  vi.spyOn(client, 'executeQuery').mockImplementation(async (query, variables) => {
    // The built molecule itself (protected on the mutation), not its GraphQL input form
    const molecule: unknown = query instanceof MutationProposeMolecule ? Reflect.get(query, '$__molecule') : null
    if (molecule instanceof Molecule) {
      captured.push(molecule)
      return { success: () => true, payload: () => null, data: () => null } as never
    }
    return { data: () => [{ slug: variables?.slug ?? 'TEST', fungibility }], payload: () => null, success: () => true } as never
  })
  return { client, captured }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('requestTokens', () => {
  it('requests for this bundle when `to` is omitted (walletBundle / own bundle)', async () => {
    positions(POS('b'), POS('c'), POS('d'))
    const { client, captured } = makeClient()
    await client.requestTokens({ token: 'TEST', amount: 25 })

    const tAtom = captured[0]!.atoms[0]!
    expect([tAtom.isotope, tAtom.metaType, tAtom.metaId, tAtom.value]).toEqual(['T', 'walletBundle', generateBundleHash(SECRET), '25'])
    expect(digest(captured[0]!.atoms)).toBe('05g0bde7b9439f307d078bedb65765dad3gf1a9e2e565bc8ggg0912649200a4f')
  })

  it('requests for a bundle hash', async () => {
    positions(POS('b'), POS('c'), POS('d'))
    const { client, captured } = makeClient()
    await client.requestTokens({ token: 'TEST', to: generateBundleHash(OTHER), amount: 25 })

    expect(digest(captured[0]!.atoms)).toBe('02e0bb0e507d185f294662eadce1d042ce2g2eg393g6350289cc70fb428d1f3a')
  })

  it('requests for a Wallet (metaType wallet, position and bundle metas)', async () => {
    positions(POS('b'), POS('c'), POS('d'))
    const { client, captured } = makeClient()
    const to = new Wallet({ secret: OTHER, token: 'TEST', position: POS('c'), otsVersion: 1 })
    await client.requestTokens({ token: 'TEST', to, amount: 25 })

    const tAtom = captured[0]!.atoms[0]!
    expect([tAtom.metaType, tAtom.metaId]).toEqual(['wallet', to.address])
    expect(digest(captured[0]!.atoms)).toBe('043e097g96eb0gaa5452ggegd2e581agg60e8d67456f8069420012bd93db614a')
  })

  it('requests stackable units: amount is the unit count, tokenUnits meta, batch id', async () => {
    positions(POS('b'), POS('c'), POS('d'))
    const { client, captured } = makeClient('stackable')
    await client.requestTokens({ token: 'TEST', units: ['u1', 'u2'], batchId: 'batch-1' })

    const tAtom = captured[0]!.atoms[0]!
    expect([tAtom.value, tAtom.batchId, tAtom.aggregatedMeta().tokenUnits]).toEqual(['2', 'batch-1', '["u1","u2"]'])
    expect(digest(captured[0]!.atoms)).toBe('024f05917a2eb237fa24e610cg03gc896fc865c0635f4a0b939eg3fbf73c4f75')
  })

  it('generates a batch id for a stackable token and refuses one for any other', async () => {
    const stackable = makeClient('stackable')
    await stackable.client.requestTokens({ token: 'TEST', amount: 1 })
    expect(stackable.captured[0]!.atoms[0]!.batchId).toMatch(/^[0-9a-f]{64}$/)

    const fungible = makeClient()
    await expect(fungible.client.requestTokens({ token: 'TEST', amount: 1, batchId: 'batch-1' })).rejects.toThrow(BatchIdException)
    await expect(fungible.client.requestTokens({ token: 'TEST', amount: 1, units: ['u1'] })).rejects.toThrow(StackableUnitAmountException)
  })
})

describe('burnTokens', () => {
  it('burns an amount through Molecule.burnToken (burn atom has no position or address)', async () => {
    positions(POS('c'), POS('d'), POS('e'))
    const { client, captured } = makeClient()
    const sourceWallet = new Wallet({ secret: SECRET, token: 'TEST', position: POS('b'), otsVersion: 1 })
    sourceWallet.balance = '100'
    await client.burnTokens({ token: 'TEST', amount: 10, sourceWallet })

    const atoms = captured[0]!.atoms
    expect(atoms.map(atom => [atom.isotope, atom.value])).toEqual([['V', '-100'], ['V', '10'], ['V', '90']])
    expect([atoms[1]!.position, atoms[1]!.walletAddress]).toEqual([null, null])
    expect(digest(atoms)).toBe('0059244b74fd194g1925163c90d1e694c2c3ff1d457c0beec85d00219b2ggdg2')
  })

  it('burns stackable units, splitting them between source and remainder', async () => {
    positions(POS('c'), POS('d'), POS('e'))
    const { client, captured } = makeClient()
    const sourceWallet = new Wallet({ secret: SECRET, token: 'TEST', position: POS('b'), otsVersion: 1 })
    sourceWallet.balance = '2'
    sourceWallet.tokenUnits = Wallet.getTokenUnits([['u1', 'U1', {}], ['u2', 'U2', { k: 'v' }]])
    await client.burnTokens({ token: 'TEST', units: ['u1'], sourceWallet })

    expect(captured[0]!.atoms.map(atom => atom.value)).toEqual(['-2', '1', '1'])
    expect(digest(captured[0]!.atoms)).toBe('00ed90e881a125fe0c6b5315147fgcde98dd477b56aaeb9ecg4be87a87911fc7')
  })
})

describe('TokenUnit.createFromGraphQL', () => {
  it('parses the JSON string metas the validator serves', () => {
    expect(TokenUnit.createFromGraphQL({ id: 'u1', name: 'U1', metas: '{"a":1}' }).metas).toEqual({ a: 1 })
    expect(TokenUnit.createFromGraphQL({ id: 'u1', name: 'U1', metas: '' }).metas).toEqual({})
    expect(TokenUnit.createFromGraphQL({ id: 'u1', name: 'U1' }).metas).toEqual({})
  })
})

describe('Molecule.fuseToken', () => {
  const fuse = (units: TokenUnit[], fusedTokenUnitIds: string[], newTokenUnit: TokenUnit | string, recipientWallet: Wallet): Molecule => {
    const sourceWallet = new Wallet({ secret: SECRET, token: 'TEST', position: POS('b'), otsVersion: 1 })
    sourceWallet.balance = '3'
    sourceWallet.tokenUnits = units
    const remainderWallet = new Wallet({ secret: SECRET, token: 'TEST', position: POS('c'), otsVersion: 1 })
    const molecule = new Molecule({ secret: SECRET, bundle: generateBundleHash(SECRET), sourceWallet, remainderWallet, cellSlug: 'probe' })
    molecule.fuseToken({ fusedTokenUnitIds, newTokenUnit, recipientWallet })
    return molecule
  }
  const recipient = () => new Wallet({ secret: SECRET, token: 'TEST', position: POS('d'), otsVersion: 1 })

  it('carries served unit metas into the fused unit', () => {
    positions(POS('e'))
    const molecule = fuse([
      TokenUnit.createFromGraphQL({ id: 'u1', name: 'U1', metas: '{"a":1}' }),
      TokenUnit.createFromGraphQL({ id: 'u2', name: 'U2', metas: '{"b":"x"}' }),
      TokenUnit.createFromGraphQL({ id: 'u3', name: 'U3', metas: '' })
    ], ['u1', 'u2'], 'N1', recipient())

    expect(digest(molecule.atoms)).toBe('033ee4a512f3f27d63416d2g22aag9g87bg764fbg402cd37343gf73040c58672')
  })

  it('keeps a TokenUnit\'s name and metas', () => {
    positions(POS('e'))
    const molecule = fuse(Wallet.getTokenUnits([['u1', 'U1', {}], ['u2', 'U2', {}], ['u3', 'U3', {}]]), ['u1', 'u3'],
      new TokenUnit('N1', 'Fused one', { color: 'red' }), recipient())

    const fAtom = molecule.atoms[2]!
    const [[id, name, metas]] = JSON.parse(fAtom.aggregatedMeta().tokenUnits as string)
    expect([id, name, metas.color]).toEqual(['N1', 'Fused one', 'red'])
    expect(digest(molecule.atoms)).toBe('04ab5953g1f73g91g72e3209cf854b05aef487e3d6a7431c5fadg702ae5c940f')
  })

  it('leaves the recipient wallet\'s batch id to the caller', () => {
    const sourceUnits = Wallet.getTokenUnits([['u1', 'U1', {}], ['u2', 'U2', {}], ['u3', 'U3', {}]])
    const recipientWallet = recipient()
    recipientWallet.batchId = 'given-batch'
    const sourceWallet = new Wallet({ secret: SECRET, token: 'TEST', position: POS('b'), batchId: 'source-batch', otsVersion: 1 })
    sourceWallet.balance = '3'
    sourceWallet.tokenUnits = sourceUnits
    const remainderWallet = new Wallet({ secret: SECRET, token: 'TEST', position: POS('c'), otsVersion: 1 })
    const molecule = new Molecule({ secret: SECRET, bundle: generateBundleHash(SECRET), sourceWallet, remainderWallet, cellSlug: 'probe' })
    molecule.fuseToken({ fusedTokenUnitIds: ['u1', 'u2'], newTokenUnit: 'N1', recipientWallet })

    expect(recipientWallet.batchId).toBe('given-batch')
    expect(molecule.atoms[2]!.batchId).toBe('given-batch')
  })

  it('KnishIOClient.fuseToken gives the recipient a fresh batch id when the source has one', async () => {
    const { client, captured } = makeClient()
    const sourceWallet = new Wallet({ secret: SECRET, token: 'TEST', position: POS('b'), batchId: 'source-batch', otsVersion: 1 })
    sourceWallet.balance = '3'
    sourceWallet.tokenUnits = Wallet.getTokenUnits([['u1', 'U1', {}], ['u2', 'U2', {}], ['u3', 'U3', {}]])
    await client.fuseToken({ bundleHash: generateBundleHash(OTHER), tokenSlug: 'TEST', newTokenUnit: 'N1', fusedTokenUnitIds: ['u1', 'u2'], sourceWallet })

    const fAtom = captured[0]!.atoms[2]!
    expect(fAtom.isotope).toBe('F')
    expect(fAtom.batchId).toMatch(/^[0-9a-f]{64}$/)
    expect(fAtom.batchId).not.toBe('source-batch')
  })
})
