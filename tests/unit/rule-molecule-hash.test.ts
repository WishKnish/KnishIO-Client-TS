/**
 * R-isotope rule molecule hash invariance (zod 4.5 migration)
 *
 * The rule path is the ONLY place a zod parse feeds hashed bytes:
 *   Molecule.createRule -> Rule.toObject -> new Callback (zod parse of CallbackParamsSchema)
 *                                        -> Meta.toObject -> new Meta (zod parse of MetaDataSchema)
 *   -> JSON.stringify(rules) into AtomMeta 'rule' -> Atom.getHashableValues -> hashAtoms
 *   -> molecular hash -> WOTS+ signature.
 *
 * The expected values below were generated on the pre-migration tree (zod 3.25.76) and are
 * pasted in deliberately: a self-comparing test would prove nothing. If a schema edit ever
 * changes a parsed VALUE or its KEY ORDER, these assertions fail.
 *
 * `meta` keys are deliberately in non-alphabetical order so a key-order regression surfaces.
 *
 * The hash is taken over the R atom ALONE, not the whole molecule: `createRule` also appends
 * a ContinuID atom whose wallet position is freshly random on every run, which would make a
 * whole-molecule hash non-reproducible for reasons that have nothing to do with zod.
 */
import { describe, it, expect } from 'vitest'
import Wallet from '../../src/core/Wallet'
import Molecule from '../../src/core/Molecule'
import Rule from '../../src/instance/rules/Rule'
import Atom from '../../src/core/Atom'
import { generateSecret } from '../../src/libraries/crypto'

const TOKEN = 'TEST'
const SEED = 'rule-molecule-hash-fixed-seed'

// Fixed, non-alphabetical meta key order — JSON.stringify preserves insertion order, and
// Meta stores keys in the order zod's record parser emits them.
const RULE_INPUT = {
  condition: [
    { key: 'zeta', value: '100', comparison: '>=' },
    { key: 'alpha', value: 'USER', comparison: '=' }
  ],
  callback: [
    {
      action: 'meta',
      metaType: 'walletBundle',
      metaId: 'c'.repeat(64),
      meta: { zulu: 'last', alpha: 'first', mike: '42' }
    }
  ]
}

// Wallet positions and atom timestamps are otherwise random/clock-derived and both feed the
// hash, so every one is pinned. What remains variable is only what zod parses.
const SOURCE_POSITION = '1'.repeat(64)
const REMAINDER_POSITION = '2'.repeat(64)
const FIXED_CREATED_AT = '1700000000000'

const buildRuleAtom = () => {
  const secret = generateSecret(SEED)
  const source = new Wallet({ secret, token: TOKEN, position: SOURCE_POSITION })
  const remainder = new Wallet({ secret, token: TOKEN, position: REMAINDER_POSITION })

  const molecule = new Molecule({
    secret,
    sourceWallet: source,
    remainderWallet: remainder,
    cellSlug: 'test'
  })
  molecule.createdAt = FIXED_CREATED_AT

  molecule.createRule({
    metaType: 'walletBundle',
    metaId: 'd'.repeat(64),
    rule: [Rule.toObject(RULE_INPUT)]
  })

  const ruleAtom = molecule.atoms.find(a => a.isotope === 'R')
  if (!ruleAtom) {
    throw new Error('createRule did not produce an R-isotope atom')
  }
  ruleAtom.createdAt = FIXED_CREATED_AT
  ruleAtom.index = 0
  return ruleAtom
}

describe('R-isotope rule molecule: zod-parsed rule bytes reach the molecular hash', () => {
  it('serialises the zod-parsed rule with stable values and key order', () => {
    const ruleAtom = buildRuleAtom()

    const ruleMeta = (ruleAtom.meta ?? []).find(m => m.key === 'rule')
    expect(ruleMeta).toBeDefined()

    // The exact serialised rule string that gets hashed. Generated pre-migration.
    expect(String(ruleMeta!.value)).toBe(
      '[{"condition":[{"key":"zeta","value":"100","comparison":">="},{"key":"alpha","value":"USER","comparison":"="}],"callback":[{"action":"meta","metaType":"walletBundle","metaId":"cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc","meta":{"zulu":"last","alpha":"first","mike":"42"}}]}]'
    )
  })

  it('hashes the zod-parsed rule atom to the byte-identical pre-migration digest', () => {
    const hash = Atom.hashAtoms({ atoms: [buildRuleAtom()] })

    // Generated on the pre-migration tree (zod 3.25.76).
    expect(hash).toBe('038ge57db4d07043f65gcda54d27d29471df84ce48962036d8d4505b77ad7dfg')
  })
})
