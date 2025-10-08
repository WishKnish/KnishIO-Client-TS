/*
                               (
                              (/(
                              (//(
                              (///(
                             (/////(
                             (//////(                          )
                            (////////(                        (/)
                            (////////(                       (///)
                           (//////////(                      (////)
                           (//////////(                     (//////)
                          (////////////(                    (///////)
                         (/////////////(                   (/////////)
                        (//////////////(                  (///////////)
                        (///////////////(                (/////////////)
                       (////////////////(               (//////////////)
                      (((((((((((((((((((              (((((((((((((((
                     (((((((((((((((((((              ((((((((((((((
                     (((((((((((((((((((            ((((((((((((((
                    ((((((((((((((((((((           (((((((((((((
                    ((((((((((((((((((((          ((((((((((((
                    (((((((((((((((((((         ((((((((((((
                    (((((((((((((((((((        ((((((((((
                    ((((((((((((((((((/      (((((((((
                    ((((((((((((((((((     ((((((((
                    (((((((((((((((((    (((((((
                   ((((((((((((((((((  (((((
                   #################  ##
                   ################  #
                  ################# ##
                 %################  ###
                 ###############(   ####
                ###############      ####
               ###############       ######
              %#############(        (#######
             %#############           #########
            ############(              ##########
           ###########                  #############
          #########                      ##############
        %######

        Powered by Knish.IO: Connecting a Decentralized World

Please visit https://github.com/WishKnish/KnishIO-Client-TS for information.

License: https://github.com/WishKnish/KnishIO-Client-TS/blob/master/LICENSE
*/

import MutationProposeMolecule from './MutationProposeMolecule'
import ResponseRequestTokens from '../response/ResponseRequestTokens'

/**
 * MutationRequestTokens class - Mutation for requesting tokens
 * Matches JavaScript SDK MutationRequestTokens implementation exactly
 */
export default class MutationRequestTokens extends MutationProposeMolecule {
  /**
   * Fills a Molecule with the appropriate atoms and prepares for broadcast
   * Matches JavaScript SDK fillMolecule method exactly
   */
  override fillMolecule({
    token,
    amount,
    metaType,
    metaId,
    meta = null,
    batchId = null
  }: {
    token: string
    amount: number | string
    metaType: string
    metaId: string
    meta?: any | null
    batchId?: string | null
  }): void {
    (this.$__molecule as any).initTokenRequest({
      token,
      amount,
      metaType,
      metaId,
      meta: meta || {},
      batchId
    });
    (this.$__molecule as any).sign({});
    (this.$__molecule as any).check()
  }

  /**
   * Builds a Response object out of a JSON object
   * Matches JavaScript SDK createResponse method exactly
   */
  override createResponse(json: any): ResponseRequestTokens {
    return new ResponseRequestTokens({
      query: this,
      json
    })
  }
}