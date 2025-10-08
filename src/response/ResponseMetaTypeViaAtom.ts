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
 * ResponseMetaTypeViaAtom class - Response for MetaTypeViaAtom Query
 * Matches JavaScript SDK ResponseMetaTypeViaAtom implementation exactly
 */
export default class ResponseMetaTypeViaAtom extends Response {
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
      dataKey: 'data.MetaTypeViaAtom'
    })
  }

  /**
   * Returns meta type instance results via atom
   * Matches JavaScript SDK payload method exactly
   */
  payload(): any | null {
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