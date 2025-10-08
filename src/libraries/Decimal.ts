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

/**
 * High-precision decimal operations for financial calculations
 * Value determined by min SQL decimal precision
 */

const MULTIPLIER = 10 ** 18

export default class Decimal {
  /**
   * Validates and normalizes a decimal value
   */
  static val(value: number): number {
    if (Math.abs(value * MULTIPLIER) < 1) {
      return 0.0
    }

    return value
  }

  /**
   * Compares two decimal values with high precision
   * @param value1 First value to compare
   * @param value2 Second value to compare  
   * @param debug Enable debug logging
   * @returns 0 if equal, 1 if value1 > value2, -1 if value1 < value2
   */
  static cmp(value1: number, value2: number, debug: boolean = false): number {
    const val1 = Decimal.val(value1) * MULTIPLIER
    const val2 = Decimal.val(value2) * MULTIPLIER

    // Equal
    if (Math.abs(val1 - val2) < 1) {
      return 0
    }

    // Greater or smaller
    return (val1 > val2) ? 1 : -1
  }

  /**
   * Tests if two decimal values are equal
   */
  static equal(value1: number, value2: number): boolean {
    return (Decimal.cmp(value1, value2) === 0)
  }
}