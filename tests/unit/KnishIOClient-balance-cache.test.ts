/**
 * Regression test: the reads that pick a wallet to spend must not come from the urql cache.
 *
 * GraphQLClient builds urql with `cacheExchange`, whose default policy is cache-first. A
 * long-lived KnishIOClient therefore answered a repeated `Balance` query from memory. Live on
 * testnet (validator 0.6.0, SDK 1.3.0): createToken (1000) → transferToken 10 (accepted; the
 * source wallet was spent, the 990 remainder moved to a new position) → a second burnTokens /
 * transferToken of the same token re-read the PRE-transfer wallet from the cache, signed with
 * its consumed one-time key, and the validator rejected it with "OTS key reuse rejected
 * (NIST SP 800-208)". querySourceWallet (transferToken, transferTokens, burnTokens,
 * depositBufferToken) and replenishToken all read through QueryBalance; claimShadowWallet(s)
 * picks the wallet to claim from QueryWalletList. QueryContinuId was already network-only.
 *
 * These tests drive the real urql client (cacheExchange + fetchExchange) with a stubbed fetch
 * that answers each request with the next ledger state, so a cache hit shows up both as a
 * missing request and as the stale wallet coming back.
 */
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import KnishIOClient from '../../src/KnishIOClient'
import type Wallet from '../../src/core/Wallet'

const TOKEN = 'CACHETEST'
const SECRET = 'a1b2c3d4'.repeat(256)

// The live wallets, padded to full length: spent pre-transfer source and its 990 remainder.
const SPENT = { address: '2e9d38'.padEnd(64, 'a'), position: '58eaa4'.padEnd(64, 'b'), amount: '1000' }
const REMAINDER = { address: '93f7b6'.padEnd(64, 'c'), position: 'dfa557'.padEnd(64, 'd'), amount: '990' }

let originalFetch: typeof globalThis.fetch
let fetchStub: Mock

/** Answers the n-th request with the n-th body; the ledger moves between calls. */
function stubFetchSequence(bodies: unknown[]): void {
  let call = 0
  fetchStub = vi.fn(() => {
    const body = bodies[Math.min(call, bodies.length - 1)]
    call += 1
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    )
  })
  // Library boundary: vi.fn's Mock type does not structurally match the full fetch overload set.
  globalThis.fetch = fetchStub as unknown as typeof globalThis.fetch
}

function newClient(): KnishIOClient {
  const client = new KnishIOClient({ uri: 'https://test.local/graphql', cellSlug: 'test', logging: false })
  client.setSecret(SECRET)
  return client
}

interface LedgerWallet {
  address: string | null
  position: string | null
  amount: string
}

function walletJson(client: KnishIOClient, wallet: LedgerWallet, batchId: string | null = null): Record<string, unknown> {
  return {
    __typename: 'Wallet',
    address: wallet.address,
    bundleHash: client.getBundle(),
    type: 'regular',
    tokenSlug: TOKEN,
    batchId,
    position: wallet.position,
    amount: wallet.amount,
    characters: 'BASE64',
    pubkey: null,
    createdAt: '1790000000000',
    tokenUnits: [],
    tradeRates: []
  }
}

beforeEach(() => {
  originalFetch = globalThis.fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('KnishIOClient wallet-selection reads bypass the urql cache', () => {
  it('queryBalance returns the post-transfer remainder on a second call, not the cached spent wallet', async () => {
    const client = newClient()
    stubFetchSequence([
      { data: { Balance: walletJson(client, SPENT) } },
      { data: { Balance: walletJson(client, REMAINDER) } }
    ])

    const first = (await client.queryBalance({ token: TOKEN })).payload() as Wallet | null
    expect(first?.position).toBe(SPENT.position)

    // The transfer that spends SPENT is accepted between these reads.
    const second = (await client.queryBalance({ token: TOKEN })).payload() as Wallet | null

    expect(second?.position).toBe(REMAINDER.position)
    expect(second?.address).toBe(REMAINDER.address)
    expect(second?.balance).toBe('990')
    expect(fetchStub).toHaveBeenCalledTimes(2)
  })

  it('queryWallets returns the claimed wallet on a second call, not the cached shadow wallet', async () => {
    const client = newClient()
    const shadow: LedgerWallet = { address: null, position: null, amount: '10' }
    const claimed: LedgerWallet = { address: '4c11aa'.padEnd(64, 'e'), position: '7d22bb'.padEnd(64, 'f'), amount: '10' }
    stubFetchSequence([
      { data: { Wallet: [walletJson(client, shadow, 'batch-1')] } },
      { data: { Wallet: [walletJson(client, claimed, 'batch-1')] } }
    ])

    const before = await client.queryWallets({ token: TOKEN })
    expect(before[0]!.isShadow()).toBe(true)

    // claimShadowWallet({ token }) for batch-1 is accepted between these reads.
    const after = await client.queryWallets({ token: TOKEN })

    expect(after[0]!.isShadow()).toBe(false)
    expect(after[0]!.address).toBe(claimed.address)
    expect(fetchStub).toHaveBeenCalledTimes(2)
  })
})
