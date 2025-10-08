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
 * Complete KnishIO Exception System
 * Exports all 22 exception classes maintaining compatibility with JS SDK
 */

// Base Exception
export { default as BaseException } from './BaseException'
export type { BaseExceptionOptions } from './BaseException'

// Core exceptions (implemented)
export { default as AtomIndexException } from './AtomIndexException'
export { default as AtomsMissingException } from './AtomsMissingException'
export { default as MolecularHashMismatchException } from './MolecularHashMismatchException'
export { default as SignatureMismatchException } from './SignatureMismatchException'
export { default as TransferBalanceException } from './TransferBalanceException'
export { default as WalletCredentialException } from './WalletCredentialException'
export { default as InvalidResponseException } from './InvalidResponseException'

// Additional exceptions (now implemented)
export { default as BalanceInsufficientException } from './BalanceInsufficientException'  
export { default as BatchIdException } from './BatchIdException'
export { default as MetaMissingException } from './MetaMissingException'
export { default as MolecularHashMissingException } from './MolecularHashMissingException'
export { default as NegativeAmountException } from './NegativeAmountException'
export { default as PolicyInvalidException } from './PolicyInvalidException'
export { default as SignatureMalformedException } from './SignatureMalformedException'
export { default as TransferMalformedException } from './TransferMalformedException'
export { default as TransferMismatchedException } from './TransferMismatchedException'
export { default as TransferRemainderException } from './TransferRemainderException'
export { default as TransferToSelfException } from './TransferToSelfException'
export { default as TransferUnbalancedException } from './TransferUnbalancedException'
export { default as WrongTokenTypeException } from './WrongTokenTypeException'

// Additional essential exceptions (now implemented)
export { default as CodeException } from './CodeException'
export { default as UnauthenticatedException } from './UnauthenticatedException'

// Missing exceptions now implemented (Phase 1 complete)
export { default as AuthorizationRejectedException } from './AuthorizationRejectedException'
export { default as DecryptionKeyException } from './DecryptionKeyException'
export { default as StackableUnitAmountException } from './StackableUnitAmountException'
export { default as StackableUnitDecimalsException } from './StackableUnitDecimalsException'
export { default as WalletShadowException } from './WalletShadowException'

// Utility functions and type guards
export { 
  isKnishIOError, 
  hasErrorType, 
  getErrorMessage, 
  createErrorContext 
} from './BaseException'

// =============================================================================
// EXCEPTION FACTORY FUNCTIONS
// =============================================================================

import BaseException from './BaseException'
import AtomIndexException from './AtomIndexException'
import AtomsMissingException from './AtomsMissingException'
import MolecularHashMismatchException from './MolecularHashMismatchException'
import SignatureMismatchException from './SignatureMismatchException'
import TransferBalanceException from './TransferBalanceException'
import WalletCredentialException from './WalletCredentialException'
import InvalidResponseException from './InvalidResponseException'

/**
 * Exception factory for creating typed exceptions
 */
export class ExceptionFactory {
  /**
   * Create AtomIndexException
   */
  static atomIndex = {
    indexConflict: AtomIndexException.indexConflict.bind(AtomIndexException),
    indexOutOfRange: AtomIndexException.indexOutOfRange.bind(AtomIndexException),
    missingIndex: AtomIndexException.missingIndex.bind(AtomIndexException)
  }

  /**
   * Create AtomsMissingException
   */
  static atomsMissing = {
    emptyMolecule: AtomsMissingException.emptyMolecule.bind(AtomsMissingException),
    missingIsotope: AtomsMissingException.missingIsotope.bind(AtomsMissingException),
    missingRemainder: AtomsMissingException.missingRemainder.bind(AtomsMissingException),
    missingValueAtoms: AtomsMissingException.missingValueAtoms.bind(AtomsMissingException)
  }

  /**
   * Create MolecularHashMismatchException
   */
  static molecularHashMismatch = {
    hashMismatch: MolecularHashMismatchException.hashMismatch.bind(MolecularHashMismatchException),
    invalidFormat: MolecularHashMismatchException.invalidFormat.bind(MolecularHashMismatchException),
    crossPlatformMismatch: MolecularHashMismatchException.crossPlatformMismatch.bind(MolecularHashMismatchException),
    atomIntegrityFailure: MolecularHashMismatchException.atomIntegrityFailure.bind(MolecularHashMismatchException)
  }

  /**
   * Create SignatureMismatchException
   */
  static signatureMismatch = {
    verificationFailed: SignatureMismatchException.verificationFailed.bind(SignatureMismatchException),
    otsVerificationFailed: SignatureMismatchException.otsVerificationFailed.bind(SignatureMismatchException),
    crossPlatformMismatch: SignatureMismatchException.crossPlatformMismatch.bind(SignatureMismatchException)
  }

  /**
   * Create TransferBalanceException
   */
  static transferBalance = {
    insufficientBalance: TransferBalanceException.insufficientBalance.bind(TransferBalanceException),
    negativeBalance: TransferBalanceException.negativeBalance.bind(TransferBalanceException),
    calculationError: TransferBalanceException.calculationError.bind(TransferBalanceException)
  }

  /**
   * Create WalletCredentialException
   */
  static walletCredential = {
    invalidSecret: WalletCredentialException.invalidSecret.bind(WalletCredentialException),
    missingCredentials: WalletCredentialException.missingCredentials.bind(WalletCredentialException),
    credentialsExpired: WalletCredentialException.credentialsExpired.bind(WalletCredentialException),
    bundleMismatch: WalletCredentialException.bundleMismatch.bind(WalletCredentialException)
  }

