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
import ResponseRequestAuthorization from '../response/ResponseRequestAuthorization'

/**
 * MutationRequestAuthorization class - Mutation for requesting an authorization token from the node
 * Matches JavaScript SDK MutationRequestAuthorization implementation exactly
 */
export default class MutationRequestAuthorization extends MutationProposeMolecule {
  /**
   * Fill molecule for authorization request
   * Matches JavaScript SDK fillMolecule method exactly
   */
  override fillMolecule({ meta }: { meta: any }): void {
    (this.$__molecule as any).initAuthorization({ meta });
    (this.$__molecule as any).sign({});
    (this.$__molecule as any).check()
  }

  /**
   * Returns a Response object
   * Matches JavaScript SDK createResponse method exactly
   */
  override createResponse(json: any): ResponseRequestAuthorization {
    return new ResponseRequestAuthorization({
      query: this,
      json
    })
  }
}