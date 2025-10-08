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
 * UnauthenticatedException - Thrown when authentication is required but missing or invalid
 * Used for GraphQL operations that require valid authentication tokens
 */
export default class UnauthenticatedException extends BaseException {
  public readonly errorType: string = 'UNAUTHENTICATED_ERROR'

  constructor(message: string, options: BaseExceptionOptions = {}) {
    super('UNAUTHENTICATED_ERROR', message, options)
  }

  /**
   * Create exception for missing authentication
   */
  static missingAuth(operation?: string, context?: Record<string, unknown>): UnauthenticatedException {
    const message = operation 
      ? `Authentication required for operation: ${operation}`
      : 'Authentication required'
    
    return new UnauthenticatedException(message, {
      code: 'MISSING_AUTH',
      context: {
        ...(operation ? { operation } : {}),
        ...context
      }
    })
  }

  /**
   * Create exception for expired tokens
   */
  static tokenExpired(expiresAt?: number, context?: Record<string, unknown>): UnauthenticatedException {
    const message = expiresAt 
      ? `Authentication token expired at ${new Date(expiresAt * 1000).toISOString()}`
      : 'Authentication token expired'
    
    return new UnauthenticatedException(message, {
      code: 'TOKEN_EXPIRED',
      context: {
        ...(expiresAt ? { expiresAt } : {}),
        ...(expiresAt ? { expiredAt: new Date(expiresAt * 1000).toISOString() } : {}),
        ...context
      }
    })
  }

  /**
   * Create exception for invalid tokens
   */
  static invalidToken(reason?: string, context?: Record<string, unknown>): UnauthenticatedException {
    const message = reason 
      ? `Invalid authentication token: ${reason}`
      : 'Invalid authentication token'
    
    return new UnauthenticatedException(message, {
      code: 'INVALID_TOKEN',
      context: {
        ...(reason ? { reason } : {}),
        ...context
      }
    })
  }

  /**
   * Create exception for rejected authentication
   */
  static authenticationRejected(reason?: string, context?: Record<string, unknown>): UnauthenticatedException {
    const message = reason 
      ? `Authentication rejected: ${reason}`
      : 'Authentication rejected by server'
    
    return new UnauthenticatedException(message, {
      code: 'AUTHENTICATION_REJECTED',
      context: {
        ...(reason ? { reason } : {}),
        ...context
      }
    })
  }

  /**
   * Create exception for missing credentials
   */
  static missingCredentials(credentialType?: string, context?: Record<string, unknown>): UnauthenticatedException {
    const message = credentialType 
      ? `Missing required credential: ${credentialType}`
      : 'Missing required authentication credentials'
    
    return new UnauthenticatedException(message, {
      code: 'MISSING_CREDENTIALS',
      context: {
        ...(credentialType ? { credentialType } : {}),
        ...context
      }
    })
  }
}