/**
 * signingWallet meta forgery (WOTS+ mitigation plan §8 Phase 0.2)
 *
 * The fixture was built by the JS reference (@wishknish/knishio-client-js 1.2.1), whose
 * `check()` accepts both molecules:
 *   - `genuine`: an M-isotope meta molecule signed normally by wallet B;
 *   - `forged`: the same build, but atoms[0].walletAddress claims victim wallet A while the OTS
 *     signature is B's, and atoms[0].meta carries a `signingWallet` naming B.
 *
 * A verifier that honours the `signingWallet` meta checks the signature against B's address and
 * reports `forged` valid, attributing it to A. Offline verifiers (knishproof) rely on `check()`,
 * so the address recovered from the signature must be compared with atoms[0].walletAddress only.
 * Validator 0.5.0 rejects the meta on every isotope.
 *
 * The fixture is shared byte-for-byte by all eight SDKs; never edit it.
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'
import Molecule from '../../src/core/Molecule'
import { SignatureMismatchException } from '../../src/exception'

interface ForgeryFixture {
  source: string
  victimAddress: string
  attackerAddress: string
  genuine: Record<string, unknown>
  forged: Record<string, unknown>
}

const FIXTURE = resolve(__dirname, '../fixtures/signing-wallet-forgery.json')
const fixture: ForgeryFixture = JSON.parse(readFileSync(FIXTURE, 'utf8'))

describe('signingWallet meta forgery fixture', () => {
  it('verifies the genuine molecule signed by its own wallet', () => {
    const genuine = Molecule.fromJSON(fixture.genuine)

    expect(genuine.check()).toBe(true)
  })

  it('rejects a molecule claiming the victim address but signed by the attacker', () => {
    const forged = Molecule.fromJSON(fixture.forged)

    expect(forged.atoms[0]!.walletAddress).toBe(fixture.victimAddress)
    expect(fixture.victimAddress).not.toBe(fixture.attackerAddress)
    expect(() => forged.check()).toThrow(SignatureMismatchException)
  })
})
