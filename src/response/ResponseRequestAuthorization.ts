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
   * Returns timestamp
   * Matches JavaScript SDK time method exactly
   */
  time(): string {
    return this.payloadKey('time')
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