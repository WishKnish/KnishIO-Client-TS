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
 * ResponseAtom class - Response for Atom Query
 * Matches JavaScript SDK ResponseAtom implementation exactly
 */
export default class ResponseAtom extends Response {
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
      dataKey: 'data.Atom'
    })
  }

  /**
   * Returns atom instance results
   * Matches JavaScript SDK payload method exactly
   */
  payload(): any | null {
    const metaTypeData = this.data()

    if (!metaTypeData) {
      return null
    }

    const response: any = {
      instances: [],
      instanceCount: {},
      paginatorInfo: {}
    }

    if (metaTypeData.instances) {
      response.instances = metaTypeData.instances

      for (const instanceKey in response.instances) {
        const instance = response.instances[instanceKey]
        if (instance.metasJson) {
          response.instances[instanceKey].metas = JSON.parse(instance.metasJson)
        }
      }
    }

    if (metaTypeData.instanceCount) {
      response.instanceCount = metaTypeData.instanceCount
    }

    if (metaTypeData.paginatorInfo) {
      response.paginatorInfo = metaTypeData.paginatorInfo
    }

    return response
  }

  /**
   * Returns parsed metas from all instances
   * Matches JavaScript SDK metas method exactly
   */
  metas(): any[] {
    const response = this.payload()
    const metas: any[] = []

    if (response && response.instances) {
      for (const instance of response.instances) {
        if (instance.metasJson) {
          metas.push(JSON.parse(instance.metasJson))
        }
      }
    }

    return metas
  }
}