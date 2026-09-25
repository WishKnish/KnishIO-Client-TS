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
import Wallet from '../../src/core/Wallet'
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
