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
 * Exception thrown when molecular hash validation fails
 * Critical for cross-SDK compatibility and transaction integrity
 */
export default class MolecularHashMismatchException extends BaseException {
  constructor(message = 'Molecular hash mismatch', options: BaseExceptionOptions = {}) {
    super('MOLECULAR_HASH_MISMATCH_ERROR', message, options)
  }

  /**
   * Factory method for hash mismatch with specific values
   */
  static hashMismatch(expected: string, actual: string): MolecularHashMismatchException {
    return new MolecularHashMismatchException(
      `Molecular hash mismatch: expected '${expected}', got '${actual}'`,
      {
        details: { expected, actual },
        code: 'HASH_MISMATCH'
      }
    )
  }

  /**
   * Factory method for invalid hash format
   */
  static invalidFormat(hash: string): MolecularHashMismatchException {
    return new MolecularHashMismatchException(
      `Invalid molecular hash format: '${hash}'`,
      {
        details: { hash },
        code: 'INVALID_FORMAT'
      }
    )
  }

  /**
   * Factory method for cross-platform compatibility issues
   */
  static crossPlatformMismatch(
    sdk: string,
    expectedHash: string,
    actualHash: string
  ): MolecularHashMismatchException {
    return new MolecularHashMismatchException(
      `Cross-platform hash mismatch with ${sdk} SDK: expected '${expectedHash}', got '${actualHash}'`,
      {
        details: { sdk, expectedHash, actualHash },
        code: 'CROSS_PLATFORM_MISMATCH'
      }
    )
  }

  /**
   * Factory method for atom integrity issues
   */
  static atomIntegrityFailure(atomIndex: number): MolecularHashMismatchException {
    return new MolecularHashMismatchException(
      `Molecular hash integrity failure at atom ${atomIndex}`,
      {
        details: { atomIndex },
        code: 'ATOM_INTEGRITY_FAILURE'
      }
    )
  }
}