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

import Mutation from './Mutation'
import ResponseActiveSession from '@/response/ResponseActiveSession'
import { gql } from '@urql/core'
import type { GraphQLClient as IGraphQLClient } from '@/types'
import type KnishIOClient from '@/KnishIOClient'

/**
 * Mutation for declaring an active User Session with a given MetaAsset
 */
export default class MutationActiveSession extends Mutation {
  /**
   * Constructor
   */
  constructor(graphQLClient: IGraphQLClient, knishIOClient: KnishIOClient) {
    super(graphQLClient, knishIOClient)

    this.$__query = gql`
      mutation(
        $bundleHash: String!
        $metaType: String!
        $metaId: String!
        $ipAddress: String
        $browser: String
        $osCpu: String
        $resolution: String
        $timeZone: String
        $json: String
      ) {
        ActiveSession(
          bundleHash: $bundleHash
          metaType: $metaType
          metaId: $metaId
          ipAddress: $ipAddress
          browser: $browser
          osCpu: $osCpu
          resolution: $resolution
          timeZone: $timeZone
          json: $json
        ) {
          bundleHash
          metaType
          metaId
          jsonData
          createdAt
          updatedAt
        }
      }
    `
  }

  /**
   * Builds a Response object out of a JSON string
   */
  override createResponse(json: Record<string, any>): ResponseActiveSession {
    return new ResponseActiveSession({
      query: this,
      json
    })
  }
}