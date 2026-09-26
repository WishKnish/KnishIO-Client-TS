/**
 * Regression: the first non-auth molecule after a profile authorization must
 * be signed from the server's ContinuID position, not from the auth
 * molecule's cached USER remainder wallet.
 *
 * From validator 0.5.0 (two-tier rejection model) an UNPROVEN re-auth — a U+I
 * molecule signed from a fresh random AUTH position for a bundle that already
 * has a ContinuID pointer — no longer executes its I-atom: no USER wallet is
 * created at the remainder position and the pointer does not move. Chaining
 * from that remainder is rejected with "Wallet not found" / "Signer address
 * mismatch". Querying ContinuID is correct against every validator version.
 *
 * Fully offline: the GraphQL transport is stubbed, while the real
 * MutationRequestAuthorization / QueryContinuId execute paths run so that
 * lastMoleculeQuery.response() is populated exactly as it is in production.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import KnishIOClient from '../../src/KnishIOClient'
import AuthToken from '../../src/AuthToken'
import Molecule from '../../src/core/Molecule'
import Wallet from '../../src/core/Wallet'
import { AuthorizationRejectedException, WrongTokenTypeException } from '../../src/exception'
import { generateBundleHash, generateSecret } from '../../src/libraries/crypto'

const CONTINUID_POSITION = 'c0ffee0000000000c0ffee0000000000c0ffee0000000000c0ffee0000000000'

describe('KnishIOClient::requestProfileAuthToken → createMolecule source wallet', () => {
  let client: KnishIOClient
  let secret: string

  beforeEach(async () => {
    secret = generateSecret()
    const bundle = generateBundleHash(secret)
    const pointerWallet = new Wallet({ secret, token: 'USER', position: CONTINUID_POSITION })

    client = new KnishIOClient({
      uri: 'https://test.local/graphql',
      cellSlug: 'test',
      logging: false
    })

    const transport = client.client()
    vi.spyOn(transport, 'mutate').mockResolvedValue({
      data: {
        ProposeMolecule: {
          molecularHash: 'stub',
          status: 'accepted',
          reason: null,
          payload: JSON.stringify({
            token: 'stub-auth-token',
            time: Math.floor(Date.now() / 1000) + 3600,
            encrypt: 'false',
            key: 'stub-server-pubkey'
          })
        }
      }
    })
    vi.spyOn(transport, 'query').mockResolvedValue({
      data: {
        ContinuId: {
          address: pointerWallet.address,
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

    await client.requestProfileAuthToken({ secret, encrypt: false })
  })

  it('drops the auth mutation as the carry-forward anchor', () => {
    // Compare by identity: printing the retained mutation would dump its whole signed molecule.
    const anchor: unknown = Reflect.get(client, 'lastMoleculeQuery')
    expect(anchor === null, 'lastMoleculeQuery must not keep the auth mutation after authorization').toBe(true)
  })

  it('signs the next molecule from the ContinuID position, not the auth remainder', async () => {
    const authRemainderPosition = client.getRemainderWallet()!.position
    expect(authRemainderPosition).not.toBe(CONTINUID_POSITION)

    const getSourceWalletSpy = vi.spyOn(client, 'getSourceWallet')
    const molecule = await client.createMolecule({})

    expect(getSourceWalletSpy).toHaveBeenCalledTimes(1)
    expect(molecule.sourceWallet!.position).toBe(CONTINUID_POSITION)
  })
})

type ProposedAtom = {
  isotope: string
  token: string
  position: string
  walletAddress: string
  meta: { key: string, value: unknown }[]
}

type ContinuIdStub = {
  address: string | null
  tokenSlug: string
  position: string | null
} | null

function proposal (status: 'accepted' | 'rejected') {
  return {
    data: {
      ProposeMolecule: {
        molecularHash: 'stub',
        status,
        reason: status === 'rejected' ? 'stub rejection' : null,
        payload: status === 'accepted'
          ? JSON.stringify({
            token: 'stub-auth-token',
            time: Math.floor(Date.now() / 1000) + 3600,
            encrypt: 'false',
            key: 'stub-server-pubkey'
          })
          : null
      }
    }
  }
}

/**
 * Profile login against a stubbed transport. `statuses` answers each proposal in order; the
 * ContinuID query answers `continuId` (the validator's reply for the bundle).
 */
