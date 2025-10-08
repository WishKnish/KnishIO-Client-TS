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
 * Exception thrown when GraphQL responses are invalid or malformed
 * Used for API communication error handling
 */
export default class InvalidResponseException extends BaseException {
  constructor(message = 'Invalid response received', options: BaseExceptionOptions = {}) {
    super('INVALID_RESPONSE_ERROR', message, options)
  }

  /**
   * Factory method for malformed JSON responses
   */
  static malformedJson(error: string): InvalidResponseException {
    return new InvalidResponseException(
      `Malformed JSON response: ${error}`,
      {
        details: { parseError: error },
        code: 'MALFORMED_JSON'
      }
    )
  }

  /**
   * Factory method for GraphQL errors
   */
  static graphqlError(errors: Array<{ message: string }>): InvalidResponseException {
    const errorMessages = errors.map(err => err.message).join(', ')
    return new InvalidResponseException(
      `GraphQL errors: ${errorMessages}`,
      {
        details: { errors },
        code: 'GRAPHQL_ERROR'
      }
    )
  }

  /**
   * Factory method for missing response data
   */
  static missingData(operation: string): InvalidResponseException {
    return new InvalidResponseException(
      `Response missing data for operation: ${operation}`,
      {
        details: { operation },
        code: 'MISSING_DATA'
      }
    )
  }

  /**
   * Factory method for network/HTTP errors
   */
  static networkError(statusCode: number, statusText: string): InvalidResponseException {
    return new InvalidResponseException(
      `Network error: ${statusCode} ${statusText}`,
      {
        details: { statusCode, statusText },
        code: 'NETWORK_ERROR'
      }
    )
  }
}