/**
 * Wire-method guard for @urql/core 6.
 *
 * urql 5 had no `preferGetMethod` default, so every operation was a POST. urql 6.0.3 defaults it
 * to 'within-url-limit': query-kind operations URL-encode query+variables, OMIT the body, and go
 * out as GET unless the URL exceeds 2047 characters.
 *
 * For this SDK that is a silent confidentiality regression rather than an error. When encryption
 * is on, GraphQLClient swaps in `cipherFetch`, which gates on `typeof init.body === 'string'`
 * (GraphQLClient.ts:192). A GET has no body, so the guard fails, the request passes through
 * unencrypted as URL parameters, and it still succeeds — X-Auth-Token rides on a GET fine. No
 * existing test catches this: cipherhash-live.test.ts compares an encrypted leg against a
 * plaintext leg with toEqual, so both degrading equally still passes, and it is skipped unless
 * CIPHERHASH_TEST_URL is set.
 *
 * Both client constructions therefore pin `preferGetMethod: false`. These tests fail if either
 * one loses it, or if a future urql changes the default again.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import GraphQLClient from '../../src/libraries/GraphQLClient'
import UrqlClientWrapper from '../../src/libraries/UrqlClientWrapper'

const SERVER_URI = 'https://api.knish.io/graphql'

// Deliberately far under urql 6's 2047-character URL limit, so the default would pick GET.
const SHORT_QUERY = 'query B { Balance(token: "USER") { amount } }'

interface Recorded {
  url: string
  method: string | undefined
  body: BodyInit | null | undefined
}

let recorded: Recorded[]
let originalFetch: typeof globalThis.fetch

beforeEach(() => {
  recorded = []
  originalFetch = globalThis.fetch
  const stub = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    recorded.push({ url: String(input), method: init?.method, body: init?.body })
    return Promise.resolve(
      new Response(JSON.stringify({ data: { Balance: { amount: '0' } } }), {
        status: 200,
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

describe('GraphQLClient sends queries as POST under urql 6', () => {
  it('uses POST with the query in the body, not the URL', async () => {
    const client = new GraphQLClient({ serverUri: SERVER_URI })
    await client.query({ query: SHORT_QUERY, variables: {} })

    expect(recorded).toHaveLength(1)
    const sent = recorded[0]!

    expect(sent.method).toBe('POST')
    expect(typeof sent.body).toBe('string')
    expect(String(sent.body)).toContain('Balance')
    // A GET would have moved the query into the query string.
    expect(sent.url).toBe(SERVER_URI)
    expect(sent.url).not.toContain('Balance')
  })
})

describe('UrqlClientWrapper sends queries as POST under urql 6', () => {
  it('uses POST with the query in the body, not the URL', async () => {
    const client = new UrqlClientWrapper({ serverUri: SERVER_URI })
    await client.query({ query: SHORT_QUERY, variables: {} })

    expect(recorded).toHaveLength(1)
    const sent = recorded[0]!

    expect(sent.method).toBe('POST')
    expect(typeof sent.body).toBe('string')
    expect(String(sent.body)).toContain('Balance')
    expect(sent.url).toBe(SERVER_URI)
    expect(sent.url).not.toContain('Balance')
  })
})

describe('the encrypted transport still has a body to encrypt', () => {
  it('gives cipherFetch a JSON-parseable string body', async () => {
    // cipherLink on. Without wallet/pubkey set, cipherFetch forwards rather than encrypting, but
    // it still receives `init` — and `typeof init.body === 'string'` is the guard that decides
    // whether encryption happens at all. Under a GET default this would be `undefined`.
    const client = new GraphQLClient({ serverUri: SERVER_URI, encrypt: true })
    await client.query({ query: SHORT_QUERY, variables: {} })

    expect(recorded).toHaveLength(1)
    const sent = recorded[0]!

    expect(sent.method).toBe('POST')
    expect(typeof sent.body).toBe('string')
    expect(String(sent.body).length).toBeGreaterThan(0)
    expect(() => JSON.parse(String(sent.body))).not.toThrow()
    expect(JSON.parse(String(sent.body))).toHaveProperty('query')
  })
})
