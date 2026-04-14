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
import ResponseEmbeddingStatus from '../response/ResponseEmbeddingStatus'
import { gql } from '@urql/core'
import type { GraphQLClient } from '../types/graphql'
import type KnishIOClient from '../KnishIOClient'

/**
 * QueryEmbeddingStatus - Query for retrieving DataBraid embedding status.
 *
 * Supports both single-instance and bulk modes:
 * - Single: { metaType: 'product', metaId: 'SKU-001' }
 * - Bulk:   { instances: [{ metaType: 'product', metaId: 'SKU-001' }, ...] }
 *
 * Returns embedding state (PENDING, STALE, COMPLETE) for each instance,
 * allowing apps to render spinner badges and completion indicators.
 *
 * NOTE: Only available on servers with EMBEDDING_ENABLED=true.
 * Use KnishIOClient.queryEmbeddingStatus() which handles capability
 * detection and returns null for unsupported servers.
 */
export default class QueryEmbeddingStatus extends Query {
  /**
   * Create new QueryEmbeddingStatus instance
   */
  constructor(graphQLClient: GraphQLClient, knishIOClient: KnishIOClient) {
    super(graphQLClient, knishIOClient)

    this.$__query = gql`query( $metaType: String, $metaId: String, $instances: [EmbeddingStatusInput!] ) {
      embeddingStatus( metaType: $metaType, metaId: $metaId, instances: $instances ) {
        metaType,
        metaId,
        state,
        totalMetas,
        embeddedCount,
        embeddedAt,
        model
      }
    }`
  }

  /**
   * Builds a GraphQL-friendly variables object for embedding status queries.
   *
   * Single mode: createVariables({ metaType: 'product', metaId: 'SKU-001' })
   * Bulk mode:   createVariables({ instances: [{ metaType: 'product', metaId: 'SKU-001' }, ...] })
   */
  static createVariables({
    metaType = null,
    metaId = null,
    instances = null
  }: {
    metaType?: string | null
    metaId?: string | null
    instances?: Array<{ metaType: string; metaId: string }> | null
  } = {}): Record<string, any> {
    const variables: Record<string, any> = {}

    if (instances && instances.length > 0) {
      variables.instances = instances
    }

    if (metaType) {
      variables.metaType = metaType
    }

    if (metaId) {
      variables.metaId = metaId
    }

    return variables
  }

  /**
   * Returns a Response object
   */
  override createResponse(json: any): ResponseEmbeddingStatus {
    return new ResponseEmbeddingStatus({
      query: this,
      json
    })
  }
}
