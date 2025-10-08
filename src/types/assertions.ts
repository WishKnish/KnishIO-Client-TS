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
 * Runtime Assertion Functions for KnishIO SDK
 * 
 * Implements 2025 TypeScript patterns:
 * - Assertion functions with 'asserts' keyword
 * - Runtime type narrowing with compile-time guarantees
 * - Enhanced error messages with context
 * - Type-safe runtime validation
 */

import type {
  AtomIsotope,
  KnishIOErrorType,
  QueryType,
  MutationType,
  SubscriptionType
} from '../constants'

import type {
  WalletAddress,
  BundleHash,
  TokenSlug,
  Position,
  MolecularHash,
  CellSlug,
  BatchId,
  AtomParams,
  WalletParams,
  MoleculeParams,
  ValueAtom,
  MetaAtom,
  ContinueAtom,
  AnyAtom,
  ErrorContext
} from './index'

import {
  isAtomIsotope,
  isKnishIOErrorType,
  isQueryType,
  isMutationType,
  isSubscriptionType,
  isWalletAddress,
  isBundleHash,
  isTokenSlug,
  isPosition,
  isMolecularHash,
  isCellSlug,
  isBatchId,
  isAtomParams,
  isWalletParams,
  isMoleculeParams,
  isValueAtom,
  isMetaAtom,
  isContinueAtom
} from './guards'

// =============================================================================
// ASSERTION ERROR CLASS
// =============================================================================

/**
 * Enhanced assertion error with context and type information
 */
export class AssertionError extends Error {
  public readonly code = 'ASSERTION_ERROR'
  public readonly context: ErrorContext
  public readonly expectedType: string
  public readonly actualValue: unknown
  public readonly timestamp: number

  constructor(
    message: string,
    expectedType: string,
    actualValue: unknown,
    context: ErrorContext = {}
  ) {
    super(message)
    this.name = 'AssertionError'
    this.expectedType = expectedType
    this.actualValue = actualValue
    this.context = context
    this.timestamp = Date.now()

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionError)
    }
  }
}

// =============================================================================
// ASSERTION UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a detailed assertion error message
 */
function createAssertionMessage(
  expectedType: string,
  actualValue: unknown,
  context?: string
): string {
  const contextMsg = context ? ` in ${context}` : ''
  const valueStr = typeof actualValue === 'string' 
    ? `"${actualValue}"` 
    : String(actualValue)
  
  return `Expected ${expectedType}${contextMsg}, but received ${typeof actualValue}: ${valueStr}`
}

/**
 * Generic assertion function factory
 */
function createAssertion<T>(
  guard: (value: unknown) => value is T,
  typeName: string
) {
  return function assert(
    value: unknown,
    context?: string
  ): asserts value is T {
    if (!guard(value)) {
      throw new AssertionError(
        createAssertionMessage(typeName, value, context),
        typeName,
        value,
        { operation: 'assertion', expected: typeName, actual: value }
      )
    }
  }
}

// =============================================================================
// ISOTOPE ASSERTIONS
// =============================================================================

/**
 * Assert value is a valid atom isotope
 */
export function assertAtomIsotope(
  value: unknown,
  context?: string
): asserts value is AtomIsotope {
  if (!isAtomIsotope(value)) {
    throw new AssertionError(
      createAssertionMessage('AtomIsotope', value, context),
      'AtomIsotope',
      value,
      { 
        operation: 'isotope_assertion',
        expected: 'C|V|U|T|M|I|R|B|F',
        actual: value,
        field: context
      }
    )
  }
}

/**
 * Specific isotope assertions for precise validation
 */
export function assertContinueIsotope(
  value: unknown,
  context?: string
): asserts value is 'C' {
  if (value !== 'C') {
    throw new AssertionError(
      createAssertionMessage('Continue isotope (C)', value, context),
      'C',
      value,
      { operation: 'isotope_assertion', expected: 'C', actual: value }
    )
  }
}

export function assertValueIsotope(
  value: unknown,
  context?: string
): asserts value is 'V' {
  if (value !== 'V') {
    throw new AssertionError(
      createAssertionMessage('Value isotope (V)', value, context),
      'V',
      value,
      { operation: 'isotope_assertion', expected: 'V', actual: value }
    )
  }
}

export function assertMetaIsotope(
  value: unknown,
  context?: string
): asserts value is 'M' {
  if (value !== 'M') {
    throw new AssertionError(
      createAssertionMessage('Meta isotope (M)', value, context),
      'M',
      value,
      { operation: 'isotope_assertion', expected: 'M', actual: value }
    )
  }
}

// =============================================================================
// ERROR TYPE ASSERTIONS
// =============================================================================

/**
 * Assert value is a valid KnishIO error type
 */
export function assertKnishIOErrorType(
  value: unknown,
  context?: string
): asserts value is KnishIOErrorType {
  if (!isKnishIOErrorType(value)) {
    throw new AssertionError(
      createAssertionMessage('KnishIOErrorType', value, context),
      'KnishIOErrorType',
      value,
      { 
        operation: 'error_type_assertion',
        expected: 'Valid KnishIO error type',
        actual: value
      }
    )
  }
}

