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
    this.$__molecule.initAuthorization({ meta })
    console.log('[TS-SDK DEBUG] MutationRequestAuthorization: starting WOTS+ sign...')
    console.time('[TS-SDK DEBUG] WOTS+ sign duration')
    this.$__molecule.sign({})
    console.timeEnd('[TS-SDK DEBUG] WOTS+ sign duration')
    console.log('[TS-SDK DEBUG] MutationRequestAuthorization: sign complete, running check...')
    this.$__molecule.check()
    console.log('[TS-SDK DEBUG] MutationRequestAuthorization: check complete')
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