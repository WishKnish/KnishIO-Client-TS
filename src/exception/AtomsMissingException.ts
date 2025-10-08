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
 * Exception thrown when required atoms are missing from a molecule
 * Used in molecular validation and composition
 */
export default class AtomsMissingException extends BaseException {
  constructor(message = 'Required atoms are missing', options: BaseExceptionOptions = {}) {
    super('ATOMS_MISSING_ERROR', message, options)
  }

  /**
   * Factory method for empty molecule
   */
  static emptyMolecule(): AtomsMissingException {
    return new AtomsMissingException(
      'Molecule cannot be empty - at least one atom is required',
      {
        code: 'EMPTY_MOLECULE'
      }
    )
  }

  /**
   * Factory method for missing isotope-specific atoms
   */
  static missingIsotope(isotope: string): AtomsMissingException {
    return new AtomsMissingException(
      `Missing required ${isotope} isotope atoms`,
      {
        details: { isotope },
        code: 'MISSING_ISOTOPE'
      }
    )
  }

  /**
   * Factory method for missing remainder atoms
   */
  static missingRemainder(expectedCount: number, actualCount: number): AtomsMissingException {
    return new AtomsMissingException(
      `Missing remainder atoms: expected ${expectedCount}, found ${actualCount}`,
      {
        details: { expectedCount, actualCount },
        code: 'MISSING_REMAINDER'
      }
    )
  }

  /**
   * Factory method for missing value atoms in transfers
   */
  static missingValueAtoms(): AtomsMissingException {
    return new AtomsMissingException(
      'Transfer molecules must contain value (V) atoms',
      {
        code: 'MISSING_VALUE_ATOMS'
      }
    )
  }
}