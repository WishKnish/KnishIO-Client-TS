/*
        Powered by Knish.IO: Connecting a Decentralized World

Please visit https://github.com/WishKnish/KnishIO-Client-TS for information.

License: https://github.com/WishKnish/KnishIO-Client-TS/blob/master/LICENSE
*/

import MutationProposeMolecule from './MutationProposeMolecule'

/**
 * Mutation for replenishing a non-finite token supply.
 *
 * The JS SDK submits replenishment through `MutationProposeMolecule` directly
 * (KnishIOClient.js:2226-2230), but that class is abstract here because it declares
 * `fillMolecule`. This subclass exists to provide the concrete type; it inherits the identical
 * `ProposeMolecule(molecule: $molecule)` document from the base, so the request on the wire is
 * the same one the JS SDK sends.
 *
 * `fillMolecule` is intentionally a no-op: KnishIOClient.replenishToken builds the V-atom pair
 * via Molecule.replenishToken, then signs and checks the molecule, before this mutation is
 * constructed. There is nothing left to fill.
 */
export default class MutationReplenishToken extends MutationProposeMolecule {
  override fillMolecule(): void {
    // Intentionally empty — the molecule arrives fully built, signed and checked.
  }
}
