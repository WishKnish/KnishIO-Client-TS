/**
 * Regression test for the urql context-passthrough fix.
 *
 * GraphQLClient.query()/mutation() previously destructured only {query,
 * variables} and called the urql client with two args, silently dropping the
 * `context` that Query.execute() assembles. That made `requestPolicy:
 * 'network-only'` a no-op (urql fell back to cache-first), causing a
 * long-lived client to serve stale/empty query results.
 *
 * These tests pin that query()/mutation() forward the context (3rd arg) to the
 * underlying urql client.
 */
import { describe, it, expect } from 'vitest'
import GraphQLClient from '../../src/libraries/GraphQLClient'

function clientWithCapturingUrql() {
  const gc = new GraphQLClient({ serverUri: 'https://test.local/graphql' }) as any
  const calls: { method: string; query: any; variables: any; context: any }[] = []
  const result = { toPromise: async () => ({ data: {}, error: undefined }) }
  gc.$__client = {
    query: (query: any, variables: any, context: any) => {
      calls.push({ method: 'query', query, variables, context })
      return result
    },
    mutation: (query: any, variables: any, context: any) => {
      calls.push({ method: 'mutation', query, variables, context })
      return result
    }
  }
  return { gc, calls }
}

describe('GraphQLClient context passthrough', () => {
  it('query() forwards context.requestPolicy to the urql client (3rd arg)', async () => {
    const { gc, calls } = clientWithCapturingUrql()
    await gc.query({
      query: 'query { x }',
      variables: { a: 1 },
      context: { requestPolicy: 'network-only' }
    })
    expect(calls).toHaveLength(1)
    expect(calls[0].variables).toEqual({ a: 1 })
    expect(calls[0].context).toEqual({ requestPolicy: 'network-only' })
  })

  it('mutation() forwards context to the urql client (3rd arg)', async () => {
    const { gc, calls } = clientWithCapturingUrql()
    await gc.mutation({
      query: 'mutation { y }',
      variables: { b: 2 },
      context: { requestPolicy: 'network-only' }
    })
    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe('mutation')
    expect(calls[0].context).toEqual({ requestPolicy: 'network-only' })
  })

  it('query() without context passes undefined (urql default policy)', async () => {
    const { gc, calls } = clientWithCapturingUrql()
    await gc.query({ query: 'query { z }', variables: {} })
    expect(calls[0].context).toBeUndefined()
  })
})
