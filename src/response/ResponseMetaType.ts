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
   * Returns meta type instance results
   * Matches JavaScript SDK payload method exactly
   */
  override payload(): any | null {
    const metaTypeData = this.data()

    if (!metaTypeData || metaTypeData.length === 0) {
      return null
    }

    const response: any = {
      instances: {},
      instanceCount: {},
      paginatorInfo: {}
    }

    const metaData = metaTypeData.pop()

    if (metaData.instances) {
      response.instances = metaData.instances
    }

    if (metaData.instanceCount) {
      response.instanceCount = metaData.instanceCount
    }

    if (metaData.paginatorInfo) {
      response.paginatorInfo = metaData.paginatorInfo
    }

    return response
  }
}