// =============================================================================
// OPERATION TYPE ASSERTIONS
// =============================================================================

/**
 * Assert value is a valid query type
 */
export const assertQueryType = createAssertion(isQueryType, 'QueryType')

/**
 * Assert value is a valid mutation type
 */
export const assertMutationType = createAssertion(isMutationType, 'MutationType')

/**
 * Assert value is a valid subscription type
 */
export const assertSubscriptionType = createAssertion(isSubscriptionType, 'SubscriptionType')

// =============================================================================
// BRANDED TYPE ASSERTIONS
// =============================================================================

/**
 * Assert value is a valid wallet address
 */
export function assertWalletAddress(
  value: unknown,
  context?: string
): asserts value is WalletAddress {
  if (!isWalletAddress(value)) {
    throw new AssertionError(
      createAssertionMessage('WalletAddress (64-character hex)', value, context),
      'WalletAddress',
      value,
      { 
        operation: 'wallet_address_assertion',
        expected: '64-character hexadecimal string',
        actual: value,
        field: context
      }
    )
  }
}

/**
 * Assert value is a valid bundle hash
 */
export function assertBundleHash(
  value: unknown,
  context?: string
): asserts value is BundleHash {
  if (!isBundleHash(value)) {
    throw new AssertionError(
      createAssertionMessage('BundleHash (64-character hex)', value, context),
      'BundleHash',
      value,
      { 
        operation: 'bundle_hash_assertion',
        expected: '64-character hexadecimal string',
        actual: value,
        field: context
      }
    )
  }
}

/**
 * Assert value is a valid token slug
 */
export function assertTokenSlug(
  value: unknown,
  context?: string
): asserts value is TokenSlug {
  if (!isTokenSlug(value)) {
    throw new AssertionError(
      createAssertionMessage('TokenSlug (uppercase alphanumeric)', value, context),
      'TokenSlug',
      value,
      { 
        operation: 'token_slug_assertion',
        expected: 'Uppercase alphanumeric string (1-32 chars)',
        actual: value,
        field: context
      }
    )
  }
}

/**
 * Assert value is a valid position
 */
export const assertPosition = createAssertion(isPosition, 'Position')

/**
 * Assert value is a valid molecular hash
 */
export function assertMolecularHash(
  value: unknown,
  context?: string
): asserts value is MolecularHash {
  if (!isMolecularHash(value)) {
    throw new AssertionError(
      createAssertionMessage('MolecularHash (base17 format)', value, context),
      'MolecularHash',
      value,
      { 
        operation: 'molecular_hash_assertion',
        expected: 'Base17 encoded string (32-128 chars)',
        actual: value,
        field: context
      }
    )
  }
}

/**
 * Assert value is a valid cell slug
 */
export const assertCellSlug = createAssertion(isCellSlug, 'CellSlug')

/**
 * Assert value is a valid batch ID
 */
export function assertBatchId(
  value: unknown,
  context?: string
): asserts value is BatchId {
  if (!isBatchId(value)) {
    throw new AssertionError(
      createAssertionMessage('BatchId (UUID format)', value, context),
      'BatchId',
      value,
      { 
        operation: 'batch_id_assertion',
        expected: 'UUID v4 format',
        actual: value,
        field: context
      }
    )
  }
}

// =============================================================================
// OBJECT STRUCTURE ASSERTIONS
// =============================================================================

/**
 * Assert value is valid atom parameters
 */
export function assertAtomParams(
  value: unknown,
  context?: string
): asserts value is AtomParams {
  if (!isAtomParams(value)) {
    throw new AssertionError(
      createAssertionMessage('AtomParams object', value, context),
      'AtomParams',
      value,
      { 
        operation: 'atom_params_assertion',
        expected: 'Object with valid atom properties',
        actual: value
      }
    )
  }
}

/**
 * Assert value is valid wallet parameters
 */
export function assertWalletParams(
  value: unknown,
  context?: string
): asserts value is WalletParams {
  if (!isWalletParams(value)) {
    throw new AssertionError(
      createAssertionMessage('WalletParams object', value, context),
      'WalletParams',
      value,
      { 
        operation: 'wallet_params_assertion',
        expected: 'Object with valid wallet properties',
        actual: value
      }
    )
  }
}

/**
 * Assert value is valid molecule parameters
 */
export function assertMoleculeParams(
  value: unknown,
  context?: string
): asserts value is MoleculeParams {
  if (!isMoleculeParams(value)) {
    throw new AssertionError(
      createAssertionMessage('MoleculeParams object', value, context),
      'MoleculeParams',
      value,
      { 
        operation: 'molecule_params_assertion',
        expected: 'Object with valid molecule properties',
        actual: value
      }
    )
  }
}

// =============================================================================
// ATOM TYPE DISCRIMINATION ASSERTIONS
// =============================================================================

/**
 * Assert atom is a value atom
 */
