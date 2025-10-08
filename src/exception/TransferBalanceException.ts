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
 * Exception thrown when token transfer balance validation fails
 * Used to ensure transfers maintain proper balance accounting
 */
export default class TransferBalanceException extends BaseException {
  constructor(message = 'Transfer balance validation failed', options: BaseExceptionOptions = {}) {
    super('TRANSFER_BALANCE_ERROR', message, options)
  }

  /**
   * Factory method for insufficient balance
   */
  static insufficientBalance(required: string, available: string): TransferBalanceException {
    return new TransferBalanceException(
      `Insufficient balance: required ${required}, available ${available}`,
      {
        details: { required, available },
        code: 'INSUFFICIENT_BALANCE'
      }
    )
  }

  /**
   * Factory method for negative balance result
   */
  static negativeBalance(balance: string): TransferBalanceException {
    return new TransferBalanceException(
      `Transfer would result in negative balance: ${balance}`,
      {
        details: { balance },
        code: 'NEGATIVE_BALANCE'
      }
    )
  }

  /**
   * Factory method for balance calculation errors
   */
  static calculationError(operation: string, details?: Record<string, unknown>): TransferBalanceException {
    return new TransferBalanceException(
      `Balance calculation error during ${operation}`,
      {
        details: { operation, ...details },
        code: 'CALCULATION_ERROR'
      }
    )
  }
}