  /**
   * Create InvalidResponseException
   */
  static invalidResponse = {
    malformedJson: InvalidResponseException.malformedJson.bind(InvalidResponseException),
    graphqlError: InvalidResponseException.graphqlError.bind(InvalidResponseException),
    missingData: InvalidResponseException.missingData.bind(InvalidResponseException),
    networkError: InvalidResponseException.networkError.bind(InvalidResponseException)
  }

  /**
   * Convert any error to KnishIO exception
   */
  static fromError = BaseException.fromError.bind(BaseException)
}

// =============================================================================
// EXCEPTION CONSTANTS
// =============================================================================

/**
 * Exception type constants for easy reference
 */
export const EXCEPTION_TYPES = {
  ATOM_INDEX_ERROR: 'ATOM_INDEX_ERROR',
  ATOMS_MISSING_ERROR: 'ATOMS_MISSING_ERROR',
  AUTHORIZATION_REJECTED_ERROR: 'AUTHORIZATION_REJECTED_ERROR',
  BALANCE_INSUFFICIENT_ERROR: 'BALANCE_INSUFFICIENT_ERROR',
  BATCH_ID_ERROR: 'BATCH_ID_ERROR',
  CODE_ERROR: 'CODE_ERROR',
  DECRYPTION_KEY_ERROR: 'DECRYPTION_KEY_ERROR',
  INVALID_RESPONSE_ERROR: 'INVALID_RESPONSE_ERROR',
  META_MISSING_ERROR: 'META_MISSING_ERROR',
  MOLECULAR_HASH_MISMATCH_ERROR: 'MOLECULAR_HASH_MISMATCH_ERROR',
  MOLECULAR_HASH_MISSING_ERROR: 'MOLECULAR_HASH_MISSING_ERROR',
  NEGATIVE_AMOUNT_ERROR: 'NEGATIVE_AMOUNT_ERROR',
  POLICY_INVALID_ERROR: 'POLICY_INVALID_ERROR',
  SIGNATURE_MALFORMED_ERROR: 'SIGNATURE_MALFORMED_ERROR',
  SIGNATURE_MISMATCH_ERROR: 'SIGNATURE_MISMATCH_ERROR',
  STACKABLE_UNIT_AMOUNT_ERROR: 'STACKABLE_UNIT_AMOUNT_ERROR',
  STACKABLE_UNIT_DECIMALS_ERROR: 'STACKABLE_UNIT_DECIMALS_ERROR',
  TRANSFER_BALANCE_ERROR: 'TRANSFER_BALANCE_ERROR',
  TRANSFER_MALFORMED_ERROR: 'TRANSFER_MALFORMED_ERROR',
  TRANSFER_MISMATCHED_ERROR: 'TRANSFER_MISMATCHED_ERROR',
  TRANSFER_REMAINDER_ERROR: 'TRANSFER_REMAINDER_ERROR',
  TRANSFER_TO_SELF_ERROR: 'TRANSFER_TO_SELF_ERROR',
  TRANSFER_UNBALANCED_ERROR: 'TRANSFER_UNBALANCED_ERROR',
  UNAUTHENTICATED_ERROR: 'UNAUTHENTICATED_ERROR',
  WALLET_CREDENTIAL_ERROR: 'WALLET_CREDENTIAL_ERROR',
  WALLET_SHADOW_ERROR: 'WALLET_SHADOW_ERROR',
  WRONG_TOKEN_TYPE_ERROR: 'WRONG_TOKEN_TYPE_ERROR'
} as const

/**
 * Exception code constants for common error scenarios
 */
export const EXCEPTION_CODES = {
  // Generic codes
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  OPERATION_FAILED: 'OPERATION_FAILED',
  
  // Atom-specific codes
  INDEX_CONFLICT: 'INDEX_CONFLICT',
  INDEX_OUT_OF_RANGE: 'INDEX_OUT_OF_RANGE',
  INDEX_MISSING: 'INDEX_MISSING',
  EMPTY_MOLECULE: 'EMPTY_MOLECULE',
  MISSING_ISOTOPE: 'MISSING_ISOTOPE',
  MISSING_REMAINDER: 'MISSING_REMAINDER',
  MISSING_VALUE_ATOMS: 'MISSING_VALUE_ATOMS',
  
  // Hash-specific codes
  HASH_MISMATCH: 'HASH_MISMATCH',
  INVALID_FORMAT: 'INVALID_FORMAT',
  CROSS_PLATFORM_MISMATCH: 'CROSS_PLATFORM_MISMATCH',
  ATOM_INTEGRITY_FAILURE: 'ATOM_INTEGRITY_FAILURE',
  
  // Signature-specific codes
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  OTS_VERIFICATION_FAILED: 'OTS_VERIFICATION_FAILED',
  
  // Transfer-specific codes
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  NEGATIVE_BALANCE: 'NEGATIVE_BALANCE',
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  
  // Wallet-specific codes
  INVALID_SECRET: 'INVALID_SECRET',
  MISSING_CREDENTIALS: 'MISSING_CREDENTIALS',
  CREDENTIALS_EXPIRED: 'CREDENTIALS_EXPIRED',
  BUNDLE_MISMATCH: 'BUNDLE_MISMATCH',
  
  // Response-specific codes
  MALFORMED_JSON: 'MALFORMED_JSON',
  GRAPHQL_ERROR: 'GRAPHQL_ERROR',
  MISSING_DATA: 'MISSING_DATA',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const