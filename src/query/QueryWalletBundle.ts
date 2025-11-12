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
import ResponseWalletBundle from '../response/ResponseWalletBundle'
import { gql } from '@urql/core'
import type GraphQLClient from '../libraries/GraphQLClient'
import type KnishIOClient from '../KnishIOClient'

/**
 * Query for retrieving information about Wallet Bundles
 * Matches JavaScript SDK QueryWalletBundle implementation exactly
 */
export default class QueryWalletBundle extends Query {
  /**
   * Create QueryWalletBundle instance
   */
  constructor(graphQLClient: GraphQLClient, knishIOClient: KnishIOClient) {
    super(graphQLClient, knishIOClient)

    this.$__query = gql`
      query($bundleHashes: [String!]) {
        WalletBundle(bundleHashes: $bundleHashes) {
          bundleHash,
          metas {
            molecularHash,
            position,
            key,
            value,
            createdAt
          },
          createdAt
        }
      }
    `
  }

  /**
   * Builds a Response object out of a JSON object
   * Matches JavaScript SDK createResponse method signature exactly
   */
  override createResponse(json: Record<string, unknown>): ResponseWalletBundle {
    return new ResponseWalletBundle({
      query: this,
      json
    })
  }
}