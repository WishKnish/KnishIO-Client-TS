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

import Subscribe from './Subscribe'
import { gql } from '@urql/core'
import type { GraphQLClient as IGraphQLClient } from '@/types'

/**
 * CreateMoleculeSubscribe handles real-time molecule creation events
 */
export default class CreateMoleculeSubscribe extends Subscribe {
  constructor(graphQLClient: IGraphQLClient) {
    super(graphQLClient)
    this.$__subscribe = gql`
      subscription onCreateMolecule($bundle: String!) {
        CreateMolecule(bundle: $bundle) {
          molecularHash
          cellSlug
          counterparty
          bundleHash
          status
          local
          height
          depth
          createdAt
          receivedAt
          processedAt
          broadcastedAt
          reason
          reasonPayload
          payload
          status
          atoms {
            molecularHash
            position
            isotope
            walletAddress
            tokenSlug
            batchId
            value
            index
            metaType
            metaId
            metasJson
            otsFragment
            createdAt
            metas {
              molecularHash
              position
              metaType
              metaId
              key
              value
              createdAt
            }
          }
        }
      }
    `
  }
}