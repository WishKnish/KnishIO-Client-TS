/**
 * Encrypted transport must fail CLOSED (PQ-transport Phase E).
 *
 * An encryption-enabled client that has no authorized wallet or no validator ML-KEM public key
 * used to fall through to the plaintext body: `cipherFetch` gated encryption on
 * `wallet && serverPubkey && …`, and when that was false it simply POSTed the unencrypted
 * operation. The caller asked for an encrypted transport and silently got none — no error, no
 * log, confidential request on the wire.
 *
 * PHP (Libraries/Cipher.php) and Kotlin (httpClient/HttpClient.kt) already threw
 * `Authorized wallet missing.` / `Server public key missing.` in exactly this situation; these
 * tests pin the same behaviour for TypeScript.
 *
 * The bypass set must keep working: the auth bootstrap (`__schema`, `ContinuId`, `AccessToken`,
 * U-isotope `ProposeMolecule`) cannot be encrypted, because the server pubkey is what it is
 * fetching. If those raised, an encrypted client could never authenticate at all.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import GraphQLClient from '../../src/libraries/GraphQLClient'
import Wallet from '../../src/core/Wallet'

const SERVER_URI = 'https://test.local/graphql'
const SECRET = 'a1b2c3d4e5f6'.repeat(8)
const BALANCE_QUERY = 'query B { Balance(token: "USER") { address } }'
const INTROSPECTION_QUERY = 'query { __schema { types { name } } }'

let sent: Array<{ url: string; body: BodyInit | null | undefined }>
/** What the stub validator answers; reset before each test, overridden per test. */
let reply: { body: string; status: number }
let originalFetch: typeof globalThis.fetch

beforeEach(() => {
  sent = []
  reply = { body: JSON.stringify({ data: {} }), status: 200 }
  originalFetch = globalThis.fetch
  const stub = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    sent.push({ url: String(input), body: init?.body })
    return Promise.resolve(
      new Response(reply.body, {
        status: reply.status,
        headers: { 'content-type': 'application/json' }
      })
    )
  })
  // Library boundary: vi.fn's Mock type does not structurally match the full fetch overload set.
  globalThis.fetch = stub as unknown as typeof globalThis.fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

/**
 * urql surfaces a throwing fetch as a CombinedError networkError on the formatted response. The
 * declared `errors` type is the plain GraphQL error shape, so narrow at runtime rather than cast.
 */
const networkErrorMessage = (response: { errors?: unknown }): string | undefined => {
  const error: unknown = Array.isArray(response.errors) ? response.errors[0] : undefined
  if (typeof error !== 'object' || error === null) {
    return undefined
  }
  const networkError: unknown = 'networkError' in error ? error.networkError : undefined
  if (typeof networkError === 'object' && networkError !== null && 'message' in networkError) {
    return typeof networkError.message === 'string' ? networkError.message : undefined
  }
  return 'message' in error && typeof error.message === 'string' ? error.message : undefined
}

describe('an encryption-enabled client with no transport keys', () => {
  it('refuses to send a normal operation instead of downgrading to plaintext', async () => {
    const client = new GraphQLClient({ serverUri: SERVER_URI, encrypt: true })

    const response = await client.query({ query: BALANCE_QUERY, variables: {} })

    expect(networkErrorMessage(response)).toBe('Authorized wallet missing.')
    // The decisive assertion: nothing at all went on the wire.
    expect(sent).toHaveLength(0)
  })

  it('refuses when only the validator public key is missing', async () => {
    const client = new GraphQLClient({ serverUri: SERVER_URI, encrypt: true })
    client.setAuthData({ token: 'T', pubkey: '', wallet: new Wallet({ secret: SECRET, token: 'AUTH' }) })

    const response = await client.query({ query: BALANCE_QUERY, variables: {} })

    expect(networkErrorMessage(response)).toBe('Server public key missing.')
    expect(sent).toHaveLength(0)
  })

  it('still sends a bypassed operation in plaintext, so the auth bootstrap works', async () => {
    const client = new GraphQLClient({ serverUri: SERVER_URI, encrypt: true })

    const response = await client.query({ query: INTROSPECTION_QUERY, variables: {} })

    expect(response.errors).toBeUndefined()
    expect(sent).toHaveLength(1)
    expect(String(sent[0]!.body)).toContain('__schema')
  })
})

describe('an encryption-enabled client WITH transport keys', () => {
  it('wraps the operation in the CipherHash envelope', async () => {
    const wallet = new Wallet({ secret: SECRET, token: 'AUTH' })
    const client = new GraphQLClient({ serverUri: SERVER_URI, encrypt: true })
    client.setAuthData({ token: 'T', pubkey: wallet.pubkey as string, wallet })

    await client.query({ query: BALANCE_QUERY, variables: {} })

    expect(sent).toHaveLength(1)
    const body = JSON.parse(String(sent[0]!.body))
    expect(body.query).toContain('CipherHash')
    expect(typeof body.variables.Hash).toBe('string')
    expect(String(sent[0]!.body)).not.toContain('Balance')
  })
})

/**
 * The reply to a wrapped request fails closed too (same rule as PHP Cipher.php and C client.c):
 * it must be a CipherHash envelope that decrypts, or an errors-only reply. A plaintext `data`
 * reply used to be handed to the caller as if it had come through the encrypted transport.
 */
describe('the reply to an encrypted request', () => {
  const keyedClient = (): GraphQLClient => {
    const wallet = new Wallet({ secret: SECRET, token: 'AUTH' })
    const client = new GraphQLClient({ serverUri: SERVER_URI, encrypt: true })
    client.setAuthData({ token: 'T', pubkey: wallet.pubkey as string, wallet })
    return client
  }

  it('rejects a plaintext data reply to an encrypted request', async () => {
    reply = { body: JSON.stringify({ data: { Balance: { address: 'x' } } }), status: 200 }

    const response = await keyedClient().query({ query: BALANCE_QUERY, variables: {} })

    expect(networkErrorMessage(response)).toBe('CipherHash: plaintext reply to an encrypted request')
    expect(response.data).toBeUndefined()
  })

  it('passes an errors-only reply through', async () => {
    const message = 'CipherHash: no envelope addressed to the validator'
    reply = { body: JSON.stringify({ data: null, errors: [{ message }] }), status: 200 }

    const response = await keyedClient().query({ query: BALANCE_QUERY, variables: {} })

    expect(networkErrorMessage(response)).toContain(message)
  })

  it('rejects an envelope that does not decrypt', async () => {
    reply = { body: JSON.stringify({ data: { CipherHash: { hash: '{}' } } }), status: 200 }

    const response = await keyedClient().query({ query: BALANCE_QUERY, variables: {} })

    expect(networkErrorMessage(response)).toBe('CipherHash: reply could not be decrypted')
    expect(response.data).toBeUndefined()
  })

  it('rejects a non-JSON 200 reply', async () => {
    reply = { body: 'not json', status: 200 }

    const response = await keyedClient().query({ query: BALANCE_QUERY, variables: {} })

    expect(networkErrorMessage(response)).toBe('CipherHash: reply is not valid JSON')
  })
})
