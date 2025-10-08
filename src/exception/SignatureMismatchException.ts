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

import BaseException, { type BaseExceptionOptions } from './BaseException'

/**
 * Exception thrown when signature verification fails
 * Critical for quantum-resistant cryptographic operations
 */
export default class SignatureMismatchException extends BaseException {
  constructor(message = 'Signature verification failed', options: BaseExceptionOptions = {}) {
    super('SIGNATURE_MISMATCH_ERROR', message, options)
  }

  /**
   * Factory method for signature verification failure
   */
  static verificationFailed(publicKey: string, signature: string): SignatureMismatchException {
    return new SignatureMismatchException(
      `Signature verification failed for public key: ${publicKey.substring(0, 16)}...`,
      {
        details: { publicKey, signature: signature.substring(0, 32) + '...' },
        code: 'VERIFICATION_FAILED'
      }
    )
  }

  /**
   * Factory method for OTS signature verification failure
   */
  static otsVerificationFailed(fragmentIndex: number): SignatureMismatchException {
    return new SignatureMismatchException(
      `OTS signature verification failed at fragment ${fragmentIndex}`,
      {
        details: { fragmentIndex },
        code: 'OTS_VERIFICATION_FAILED'
      }
    )
  }

  /**
   * Factory method for cross-platform signature compatibility issues
   */
  static crossPlatformMismatch(sdk: string): SignatureMismatchException {
    return new SignatureMismatchException(
      `Signature verification failed due to cross-platform incompatibility with ${sdk}`,
      {
        details: { sdk },
        code: 'CROSS_PLATFORM_MISMATCH'
      }
    )
  }
}