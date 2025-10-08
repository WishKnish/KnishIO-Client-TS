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
import ResponseRequestAuthorizationGuest from '@/response/ResponseRequestAuthorizationGuest'
import { gql } from '@urql/core'
import type { GraphQLClient as IGraphQLClient } from '@/types'
import type KnishIOClient from '@/KnishIOClient'

/**
 * Mutation for requesting guest authorization
 */
export default class MutationRequestAuthorizationGuest extends Mutation {
  /**
   * Constructor
   */
  constructor(graphQLClient: IGraphQLClient, knishIOClient: KnishIOClient) {
    super(graphQLClient, knishIOClient)

    this.$__query = gql`
      mutation($cellSlug: String, $pubkey: String, $encrypt: Boolean) {
        AccessToken(cellSlug: $cellSlug, pubkey: $pubkey, encrypt: $encrypt) {
          token
          pubkey
          expiresAt
        }
      }
    `
  }

  /**
   * Returns a Response object
   */
  override createResponse(json: Record<string, any>): ResponseRequestAuthorizationGuest {
    return new ResponseRequestAuthorizationGuest({
      query: this,
      json
    })
  }
}