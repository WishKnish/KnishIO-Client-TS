/**
 * Unit tests for ResponseProposeMolecule.toException()
 *
 * Pure-function tests against constructed response objects — no validator
 * needed. Locks in the rejection-text -> typed-exception mapping so future
 * validator phrasing changes don't silently break cache-invalidation logic
 * downstream.
 */

import { describe, it, expect } from 'vitest'
import ResponseProposeMolecule from '../../src/response/ResponseProposeMolecule'
import MolecularHashMismatchException from '../../src/exception/MolecularHashMismatchException'
import SignatureMismatchException from '../../src/exception/SignatureMismatchException'
import AtomIndexException from '../../src/exception/AtomIndexException'

// Minimum stub for the constructor's `query` parameter — only needs a
// `molecule()` method (consumed in the constructor body).
const stubQuery = (): any => ({ molecule: () => null })

const makeResponse = (status: string, reason: string): ResponseProposeMolecule =>
  new ResponseProposeMolecule({
    query: stubQuery(),
    json: { data: { ProposeMolecule: { status, reason, payload: null } } }
  })

describe('ResponseProposeMolecule.toException', () => {
  it('returns null on success', () => {
    const r = makeResponse('accepted', '')
    expect(r.success()).toBe(true)
    expect(r.toException()).toBeNull()
  })

  it('classifies MolecularHashMismatch rejections as MolecularHashMismatchException', () => {
    const cases = [
      'Signature verification failed: MolecularHashMismatch',
      'molecular hash mismatch on atom 3',
      'Hash mismatch detected'
    ]
    for (const reason of cases) {
      const exc = makeResponse('rejected', reason).toException()
      expect(exc).toBeInstanceOf(MolecularHashMismatchException)
      expect(exc?.code).toBe('HASH_MISMATCH')
      expect(exc?.message).toBe(reason)
    }
  })

  it('classifies OTS position-reuse rejections as SignatureMismatchException with OTS_VERIFICATION_FAILED', () => {
    const cases = [
      'OTS position reuse rejected',
      'OTS position already used by another molecule',
      'position already used',
      'OTS verification failed for this signing position'
    ]
    for (const reason of cases) {
      const exc = makeResponse('rejected', reason).toException()
      expect(exc).toBeInstanceOf(SignatureMismatchException)
      expect(exc?.code).toBe('OTS_VERIFICATION_FAILED')
    }
  })

  it('classifies the validator 0.5.0 OTS key-reuse wording as OTS_VERIFICATION_FAILED', () => {
    // Validator 0.5.0 (f120a65) consumes the signing key at insert and words the rejection as key
    // reuse. handlePositionDrift keys on this class to drop a stale cached remainder.
    const reason = 'OTS key reuse rejected (NIST SP 800-208): signing key at position ' +
      '06ed6327dd3c4c63d0d2e3b594b92a3ef59c50479c3413079c1b5614953123e5 is already consumed'
    const exc = makeResponse('rejected', reason).toException()
    expect(exc).toBeInstanceOf(SignatureMismatchException)
    expect(exc?.code).toBe('OTS_VERIFICATION_FAILED')
  })

  it('classifies ContinuID chain violations as AtomIndexException with INDEX_CONFLICT', () => {
    const cases = [
      'ContinuID chain violation: previousPosition mismatch',
      'previousPosition does not match chain head',
      'chain violation in I-isotope atom'
    ]
    for (const reason of cases) {
      const exc = makeResponse('rejected', reason).toException()
      expect(exc).toBeInstanceOf(AtomIndexException)
      expect(exc?.code).toBe('INDEX_CONFLICT')
    }
  })

  it('classifies generic signature failures as SignatureMismatchException with VERIFICATION_FAILED', () => {
    const exc = makeResponse('rejected', 'Signature verification failed').toException()
    expect(exc).toBeInstanceOf(SignatureMismatchException)
    expect(exc?.code).toBe('VERIFICATION_FAILED')
  })

  // Validator 0.5.0 texts, verbatim (signature_verifier.rs, graphql/schema.rs). Each must reach its
  // own branch: the earlier OTS / chain / signature patterns must not claim either one first.
  const SIGNER_MISMATCH = 'Signer address mismatch: atom declares 1111, but the wallet registered ' +
    'for bundle bbbb token USER at position 2222 is 3333'
  const ORIGIN_PENDING = 'No accepted origin available — origin still pending after timeout. ' +
    "This molecule's signing key is consumed; re-send from the next position."

  it('classifies the validator 0.5.0 signer-binding rejection as SIGNER_ADDRESS_MISMATCH', () => {
    const exc = makeResponse('rejected', SIGNER_MISMATCH).toException()
    expect(exc).toBeInstanceOf(SignatureMismatchException)
    expect(exc?.code).toBe('SIGNER_ADDRESS_MISMATCH')
  })

  it('classifies the validator 0.5.0 pending-origin rejection as AtomIndexException with ORIGIN_PENDING', () => {
    // The validator consumed the signing key and advanced the chain, so this is position drift.
    const exc = makeResponse('rejected', ORIGIN_PENDING).toException()
    expect(exc).toBeInstanceOf(AtomIndexException)
    expect(exc?.code).toBe('ORIGIN_PENDING')
  })

  it('returns null for unclassified rejections', () => {
    // Genuine rejections that don't match any known pattern — caller should
    // fall back to inspecting .reason() text directly.
    const cases = [
      'Insufficient balance for token transfer',
      'Cell slug does not exist',
      'Rate limit exceeded',
      'Validator is shutting down'
    ]
    for (const reason of cases) {
      const r = makeResponse('rejected', reason)
      expect(r.success()).toBe(false)
      expect(r.toException()).toBeNull()
    }
  })
})
