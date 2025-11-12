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

import Response from './Response'
import Dot from '@/libraries/Dot'
import { InvalidResponseException } from '@/exception'
import type Query from '@/query/Query'

/**
 * Response for Guest Authorization Request
 */
export default class ResponseAuthorizationGuest extends Response {
  /**
   * Constructor
   */
  constructor({
    query,
    json
  }: {
    query: Query
    json: Record<string, any>
  }) {
    super({
      query,
      json,
      dataKey: 'data.AccessToken'
    })
  }

  /**
   * Returns the reason for rejection
   */
  reason(): string {
    return 'Invalid response from server'
  }

  /**
   * Returns whether molecule was accepted or not
   */
  success(): boolean {
    return this.payload() !== null
  }

  /**
   * Returns authorization data
   */
  override payload(): any {
    return this.data()
  }

  /**
   * Returns the authorization key
   */
  payloadKey(key: string): any {
    if (!Dot.has(this.payload(), key)) {
      throw new InvalidResponseException(`ResponseAuthorizationGuest::payloadKey() - '${key}' key is not found in the payload!`)
    }
    return Dot.get(this.payload(), key)
  }

  /**
   * Returns the auth token
   */
  token(): any {
    return this.payloadKey('token')
  }

  /**
   * Returns timestamp
   */
  time(): any {
    return this.payloadKey('time')
  }
}