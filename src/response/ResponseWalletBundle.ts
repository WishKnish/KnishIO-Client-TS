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
import Meta from '../core/Meta'
import type Query from '../query/Query'

/**
 * Response for Wallet Bundle query
 * Matches JavaScript SDK ResponseWalletBundle implementation exactly
 */
export default class ResponseWalletBundle extends Response {
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
      dataKey: 'data.WalletBundle'
    })
  }

  /**
   * Returns a wallet bundle with normalized metadata
   * Matches JavaScript SDK payload() method exactly
   */
  payload(): Record<string, any> | null {
    const bundleData = this.data() as any[]

    if (!bundleData || bundleData.length === 0) {
      return null
    }

    const aggregate: Record<string, any> = {}

    bundleData.forEach((bundle: any) => {
      bundle.metas = Meta.aggregateMeta(bundle.metas)
      aggregate[bundle.bundleHash] = bundle
    })

    return aggregate
  }
}