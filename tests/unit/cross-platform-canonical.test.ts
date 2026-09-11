/**
 * Canonical cross-platform test vectors — verifies the TS SDK against the shared
 * cross-platform-test-vectors.json (the cross-SDK master). Sibling of the family's
 * cross-platform tests (JS cross-platform-canonical.test.js, PHP/Kotlin
 * CrossPlatformVectorsTest, Rust cross_platform_vectors.rs) — asserts SHAKE256 /
 * bundle_hash / wallet_generation / ML-KEM768 against the same committed vectors.
 *
 * Standalone-CI note: this statically imports the monorepo-parent master, which is
 * ABSENT in a standalone GitHub checkout — vitest.config.ts gates it out via
 * `crossPlatformVectorsPresent` (mirrors the generate-secret-parity.test.ts gate).
 */

import { describe, it, expect } from 'vitest'
import Wallet from '../../src/core/Wallet'
import Atom from '../../src/core/Atom'
import Molecule from '../../src/core/Molecule'
import AuthToken from '../../src/AuthToken'
import { generateBundleHash, shake256 } from '../../src/libraries/crypto'
import vectorsJson from '../../../shared-test-results/cross-platform-test-vectors.json'
import { FROZEN_TS_0_9_7_ENVELOPE } from '../fixtures/frozenEnvelope'

type LegacyMetaJson = { key: string; value: string }

type LegacyAtomJson = {
  position: string | null
  walletAddress: string | null
  isotope: string
  token: string | null
  value: string | null
  batchId: string | null
  metaType: string | null
  metaId: string | null
  meta: LegacyMetaJson[]
  index: number
  createdAt: string
  otsFragment?: string | null
}

type LegacyWalletJson = {
  address: string
  position: string
  token: string
  balance: string
  bundle: string
  batchId: string | null
  characters: string
  pubkey: string
  tokenUnits: unknown[]
  tradeRates: Record<string, unknown>
  molecules: Record<string, unknown>
}

type LegacyMoleculeJson = {
  status: string | null
  molecularHash: string
  createdAt: string
  cellSlug: string
  bundle: string
  atoms: LegacyAtomJson[]
  cellSlugOrigin: string
  sourceWallet: LegacyWalletJson
  remainderWallet: LegacyWalletJson
}

const vectors = (vectorsJson as {
  vectors: {
    shake256: { tests: Array<{ name: string; input: string; outputLength: number; expected: string }> }
    bundle_hash: { tests: Array<{ name: string; secret: string; expected: string }> }
    wallet_generation: { tests: Array<{ name: string; secret: string; token: string; position: string; expectedBundle: string; expectedAddress: string }> }
    mlkem768: {
      keygen: { secret: string; token: string; position: string; expectedPubkey: string }
      decrypt: { secret: string; token: string; position: string; cipherText: string; encryptedMessage: string; expectedPlaintext: string }
    }
    mlkem1024: {
      keygen: { secret: string; token: string; position: string; expectedPubkey: string }
      decrypt: { secret: string; token: string; position: string; cipherText: string; encryptedMessage: string; expectedPlaintext: string }
    }
    legacyMlkem768AuthMolecule: {
      description: string
      expectedMolecularHash: string
      expectedWalletPubkeyBytes: number
      atoms: LegacyAtomJson[]
      molecule: LegacyMoleculeJson
    }
  }
}).vectors

describe('Canonical Cross-Platform SHAKE256 Vectors', () => {
  it.each(vectors.shake256.tests)('SHAKE256: $name', (vector) => {
    // Vector outputLength is in BYTES; TS shake256() takes BITS.
    const result = shake256(vector.input, vector.outputLength * 8)
    expect(result).toBe(vector.expected)
  })
})

describe('Canonical Cross-Platform Bundle Hash Vectors', () => {
  // FIXED (cycle 142): TS generateBundleHash() now hashes an empty secret to
  // shake256("") = 46b9dd2b… (removed the "Secret is required" guard), matching
  // JS/PHP/Kotlin/Rust/Python + the committed `empty_secret` vector — so ALL cases
  // (incl. empty_secret) are asserted here, no longer filtered.
  it.each(vectors.bundle_hash.tests)('Bundle hash: $name', (vector) => {
    expect(generateBundleHash(vector.secret)).toBe(vector.expected)
  })
})

