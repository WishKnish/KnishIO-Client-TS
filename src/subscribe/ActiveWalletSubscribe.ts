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
 * ActiveWalletSubscribe handles real-time active wallet events
 */
export default class ActiveWalletSubscribe extends Subscribe {
  constructor(graphQLClient: IGraphQLClient) {
    super(graphQLClient)
    this.$__subscribe = gql`
      subscription onActiveWallet($bundle: String!) {
        ActiveWallet(bundle: $bundle) {
          address
          bundleHash
          walletBundle {
            bundleHash
            slug
            createdAt
          }
          tokenSlug
          token {
            slug
            name
            fungibility
            supply
            decimals
            amount
            icon
            createdAt
          }
          batchId
          position
          characters
          pubkey
          amount
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
    `
  }
}