/**
 * Buffer-family conservation — verifies the TS SDK against the shared
 * canonical-patent-vectors.json (buffer_deposit_conservation +
 * buffer_withdraw_conservation). Sibling of the family's buffer-conservation
 * tests (JS patent-vectors.test.js, PHP/Kotlin PatentVectorValidationTest,
 * Rust/Python patent_vector tests). TS's initDepositBuffer/initWithdrawBuffer
 * already debit the FULL source balance (-Number(balance)); this regression-locks
 * that so a PARTIAL deposit/withdraw still conserves (sum of all V+B atom values == 0,
 * the validator's b_isotope conservation check). Cross-SDK parity lock (cycle 150).
 *
 * Deposit emits V(source -balance) B(buffer +amount) V(remainder +(balance-amount));
 * withdraw emits B(source -balance) V(recipient +amount) B(remainder +(balance-amount)).
 *
 * Standalone-CI note: this statically imports the monorepo-parent master, which is
 * ABSENT in a standalone GitHub checkout — vitest.config.ts gates it out via
 * `canonicalVectorsPresent` (mirrors the generate-secret-parity.test.ts gate).
 */

import { describe, it, expect } from 'vitest'
import Wallet from '../../src/core/Wallet'
import Molecule from '../../src/core/Molecule'
import vectorsJson from '../../../shared-test-results/canonical-patent-vectors.json'

const BUF_SECRET = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

const vectors = (vectorsJson as {
  vectors: {
    buffer_deposit_conservation: {
      tests: Array<{
        name: string
        sourceBalance: number
        amount: number
        expectedSourceValue: string
        expectedBufferValue: string
        expectedRemainderValue: string
        expectedSum: string
      }>
    }
    buffer_withdraw_conservation: {
      tests: Array<{
        name: string
        sourceBalance: number
        amount: number
        expectedSourceValue: string
        expectedRecipientValue: string
        expectedRemainderValue: string
        expectedSum: string
      }>
    }
  }
}).vectors

describe('buffer_deposit_conservation', () => {
  it.each(vectors.buffer_deposit_conservation.tests)(
    'deposit $name: full-balance debit conserves (sum V+B = 0)',
    (vector) => {
      const sourceWallet = Wallet.create({ secret: BUF_SECRET, token: 'BUFTOK' })
      sourceWallet.balance = String(vector.sourceBalance)
      const mol = new Molecule({ secret: BUF_SECRET, bundle: sourceWallet.bundle, sourceWallet, cellSlug: 'buftest' })
      mol.initDepositBuffer({ amount: vector.amount, tradeRates: {} })

      const vb = mol.atoms.filter((a) => a.isotope === 'V' || a.isotope === 'B')
      const sum = vb.reduce((s, a) => s + BigInt(a.value ?? '0'), 0n)
      expect(sum.toString()).toBe(vector.expectedSum)

      // Emit order: source V (full-balance debit), buffer B (+amount), remainder V (+change).
      const vAtoms = mol.atoms.filter((a) => a.isotope === 'V')
      const bAtom = mol.atoms.find((a) => a.isotope === 'B')
      expect(vAtoms[0].value).toBe(vector.expectedSourceValue)
      expect(bAtom?.value).toBe(vector.expectedBufferValue)
      expect(vAtoms[1].value).toBe(vector.expectedRemainderValue)
    },
  )
})

describe('buffer_withdraw_conservation', () => {
  it.each(vectors.buffer_withdraw_conservation.tests)(
    'withdraw $name: full-balance debit conserves (sum B+V = 0)',
    (vector) => {
      const sourceWallet = Wallet.create({ secret: BUF_SECRET, token: 'BUFTOK' })
      sourceWallet.balance = String(vector.sourceBalance)
      const mol = new Molecule({ secret: BUF_SECRET, bundle: sourceWallet.bundle, sourceWallet, cellSlug: 'buftest' })
      // Withdraw `amount` to the caller's own bundle (single recipient), mirroring the client wrapper.
      mol.initWithdrawBuffer({ recipients: { [sourceWallet.bundle!]: vector.amount } })

      const vb = mol.atoms.filter((a) => a.isotope === 'V' || a.isotope === 'B')
      const sum = vb.reduce((s, a) => s + BigInt(a.value ?? '0'), 0n)
      expect(sum.toString()).toBe(vector.expectedSum)

      // Emit order: source B (full-balance debit), recipient V (+amount), remainder B (+change).
      const bAtoms = mol.atoms.filter((a) => a.isotope === 'B')
      const vAtom = mol.atoms.find((a) => a.isotope === 'V')
      expect(bAtoms[0].value).toBe(vector.expectedSourceValue)
      expect(vAtom?.value).toBe(vector.expectedRecipientValue)
      expect(bAtoms[1].value).toBe(vector.expectedRemainderValue)
    },
  )
})
