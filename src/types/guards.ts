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
 * Exhaustive Type Guards for KnishIO SDK
 * 
 * Implements 2025 TypeScript patterns:
 * - Exhaustive type checking with assertNever
 * - Advanced type guards with user-defined type predicates
 * - Discriminated union type narrowing
 * - Compile-time completeness guarantees
 */

import type {
  AtomIsotope,
  KnishIOErrorType,
  QueryType,
  MutationType,
  SubscriptionType,
  BalanceQueryType,
  NodeEnvironment
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
  AnyAtom
} from './index'

// =============================================================================
// EXHAUSTIVE CHECKING UTILITIES (2025 TYPESCRIPT)
// =============================================================================

/**
 * Exhaustive checking function to ensure all union cases are handled
 * Provides compile-time guarantees for completeness
 */
export function assertNever(value: never): never {
  throw new Error(`Exhaustive check failed. Received unexpected value: ${JSON.stringify(value)}`)
}

/**
 * Assert that all cases in a union are handled
 * Usage: assertExhaustive(isotope, handleIsotope) 
 */
export function assertExhaustive<T>(
  value: T,
  handler: (value: T) => unknown
): asserts value is never {
  handler(value)
  throw new Error(`Exhaustive check failed for value: ${String(value)}`)
}

// =============================================================================
// ISOTOPE TYPE GUARDS (EXHAUSTIVE)
// =============================================================================

/**
 * Exhaustive isotope type guard with compile-time checking
 */
export function isAtomIsotope(value: unknown): value is AtomIsotope {
  return typeof value === 'string' && 
    (['C', 'V', 'U', 'T', 'M', 'I', 'R', 'B', 'F'] as const).includes(value as AtomIsotope)
}

/**
 * Specific isotope type guards for precise type narrowing
 */
export function isContinueIsotope(value: unknown): value is 'C' {
  return value === 'C'
}

export function isValueIsotope(value: unknown): value is 'V' {
  return value === 'V'
}

export function isMetaIsotope(value: unknown): value is 'M' {
  return value === 'M'
}

export function isUserIsotope(value: unknown): value is 'U' {
  return value === 'U'
}

export function isTokenIsotope(value: unknown): value is 'T' {
  return value === 'T'
}

export function isIdentityIsotope(value: unknown): value is 'I' {
  return value === 'I'
}

export function isRuleIsotope(value: unknown): value is 'R' {
  return value === 'R'
}

export function isBufferIsotope(value: unknown): value is 'B' {
  return value === 'B'
}

export function isFuseIsotope(value: unknown): value is 'F' {
  return value === 'F'
}

/**
 * Exhaustive isotope handler with compile-time completeness
 */
export function handleIsotope<T>(
  isotope: AtomIsotope,
  handlers: {
    readonly C: () => T
    readonly V: () => T
    readonly U: () => T
    readonly T: () => T
    readonly M: () => T
    readonly I: () => T
    readonly R: () => T
    readonly B: () => T
    readonly F: () => T
  }
): T {
  switch (isotope) {
    case 'C': return handlers.C()
    case 'V': return handlers.V()
    case 'U': return handlers.U()
    case 'T': return handlers.T()
    case 'M': return handlers.M()
    case 'I': return handlers.I()
    case 'R': return handlers.R()
    case 'B': return handlers.B()
    case 'F': return handlers.F()
    default: return assertNever(isotope)
  }
}

// =============================================================================
// ERROR TYPE GUARDS (EXHAUSTIVE)
// =============================================================================

/**
 * Exhaustive error type guard
 */
