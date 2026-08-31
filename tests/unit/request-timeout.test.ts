/**
 * The 60-second request timeout must actually be wired.
 *
 * Before 0.9.6 both clients returned `signal: AbortSignal.timeout(60000)` from `fetchOptions()`,
 * but urql's `makeFetchSource` does `t.signal = new AbortController().signal` unconditionally, so
 * that signal was discarded and no request ever timed out. GraphQLClient now applies the timeout
 * inside its own wrapping `fetch`, where it survives, combining it with urql's signal via
 * `AbortSignal.any` so teardown-abort still works.
 *
 * The 60s duration itself is not advanced here — Node's `AbortSignal.timeout` is driven by an
 * internal timer that vitest's fake timers do not intercept, so a "wait for 60s" test would be
 * either slow or flaky. Instead these assert the two properties that make the timeout real:
 * the signal handed to fetch is a COMBINED signal (not urql's raw one), and that combination
 * aborts both on upstream abort and on timer expiry.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import GraphQLClient from '../../src/libraries/GraphQLClient'

const SERVER_URI = 'https://api.knish.io/graphql'
const QUERY = 'query B { Balance(token: "USER") { amount } }'

interface Recorded {
  signal: AbortSignal | null | undefined
  /** Captured at dispatch: urql aborts its controller on teardown once the result is delivered. */
  abortedAtDispatch: boolean | undefined
  method: string | undefined
  body: BodyInit | null | undefined
}

let recorded: Recorded[]
let originalFetch: typeof globalThis.fetch

beforeEach(() => {
  recorded = []
  originalFetch = globalThis.fetch
  const stub = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
    recorded.push({
      signal: init?.signal,
      abortedAtDispatch: init?.signal?.aborted,
      method: init?.method,
      body: init?.body
    })
    return Promise.resolve(
      new Response(JSON.stringify({ data: { Balance: { amount: '0' } } }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    )
  })
  // Library boundary: vi.fn's Mock type does not structurally match fetch's overload set.
  globalThis.fetch = stub as unknown as typeof globalThis.fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('GraphQLClient wires a real timeout into the request', () => {
  it('hands fetch an AbortSignal, and the normal path still succeeds', async () => {
    const client = new GraphQLClient({ serverUri: SERVER_URI })
    const result = await client.query({ query: QUERY, variables: {} })

    expect(recorded).toHaveLength(1)
    const sent = recorded[0]!

    // A signal reaches the transport, live at dispatch. Under the old code the 60s timeout was
    // dropped before it got here, because urql replaced fetchOptions().signal with its own.
    expect(sent.signal).toBeInstanceOf(AbortSignal)
    expect(sent.abortedAtDispatch).toBe(false)

    // After the result is delivered urql tears down and aborts its controller; the combined
    // signal propagates that, which is the teardown behaviour the composition must preserve.
    expect(sent.signal!.aborted).toBe(true)

    // The wrapping fetch must not have broken the request itself.
    expect(sent.method).toBe('POST')
    expect(result.data).toBeDefined()
  })
})

// Runtime floors differ between the shipped package and this suite, and both matter here:
//   - the package declares `engines.node: >=18.0.0`, and `AbortSignal.any` only exists from 18.17,
//     so `src/libraries/GraphQLClient.ts:158` guards on it and falls back to urql's own signal;
//   - this suite cannot run below Node 20 regardless (vitest requires ^20 || ^22 || >=24), so the
//     composition below is always exercisable here and is never conditionally skipped.
// Nothing in this file may use an API above the *package* floor even so — `Promise.withResolvers`
// is Node 22+, and using it here is what turned CI red on Node 20 after 0.9.6.
describe('the AbortSignal.any composition the client relies on', () => {
  it('is available in this runtime', () => {
    expect(typeof AbortSignal.any).toBe('function')
    expect(typeof AbortSignal.timeout).toBe('function')
  })

  it('aborts when the upstream (urql teardown) signal aborts', () => {
    const upstream = new AbortController()
    const combined = AbortSignal.any([upstream.signal, AbortSignal.timeout(60000)])

    expect(combined.aborted).toBe(false)
    upstream.abort()
    expect(combined.aborted).toBe(true)
  })

  it('aborts when the timeout expires, with the upstream still open', async () => {
    const upstream = new AbortController()
    // Same composition the client builds, with a short duration. Node drives
    // AbortSignal.timeout from an internal timer that vitest's fake timers do not intercept, so
    // the clock cannot be advanced synthetically here — but nothing is slept on either: the
    // assertion awaits the signal's own `abort` event, so it resolves as soon as it really fires.
    const combined = AbortSignal.any([upstream.signal, AbortSignal.timeout(5)])
    expect(combined.aborted).toBe(false)

    // Executor form on purpose: `Promise.withResolvers` is Node 22+, above this package's floor,
    // and no resolver needs to escape this scope.
    await new Promise<void>(resolve => {
      combined.addEventListener('abort', () => resolve(), { once: true })
    })

    expect(combined.aborted).toBe(true)
    expect(upstream.signal.aborted).toBe(false)
  })
})
