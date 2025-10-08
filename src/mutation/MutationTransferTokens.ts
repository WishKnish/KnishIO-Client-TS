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
import ResponseTransferTokens from '../response/ResponseTransferTokens'
import type Wallet from '../core/Wallet'

/**
 * Mutation for moving tokens between wallets
 * Matches JavaScript SDK MutationTransferTokens implementation exactly
 */
export default class MutationTransferTokens extends MutationProposeMolecule {
  /**
   * Fills the Molecule with provided wallet and amount data
   * Matches JavaScript SDK fillMolecule method exactly
   */
  override fillMolecule({
    recipientWallet,
    amount
  }: {
    recipientWallet: Wallet
    amount: number | string
  }): void {
    (this.$__molecule as any).initValue({
      recipientWallet,
      amount
    });
    (this.$__molecule as any).sign({});
    (this.$__molecule as any).check((this.$__molecule as any).sourceWallet)
  }

  /**
   * Builds a Response object out of a JSON object
   * Matches JavaScript SDK createResponse method signature exactly
   */
  override createResponse(json: Record<string, unknown>): ResponseTransferTokens {
    return new ResponseTransferTokens({
      query: this,
      json
    })
  }
}