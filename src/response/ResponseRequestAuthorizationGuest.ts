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
  payload(): any {
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
   * Returns timestamp
   */
  time(): any {
    return this.payloadKey('time')
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