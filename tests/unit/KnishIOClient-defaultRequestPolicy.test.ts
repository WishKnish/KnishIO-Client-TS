/**
 * defaultRequestPolicy client option.
 *
 * A long-lived KnishIOClient defaults to urql's cache-first policy, so any read
 * that omits an explicit requestPolicy can serve a stale cached result (e.g. a
 * meta queried before it existed). `defaultRequestPolicy` lets a server/sync
 * client opt into fresh-by-default reads ('network-only') so callers no longer
 * have to pass network-only on every queryMeta. Per-call policy still wins.
 */
import { describe, it, expect } from 'vitest'
import KnishIOClient from '../../src/KnishIOClient'

// A stand-in Query whose execute() captures the variables/context executeQuery
// forwards. It is NOT a MutationProposeMolecule, so executeQuery takes the
// normal (non-molecule) branch where the default policy is applied.
function fakeQuery() {
  const captured: { variables?: any; context?: any } = {}
  const obj = {
    execute: async ({ variables, context }: { variables?: any; context?: any } = {}) => {
      captured.variables = variables
      captured.context = context
      return null
    }
  }
  return { obj, captured }
}

describe('KnishIOClient defaultRequestPolicy', () => {
  it('applies defaultRequestPolicy to reads when the caller gives no per-call policy', async () => {
    const client = new KnishIOClient({ uri: 'https://test.local/graphql', defaultRequestPolicy: 'network-only' })
    const { obj, captured } = fakeQuery()
    await client.executeQuery(obj as any, { a: 1 })
    expect(captured.context).toEqual({ requestPolicy: 'network-only' })
  })

  it('lets an explicit per-call requestPolicy override the client default', async () => {
    const client = new KnishIOClient({ uri: 'https://test.local/graphql', defaultRequestPolicy: 'network-only' })
    const { obj, captured } = fakeQuery()
    await client.executeQuery(obj as any, { a: 1 }, { requestPolicy: 'cache-first' })
    expect(captured.context.requestPolicy).toBe('cache-first')
  })

  it('leaves context untouched when no default is set (urql default = cache-first)', async () => {
    const client = new KnishIOClient({ uri: 'https://test.local/graphql' })
    const { obj, captured } = fakeQuery()
    await client.executeQuery(obj as any, { a: 1 })
    expect(captured.context).toEqual({})
  })

  it('exposes get/setDefaultRequestPolicy', () => {
    const client = new KnishIOClient({ uri: 'https://test.local/graphql' })
    expect(client.getDefaultRequestPolicy()).toBeNull()
    client.setDefaultRequestPolicy('network-only')
    expect(client.getDefaultRequestPolicy()).toBe('network-only')
  })
})
