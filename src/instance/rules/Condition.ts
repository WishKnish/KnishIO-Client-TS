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

import RuleArgumentException from './exception/RuleArgumentException'

interface ConditionParams {
  key: string
  value: any
  comparison: string
}

/**
 * Condition class for rule-based logic
 */
export default class Condition {
  private __key: string
  private __value: any
  private __comparison: string

  constructor({ key, value, comparison }: ConditionParams) {
    if ([key, value, comparison].some(item => !item)) {
      throw new RuleArgumentException('Condition::constructor( { key, value, comparison } ) - not all class parameters are initialised!')
    }

    this.__key = key
    this.__value = value
    this.__comparison = comparison
  }

  /**
   * Creates a Condition from a plain object
   */
  static toObject(object: ConditionParams): Condition {
    return new this({
      key: object.key,
      value: object.value,
      comparison: object.comparison
    })
  }

  /**
   * Converts to JSON representation
   */
  toJSON(): ConditionParams {
    return {
      key: this.__key,
      value: this.__value,
      comparison: this.__comparison
    }
  }
}