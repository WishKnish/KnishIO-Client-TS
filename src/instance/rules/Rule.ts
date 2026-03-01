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

import Callback from './Callback'
import Condition from './Condition'
import RuleArgumentException from './exception/RuleArgumentException'
import { MetaMissingException } from '@/exception'

interface RuleParams {
  condition?: Condition[]
  callback?: Callback[]
}

interface RuleJSON {
  condition: Condition[]
  callback: Callback[]
}

export default class Rule {
  private __condition: Condition[]
  private __callback: Callback[]

  constructor({ condition = [], callback = [] }: RuleParams) {
    for (const element of condition) {
      if (!(element instanceof Condition)) {
        throw new RuleArgumentException()
      }
    }

    for (const element of callback) {
      if (!(element instanceof Callback)) {
        throw new RuleArgumentException()
      }
    }

    this.__condition = condition
    this.__callback = callback
  }

  /**
   * Adds a condition to this rule
   */
  set comparison(condition: Condition | Record<string, any>) {
    this.__condition.push(
      condition instanceof Condition ? condition : Condition.toObject(condition as any)
    )
  }

  /**
   * Adds a callback to this rule
   */
  set callback(callback: Callback | Record<string, any>) {
    this.__callback.push(
      callback instanceof Callback ? callback : Callback.toObject(callback as any)
    )
  }

  /**
   * Convert rule data to Rule object
   * @param object - Rule data to convert
   * @return Rule instance
   */
  static toObject(object: any): Rule {
    if (!object.condition) {
      throw new MetaMissingException('Rule::toObject() - Incorrect rule format! There is no condition field.')
    }
    if (!object.callback) {
      throw new MetaMissingException('Rule::toObject() - Incorrect rule format! There is no callback field.')
    }

    const rule = new Rule({})

    for (const condition of object.condition) {
      rule.comparison = condition
    }

    for (const callback of object.callback) {
      rule.callback = callback
    }

    return rule
  }

  /**
   * Converts to JSON representation
   */
  toJSON(): RuleJSON {
    return {
      condition: this.__condition,
      callback: this.__callback
    }
  }
}
