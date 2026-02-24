/*
        Powered by Knish.IO: Connecting a Decentralized World

Please visit https://github.com/WishKnish/KnishIO-Client-TS for information.

License: https://github.com/WishKnish/KnishIO-Client-TS/blob/master/LICENSE
*/

import MutationProposeMolecule from './MutationProposeMolecule'
import ResponsePeering from '../response/ResponsePeering'

/**
 * Mutation for registering a peer node via the P-isotope
 * Matches JavaScript SDK MutationPeering implementation exactly
 */
export default class MutationPeering extends MutationProposeMolecule {
  /**
   * Fills a molecule with a P-isotope peering atom
   * Matches JavaScript SDK fillMolecule method exactly
   */
  override fillMolecule({ host }: { host: string }): void {
    (this.$__molecule as any).initPeering({ host });
    (this.$__molecule as any).sign({});
    (this.$__molecule as any).check()
  }

  /**
   * Builds a Response object out of a JSON object
   * Matches JavaScript SDK createResponse method exactly
   */
  override createResponse(json: any): ResponsePeering {
    return new ResponsePeering({
      query: this,
      json
    })
  }
}
