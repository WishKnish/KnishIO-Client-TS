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

/**
 * ResponseContinuId class - Response for ContinuID query
 * Matches JavaScript SDK ResponseContinuId implementation exactly
 */
export default class ResponseContinuId extends Response {
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
      dataKey: 'data.ContinuId'
    })
  }

  /**
   * Returns the ContinuID wallet
   * Matches JavaScript SDK payload method exactly
   */
  override payload(): Wallet | null {
    let wallet: Wallet | null = null

    const continuId = this.data()

    if (continuId) {
      wallet = new Wallet({
        secret: null,
        token: continuId.tokenSlug
      })
      wallet.address = continuId.address
      wallet.position = continuId.position
      wallet.bundle = continuId.bundleHash
      wallet.batchId = continuId.batchId
      wallet.characters = continuId.characters
      wallet.pubkey = continuId.pubkey
      wallet.balance = continuId.amount * 1.0
    }

    return wallet
  }
}