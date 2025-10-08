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
import Response from '@/response/Response'
import { gql } from '@urql/core'
import type { GraphQLClient as IGraphQLClient } from '@/types'
import type KnishIOClient from '@/KnishIOClient'

/**
 * Query for getting token information
 */
export default class QueryToken extends Query {
  /**
   * Constructor
   */
  constructor(graphQLClient: IGraphQLClient, knishIOClient: KnishIOClient) {
    super(graphQLClient, knishIOClient)

    this.$__query = gql`
      query($slug: String, $slugs: [String!], $limit: Int, $order: String) {
        Token(slug: $slug, slugs: $slugs, limit: $limit, order: $order) {
          slug
          name
          fungibility
          supply
          decimals
          amount
          icon
        }
      }
    `
  }

  /**
   * Creates a Response object
   */
  override createResponse(json: Record<string, any>): Response {
    return new Response({
      query: this,
      json,
      dataKey: 'data.Token'
    })
  }
}