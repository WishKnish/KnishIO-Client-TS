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

import Response from './Response'
import Wallet from '../core/Wallet'
import type Query from '../query/Query'

/**
 * Response for balance query
 * Matches JavaScript SDK ResponseBalance implementation exactly
 */
export default class ResponseBalance extends Response {
  /**
   * Class constructor
   */
  constructor({
    query,
    json
  }: {
    query: Query
    json: Record<string, unknown>
  }) {
    super({
      query,
      json,
      dataKey: 'data.Balance'
    })
  }

  /**
   * Returns a wallet with balance
   * Matches JavaScript SDK payload() method exactly
   */
  payload(): Wallet | null {
    const walletData = this.data() as any

    if (!walletData || !walletData.bundleHash || !walletData.tokenSlug) {
      return null
    }

    return ResponseBalance.toClientWallet({
      data: walletData
    })
  }

  /**
   * Returns a Knish.IO client Wallet class instance out of object data
   * Simplified version - will be enhanced when TokenUnit is implemented
   * Matches JavaScript SDK ResponseWalletList.toClientWallet pattern
   */
  static toClientWallet({
    data,
    secret = null
  }: {
    data: any
    secret?: string | null
  }): Wallet {
    let wallet: Wallet

    if (data.position === null || typeof data.position === 'undefined') {
      wallet = Wallet.create({
        bundle: data.bundleHash,
        token: data.tokenSlug,
        batchId: data.batchId,
        characters: data.characters
      })
    } else {
      wallet = new Wallet({
        secret,
        token: data.tokenSlug,
        position: data.position,
        batchId: data.batchId,
        characters: data.characters
      })
      wallet.address = data.address
      wallet.bundle = data.bundleHash
    }

    // Set token information if available
    if (data.token) {
      wallet.tokenName = data.token.name
      wallet.tokenAmount = data.token.amount
      wallet.tokenSupply = data.token.supply
      wallet.tokenFungibility = data.token.fungibility
    }

    // TODO: Implement TokenUnit support when TokenUnit class is available
    // if (data.tokenUnits && data.tokenUnits.length) {
    //   for (const tokenUnitData of data.tokenUnits) {
    //     wallet.tokenUnits.push(TokenUnit.createFromGraphQL(tokenUnitData))
    //   }
    // }

    // Set trade rates if available
    if (data.tradeRates && data.tradeRates.length) {
      for (const tradeRate of data.tradeRates) {
        wallet.tradeRates[tradeRate.tokenSlug] = tradeRate.amount
      }
    }

    // Set balance and other properties
    wallet.balance = Number(data.amount || 0)
    wallet.pubkey = data.pubkey
    wallet.createdAt = data.createdAt

    return wallet
  }
}