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
import ResponseAtom from '../response/ResponseAtom'
import { gql } from '@urql/core'
import type { GraphQLClient } from '../types/graphql'
import type KnishIOClient from '../KnishIOClient'

/**
 * QueryAtom class - Query for getting Knish.IO Atoms
 * Matches JavaScript SDK QueryAtom implementation exactly
 */
export default class QueryAtom extends Query {
  /**
   * Create new QueryAtom instance
   * Matches JavaScript SDK constructor signature exactly
   */
  constructor(graphQLClient: GraphQLClient, knishIOClient: KnishIOClient) {
    super(graphQLClient, knishIOClient)

    this.$__query = gql`query(
      $molecularHashes: [String!],
      $bundleHashes: [String!],
      $positions:[String!],
      $walletAddresses: [String!],
      $isotopes: [String!],
      $tokenSlugs: [String!],
      $cellSlugs: [String!],
      $batchIds: [String!],
      $values: [String!],
      $metaTypes: [String!],
      $metaIds: [String!],
      $indexes: [String!],
      $filter: [ MetaFilter! ],
      $latest: Boolean,
      $queryArgs: QueryArgs,
    ) {
      Atom(
        molecularHashes: $molecularHashes,
        bundleHashes: $bundleHashes,
        positions: $positions,
        walletAddresses: $walletAddresses,
        isotopes: $isotopes,
        tokenSlugs: $tokenSlugs,
        cellSlugs: $cellSlugs,
        batchIds: $batchIds,
        values: $values,
        metaTypes: $metaTypes,
        metaIds: $metaIds,
        indexes: $indexes,
        filter: $filter,
        latest: $latest,
        queryArgs: $queryArgs,
      ) {
        instances {
          position,
          walletAddress,
          tokenSlug,
          isotope,
          index,
          molecularHash,
          metaId,
          metaType,
          metasJson,
          batchId,
          value,
          bundleHashes,
          cellSlugs,
          createdAt,
          otsFragment
        },
        paginatorInfo {
          currentPage,
          total
        }
      }
    }`
  }

  /**
   * Queries Knish.IO Atoms
   * Matches JavaScript SDK createVariables method exactly
   */
  static createVariables({
    molecularHashes,
    molecularHash,
    bundleHashes,
    bundleHash,
    positions,
    position,
    walletAddresses,
    walletAddress,
    isotopes,
    isotope,
    tokenSlugs,
    tokenSlug,
    cellSlugs,
    cellSlug,
    batchIds,
    batchId,
    values,
    value,
    metaTypes,
    metaType,
    metaIds,
    metaId,
    indexes,
    index,
    filter,
    latest,
    queryArgs
  }: {
    molecularHashes?: string[] | null
    molecularHash?: string | null
    bundleHashes?: string[] | null
    bundleHash?: string | null
    positions?: string[] | null
    position?: string | null
    walletAddresses?: string[] | null
    walletAddress?: string | null
    isotopes?: string[] | null
    isotope?: string | null
    tokenSlugs?: string[] | null
    tokenSlug?: string | null
    cellSlugs?: string[] | null
    cellSlug?: string | null
    batchIds?: string[] | null
    batchId?: string | null
    values?: string[] | null
    value?: string | number | null
    metaTypes?: string[] | null
    metaType?: string | null
    metaIds?: string[] | null
    metaId?: string | null
    indexes?: number[] | null
    index?: number | null
    filter?: object[] | null
    latest?: boolean | null
    queryArgs?: object | null
  }): Record<string, any> {
    if (molecularHash) {
      molecularHashes = molecularHashes || []
      molecularHashes.push(molecularHash)
    }

    if (bundleHash) {
      bundleHashes = bundleHashes || []
      bundleHashes.push(bundleHash)
    }

    if (position) {
      positions = positions || []
      positions.push(position)
    }

    if (walletAddress) {
      walletAddresses = walletAddresses || []
      walletAddresses.push(walletAddress)
    }

    if (isotope) {
      isotopes = isotopes || []
      isotopes.push(isotope)
    }

    if (tokenSlug) {
      tokenSlugs = tokenSlugs || []
      tokenSlugs.push(tokenSlug)
    }

    if (cellSlug) {
      cellSlugs = cellSlugs || []
      cellSlugs.push(cellSlug)
    }

    if (batchId) {
      batchIds = batchIds || []
      batchIds.push(batchId)
    }

    if (value) {
      values = values || []
      values.push(String(value))
    }

    if (metaType) {
      metaTypes = metaTypes || []
      metaTypes.push(metaType)
    }

    if (metaId) {
      metaIds = metaIds || []
      metaIds.push(metaId)
    }

    if (index) {
      indexes = indexes || []
      indexes.push(index)
    }

    return {
      molecularHashes,
      bundleHashes,
      positions,
      walletAddresses,
      isotopes,
      tokenSlugs,
      cellSlugs,
      batchIds,
      values,
      metaTypes,
      metaIds,
      indexes,
      filter,
      latest,
      queryArgs
    }
  }

  /**
   * Returns a Response object
   * Matches JavaScript SDK createResponse method exactly
   */
  override createResponse(json: any): ResponseAtom {
    return new ResponseAtom({
      query: this,
      json
    })
  }
}