describe('Canonical Cross-Platform Wallet Address Vectors', () => {
  it.each(vectors.wallet_generation.tests)('Wallet: $name', (vector) => {
    expect(generateBundleHash(vector.secret)).toBe(vector.expectedBundle)
    const wallet = new Wallet({ secret: vector.secret, token: vector.token, position: vector.position })
    expect(wallet.address).toBe(vector.expectedAddress)
  })
})

describe('Canonical Cross-Platform ML-KEM768 Vectors', () => {
  const mlkem = vectors.mlkem768

  // Keygen-from-seed is deterministic (FIPS-203) → byte-frozen pubkey, like a SHAKE vector.
  it('ML-KEM768 keygen: deterministic pubkey matches canonical', () => {
    const { secret, token, position, expectedPubkey } = mlkem.keygen
    const wallet = new Wallet({ secret, token, position, mlKemParameterSet: 768 })
    expect(wallet.pubkey).toBe(expectedPubkey)
  })

  // Encapsulation is non-deterministic, but decapsulation + AES-256-GCM decrypt is deterministic →
  // one frozen {cipherText, encryptedMessage} sample must decrypt to the canonical plaintext.
  it('ML-KEM768 decrypt: frozen sample decrypts to canonical plaintext', async () => {
    const { secret, token, position, cipherText, encryptedMessage, expectedPlaintext } = mlkem.decrypt
    const wallet = new Wallet({ secret, token, position, mlKemParameterSet: 768 })
    const plaintext = await wallet.decryptMessage({ cipherText, encryptedMessage })
    expect(plaintext).toBe(expectedPlaintext)
  })
})

describe('Canonical Cross-Platform ML-KEM1024 Vectors', () => {
  const mlkem1024 = vectors.mlkem1024

  it('ML-KEM1024 keygen: deterministic pubkey matches canonical (default 1024)', () => {
    const { secret, token, position, expectedPubkey } = mlkem1024.keygen
    const wallet = new Wallet({ secret, token, position })
    expect(wallet.pubkey).toBe(expectedPubkey)
  })

  it('ML-KEM1024 decrypt: frozen sample decrypts to canonical plaintext', async () => {
    const { secret, token, position, cipherText, encryptedMessage, expectedPlaintext } = mlkem1024.decrypt
    const wallet = new Wallet({ secret, token, position })
    const plaintext = await wallet.decryptMessage({ cipherText, encryptedMessage })
    expect(plaintext).toBe(expectedPlaintext)
  })
})

describe('Backwards compatibility: a 1024-default build reads pre-bump ML-KEM-768 records', () => {
  const mlkem768 = vectors.mlkem768.decrypt

  // (a) The whole point of dual-identity inbound decryption: no second wallet, no explicit step-back.
  it('a default (1024) wallet decrypts a frozen 768 envelope addressed to its own 768 identity', async () => {
    const { secret, token, position, cipherText, encryptedMessage, expectedPlaintext } = mlkem768
    const wallet = new Wallet({ secret, token, position })
    expect(wallet.mlKemParameterSet).toBe(1024)
    await expect(wallet.decryptMessage({ cipherText, encryptedMessage })).resolves.toBe(expectedPlaintext)
  })

  // (b) Permissive inbound must NOT change what the wallet advertises — that value goes into
  // signed molecule meta and into auth, so moving it would change hashed bytes.
  it('the advertised public key is still ML-KEM-1024', () => {
    const { secret, token, position } = mlkem768
    const wallet = new Wallet({ secret, token, position })
    expect(Buffer.from(wallet.pubkey as string, 'base64')).toHaveLength(1568)
  })

  // (d) A ciphertext at neither parameter set must still fail on the existing observable (null).
  it('a ciphertext matching neither parameter set still returns null', async () => {
    const { secret, token, position, encryptedMessage } = mlkem768
    const wallet = new Wallet({ secret, token, position })
    const malformed = wallet.serializeKey(new Uint8Array(64))
    await expect(wallet.decryptMessage({ cipherText: malformed, encryptedMessage })).resolves.toBeNull()
  })

  // (e) The transport path is map-addressed, so without trying both hash shares the length
  // dispatch in (a) is never even reached.
  it('the CipherHash map path finds an envelope addressed to the 768 hash share', async () => {
    const { secret, token, position, cipherText, encryptedMessage, expectedPlaintext } = mlkem768
    const wallet = new Wallet({ secret, token, position })
    const wallet768 = new Wallet({ secret, token, position, mlKemParameterSet: 768 })
    const map = { [wallet768.hashShare(wallet768.pubkey as string)]: { cipherText, encryptedMessage } }

    // decryptMyMessageML returns the RAW response text (the normal parser JSON.parses it).
    const raw = await wallet.decryptMyMessageML(map)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw as string)).toBe(expectedPlaintext)
  })
})