function stubbedClient (secret: string, continuId: ContinuIdStub, statuses: ('accepted' | 'rejected')[]) {
  const client = new KnishIOClient({
    uri: 'https://test.local/graphql',
    cellSlug: 'test',
    logging: false
  })
  const transport = client.client()
  const mutate = vi.spyOn(transport, 'mutate')
  for (const status of statuses) {
    mutate.mockResolvedValueOnce(proposal(status))
  }
  const query = vi.spyOn(transport, 'query').mockResolvedValue({
    data: {
      ContinuId: continuId && {
        ...continuId,
        bundleHash: generateBundleHash(secret),
        batchId: null,
        characters: null,
        pubkey: null,
        amount: 0
      }
    }
  })
  return { client, mutate, query }
}

/** Atoms of the `call`-th proposal: an authorization molecule is always [U signer, I ContinuID]. */
function proposedAtoms (mutate: { mock: { calls: unknown[][] } }, call: number): [ProposedAtom, ProposedAtom] {
  const params = mutate.mock.calls[call]?.[0] as { variables: { molecule: { atoms: [ProposedAtom, ProposedAtom] } } }
  return params.variables.molecule.atoms
}

function metaValue (atom: ProposedAtom, key: string): unknown {
  return atom.meta.find(entry => entry.key === key)?.value
}

