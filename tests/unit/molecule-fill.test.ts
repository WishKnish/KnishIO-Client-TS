/**
 * Molecule.fill copies every property of the given object onto the molecule, as the JS
 * reference's Molecule.fill does.
 */
import { describe, it, expect } from 'vitest'
import Molecule from '../../src/core/Molecule'
import { generateSecret } from '../../src/libraries/crypto'

describe('Molecule.fill', () => {
  it('copies every property of the given object', () => {
    const molecule = new Molecule({ secret: generateSecret('molecule-fill') })
    molecule.fill({ cellSlug: 'filled-cell', status: 'filled' })

    expect(molecule.cellSlug).toBe('filled-cell')
    expect(molecule.status).toBe('filled')
  })
})
