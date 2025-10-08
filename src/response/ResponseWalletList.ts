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

import type Query from '../query/Query'
import Response from './Response'
import Wallet from '../core/Wallet'
import TokenUnit from '../core/TokenUnit'

/**
 * ResponseWalletList class - Response for Wallet List query
 * Matches JavaScript SDK ResponseWalletList implementation exactly
 */
export default class ResponseWalletList extends Response {
  /**
   * Class constructor
   * Matches JavaScript SDK constructor signature exactly
   */
  constructor({
    query,
    json
  }: {
    query: Query
    json: any
  }) {
    super({
      query,
      json,
      dataKey: 'data.Wallet'
    })
  }

  /**
   * Returns a Knish.IO client Wallet class instance out of object data
   * Matches JavaScript SDK toClientWallet method exactly
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

    if (data.token) {
      wallet.tokenName = data.token.name
      wallet.tokenAmount = data.token.amount
      wallet.tokenSupply = data.token.supply
      wallet.tokenFungibility = data.token.fungibility
    }

    if (data.tokenUnits.length) {
      for (const tokenUnitData of data.tokenUnits) {
        wallet.tokenUnits.push(TokenUnit.createFromGraphQL(tokenUnitData))
      }
    }

    if (data.tradeRates.length) {
      for (const tradeRate of data.tradeRates) {
        wallet.tradeRates[tradeRate.tokenSlug] = tradeRate.amount
      }
    }

    wallet.balance = Number(data.amount)
    wallet.pubkey = data.pubkey
    wallet.createdAt = data.createdAt

    return wallet
  }

  /**
   * Returns a list of Wallet class instances
   * Matches JavaScript SDK getWallets method exactly
   */
  getWallets(secret: string | null = null): Wallet[] | null {
    const list = this.data()

    if (!list) {
      return null
    }

    const wallets: Wallet[] = []

    for (const data of list) {
      wallets.push(ResponseWalletList.toClientWallet({
        data,
        secret
      }))
    }

    return wallets
  }

  /**
   * Returns response payload
   * Matches JavaScript SDK payload method exactly
   */
  payload(): Wallet[] | null {
    return this.getWallets()
  }
}