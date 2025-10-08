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
import Wallet from '@/core/Wallet'
import ResponseClaimShadowWallet from '@/response/ResponseClaimShadowWallet'
import type { TokenSlug } from '@/types'

/**
 * Mutation for claiming a Shadow Wallet
 */
export default class MutationClaimShadowWallet extends MutationProposeMolecule {
  /**
   * Fills the molecule with shadow wallet claim data
   */
  override fillMolecule({
    token,
    batchId = null
  }: {
    token: TokenSlug
    batchId?: string | null
  }): void {
    // Create the wallet to claim
    const wallet = Wallet.create({
      secret: this.$__molecule.secret,
      bundle: this.$__molecule.bundle,
      token,
      batchId
    })

    // Initialize shadow wallet claim on the molecule
    (this.$__molecule as any).initShadowWalletClaim(wallet)
    this.$__molecule.sign({})
    this.$__molecule.check()
  }

  /**
   * Builds a Response object out of a JSON string
   */
  override createResponse(json: Record<string, any>): ResponseClaimShadowWallet {
    return new ResponseClaimShadowWallet({
      query: this,
      json
    })
  }
}