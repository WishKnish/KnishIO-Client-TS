/**
 * OTS v2 (64-chain WOTS+ keys): cross-SDK vectors plus an always-running round trip.
 *
 * The vector suite reads the shared master ../shared-test-results/ots-v2-vectors.json. In a
 * standalone checkout of this SDK it is absent, and the file registers one visible skipped test.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import Wallet from '../../src/core/Wallet'
import Molecule from '../../src/core/Molecule'
import Atom from '../../src/core/Atom'
import AtomMeta from '../../src/core/AtomMeta'
import CheckMolecule from '../../src/libraries/CheckMolecule'
import SignatureMismatchException from '../../src/exception/SignatureMismatchException'
import SignatureMalformedException from '../../src/exception/SignatureMalformedException'
import KnishIOClient from '../../src/KnishIOClient'
import AuthToken from '../../src/AuthToken'
import MutationCreateWallet from '../../src/mutation/MutationCreateWallet'
import WalletCredentialException from '../../src/exception/WalletCredentialException'

type KeyCase = { name: string, secret: string, token: string, position: string, expectedKeyV1: string, expectedKeyV2: string, expectedAddressV1: string, expectedAddressV2: string }
type MoleculeJson = { atoms: Array<{ otsFragment?: string | null }> }
type OtsV2Vectors = {
  key_derivation: { tests: KeyCase[] }
  signature: { tests: Array<{ name: string, molecularHash: string, expectedNormalized: number[] }> }
  mlkem_identity: { tests: Array<{ name: string, keyFrom: string, expectedMlKem1024Pubkey: string, expectedMlKem768Pubkey: string }> }
  molecules: { tests: Array<{ name: string, otsVersion: 1 | 2, molecule: MoleculeJson, expected: string }> }
  malformed_hash: { tests: Array<{ name: string, molecule: MoleculeJson, expected: string }> }
}
type MoleculeInput = Parameters<typeof Molecule.fromJSON>[0]

const VECTORS_PATH = resolve(__dirname, '../../../shared-test-results/ots-v2-vectors.json')
const vectors: OtsV2Vectors | null = existsSync(VECTORS_PATH) ? JSON.parse(readFileSync(VECTORS_PATH, 'utf8')).vectors : null

const EXCEPTIONS: Record<string, typeof SignatureMismatchException | typeof SignatureMalformedException> = {
  SignatureMismatch: SignatureMismatchException,
  SignatureMalformed: SignatureMalformedException
}

const parse = (json: unknown): Molecule => Molecule.fromJSON(json as MoleculeInput, {
  includeValidationContext: true,
  validateStructure: true,
  strictMode: false
})

if (!vectors) {
  it.skip('ots-v2-vectors.test.ts: skipped — ../shared-test-results/ots-v2-vectors.json not found (standalone checkout)', () => {})
} else {
  const keyCase = (name: string): KeyCase => {
    const found = vectors.key_derivation.tests.find(k => k.name === name)
    if (!found) throw new Error(`missing key_derivation case ${name}`)
    return found
  }

  describe('OTS v2 key derivation and address', () => {
    it.each(vectors.key_derivation.tests)('$name', (vector) => {
      const { secret, token, position } = vector
      expect(Wallet.generateKey({ secret, token, position })).toBe(vector.expectedKeyV1)
      expect(Wallet.generateKey({ secret, token, position, otsVersion: 2 })).toBe(vector.expectedKeyV2)
      expect(Wallet.generateAddress(vector.expectedKeyV1)).toBe(vector.expectedAddressV1)
      expect(Wallet.generateAddress(vector.expectedKeyV2)).toBe(vector.expectedAddressV2)
      expect(new Wallet({ secret, token, position, otsVersion: 2 }).address).toBe(vector.expectedAddressV2)
    })

    it('an unsupported OTS version is refused', () => {
      const message = 'KnishIO: unsupported OTS version 3; expected 1 or 2.'
      expect(() => new Wallet({ secret: 'x', otsVersion: 3 as unknown as 1 })).toThrow(message)
      expect(() => Wallet.generateKey({ secret: 'x', token: 'USER', position: 'y', otsVersion: 3 as unknown as 1 })).toThrow(message)
    })
  })

  describe('OTS v2 normalized hash', () => {
    it.each(vectors.signature.tests)('$name', (vector) => {
      expect(Molecule.normalize(Molecule.enumerate(vector.molecularHash))).toEqual(vector.expectedNormalized)
    })
  })

  describe('OTS v2 wallet ML-KEM identities', () => {
    it.each(vectors.mlkem_identity.tests)('$name', (vector) => {
      const { secret, token, position } = keyCase(vector.keyFrom)
      const pubkey = (mlKemParameterSet: 1024 | 768): unknown =>
        new Wallet({ secret, token, position, otsVersion: 2, mlKemParameterSet }).pubkey
      expect(pubkey(1024)).toBe(vector.expectedMlKem1024Pubkey)
      expect(pubkey(768)).toBe(vector.expectedMlKem768Pubkey)
    })
  })

  describe('OTS v2 molecule verdicts', () => {
    it.each(vectors.molecules.tests)('$name → $expected', (vector) => {
      const molecule = parse(vector.molecule)
      if (vector.expected === 'verified') {
        expect(molecule.check(molecule.sourceWallet)).toBe(true)
      } else {
        expect(() => molecule.check(molecule.sourceWallet)).toThrow(EXCEPTIONS[vector.expected]!)
      }
    })

    it.each(['genuine_v2', 'genuine_v1_control'])('re-signing %s reproduces every otsFragment', (name) => {
      const vector = vectors.molecules.tests.find(t => t.name === name)!
      const { secret, position } = keyCase('hex_secret_user')
      const molecule = parse(vector.molecule)
      molecule.secret = secret
      molecule.sourceWallet = new Wallet({ secret, token: 'USER', position, otsVersion: vector.otsVersion })
      molecule.sign()
      expect(molecule.atoms.map(atom => atom.otsFragment)).toEqual(vector.molecule.atoms.map(atom => atom.otsFragment))
    })
  })

  describe('OTS malformed declared hash', () => {
    it.each(vectors.malformed_hash.tests)('$name → $expected', (vector) => {
      const check = new CheckMolecule(parse(vector.molecule))
      expect(() => check.ots()).toThrow(EXCEPTIONS[vector.expected]!)
    })
  })
}

describe('OTS v2 round trip', () => {
  const SECRET = 'e'.repeat(2048)

  function signedV2Molecule(): { molecule: Molecule, signer: Wallet } {
    const signer = Wallet.create({ secret: SECRET, token: 'USER', otsVersion: 2 })
    const molecule = new Molecule({ secret: SECRET, sourceWallet: signer, cellSlug: 'ots-v2' })
    molecule.addAtom(Atom.create({ isotope: 'M', wallet: signer, metaType: 'OtsV2Probe', metaId: 'p1', meta: new AtomMeta({ k: 'v' }) }))
    molecule.addContinuIdAtom()
    molecule.sign({ compressed: true })
    return { molecule, signer }
  }

  it('a v2 source wallet signs 64 chains and the molecule verifies', () => {
    const { molecule, signer } = signedV2Molecule()
    expect(signer.otsVersion).toBe(2)
    expect(signer.key).toHaveLength(8192)
    expect(molecule.signingOtsVersion()).toBe(2)
    expect(molecule.remainderWallet?.otsVersion).toBe(2)
    expect(molecule.atoms.map(atom => atom.otsFragment || '').join('')).toHaveLength(5464)
    expect(molecule.check(signer)).toBe(true)
  })

  it('a one-character change to the signature is a SignatureMismatch', () => {
    const { molecule, signer } = signedV2Molecule()
    const atom = molecule.atoms[0]!
    const fragment = atom.otsFragment!
    const index = fragment.search(/[AB]/)
    expect(index).toBeGreaterThanOrEqual(0)
    const flipped = fragment[index] === 'A' ? 'B' : 'A'
    atom.otsFragment = fragment.slice(0, index) + flipped + fragment.slice(index + 1)
    expect(() => molecule.check(signer)).toThrow(SignatureMismatchException)
  })
})

describe('client-level OTS version', () => {
  const secret = 'a'.repeat(2048)
  const position = 'b'.repeat(64)
  const keyV1 = Wallet.generateKey({ secret, token: 'USER', position, otsVersion: 1 })
  const keyV2 = Wallet.generateKey({ secret, token: 'USER', position, otsVersion: 2 })
  const addressV1 = Wallet.generateAddress(keyV1)
  const addressV2 = Wallet.generateAddress(keyV2)
  const unrelated = 'c'.repeat(64)
  const notDerived = `KnishIO: wallet ${unrelated} is not derived from this secret at position ${position} under OTS version 1 or 2.`
  const ledgerWallet = (address: string): Wallet => new Wallet({ secret: null, token: 'USER', position, address })
  const clientAt = (otsVersion: 1 | 2): KnishIOClient => {
    const client = new KnishIOClient({ uri: 'http://127.0.0.1:9/graphql', cellSlug: 'ots-v2', logging: false, otsVersion })
    client.setSecret(secret)
    return client
  }
  const continuIdReturns = (client: KnishIOClient, wallet: Wallet | null) =>
    vi.spyOn(client, 'queryContinuId').mockResolvedValue({ payload: () => wallet } as never)

  it('detectOtsVersion finds the version an address was derived at, either preferred order', () => {
    for (const preferred of [1, 2] as const) {
      expect(Wallet.detectOtsVersion({ secret, token: 'USER', position, address: addressV1, preferred })).toBe(1)
      expect(Wallet.detectOtsVersion({ secret, token: 'USER', position, address: addressV2, preferred })).toBe(2)
      expect(Wallet.detectOtsVersion({ secret, token: 'USER', position, address: unrelated, preferred })).toBeNull()
    }
  })

  it('setOtsVersion sets a keyless wallet and refuses to change a keyed one', () => {
    expect(ledgerWallet(addressV2).setOtsVersion(2).otsVersion).toBe(2)
    const keyed = new Wallet({ secret, token: 'USER', position })
    expect(() => keyed.setOtsVersion(2)).toThrow('KnishIO: cannot change the OTS version of a keyed wallet.')
    expect(keyed.setOtsVersion(1).otsVersion).toBe(1)
  })

  it('the client option is validated', () => {
    expect(clientAt(2).getOtsVersion()).toBe(2)
    expect(() => clientAt(1).setOtsVersion(3 as never)).toThrow('KnishIO: unsupported OTS version 3; expected 1 or 2.')
  })

  it('without a ContinuID, getSourceWallet creates a key at the client version', async () => {
    const client = clientAt(2)
    continuIdReturns(client, null)
    const sourceWallet = await client.getSourceWallet()
    expect(sourceWallet.otsVersion).toBe(2)
    expect(sourceWallet.key).toHaveLength(8192)
  })

  it('a client at version 2 signs in from a fresh AUTH wallet and creates wallets at version 2', async () => {
    const client = clientAt(2)
    continuIdReturns(client, null)
    let authWallet: Wallet | null = null
    vi.spyOn(client as never as { proposeProfileAuthorization: (wallet: Wallet) => Promise<never> }, 'proposeProfileAuthorization')
      .mockImplementation(async (wallet: Wallet) => { authWallet = wallet; throw new Error('stop') })
    await expect(client.requestProfileAuthToken({ secret })).rejects.toThrow('stop')
    expect(authWallet!.token).toBe('AUTH')
    expect(authWallet!.otsVersion).toBe(2)
    expect(authWallet!.key).toHaveLength(8192)

    let created: Wallet | null = null
    vi.spyOn(MutationCreateWallet.prototype, 'fillMolecule').mockImplementation((wallet: Wallet) => { created = wallet; throw new Error('stop') })
    await expect(client.createWallet({ token: 'TST' })).rejects.toThrow('stop')
    expect(created!.otsVersion).toBe(2)
    vi.restoreAllMocks()
  })

  it('getSourceWallet derives a ContinuID wallet at the version its address was derived at', async () => {
    const client = clientAt(1)
    continuIdReturns(client, ledgerWallet(addressV2))
    const sourceWallet = await client.getSourceWallet()
    expect(sourceWallet.otsVersion).toBe(2)
    expect(sourceWallet.key).toBe(keyV2)
  })

  it('binding a keyless ledger wallet uses the version its address was derived at', () => {
    expect(clientAt(1).bindOwnWalletOtsVersion(ledgerWallet(addressV2)).otsVersion).toBe(2)
    expect(clientAt(2).bindOwnWalletOtsVersion(ledgerWallet(addressV1)).otsVersion).toBe(1)
  })

  it('binding refuses a wallet this secret does not derive', async () => {
    expect(() => clientAt(1).bindOwnWalletOtsVersion(ledgerWallet(unrelated))).toThrow(WalletCredentialException)
    expect(() => clientAt(1).bindOwnWalletOtsVersion(ledgerWallet(unrelated))).toThrow(notDerived)
    const client = clientAt(1)
    continuIdReturns(client, ledgerWallet(unrelated))
    await expect(client.getSourceWallet()).rejects.toThrow(notDerived)
  })

  it('an AuthToken snapshot keeps the session wallet OTS version', () => {
    const wallet = new Wallet({ secret, token: 'USER', position, otsVersion: 2 })
    const snapshot = AuthToken.create({ token: 't', expiresAt: 0, pubkey: '', encrypt: false }, wallet).toSnapshot()
    expect(snapshot.wallet?.otsVersion).toBe(2)
    const restored = AuthToken.restore(snapshot, secret).getWallet()!
    expect(restored.otsVersion).toBe(2)
    expect(restored.address).toBe(wallet.address)

    delete snapshot.wallet!.otsVersion
    expect(AuthToken.restore(snapshot, secret).getWallet()!.otsVersion).toBe(1)
  })
})