describe('Backwards compatibility: session snapshots keep their ML-KEM parameter set', () => {
  const { secret, position } = vectors.mlkem768.decrypt

  it('a stepped-back 768 session survives a snapshot round trip', () => {
    const wallet = new Wallet({ secret, token: 'AUTH', position, mlKemParameterSet: 768 })
    const snapshot = AuthToken.create(
      { token: 'T', expiresAt: 9999999999, pubkey: wallet.pubkey as string, encrypt: true },
      wallet
    ).toSnapshot()

    expect(AuthToken.restore(snapshot, secret).getWallet()!.pubkey).toBe(wallet.pubkey)
  })

  it('a legacy snapshot with no parameter set restores as 768, not the 1024 default', () => {
    const wallet768 = new Wallet({ secret, token: 'AUTH', position, mlKemParameterSet: 768 })

    // The exact shape an 0.9.x build persisted: no parameter-set field anywhere, and `pubkey`
    // is the validator's 768 key because every pre-bump session was 768.
    const legacySnapshot = {
      token: 'T',
      expiresAt: 9999999999,
      pubkey: wallet768.pubkey as string,
      encrypt: true,
      wallet: {
        position: wallet768.position,
        characters: wallet768.characters
      }
    }

    const restored = AuthToken.restore(legacySnapshot, secret).getWallet()!
    expect(restored.pubkey).toBe(wallet768.pubkey)
    expect(Buffer.from(restored.pubkey as string, 'base64')).toHaveLength(1184)
  })
})

describe('Canonical pre-bump ML-KEM-768 auth molecule validates from a 1024 default', () => {
  const legacy = vectors.legacyMlkem768AuthMolecule

  // Fails loudly if the fixture is ever regenerated at the 1024 default — at which point it
  // would no longer be evidence about pre-bump records at all.
  it('the U-atom walletPubkey meta really is an ML-KEM-768 key', () => {
    const walletPubkeys = legacy.molecule.atoms
      .flatMap(atom => atom.meta || [])
      .filter(meta => meta.key === 'walletPubkey')
      .map(meta => meta.value)

    expect(walletPubkeys).toHaveLength(1)
    expect(Buffer.from(walletPubkeys[0], 'base64')).toHaveLength(legacy.expectedWalletPubkeyBytes)
  })

  it('its molecular hash still verifies', () => {
    const atoms = legacy.atoms.map(atom => Atom.fromJSON(atom))
    expect(Atom.hashAtoms({ atoms })).toBe(legacy.expectedMolecularHash)
  })

  it('full check() — hash plus WOTS+ signature — passes', () => {
    const molecule = Molecule.fromJSON(legacy.molecule, {
      includeValidationContext: true,
      validateStructure: true,
      strictMode: false
    })
    expect(molecule.molecularHash).toBe(legacy.expectedMolecularHash)
    expect(molecule.check(molecule.sourceWallet)).toBe(true)
  })
})

describe('Secret storage envelope parity with master vector', () => {
  it('master vector payload matches the frozen envelope constant', () => {
    const masterPayload = (vectorsJson as any).vectors.secret_storage_envelope.tests[0].payload
    const frozenPayload = JSON.parse(FROZEN_TS_0_9_7_ENVELOPE)
    expect(frozenPayload).toEqual(masterPayload)
  })
})
