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

import Dot from '../libraries/Dot'
import { InvalidResponseException } from '../exception'
import ResponseProposeMolecule from './ResponseProposeMolecule'

/**
 * ResponseRequestAuthorization class - Response for auth token mutation
 * Matches JavaScript SDK ResponseRequestAuthorization implementation exactly
 */
export default class ResponseRequestAuthorization extends ResponseProposeMolecule {
  /**
   * Return the authorization key
   * Matches JavaScript SDK payloadKey method exactly
   */
  payloadKey(key: string): any {
    if (!Dot.has(this.payload(), key)) {
      throw new InvalidResponseException(`ResponseRequestAuthorization::payloadKey() - '${key}' key was not found in the payload!`)
    }
    return Dot.get(this.payload(), key)
  }

  /**
   * Returns the auth token
   * Matches JavaScript SDK token method exactly
   */
  token(): string {
    return this.payloadKey('token')
  }

  /**
   * Returns raw time value from payload
   */
  time(): string {
    return this.payloadKey('time')
  }

  /**
   * Returns the expiration timestamp as Unix seconds.
   * Handles both server formats:
   * - PHP server: time = lifetime in ms, expiresAt = Unix timestamp in payload
   * - Rust server: time = Unix timestamp in seconds
   */
  expiresAt(): number {
    // Try the explicit expiresAt payload key first (PHP server provides this)
    try {
      const ea = this.payloadKey('expiresAt')
      if (ea) {
        return Number(ea)
      }
    } catch (_e) {
      // Not available in payload, fall back
    }

    // Use time field with heuristic detection
    const timeValue = Number(this.time())

    // If timeValue looks like a valid Unix timestamp (>= year 2020), use directly
    // Rust server sets time = Unix timestamp in seconds
    if (timeValue >= 1577836800) {
      return timeValue
    }

    // Otherwise, time is a lifetime in milliseconds (PHP server format)
    // Convert to Unix timestamp: now_seconds + lifetime_seconds
    return Math.floor(Date.now() / 1000) + Math.floor(timeValue / 1000)
  }

  /**
   * Returns encryption info
   * Matches JavaScript SDK encrypt method exactly
   */
  encrypt(): string {
    return this.payloadKey('encrypt')
  }

  /**
   * Returns public key
   * Matches JavaScript SDK pubKey method exactly
   */
  pubKey(): string {
    return this.payloadKey('key')
  }
}