export function isKnishIOErrorType(value: unknown): value is KnishIOErrorType {
  const errorTypes = [
    'ATOM_INDEX_ERROR',
    'ATOMS_MISSING_ERROR',
    'AUTHORIZATION_REJECTED_ERROR',
    'BALANCE_INSUFFICIENT_ERROR',
    'BATCH_ID_ERROR',
    'CODE_ERROR',
    'DECRYPTION_KEY_ERROR',
    'INVALID_RESPONSE_ERROR',
    'META_MISSING_ERROR',
    'MOLECULAR_HASH_MISMATCH_ERROR',
    'MOLECULAR_HASH_MISSING_ERROR',
    'NEGATIVE_AMOUNT_ERROR',
    'POLICY_INVALID_ERROR',
    'SIGNATURE_MALFORMED_ERROR',
    'SIGNATURE_MISMATCH_ERROR',
    'STACKABLE_UNIT_AMOUNT_ERROR',
    'STACKABLE_UNIT_DECIMALS_ERROR',
    'TRANSFER_BALANCE_ERROR',
    'TRANSFER_MALFORMED_ERROR',
    'TRANSFER_MISMATCHED_ERROR',
    'TRANSFER_REMAINDER_ERROR',
    'TRANSFER_TO_SELF_ERROR',
    'TRANSFER_UNBALANCED_ERROR',
    'UNAUTHENTICATED_ERROR',
    'WALLET_CREDENTIAL_ERROR',
    'WALLET_SHADOW_ERROR',
    'WRONG_TOKEN_TYPE_ERROR'
  ] as const

  return typeof value === 'string' && errorTypes.includes(value as KnishIOErrorType)
}

/**
 * Error severity type guard
 */
export function isErrorSeverity(value: unknown): value is 'low' | 'medium' | 'high' {
  return typeof value === 'string' && ['low', 'medium', 'high'].includes(value)
}

/**
 * Exhaustive error handler with compile-time completeness
 */
export function handleError<T>(
  errorType: KnishIOErrorType,
  handlers: Record<KnishIOErrorType, () => T>
): T {
  const handler = handlers[errorType]
  if (!handler) {
    return assertNever(errorType as never)
  }
  return handler()
}

// =============================================================================
// OPERATION TYPE GUARDS (EXHAUSTIVE)
// =============================================================================

/**
 * Query type guards
 */
export function isQueryType(value: unknown): value is QueryType {
  const queryTypes = [
    'Balance',
    'WalletBundle',
    'WalletList',
    'Atom',
    'MetaType',
    'MetaTypeViaAtom',
    'ContinuId',
    'Batch',
    'ActiveSession',
    'Policy',
    'Token',
    'UserActivity'
  ] as const

  return typeof value === 'string' && queryTypes.includes(value as QueryType)
}

/**
 * Mutation type guards
 */
export function isMutationType(value: unknown): value is MutationType {
  const mutationTypes = [
    'TransferTokens',
    'CreateWallet',
    'RequestAuthorization',
    'CreateMeta',
    'CreateToken',
    'RequestTokens',
    'ActiveSession',
    'ClaimShadowWallet',
    'CreateIdentifier',
    'CreateRule',
    'RequestAuthorizationGuest',
    'DepositBufferToken',
    'LinkIdentifier',
    'WithdrawBufferToken',
    'ProposeMolecule'
  ] as const

  return typeof value === 'string' && mutationTypes.includes(value as MutationType)
}

/**
 * Subscription type guards
 */
export function isSubscriptionType(value: unknown): value is SubscriptionType {
  const subscriptionTypes = [
    'CreateMolecule',
    'ActiveSession',
    'ActiveWallet',
    'WalletStatus'
  ] as const

  return typeof value === 'string' && subscriptionTypes.includes(value as SubscriptionType)
}

// =============================================================================
// BRANDED TYPE GUARDS (PATTERN VALIDATION)
// =============================================================================

/**
 * Enhanced wallet address validation with pattern checking
 */
export function isWalletAddress(value: unknown): value is WalletAddress {
  return typeof value === 'string' && 
    value.length === 64 && 
    /^[0-9a-fA-F]{64}$/.test(value)
}

/**
 * Enhanced bundle hash validation
 */
export function isBundleHash(value: unknown): value is BundleHash {
  return typeof value === 'string' && 
    value.length === 64 && 
    /^[0-9a-fA-F]{64}$/.test(value)
}

/**
 * Enhanced position validation
 */
export function isPosition(value: unknown): value is Position {
  return typeof value === 'string' && 
    value.length === 64 && 
    /^[0-9a-fA-F]{64}$/.test(value)
}

/**
 * Token slug validation with pattern checking
 */
