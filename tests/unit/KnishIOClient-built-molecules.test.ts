/**
 * The molecules KnishIOClient builds for replenish, fusion, buffer withdraw and shadow-wallet
 * claims (contract 9.1, 9.2, 9.3, 9.6), and the pre-submit check (9.7): a built operation whose
 * molecule fails the SDK's own check() is refused client-side and never sent, while a molecule the
 * caller submits through the raw MutationProposeMolecule is sent unchanged.
 *
 * Fully offline: the GraphQL transport is stubbed (ContinuID query + ProposeMolecule mutation),
 * and the balance / wallet-list reads are stubbed on the client.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import KnishIOClient from '../../src/KnishIOClient'
import Atom from '../../src/core/Atom'
import AtomMeta from '../../src/core/AtomMeta'
import Molecule from '../../src/core/Molecule'
import Wallet from '../../src/core/Wallet'
import MutationProposeMolecule from '../../src/mutation/MutationProposeMolecule'
import { AtomsMissingException, WalletShadowException } from '../../src/exception'
import { generateBundleHash, generateSecret } from '../../src/libraries/crypto'

const CONTINUID_POSITION = 'c0ffee0000000000c0ffee0000000000c0ffee0000000000c0ffee0000000000'
const OTHER_BUNDLE = 'b'.repeat(64)

type ProposedAtom = {
  isotope: string
  token: string
  position: string | null
  walletAddress: string | null
  value: string | null
  batchId: string | null
  metaType: string | null
  metaId: string | null
  meta: { key: string, value: string | null }[]
}

let secret: string
let bundle: string
let client: KnishIOClient
let mutate: Mock

const proposedAtoms = (call = 0): ProposedAtom[] => {
  const params: { variables: { molecule: { atoms: ProposedAtom[] } } } = mutate.mock.calls[call]?.[0]
  return params.variables.molecule.atoms
}

const metaOf = (atom: ProposedAtom, key: string): string | null | undefined =>
  atom.meta.find(item => item.key === key)?.value

const stubBalance = (wallet: Wallet | null) =>
  vi.spyOn(client, 'queryBalance').mockResolvedValue({ payload: () => wallet } as never)

afterEach(() => {
  vi.restoreAllMocks()
})

beforeEach(() => {
  secret = generateSecret()
  bundle = generateBundleHash(secret)
  const pointer = new Wallet({ secret, token: 'USER', position: CONTINUID_POSITION })

  client = new KnishIOClient({ uri: 'https://test.local/graphql', cellSlug: 'test', logging: false })
  client.setSecret(secret)
  const transport = client.client()
  mutate = vi.spyOn(transport, 'mutate').mockResolvedValue({
    data: { ProposeMolecule: { molecularHash: 'stub', status: 'accepted', reason: null, payload: null } }
  }) as Mock
  vi.spyOn(transport, 'query').mockResolvedValue({
    data: {
      ContinuId: {
        address: pointer.address,
        bundleHash: bundle,
        tokenSlug: 'USER',
        position: CONTINUID_POSITION,
        batchId: null,
        characters: null,
        pubkey: null,
        amount: 0
      }
    }
  })
})

describe('replenishToken', () => {
  it('signs a C(action add) + I molecule from the USER ContinuID wallet, crediting the existing token wallet', async () => {
    const existing = Wallet.create({ secret, token: 'REPL' })
    existing.balance = '1000'
    stubBalance(existing)

    await client.replenishToken({ token: 'REPL', amount: 500 })

    const atoms = proposedAtoms()
    expect(atoms.map(atom => atom.isotope)).toEqual(['C', 'I'])
    expect([atoms[0]!.token, atoms[0]!.position, atoms[0]!.value]).toEqual(['USER', CONTINUID_POSITION, '500'])
    expect([metaOf(atoms[0]!, 'action'), metaOf(atoms[0]!, 'address'), metaOf(atoms[0]!, 'position')])
      .toEqual(['add', existing.address, existing.position])
  })

  it('credits a new wallet of the token when the identity holds none', async () => {
    stubBalance(null)

    await client.replenishToken({ token: 'REPL', amount: '7' })

    const cAtom = proposedAtoms()[0]!
    expect(cAtom.value).toBe('7')
    expect(metaOf(cAtom, 'address')).toMatch(/^[0-9a-f]{64}$/)
    expect(metaOf(cAtom, 'address')).not.toBe(cAtom.walletAddress)
    expect(metaOf(cAtom, 'position')).not.toBe(CONTINUID_POSITION)
  })
})

describe('fuseToken', () => {
  it.each([
    ['its own bundle', true],
    ['another bundle', false]
  ])('delivers the fused unit to %s: V V F V, no ContinuID atom', async (_label, own) => {
    const source = Wallet.create({ secret, token: 'STK' })
    source.tokenUnits = Wallet.getTokenUnits([['u1', 'u1', {}], ['u2', 'u2', {}], ['u3', 'u3', {}]])
    source.balance = '3'
    stubBalance(source)

    await client.fuseToken({ bundleHash: own ? bundle : OTHER_BUNDLE, tokenSlug: 'STK', newTokenUnit: 'FUSED', fusedTokenUnitIds: ['u1', 'u3'] })

    const atoms = proposedAtoms()
    expect(atoms.map(atom => atom.isotope)).toEqual(['V', 'V', 'F', 'V'])
    expect(atoms[0]!.position).toBe(source.position)
    expect(atoms.map(atom => atom.value)).toEqual(['-3', '1', '1', '1'])
    const fusion = atoms[2]!
    expect(fusion.metaId).toBe(own ? bundle : OTHER_BUNDLE)
    expect(Boolean(fusion.walletAddress)).toBe(own)
    expect(atoms[3]!.position).not.toBe(source.position)
  })
})

describe('withdrawBufferToken', () => {
  it('signs from the buffer Balance wallet and sends the change to a fresh position', async () => {
    const buffer = Wallet.create({ secret, token: 'BUF' })
    buffer.balance = '50'
    const balance = stubBalance(buffer)

    await client.withdrawBufferToken({ tokenSlug: 'BUF', amount: '20' })

    expect(balance).toHaveBeenCalledWith({ token: 'BUF', type: 'buffer' })
    const atoms = proposedAtoms()
    expect(atoms.map(atom => [atom.isotope, atom.token, atom.value])).toEqual([['B', 'BUF', '-50'], ['V', 'BUF', '20'], ['B', 'BUF', '30']])
    expect(atoms[0]!.position).toBe(buffer.position)
    expect(atoms[1]!.metaId).toBe(bundle)
    expect(atoms[2]!.position).not.toBe(buffer.position)
    expect(atoms[2]!.walletAddress).not.toBe(buffer.address)
  })
})

describe('claimShadowWallet', () => {
  it('skips the regular wallet listed first and claims the shadow wallet batch', async () => {
    const regular = Wallet.create({ secret, token: 'CLM' })
    const shadow = Wallet.create({ bundle, token: 'CLM', batchId: 'batch-shadow-1' })
    vi.spyOn(client, 'queryWallets').mockResolvedValue([regular, shadow])

    await client.claimShadowWallet({ token: 'CLM' })

    const claim = proposedAtoms()[0]!
    expect([claim.isotope, claim.metaType]).toEqual(['C', 'wallet'])
    expect(metaOf(claim, 'walletBatchId')).toBe('batch-shadow-1')
  })

  it('refuses when no shadow wallet is listed, sending nothing', async () => {
    vi.spyOn(client, 'queryWallets').mockResolvedValue([Wallet.create({ secret, token: 'CLM' })])

    await expect(client.claimShadowWallet({ token: 'CLM' })).rejects.toThrow(WalletShadowException)
    await expect(client.claimShadowWallet({ token: 'CLM' })).rejects.toThrow('No shadow wallets found')
    expect(mutate).not.toHaveBeenCalled()
  })
})

describe('pre-submit check', () => {
  it('refuses a built operation whose molecule fails check() and sends nothing', async () => {
    // A builder regression that drops the ContinuID atom from a USER-signed meta mutation
    vi.spyOn(Molecule.prototype, 'addContinuIdAtom').mockImplementation(function (this: Molecule) { return this })

    await expect(client.createMeta({ metaType: 'Probe', metaId: 'p1', meta: { k: 'v' } })).rejects.toThrow(AtomsMissingException)
    expect(mutate).not.toHaveBeenCalled()
  })

  it('sends a caller-built molecule through the raw MutationProposeMolecule unchanged', async () => {
    const signer = new Wallet({ secret, token: 'USER', position: CONTINUID_POSITION })
    const molecule = new Molecule({ secret, sourceWallet: signer, cellSlug: 'test' })
    molecule.addAtom(Atom.create({ isotope: 'M', wallet: signer, metaType: 'Probe', metaId: 'p1', meta: new AtomMeta({ k: 'v' }) }))
    molecule.sign({})

    const mutation = await client.createMoleculeMutation({ mutationClass: MutationProposeMolecule, molecule })
    await client.executeQuery(mutation)

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(proposedAtoms().map(atom => atom.isotope)).toEqual(['M'])
    expect(proposedAtoms()[0]!.walletAddress).toBe(signer.address)
  })
})
