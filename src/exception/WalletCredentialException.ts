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
 * Exception thrown when wallet credentials are invalid or compromised
 * Used for wallet authentication and authorization failures
 */
export default class WalletCredentialException extends BaseException {
  constructor(message = 'Invalid wallet credentials', options: BaseExceptionOptions = {}) {
    super('WALLET_CREDENTIAL_ERROR', message, options)
  }

  /**
   * Factory method for invalid secret
   */
  static invalidSecret(): WalletCredentialException {
    return new WalletCredentialException(
      'Wallet secret is invalid or corrupted',
      {
        code: 'INVALID_SECRET'
      }
    )
  }

  /**
   * Factory method for missing credentials
   */
  static missingCredentials(): WalletCredentialException {
    return new WalletCredentialException(
      'Wallet credentials are required but not provided',
      {
        code: 'MISSING_CREDENTIALS'
      }
    )
  }

  /**
   * Factory method for expired credentials
   */
  static credentialsExpired(): WalletCredentialException {
    return new WalletCredentialException(
      'Wallet credentials have expired',
      {
        code: 'CREDENTIALS_EXPIRED'
      }
    )
  }

  /**
   * Factory method for bundle mismatch
   */
  static bundleMismatch(expected: string, actual: string): WalletCredentialException {
    return new WalletCredentialException(
      `Wallet bundle mismatch: expected ${expected.substring(0, 16)}..., got ${actual.substring(0, 16)}...`,
      {
        details: { expected: expected.substring(0, 16) + '...', actual: actual.substring(0, 16) + '...' },
        code: 'BUNDLE_MISMATCH'
      }
    )
  }
}