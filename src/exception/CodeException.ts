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
 * CodeException - Thrown when there are code-related issues
 * Used for general application logic errors
 */
export default class CodeException extends BaseException {
  public readonly errorType: string = 'CODE_ERROR'

  constructor(message: string, options: BaseExceptionOptions = {}) {
    super('CODE_ERROR', message, {
      code: 'CODE_ERROR',
      ...options
    })
  }

  /**
   * Create exception for general code errors
   */
  static codeError(message: string, context?: Record<string, unknown>): CodeException {
    return new CodeException(message, {
      code: 'CODE_ERROR',
      ...(context ? { context } : {})
    })
  }

  /**
   * Create exception for validation errors
   */
  static validationError(field: string, value: unknown, context?: Record<string, unknown>): CodeException {
    return new CodeException(`Validation failed for field '${field}' with value: ${value}`, {
      code: 'VALIDATION_ERROR',
      context: {
        operation: 'validation',
        parameters: {
          field,
          value,
          ...context
        }
      }
    })
  }

  /**
   * Create exception for configuration errors
   */
  static configurationError(message: string, context?: Record<string, unknown>): CodeException {
    return new CodeException(`Configuration error: ${message}`, {
      code: 'CONFIGURATION_ERROR',
      ...(context ? { context } : {})
    })
  }

  /**
   * Create exception for operation failures
   */
  static operationFailed(operation: string, reason?: string, context?: Record<string, unknown>): CodeException {
    const message = reason 
      ? `Operation '${operation}' failed: ${reason}`
      : `Operation '${operation}' failed`
    
    return new CodeException(message, {
      code: 'OPERATION_FAILED',
      context: {
        operation,
        ...(reason ? { reason } : {}),
        ...context
      }
    })
  }
}