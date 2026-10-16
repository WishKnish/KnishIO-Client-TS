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
const fixture: { v1: ServedMolecule; v2: ServedMolecule; v2ts: ServedMolecule; v3rust: ServedMolecule } = JSON.parse(readFileSync(FIXTURE, 'utf8'))

function withAtomVersion (served: ServedMolecule, version: string | null): ServedMolecule {
  const copy = structuredClone(served)
  copy.atoms.forEach(atom => { atom.version = version })
  return copy
}

describe('served molecules', () => {
  it.each(['v1', 'v2'] as const)('verifies the served %s molecule', (key) => {
    const result = CheckMolecule.verifyFromServerData(fixture[key])

    expect(result.error).toBeNull()
    expect(result.verified).toBe(true)
  })

  it('verifies a version-4 molecule served without atom versions', () => {
    const result = CheckMolecule.verifyFromServerData(fixture.v2ts)

    expect(result.error).toBeNull()
    expect(result.verified).toBe(true)
  })

  it('verifies a version-4 molecule served with atom versions', () => {
    const result = CheckMolecule.verifyFromServerData(withAtomVersion(fixture.v2ts, '4'))

    expect(result.error).toBeNull()
    expect(result.verified).toBe(true)
  })

  it('rejects a tampered version-4 molecule', () => {
    const served = structuredClone(fixture.v2ts)
    served.atoms[0].metasJson = (served.atoms[0].metasJson as string).replace('"f1"', '"f2"')

    const result = CheckMolecule.verifyFromServerData(served)

    expect(served.atoms[0].metasJson).toContain('"f2"')
    expect(result.verified).toBe(false)
    expect(result.error).toMatch(/hash/i)
  })

  it('does not fall back when a served atom carries a version', () => {
    const result = CheckMolecule.verifyFromServerData(withAtomVersion(fixture.v1, '4'))

    expect(result.verified).toBe(false)
    expect(result.error).toMatch(/hash/i)
  })

  it('v3rust molecule served with atom version 3 verifies', () => {
    const result = CheckMolecule.verifyFromServerData(fixture.v3rust)

    expect(result).toMatchObject({ verified: true, error: null })
  })

  it('v3rust molecule served without atom versions verifies (version 3 fallback)', () => {
    const result = CheckMolecule.verifyFromServerData(withAtomVersion(fixture.v3rust, null))

    expect(result).toMatchObject({ verified: true, error: null })
  })

  it.each([['3'], [null]] as const)('tampered v3rust fails (atom version %s)', (version) => {
    const served = withAtomVersion(fixture.v3rust, version)
    served.atoms[0].metaId = 'rust-pre-tampered'

    const result = CheckMolecule.verifyFromServerData(served)

    expect(result.verified).toBe(false)
    expect(result.error).toMatch(/hash/i)
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
