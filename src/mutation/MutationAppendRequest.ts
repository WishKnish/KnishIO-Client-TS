/*
        Powered by Knish.IO: Connecting a Decentralized World

Please visit https://github.com/WishKnish/KnishIO-Client-TS for information.

License: https://github.com/WishKnish/KnishIO-Client-TS/blob/master/LICENSE
*/

import MutationProposeMolecule from './MutationProposeMolecule'
import ResponseAppendRequest from '../response/ResponseAppendRequest'

/**
 * Mutation for submitting an append request via the A-isotope
 * Matches JavaScript SDK MutationAppendRequest implementation exactly
 */
export default class MutationAppendRequest extends MutationProposeMolecule {
  /**
   * Fills a molecule with an A-isotope append request atom
   * Matches JavaScript SDK fillMolecule method exactly
   */
  override fillMolecule({
    metaType,
    metaId,
    action,
    meta = {}
  }: {
    metaType: string
    metaId: string
    action: string
    meta?: Record<string, any>
  }): void {
    (this.$__molecule as any).initAppendRequest({
      metaType,
      metaId,
      action,
      meta
    });
    (this.$__molecule as any).sign({});
    (this.$__molecule as any).check()
  }

  /**
   * Builds a Response object out of a JSON object
   * Matches JavaScript SDK createResponse method exactly
   */
  override createResponse(json: any): ResponseAppendRequest {
    return new ResponseAppendRequest({
      query: this,
      json
    })
  }
}
