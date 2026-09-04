import { describe, it, expect } from 'vitest'
import KnishIOClient from '../../src/KnishIOClient'
import {
  WebCryptoSecretStorageProvider,
  MemorySecretStorageProvider
} from '../../src/storage'
import { generateBundleHash, generateSecret } from '../../src/libraries/crypto'
import Wallet from '../../src/core/Wallet'
import Atom from '../../src/core/Atom'

describe('KnishIOClient Secret Storage Integration', () => {
  const testSeed = 'knishio-hardware-secret-storage-seed'
  const canonicalSecret = generateSecret(testSeed)
  const canonicalBundle = generateBundleHash(canonicalSecret)

  it('operates with WebCryptoSecretStorageProvider without retaining cleartext secret on client', async () => {
    const storage = new WebCryptoSecretStorageProvider({
      defaultPassphrase: 'client-secure-passphrase'
    })

    // Store secret under bundle in storage
    await storage.storeSecret(canonicalBundle, canonicalSecret, { label: 'Hardware Key' })

    // Create client with storage provider
    const client = new KnishIOClient({
      uri: 'https://api.test.knish.io',
      secretStorage: storage
    })

    // Associate active bundle with the client
    client.setSecretStorage(storage, canonicalBundle)

    // Client has secret via storage
    expect(client.hasSecret()).toBe(true)
    expect(client.hasBundle()).toBe(true)
    expect(client.getBundle()).toBe(canonicalBundle)

    // Internal $__secret remains empty (defends against long-term heap retention)
    expect((client as any).$__secret).toBe('')

    // Client can asynchronously retrieve secret
    const retrieved = await client.retrieveSecret()
    expect(retrieved).toBe(canonicalSecret)

    // Create a source wallet to provide to createMolecule
    const sourceWallet = new Wallet({
      secret: canonicalSecret,
      bundle: canonicalBundle,
      token: 'USER',
      position: '0'.repeat(64)
    })

    // createMolecule should successfully unwrap secret from storage
    const molecule = await client.createMolecule({
      sourceWallet
    })

    expect(molecule).toBeDefined()
    expect(molecule.bundle).toBe(canonicalBundle)
    expect(molecule.sourceWallet).toBe(sourceWallet)
    expect(molecule.remainderWallet).toBeDefined()
    expect(molecule.remainderWallet?.bundle).toBe(canonicalBundle)

    // Sign the molecule
    const atom = Atom.create({
      wallet: sourceWallet,
      isotope: 'C',
      value: '0'
    })
    molecule.addAtom(atom)
    const signature = molecule.sign()
    expect(signature).toBeDefined()
    expect(typeof signature).toBe('string')
    expect(molecule.molecularHash).toBeDefined()
  })

  it('setSecret automatically initializes internal secret storage for uniform access', async () => {
    const client = new KnishIOClient({
      uri: 'https://api.test.knish.io'
    })

    expect(client.hasSecret()).toBe(false)
    expect(client.getSecretStorage()).toBeNull()

    client.setSecret(canonicalSecret)

    expect(client.hasSecret()).toBe(true)
    expect(client.getBundle()).toBe(canonicalBundle)
    expect(client.getSecret()).toBe(canonicalSecret)

    const storage = client.getSecretStorage()
    expect(storage).toBeDefined()
    expect(await storage?.hasSecret(canonicalBundle)).toBe(true)

    const retrievedFromStorage = await storage?.retrieveSecret(canonicalBundle)
    expect(retrievedFromStorage).toBe(canonicalSecret)
  })

  it('reset clears secret storage and bundle reference', () => {
    const storage = new MemorySecretStorageProvider()
    const client = new KnishIOClient({
      uri: 'https://api.test.knish.io',
      secretStorage: storage
    })

    client.setSecretStorage(storage, canonicalBundle)
    expect(client.hasSecret()).toBe(true)
    expect(client.getSecretStorage()).toBe(storage)

    client.reset()

    expect(client.hasSecret()).toBe(false)
    expect(client.getSecretStorage()).toBeNull()
    expect((client as any).$__bundle).toBe('')
  })
})