describe('KnishIOClient::requestProfileAuthToken — proven re-login from the ContinuID pointer', () => {
  let secret: string
  let pointerAddress: string

  beforeEach(() => {
    secret = generateSecret()
    pointerAddress = new Wallet({ secret, token: 'USER', position: CONTINUID_POSITION }).address!
  })

  it('signs a returning login with the USER wallet at the pointer, in a single proposal', async () => {
    const { client, mutate } = stubbedClient(secret, {
      address: pointerAddress, tokenSlug: 'USER', position: CONTINUID_POSITION
    }, ['accepted'])

    await client.requestProfileAuthToken({ secret, encrypt: false })

    expect(mutate).toHaveBeenCalledTimes(1)
    const [signer, continuId] = proposedAtoms(mutate, 0)
    expect(signer.isotope).toBe('U')
    expect(signer.token).toBe('USER')
    expect(signer.position).toBe(CONTINUID_POSITION)
    expect(signer.walletAddress).toBe(pointerAddress)
    expect(continuId.isotope).toBe('I')
    expect(continuId.token).toBe('USER')
    expect(metaValue(continuId, 'previousPosition')).toBe(CONTINUID_POSITION)
    expect(continuId.position).not.toBe(CONTINUID_POSITION)

    // The token is bound to the pointer wallet, whose ML-KEM key the auth advertised.
    const tokenWallet = client.getAuthToken()!.getWallet()!
    expect(tokenWallet.token).toBe('USER')
    expect(tokenWallet.position).toBe(CONTINUID_POSITION)
    expect(metaValue(signer, 'walletPubkey')).toBe(tokenWallet.pubkey)
  })

  it('asks for the USER ContinuID wallet, not the newest wallet of any token', async () => {
    const { client, query } = stubbedClient(secret, {
      address: pointerAddress, tokenSlug: 'USER', position: CONTINUID_POSITION
    }, ['accepted'])

    await client.requestProfileAuthToken({ secret, encrypt: false })

    expect(query).toHaveBeenCalledTimes(1)
    const params = query.mock.calls[0]?.[0] as { variables: Record<string, unknown> }
    expect(params.variables).toEqual({ bundle: generateBundleHash(secret), token: 'USER' })
  })

  const unusablePointers: [string, () => ContinuIdStub][] = [
    ['no ContinuID wallet', () => null],
    ['a non-USER wallet', () => ({ address: pointerAddress, tokenSlug: 'AUTH', position: CONTINUID_POSITION })],
    ['an empty position', () => ({ address: pointerAddress, tokenSlug: 'USER', position: '' })],
    ['an address the secret does not derive at that position', () => ({
      address: new Wallet({ secret: generateSecret(), token: 'USER', position: CONTINUID_POSITION }).address,
      tokenSlug: 'USER',
      position: CONTINUID_POSITION
    })]
  ]
  for (const [label, continuId] of unusablePointers) {
    it(`signs from a fresh AUTH wallet when the query returns ${label}`, async () => {
      const { client, mutate } = stubbedClient(secret, continuId(), ['accepted'])

      await client.requestProfileAuthToken({ secret, encrypt: false })

      expect(mutate).toHaveBeenCalledTimes(1)
      const [signer] = proposedAtoms(mutate, 0)
      expect(signer.isotope).toBe('U')
      expect(signer.token).toBe('AUTH')
      expect(signer.position).not.toBe(CONTINUID_POSITION)
      expect(client.getAuthToken()!.getWallet()!.token).toBe('AUTH')
    })
  }

  it('falls back to the AUTH login exactly once when the pointer-signed login is rejected', async () => {
    const { client, mutate } = stubbedClient(secret, {
      address: pointerAddress, tokenSlug: 'USER', position: CONTINUID_POSITION
    }, ['rejected', 'accepted'])

    await client.requestProfileAuthToken({ secret, encrypt: false })

    expect(mutate).toHaveBeenCalledTimes(2)
    expect(proposedAtoms(mutate, 0)[0].token).toBe('USER')
    expect(proposedAtoms(mutate, 1)[0].token).toBe('AUTH')
    expect(client.getAuthToken()!.getWallet()!.token).toBe('AUTH')
  })

  it('raises the authorization rejection when the fallback is rejected too, after two proposals', async () => {
    const { client, mutate } = stubbedClient(secret, {
      address: pointerAddress, tokenSlug: 'USER', position: CONTINUID_POSITION
    }, ['rejected', 'rejected'])

    await expect(client.requestProfileAuthToken({ secret, encrypt: false }))
      .rejects.toBeInstanceOf(AuthorizationRejectedException)
    expect(mutate).toHaveBeenCalledTimes(2)
    expect(proposedAtoms(mutate, 1)[0].token).toBe('AUTH')
    expect(client.getAuthToken()).toBeNull()
  })

  it('propagates a ContinuID query failure without proposing anything', async () => {
    const { client, mutate, query } = stubbedClient(secret, null, [])
    query.mockRejectedValue(new Error('network down'))

    await expect(client.requestProfileAuthToken({ secret, encrypt: false })).rejects.toThrow('network down')
    expect(mutate).not.toHaveBeenCalled()
  })
})

/** The client's private re-entrancy guard: true only while a login is running. */
function authInProcess (client: KnishIOClient): unknown {
  return Reflect.get(client, '$__authInProcess')
}

/** A token that `executeQuery` treats as expired, so the next request refreshes the login. */
function expiredToken (secret: string): AuthToken {
  return AuthToken.create(
    { token: 'expired', expiresAt: Math.floor(Date.now() / 1000) - 60, pubkey: 'stub-server-pubkey', encrypt: false },
    new Wallet({ secret, token: 'AUTH' })
  )
}

