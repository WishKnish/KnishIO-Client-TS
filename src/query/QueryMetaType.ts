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
import ResponseMetaType from '../response/ResponseMetaType'
import { gql } from '@urql/core'
import type { GraphQLClient } from '../types/graphql'
import type KnishIOClient from '../KnishIOClient'

/**
 * QueryMetaType class - Query for retrieving Meta Asset information
 * Matches JavaScript SDK QueryMetaType implementation exactly
 */
export default class QueryMetaType extends Query {
  /**
   * Create new QueryMetaType instance
   * Matches JavaScript SDK constructor signature exactly
   */
  constructor(graphQLClient: GraphQLClient, knishIOClient: KnishIOClient) {
    super(graphQLClient, knishIOClient)

    this.$__query = gql`query( $metaType: String, $metaTypes: [ String! ], $metaId: String, $metaIds: [ String! ], $key: String, $keys: [ String! ], $value: String, $values: [ String! ], $count: String, $latest: Boolean, $filter: [ MetaFilter! ], $queryArgs: QueryArgs, $countBy: String, $cellSlug: String ) {
      MetaType( metaType: $metaType, metaTypes: $metaTypes, metaId: $metaId, metaIds: $metaIds, key: $key, keys: $keys, value: $value, values: $values, count: $count, filter: $filter, queryArgs: $queryArgs, countBy: $countBy, cellSlug: $cellSlug ) {
        metaType,
        instanceCount {
          key,
          value
        },
        instances {
          metaType,
          metaId,
          createdAt,
          metas(latest:$latest) {
            molecularHash,
            position,
            key,
            value,
            createdAt
          }
        },
        paginatorInfo {
          currentPage,
          total
        }
      }
    }`
  }

  /**
   * Builds a GraphQL-friendly variables object based on input fields
   * Matches JavaScript SDK createVariables method exactly
   */
  static createVariables({
    metaType = null,
    metaId = null,
    key = null,
    value = null,
    latest = null,
    filter = null,
    queryArgs = null,
    count = null,
    countBy = null,
    cellSlug = null
  }: {
    metaType?: string | string[] | null
    metaId?: string | string[] | null
    key?: string | string[] | null
    value?: string | string[] | null
    latest?: boolean | null
    filter?: any | null
    queryArgs?: any | null
    count?: string | null
    countBy?: string | null
    cellSlug?: string | null
  } = {}): Record<string, any> {
    const variables: Record<string, any> = {}

    if (metaType) {
      variables[typeof metaType === 'string' ? 'metaType' : 'metaTypes'] = metaType
    }

    if (metaId) {
      variables[typeof metaId === 'string' ? 'metaId' : 'metaIds'] = metaId
    }

    if (key) {
      variables[typeof key === 'string' ? 'key' : 'keys'] = key
    }

    if (value) {
      variables[typeof value === 'string' ? 'value' : 'values'] = value
    }

    variables.latest = latest === true

    if (filter) {
      variables.filter = filter
    }

    if (queryArgs) {
      if (typeof queryArgs.limit === 'undefined' || queryArgs.limit === 0) {
        queryArgs.limit = '*'
      }

      variables.queryArgs = queryArgs
    }

    if (count) {
      variables.count = count
    }

    if (countBy) {
      variables.countBy = countBy
    }

    if (cellSlug) {
      variables.cellSlug = cellSlug
    }

    return variables
  }

  /**
   * Returns a Response object
   * Matches JavaScript SDK createResponse method exactly
   */
  override createResponse(json: any): ResponseMetaType {
    return new ResponseMetaType({
      query: this,
      json
    })
  }
}