export function assertValueAtom(
  value: unknown,
  context?: string
): asserts value is ValueAtom {
  if (!isValueAtom(value as AnyAtom)) {
    throw new AssertionError(
      createAssertionMessage('ValueAtom (isotope V with value)', value, context),
      'ValueAtom',
      value,
      { 
        operation: 'value_atom_assertion',
        expected: 'Atom with isotope V and value property',
        actual: value
      }
    )
  }
}

/**
 * Assert atom is a meta atom
 */
export function assertMetaAtom(
  value: unknown,
  context?: string
): asserts value is MetaAtom {
  if (!isMetaAtom(value as AnyAtom)) {
    throw new AssertionError(
      createAssertionMessage('MetaAtom (isotope M with metadata)', value, context),
      'MetaAtom',
      value,
      { 
        operation: 'meta_atom_assertion',
        expected: 'Atom with isotope M, metaType, metaId, and meta properties',
        actual: value
      }
    )
  }
}

/**
 * Assert atom is a continue atom
 */
export function assertContinueAtom(
  value: unknown,
  context?: string
): asserts value is ContinueAtom {
  if (!isContinueAtom(value as AnyAtom)) {
    throw new AssertionError(
      createAssertionMessage('ContinueAtom (isotope C)', value, context),
      'ContinueAtom',
      value,
      { 
        operation: 'continue_atom_assertion',
        expected: 'Atom with isotope C',
        actual: value
      }
    )
  }
}

// =============================================================================
// COMPLEX VALIDATION ASSERTIONS
// =============================================================================

/**
 * Assert array contains only specific type
 */
export function assertArrayOf<T>(
  value: unknown,
  itemAssertion: (item: unknown, context?: string) => asserts item is T,
  context?: string
): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new AssertionError(
      createAssertionMessage('Array', value, context),
      'Array',
      value,
      { operation: 'array_assertion', expected: 'Array', actual: value }
    )
  }

  value.forEach((item, index) => {
    try {
      itemAssertion(item, `${context}[${index}]`)
    } catch (error) {
      if (error instanceof AssertionError) {
        throw new AssertionError(
          `Array validation failed at index ${index}: ${error.message}`,
          `Array<${error.expectedType}>`,
          value,
          { 
            operation: 'array_item_assertion',
            expected: `Array<${error.expectedType}>`,
            actual: value,
            field: `${context}[${index}]`
          }
        )
      }
      throw error
    }
  })
}

/**
 * Assert value is non-null and non-undefined
 */
export function assertExists<T>(
  value: T | null | undefined,
  context?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new AssertionError(
      createAssertionMessage('non-null value', value, context),
      'non-null',
      value,
      { 
        operation: 'existence_assertion',
        expected: 'non-null and non-undefined value',
        actual: value
      }
    )
  }
}

/**
 * Assert value matches one of the allowed values
 */
export function assertOneOf<T extends readonly unknown[]>(
  value: unknown,
  allowedValues: T,
  context?: string
): asserts value is T[number] {
  if (!allowedValues.includes(value)) {
    throw new AssertionError(
      createAssertionMessage(`one of [${allowedValues.join(', ')}]`, value, context),
      `OneOf<${allowedValues.join('|')}>`,
      value,
      { 
        operation: 'one_of_assertion',
        expected: allowedValues.join('|'),
        actual: value
      }
    )
  }
}

// =============================================================================
// GROUPED ASSERTIONS
// =============================================================================

/**
 * Grouped assertion functions for convenient access
 */
export const Assertions = {
  // Isotope assertions
  isotope: {
    any: assertAtomIsotope,
    continue: assertContinueIsotope,
    value: assertValueIsotope,
    meta: assertMetaIsotope
  },
  
  // Error type assertions
  error: {
    type: assertKnishIOErrorType
  },
  
  // Operation assertions
  operation: {
    query: assertQueryType,
    mutation: assertMutationType,
    subscription: assertSubscriptionType
  },
  
  // Branded type assertions
  branded: {
    walletAddress: assertWalletAddress,
    bundleHash: assertBundleHash,
    tokenSlug: assertTokenSlug,
    position: assertPosition,
    molecularHash: assertMolecularHash,
    cellSlug: assertCellSlug,
    batchId: assertBatchId
  },
  
  // Object assertions
  object: {
    atomParams: assertAtomParams,
    walletParams: assertWalletParams,
    moleculeParams: assertMoleculeParams
  },
  
  // Atom discrimination
  atom: {
    value: assertValueAtom,
    meta: assertMetaAtom,
    continue: assertContinueAtom
  },
  
  // Utility assertions
  util: {
    arrayOf: assertArrayOf,
    exists: assertExists,
    oneOf: assertOneOf
  }
} as const

// =============================================================================
// ASSERTION FUNCTION FACTORY
// =============================================================================

/**
 * Create custom assertion function from a type guard
 */
export function createAssertionFrom<T>(
  guard: (value: unknown) => value is T,
  typeName: string
): (value: unknown, context?: string) => asserts value is T {
  return (value: unknown, context?: string): asserts value is T => {
    if (!guard(value)) {
      throw new AssertionError(
        createAssertionMessage(typeName, value, context),
        typeName,
        value,
        { operation: 'custom_assertion', expected: typeName, actual: value }
      )
    }
  }
}