describe('KnishIOClient auth-in-progress guard', () => {
  let secret: string
  let pointer: ContinuIdStub

  beforeEach(() => {
    secret = generateSecret()
    pointer = {
      address: new Wallet({ secret, token: 'USER', position: CONTINUID_POSITION }).address!,
      tokenSlug: 'USER',
      position: CONTINUID_POSITION
    }
  })

  it('is released after a rejected login, so an expired token is refreshed by the next request', async () => {
    const { client, mutate } = stubbedClient(secret, pointer, ['rejected', 'rejected', 'accepted'])

    await expect(client.requestAuthToken({ secret, encrypt: false }))
      .rejects.toBeInstanceOf(AuthorizationRejectedException)
    expect(mutate).toHaveBeenCalledTimes(2)
    expect(authInProcess(client)).toBe(false)

    // The next request sees an expired token and logs in again before it runs.
    client.setAuthToken(expiredToken(secret))
    await client.queryContinuId({ bundle: generateBundleHash(secret), token: 'USER' })

    expect(mutate).toHaveBeenCalledTimes(3)
    expect(proposedAtoms(mutate, 2)[0].token).toBe('USER')
    expect(client.getAuthToken()!.isExpired()).toBe(false)
    expect(authInProcess(client)).toBe(false)
  })

  it('is held by a direct requestProfileAuthToken, so its own requests do not start a second login', async () => {
    const { client, mutate } = stubbedClient(secret, pointer, ['accepted', 'accepted'])
    client.setAuthToken(expiredToken(secret))

    await client.requestProfileAuthToken({ secret, encrypt: false })

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(proposedAtoms(mutate, 0)[0].token).toBe('USER')
    expect(client.getAuthToken()!.isExpired()).toBe(false)
    expect(authInProcess(client)).toBe(false)
  })

  it('is held by a direct requestGuestAuthToken, so its request does not start a second login', async () => {
    const { client, mutate } = stubbedClient(secret, pointer, [])
    mutate.mockResolvedValue({
      data: {
        AccessToken: { token: 'guest', pubkey: 'stub-server-pubkey', expiresAt: Math.floor(Date.now() / 1000) + 3600 }
      }
    })
    client.setAuthToken(expiredToken(secret))

    await client.requestGuestAuthToken({ cellSlug: 'test', encrypt: false })

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(authInProcess(client)).toBe(false)
  })
})

describe('Authorization molecules signed from a USER wallet', () => {
  const authMolecule = (secret: string, token: string): Molecule => {
    const molecule = new Molecule({
      secret,
      sourceWallet: new Wallet({ secret, token, position: CONTINUID_POSITION }),
      remainderWallet: Wallet.create({ secret, bundle: generateBundleHash(secret) })
    })
    molecule.initAuthorization({ meta: { encrypt: 'false' } })
    molecule.sign({})
    return molecule
  }

  it('pass the local U-isotope check for USER and AUTH, and still fail for any other token', () => {
    const secret = generateSecret()
    expect(authMolecule(secret, 'USER').check()).toBe(true)
    expect(authMolecule(secret, 'AUTH').check()).toBe(true)
    expect(() => authMolecule(secret, 'TEST').check()).toThrow(WrongTokenTypeException)
  })

  it('restore from a session snapshot with the same token, address and ML-KEM key', () => {
    const secret = generateSecret()
    const wallet = new Wallet({ secret, token: 'USER', position: CONTINUID_POSITION })
    const snapshot = AuthToken.create(
      { token: 'T', expiresAt: 9999999999, pubkey: 'stub-server-pubkey', encrypt: true },
      wallet
    ).toSnapshot()

    const restored = AuthToken.restore(snapshot, secret).getWallet()!
    expect(restored.token).toBe('USER')
    expect(restored.address).toBe(wallet.address)
    expect(restored.pubkey).toBe(wallet.pubkey)

    // A snapshot persisted before the token was recorded can only be an AUTH session.
    const { token: _token, ...legacyWallet } = snapshot.wallet!
    const legacy = AuthToken.restore({ ...snapshot, wallet: legacyWallet }, secret).getWallet()!
    expect(legacy.token).toBe('AUTH')
    expect(legacy.address).toBe(new Wallet({ secret, token: 'AUTH', position: CONTINUID_POSITION }).address)
  })
})
