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
 * Exception thrown when a secret storage or hardware envelope encryption operation fails
 */
export default class SecretStorageException extends BaseException {
  constructor(message = 'Secret storage operation failed', options: BaseExceptionOptions = {}) {
    super('WALLET_CREDENTIAL_ERROR', message, {
      code: 'SECRET_STORAGE_ERROR',
      ...options
    })
  }

  /**
   * Secret not found for the requested bundle hash
   */
  static notFound(bundleHash: string): SecretStorageException {
    return new SecretStorageException(`Secret not found for bundle: ${bundleHash}`, {
      code: 'SECRET_NOT_FOUND',
      details: { bundleHash }
    })
  }

  /**
   * Decryption failed (wrong passphrase or corrupted payload)
   */
  static decryptionFailed(reason?: string): SecretStorageException {
    return new SecretStorageException(
      `Failed to decrypt master secret: ${reason || 'Invalid passphrase or corrupted ciphertext'}`,
      {
        code: 'DECRYPTION_FAILED',
        details: { reason }
      }
    )
  }

  /**
   * Provider is unavailable in current platform
   */
  static unavailable(provider: string, reason?: string): SecretStorageException {
    return new SecretStorageException(
      `Secret storage provider '${provider}' is unavailable: ${reason || 'Hardware or API not accessible'}`,
      {
        code: 'STORAGE_UNAVAILABLE',
        details: { provider, reason }
      }
    )
  }
}
