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
import ResponseCreateToken from '../response/ResponseCreateToken'
import type Wallet from '../core/Wallet'

/**
 * MutationCreateToken class - Mutation for creating new Tokens
 * Matches JavaScript SDK MutationCreateToken implementation exactly
 */
export default class MutationCreateToken extends MutationProposeMolecule {
  /**
   * Fill molecule for token creation
   * Matches JavaScript SDK fillMolecule method exactly
   */
  override fillMolecule({
    recipientWallet,
    amount,
    meta = null
  }: {
    recipientWallet: Wallet
    amount: number | string
    meta?: any | null
  }): void {
    (this.$__molecule as any).initTokenCreation({
      recipientWallet,
      amount,
      meta: meta || {}
    });
    (this.$__molecule as any).sign({
      bundle: recipientWallet.bundle
    });
    (this.$__molecule as any).check()
  }

  /**
   * Builds a new Response object from a JSON object
   * Matches JavaScript SDK createResponse method exactly
   */
  override createResponse(json: any): ResponseCreateToken {
    return new ResponseCreateToken({
      query: this,
      json
    })
  }
}