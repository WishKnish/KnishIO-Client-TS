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
 * Exception thrown when atom indexing is invalid or conflicts
 * Used in molecular composition when atom indices are incorrect
 */
export default class AtomIndexException extends BaseException {
  constructor(message = 'Invalid atom index', options: BaseExceptionOptions = {}) {
    super('ATOM_INDEX_ERROR', message, options)
  }

  /**
   * Factory method for index conflicts
   */
  static indexConflict(index: number, existingIndex: number): AtomIndexException {
    return new AtomIndexException(
      `Atom index ${index} conflicts with existing index ${existingIndex}`,
      {
        details: { index, existingIndex },
        code: 'INDEX_CONFLICT'
      }
    )
  }

  /**
   * Factory method for out-of-range indices
   */
  static indexOutOfRange(index: number, maxIndex: number): AtomIndexException {
    return new AtomIndexException(
      `Atom index ${index} is out of range (max: ${maxIndex})`,
      {
        details: { index, maxIndex },
        code: 'INDEX_OUT_OF_RANGE'
      }
    )
  }

  /**
   * Factory method for missing required index
   */
  static missingIndex(): AtomIndexException {
    return new AtomIndexException(
      'Atom index is required but not provided',
      {
        code: 'INDEX_MISSING'
      }
    )
  }
}