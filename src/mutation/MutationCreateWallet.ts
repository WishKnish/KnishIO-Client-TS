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
import ResponseCreateWallet from '../response/ResponseCreateWallet'
import type Wallet from '../core/Wallet'

/**
 * MutationCreateWallet class - Mutation for creating new Wallets
 * Matches JavaScript SDK MutationCreateWallet implementation exactly
 */
export default class MutationCreateWallet extends MutationProposeMolecule {
  /**
   * Fill molecule for wallet creation
   * Matches JavaScript SDK fillMolecule method exactly
   */
  override fillMolecule(wallet: Wallet): void {
    (this.$__molecule as any).initWalletCreation(wallet);
    (this.$__molecule as any).sign({});
    (this.$__molecule as any).check()
  }

  /**
   * Returns a Response object
   * Matches JavaScript SDK createResponse method exactly
   */
  override createResponse(json: any): ResponseCreateWallet {
    return new ResponseCreateWallet({
      query: this,
      json
    })
  }
}