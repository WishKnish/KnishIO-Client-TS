/**
 * Atom hashing: cross-SDK Version4 (versioned) and legacy (unversioned) vectors.
 *
 * tests/fixtures/version4-hash-vectors.json is a vendored copy of the monorepo master
 * shared-test-results/version4-hash-vectors.json. Each `cases` entry gives client-format atoms,
 * the exact JSON view string that is hashed, and the expected base17 molecular hash. Each
 * `legacyCases` entry gives atoms without a version and their expected legacy molecular hash.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import Atom from '../../src/core/Atom'
import Version4 from '../../src/versions/Version4'

interface Version4Case {
  name: string
  atoms: Array<Record<string, unknown>>
  viewJson: string
  expectedHash: string
}
interface LegacyCase {
  name: string
  atoms: Array<Record<string, unknown>>
  expectedHash: string
}
const FIXTURE = resolve(__dirname, '../fixtures/version4-hash-vectors.json')
const vectors: { alphabet: string; cases: Version4Case[]; legacyCases: LegacyCase[] } =
  JSON.parse(readFileSync(FIXTURE, 'utf8'))

describe('Version4 hash vectors', () => {
  it('has the nine shared cases', () => {
    expect(vectors.cases.map(c => c.name)).toEqual([
      'v4-basic', 'v3-basic', 'slash-unicode', 'control-quote', 'line-separators', 'nulls',
      'empty-strings', 'empty-version', 'index-order'
    ])
  })

  it.each(vectors.cases.map(c => [c.name, c] as const))('%s: view and hash match', (_name, vector) => {
    const atoms = vector.atoms.map(json => Atom.fromJSON(json))

    const view = JSON.stringify(Atom.sortAtoms(atoms).map(atom => Version4.create(atom).view()))
    expect(view).toBe(vector.viewJson)
    expect(Atom.hashAtoms({ atoms })).toBe(vector.expectedHash)
  })

  it('has the two shared legacy cases', () => {
    expect(vectors.legacyCases.map(c => c.name)).toEqual(['legacy-empty-strings', 'legacy-nulls'])
  })

  it.each(vectors.legacyCases.map(c => [c.name, c] as const))('%s: legacy hash matches', (_name, vector) => {
    const atoms = vector.atoms.map(json => Atom.fromJSON(json))

    expect(atoms.every(atom => atom.version === null || atom.version === undefined)).toBe(true)
    expect(Atom.hashAtoms({ atoms })).toBe(vector.expectedHash)
  })
})
