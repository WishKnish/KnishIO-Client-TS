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

import Query from './Query'
import ResponseBalance from '../response/ResponseBalance'
import type GraphQLClient from '../libraries/GraphQLClient'
import type KnishIOClient from '../KnishIOClient'

/**
 * Query for getting the balance of a given wallet or token slug
 * Matches JavaScript SDK QueryBalance implementation exactly
 */
export default class QueryBalance extends Query {
  /**
   * Create QueryBalance instance
   */
  constructor(graphQLClient: GraphQLClient, knishIOClient: KnishIOClient) {
    super(graphQLClient, knishIOClient)

    this.$__query = `
      query($address: String, $bundleHash: String, $type: String, $token: String, $position: String) {
        Balance(address: $address, bundleHash: $bundleHash, type: $type, token: $token, position: $position) {
          address,
          bundleHash,
          type,
          tokenSlug,
          batchId,
          position,
          amount,
          characters,
          pubkey,
          createdAt,
          tokenUnits {
            id,
            name,
            metas
          },
          tradeRates {
            tokenSlug,
            amount
          }
        }
      }
    `
  }

  /**
   * Create ResponseBalance instance from JSON data
   * Matches JavaScript SDK createResponse method signature exactly
   */
  override createResponse(json: Record<string, unknown>): ResponseBalance {
    return new ResponseBalance({
      query: this,
      json
    })
  }
}