/**
 * Unit tests for KnishIOClient position-drift handling.
 *
 * Covers:
 *   1. withMoleculeLock serializes concurrent work (no validator round-trip)
 *   2. handlePositionDrift clears cached wallet state on position-related
 *      rejection exception classes, and leaves it alone otherwise.
 *
 * Both methods are private; tests access them via `as any` since the
 * behavior (not the surface) is what we care about preserving across
 * future refactors.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import KnishIOClient from '../../src/KnishIOClient'
import ResponseProposeMolecule from '../../src/response/ResponseProposeMolecule'

// Construct a client with the smallest config that won't trip validation.
// We never actually call execute() — only the lock + invalidation helpers.
const newClient = (): KnishIOClient =>
  new KnishIOClient({
    uri: 'https://test.local/graphql',
    cellSlug: 'test',
    logging: false
  })

const stubQuery = (): any => ({ molecule: () => null })

const responseFor = (status: string, reason: string): ResponseProposeMolecule =>
  new ResponseProposeMolecule({
    query: stubQuery(),
    json: { data: { ProposeMolecule: { status, reason, payload: null } } }
  })

describe('KnishIOClient::withMoleculeLock', () => {
  it('serializes concurrent work in submission order', async () => {
    const client = newClient() as any
    const log: string[] = []

    const job = (id: string, delayMs: number) =>
      client.withMoleculeLock(async () => {
        log.push(`${id}:start`)
        await new Promise(r => setTimeout(r, delayMs))
        log.push(`${id}:end`)
      })

    // Fire three jobs concurrently; faster jobs queued later must still
    // wait for earlier jobs to finish.
    await Promise.all([
      job('A', 40),
      job('B', 5),
      job('C', 5)
    ])

    expect(log).toEqual([
      'A:start', 'A:end',
      'B:start', 'B:end',
      'C:start', 'C:end'
    ])
  })

  it('releases the lock when the inner function throws', async () => {
    const client = newClient() as any
    const log: string[] = []

    await Promise.allSettled([
      client.withMoleculeLock(async () => {
        log.push('A:start')
        throw new Error('boom')
      }),
      client.withMoleculeLock(async () => {
        log.push('B:start')
      })
    ])

    expect(log).toEqual(['A:start', 'B:start'])
  })

  it('returns the inner function value', async () => {
    const client = newClient() as any
    const value = await client.withMoleculeLock(async () => 42)
    expect(value).toBe(42)
  })
})

describe('KnishIOClient::handlePositionDrift', () => {
  let client: any
  beforeEach(() => {
    client = newClient() as any
    // Pre-populate cache with sentinel values we can assert got cleared.
    client.$__remainderWallet = { sentinel: 'remainder' }
    client.lastMoleculeQuery = { sentinel: 'lastQuery' }
  })

  it('clears cache on MolecularHashMismatch rejection', () => {
    client.handlePositionDrift(responseFor('rejected', 'MolecularHashMismatch detected'))
    expect(client.$__remainderWallet).toBeNull()
    expect(client.lastMoleculeQuery).toBeNull()
  })

  it('clears cache on OTS position-reuse rejection', () => {
    client.handlePositionDrift(responseFor('rejected', 'OTS position reuse rejected'))
    expect(client.$__remainderWallet).toBeNull()
    expect(client.lastMoleculeQuery).toBeNull()
  })

  it('clears cache on ContinuID chain violation', () => {
    client.handlePositionDrift(responseFor('rejected', 'ContinuID chain violation'))
    expect(client.$__remainderWallet).toBeNull()
    expect(client.lastMoleculeQuery).toBeNull()
  })

  it('does NOT clear cache on generic signature verification failure', () => {
    // VERIFICATION_FAILED (without OTS) means bad signature bytes, not
    // position drift — preserve cache.
    client.handlePositionDrift(responseFor('rejected', 'Signature verification failed'))
    expect(client.$__remainderWallet).not.toBeNull()
    expect(client.lastMoleculeQuery).not.toBeNull()
  })

  it('does NOT clear cache on unclassified rejection', () => {
    client.handlePositionDrift(responseFor('rejected', 'Insufficient balance'))
    expect(client.$__remainderWallet).not.toBeNull()
    expect(client.lastMoleculeQuery).not.toBeNull()
  })

  it('does NOT clear cache on accepted response', () => {
    client.handlePositionDrift(responseFor('accepted', ''))
    expect(client.$__remainderWallet).not.toBeNull()
    expect(client.lastMoleculeQuery).not.toBeNull()
  })

  it('does NOT clear cache for non-ProposeMolecule responses', () => {
    client.handlePositionDrift(null)
    expect(client.$__remainderWallet).not.toBeNull()
    expect(client.lastMoleculeQuery).not.toBeNull()

    const otherResponse = { success: () => false, reason: () => 'something' }
    client.handlePositionDrift(otherResponse as any)
    expect(client.$__remainderWallet).not.toBeNull()
    expect(client.lastMoleculeQuery).not.toBeNull()
  })
})