export function isTokenSlug(value: unknown): value is TokenSlug {
  return typeof value === 'string' && 
    value.length >= 1 && 
    value.length <= 32 && 
    /^[A-Z0-9_]+$/.test(value)
}

/**
 * Molecular hash validation (base17 format)
 */
export function isMolecularHash(value: unknown): value is MolecularHash {
  return typeof value === 'string' && 
    value.length >= 32 && 
    value.length <= 128 && 
    /^[0-9a-g]+$/i.test(value)
}

/**
 * Cell slug validation
 */
export function isCellSlug(value: unknown): value is CellSlug {
  return typeof value === 'string' && 
    value.length >= 1 && 
    value.length <= 64 && 
    /^[a-zA-Z0-9\-_.]+$/.test(value)
}

/**
 * Batch ID validation (UUID format)
 */
export function isBatchId(value: unknown): value is BatchId {
  return typeof value === 'string' && 
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

// =============================================================================
// OBJECT TYPE GUARDS (DISCRIMINATED UNIONS)
// =============================================================================

/**
 * Atom parameter validation
 */
export function isAtomParams(value: unknown): value is AtomParams {
  if (!value || typeof value !== 'object') return false
  
  const obj = value as Record<string, unknown>
  return (
    (!obj.isotope || isAtomIsotope(obj.isotope)) &&
    (!obj.walletAddress || typeof obj.walletAddress === 'string') &&
    (!obj.token || typeof obj.token === 'string') &&
    (!obj.position || typeof obj.position === 'string')
  )
}

/**
 * Wallet parameter validation
 */
export function isWalletParams(value: unknown): value is WalletParams {
  if (!value || typeof value !== 'object') return false
  
  const obj = value as Record<string, unknown>
  return (
    (!obj.secret || typeof obj.secret === 'string') &&
    (!obj.bundle || typeof obj.bundle === 'string') &&
    (!obj.token || typeof obj.token === 'string') &&
    (!obj.address || typeof obj.address === 'string')
  )
}

/**
 * Molecule parameter validation
 */
export function isMoleculeParams(value: unknown): value is MoleculeParams {
  if (!value || typeof value !== 'object') return false
  
  const obj = value as Record<string, unknown>
  return (
    (!obj.secret || typeof obj.secret === 'string') &&
    (!obj.bundle || typeof obj.bundle === 'string') &&
    (!obj.cellSlug || typeof obj.cellSlug === 'string') &&
    (!obj.version || typeof obj.version === 'number')
  )
}

// =============================================================================
// ATOM TYPE DISCRIMINATION (ADVANCED)
// =============================================================================

/**
 * Advanced atom type discrimination based on isotope
 */
export function isValueAtom(atom: AnyAtom): atom is ValueAtom {
  return atom.isotope === 'V' && 'value' in atom && atom.value !== null
}

export function isMetaAtom(atom: AnyAtom): atom is MetaAtom {
  return atom.isotope === 'M' && 'metaType' in atom && 'metaId' in atom && 'meta' in atom
}

export function isContinueAtom(atom: AnyAtom): atom is ContinueAtom {
  return atom.isotope === 'C'
}

/**
 * Exhaustive atom type handler
 */
export function handleAtomType<T>(
  atom: AnyAtom,
  handlers: {
    readonly value: (atom: ValueAtom) => T
    readonly meta: (atom: MetaAtom) => T
    readonly continue: (atom: ContinueAtom) => T
    readonly default: (atom: AnyAtom) => T
  }
): T {
  if (isValueAtom(atom)) {
    return handlers.value(atom)
  }
  if (isMetaAtom(atom)) {
    return handlers.meta(atom)
  }
  if (isContinueAtom(atom)) {
    return handlers.continue(atom)
  }
  return handlers.default(atom)
}

// =============================================================================
// ENVIRONMENT AND CONFIGURATION GUARDS
// =============================================================================

/**
 * Node environment validation
 */
export function isNodeEnvironment(value: unknown): value is NodeEnvironment {
  return typeof value === 'string' && 
    (['development', 'production', 'test'] as const).includes(value as NodeEnvironment)
}

/**
 * Balance query type validation
 */
export function isBalanceQueryType(value: unknown): value is BalanceQueryType {
  return typeof value === 'string' && 
    (['token', 'user'] as const).includes(value as BalanceQueryType)
}

// =============================================================================
// UTILITY TYPE GUARD COMBINATORS
// =============================================================================

/**
 * Create a union type guard from multiple guards
 */
export function createUnionGuard<T extends readonly unknown[]>(
  ...guards: { [K in keyof T]: (value: unknown) => value is T[K] }
): (value: unknown) => value is T[number] {
  return (value: unknown): value is T[number] => {
    return guards.some(guard => guard(value))
  }
}

/**
 * Create an array type guard from an element guard
 */
export function createArrayGuard<T>(
  elementGuard: (value: unknown) => value is T
): (value: unknown) => value is T[] {
  return (value: unknown): value is T[] => {
    return Array.isArray(value) && value.every(elementGuard)
  }
}

/**
 * Create an optional type guard
 */
export function createOptionalGuard<T>(
  guard: (value: unknown) => value is T
): (value: unknown) => value is T | undefined {
  return (value: unknown): value is T | undefined => {
    return value === undefined || guard(value)
  }
}

// =============================================================================
// COMPLEX VALIDATION PATTERNS
// =============================================================================

/**
 * Validate object with required and optional properties
 */
export function validateObjectShape<
  Required extends Record<string, (value: unknown) => boolean>,
  Optional extends Record<string, (value: unknown) => boolean>
>(
  value: unknown,
  requiredProps: Required,
  optionalProps: Optional = {} as Optional
): value is {
  [K in keyof Required]: Required[K] extends (value: unknown) => value is infer T ? T : never
} & {
  [K in keyof Optional]?: Optional[K] extends (value: unknown) => value is infer T ? T : never
} {
  if (!value || typeof value !== 'object') return false
  
  const obj = value as Record<string, unknown>
  
  // Check required properties
  for (const [key, guard] of Object.entries(requiredProps)) {
    if (!(key in obj) || !guard(obj[key])) {
      return false
    }
  }
  
  // Check optional properties
  for (const [key, guard] of Object.entries(optionalProps)) {
    if (key in obj && !guard(obj[key])) {
      return false
    }
  }
  
  return true
}

// =============================================================================
// EXPORT GROUPED GUARDS
// =============================================================================

/**
 * Grouped type guards for convenient access
 */
export const Guards = {
  // Isotope guards
  isotope: {
    is: isAtomIsotope,
    continue: isContinueIsotope,
    value: isValueIsotope,
    meta: isMetaIsotope,
    user: isUserIsotope,
    token: isTokenIsotope,
    identity: isIdentityIsotope,
    rule: isRuleIsotope,
    buffer: isBufferIsotope,
    fuse: isFuseIsotope,
    handle: handleIsotope
  },
  
  // Error guards  
  error: {
    type: isKnishIOErrorType,
    severity: isErrorSeverity,
    handle: handleError
  },
  
  // Operation guards
  operation: {
    query: isQueryType,
    mutation: isMutationType,
    subscription: isSubscriptionType
  },
  
  // Branded type guards
  branded: {
    walletAddress: isWalletAddress,
    bundleHash: isBundleHash,
    position: isPosition,
    tokenSlug: isTokenSlug,
    molecularHash: isMolecularHash,
    cellSlug: isCellSlug,
    batchId: isBatchId
  },
  
  // Object guards
  object: {
    atomParams: isAtomParams,
    walletParams: isWalletParams,
    moleculeParams: isMoleculeParams
  },
  
  // Atom discrimination
  atom: {
    value: isValueAtom,
    meta: isMetaAtom,
    continue: isContinueAtom,
    handle: handleAtomType
  },
  
  // Environment guards
  env: {
    nodeEnv: isNodeEnvironment,
    balanceQueryType: isBalanceQueryType
  },
  
  // Utility guards
  util: {
    union: createUnionGuard,
    array: createArrayGuard,
    optional: createOptionalGuard,
    shape: validateObjectShape
  },
  
  // Exhaustive checking
  exhaustive: {
    never: assertNever,
    check: assertExhaustive
  }
} as const