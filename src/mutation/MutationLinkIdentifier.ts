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
import ResponseLinkIdentifier from '@/response/ResponseLinkIdentifier'
import { gql } from '@urql/core'
import type { GraphQLClient as IGraphQLClient } from '@/types'
import type KnishIOClient from '@/KnishIOClient'

/**
 * Mutation for linking an Identifier to a Wallet Bundle
 */
export default class MutationLinkIdentifier extends Mutation {
  /**
   * Constructor
   */
  constructor(graphQLClient: IGraphQLClient, knishIOClient: KnishIOClient) {
    super(graphQLClient, knishIOClient)

    this.$__query = gql`
      mutation($bundle: String!, $type: String!, $content: String!) {
        LinkIdentifier(bundle: $bundle, type: $type, content: $content) {
          type
          bundle
          content
          set
          message
        }
      }
    `
  }

  /**
   * Returns a Response object
   */
  override createResponse(json: Record<string, any>): ResponseLinkIdentifier {
    return new ResponseLinkIdentifier({
      query: this,
      json
    })
  }
}