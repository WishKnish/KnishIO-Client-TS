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
import type MutationRequestAuthorizationGuest from '@/mutation/MutationRequestAuthorizationGuest'

/**
 * Response for guest auth mutation
 */
export default class ResponseRequestAuthorizationGuest extends Response {
  /**
   * Constructor
   */
  constructor({
    query,
    json
  }: {
    query: MutationRequestAuthorizationGuest
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
   * Returns whether authorization was successful
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
      throw new InvalidResponseException(`ResponseRequestAuthorizationGuest::payloadKey() - '${key}' key is not found in the payload!`)
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
   * Returns raw time value from payload
   */
  time(): any {
    return this.payloadKey('time')
  }

  /**
   * Returns the expiration timestamp as Unix seconds.
   * Handles both server formats:
   * - PHP server: time = lifetime in ms, expiresAt = Unix timestamp in payload
   * - Rust server: time = Unix timestamp in seconds
   */
  expiresAt(): number {
    try {
      const ea = this.payloadKey('expiresAt')
      if (ea) {
        return Number(ea)
      }
    } catch (_e) {
      // Not available in payload, fall back
    }

    const timeValue = Number(this.time())
    if (timeValue >= 1577836800) {
      return timeValue
    }

    return Math.floor(Date.now() / 1000) + Math.floor(timeValue / 1000)
  }

  /**
   * Returns public key
   */
  pubKey(): string {
    return this.payloadKey('key')
  }

  /**
   * Returns encrypt flag
   */
  encrypt(): any {
    return this.payloadKey('encrypt')
  }
}