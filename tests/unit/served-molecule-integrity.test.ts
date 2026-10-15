/**
 * Integrity of molecules served by a validator.
 *
 * Validators return createdAt as an RFC 3339 string, while molecules are signed over the
 * epoch-millisecond string, so fromServerData must normalise it before hashing.
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'
import CheckMolecule from '../../src/libraries/CheckMolecule'

// captured from validator 0.8.3 MetaType through-molecule responses
const FIXTURE = resolve(__dirname, '../fixtures/served-molecules.json')
interface ServedMolecule {
  molecularHash: string
  bundleHash: string
  createdAt?: string | number | null
  atoms: Array<Record<string, unknown>>
}
const fixture: { v1: ServedMolecule; v2: ServedMolecule } = JSON.parse(readFileSync(FIXTURE, 'utf8'))

describe('served molecules', () => {
  it.each(['v1', 'v2'] as const)('verifies the served %s molecule', (key) => {
    const result = CheckMolecule.verifyFromServerData(fixture[key])

    expect(result.error).toBeNull()
    expect(result.verified).toBe(true)
  })

  it.each([
    ['2026-10-14T20:02:37+00:00', '1792008157000'],
    ['2026-10-14T20:02:37.110Z', '1792008157110'],
    [1792008157110, '1792008157110'],
    ['1792008157110', '1792008157110'],
    ['not-a-date', 'not-a-date']
  ])('normalises atom createdAt %s to %s', (input, expected) => {
    const served = structuredClone(fixture.v1)
    served.atoms[0].createdAt = input

    const molecule = CheckMolecule.fromServerData(served)

    expect(molecule.atoms[0].createdAt).toBe(expected)
  })
})
