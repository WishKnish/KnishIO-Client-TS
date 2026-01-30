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

import type Query from '../query/Query'
import Response from './Response'

/**
 * ResponseMetaType class - Response for MetaType Query
 * Matches JavaScript SDK ResponseMetaType implementation exactly
 */
export default class ResponseMetaType extends Response {
  /**
   * Class constructor
   * Matches JavaScript SDK constructor signature exactly
   */
  constructor({
    query,
    json
  }: {
    query: Query
    json: any
  }) {
    super({
      query,
      json,
      dataKey: 'data.MetaType'
    })
  }

  /**
   * Extracts payload from metaData object
   */
  private extractPayload(metaData: any): any {
    return {
      instances: metaData?.instances || [],
      instanceCount: metaData?.instanceCount || [],
      paginatorInfo: metaData?.paginatorInfo || {}
    }
  }

  /**
   * Returns meta type instance results
   * Handles various response formats from server:
   * - Array of results (normal case)
   * - Single object (filtered queries)
   * - null/undefined (no results)
   * - Empty array (no matching data)
   */
  override payload(): any | null {
    const metaTypeData = this.data()

    // Handle null/undefined responses
    if (metaTypeData === null || metaTypeData === undefined) {
      return null
    }

    // Handle array response (expected format)
    if (Array.isArray(metaTypeData)) {
      if (metaTypeData.length === 0) {
        // Return empty structure instead of null for empty results
        return this.extractPayload(null)
      }
      // Get last element without mutating the array
      const metaData = metaTypeData[metaTypeData.length - 1]
      return this.extractPayload(metaData)
    }

    // Handle single object response (some filtered queries)
    if (typeof metaTypeData === 'object') {
      return this.extractPayload(metaTypeData)
    }

    // Unknown format, return null
    return null
  }
}