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
 * EmbeddingStatusItem shape returned by the server.
 */
export interface EmbeddingStatusItem {
  /** Metadata type (echoed from input) */
  metaType: string
  /** Instance identifier (echoed from input) */
  metaId: string
  /** Embedding state: 'PENDING' | 'STALE' | 'COMPLETE' */
  state: 'PENDING' | 'STALE' | 'COMPLETE'
  /** Total meta rows for this instance */
  totalMetas: number
  /** Rows with current-model embeddings */
  embeddedCount: number
  /** Unix epoch of most recent embedding, or null */
  embeddedAt: number | null
  /** Model name used for embeddings, or null */
  model: string | null
}

/**
 * ResponseEmbeddingStatus - Response for EmbeddingStatus Query
 *
 * Payload is an array of EmbeddingStatusItem objects.
 */
export default class ResponseEmbeddingStatus extends Response {
  /**
   * Class constructor
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
      dataKey: 'data.embeddingStatus'
    })
  }

  /**
   * Returns the array of embedding status items, or null if empty.
   */
  override payload(): EmbeddingStatusItem[] | null {
    const items = this.data()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return null
    }

    return items as EmbeddingStatusItem[]
  }
}
