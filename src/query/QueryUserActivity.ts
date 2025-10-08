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
import ResponseQueryUserActivity from '@/response/ResponseQueryUserActivity'
import { gql } from '@urql/core'
import type { GraphQLClient as IGraphQLClient } from '@/types'
import type KnishIOClient from '@/KnishIOClient'
import type { BundleHash, MetaType, MetaId } from '@/types'

/**
 * Query for retrieving information about user activity
 */
export default class QueryUserActivity extends Query {
  /**
   * Constructor
   */
  constructor(graphQLClient: IGraphQLClient, knishIOClient: KnishIOClient) {
    super(graphQLClient, knishIOClient)

    this.$__query = gql`
      query UserActivity(
        $bundleHash: String
        $metaType: String
        $metaId: String
        $ipAddress: String
        $browser: String
        $osCpu: String
        $resolution: String
        $timeZone: String
        $countBy: [CountByUserActivity]
        $interval: span
      ) {
        UserActivity(
          bundleHash: $bundleHash
          metaType: $metaType
          metaId: $metaId
          ipAddress: $ipAddress
          browser: $browser
          osCpu: $osCpu
          resolution: $resolution
          timeZone: $timeZone
          countBy: $countBy
          interval: $interval
        ) {
          createdAt
          bundleHash
          metaType
          metaId
          instances {
            bundleHash
            metaType
            metaId
            jsonData
            createdAt
            updatedAt
          }
          instanceCount {
            ...SubFields
            ...Recursive
          }
        }
      }

      fragment SubFields on InstanceCountType {
        id
        count
      }

      fragment Recursive on InstanceCountType {
        instances {
          ...SubFields
          instances {
            ...SubFields
            instances {
              ...SubFields
              instances {
                ...SubFields
                instances {
                  ...SubFields
                  instances {
                    ...SubFields
                    instances {
                      ...SubFields
                      instances {
                        ...SubFields
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `
  }

  /**
   * Returns a Response object
   */
  override createResponse(json: Record<string, any>): ResponseQueryUserActivity {
    return new ResponseQueryUserActivity({
      query: this,
      json
    })
  }
}