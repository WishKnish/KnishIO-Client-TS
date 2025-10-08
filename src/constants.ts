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
 * Constants with Const Assertions for KnishIO SDK
 * 
 * Implements 2025 TypeScript patterns:
 * - Const assertions for immutable data structures
 * - Template literal types for enhanced validation
 * - Type-safe constants for protocol definitions
 */

// =============================================================================
// ATOM ISOTOPE CONSTANTS (CONST ASSERTION)
// =============================================================================

/**
 * Immutable array of atom isotopes with const assertion
 * Provides compile-time type safety and runtime immutability
 */
export const ISOTOPES = ['C', 'V', 'U', 'T', 'M', 'I', 'R', 'B', 'F'] as const
export type AtomIsotope = typeof ISOTOPES[number]

/**
 * Isotope descriptions with const assertion for type safety
 */
export const ISOTOPE_DESCRIPTIONS = {
  C: 'Continue - Position continuation',
  V: 'Value - Token value transfer', 
  U: 'User - User token operations',
  T: 'Token - Token creation/management',
  M: 'Meta - Metadata operations',
  I: 'Identity - Identity operations',
  R: 'Rule - Policy operations',
  B: 'Buffer - Buffer token operations',
  F: 'Fuse - Token fusion operations'
} as const satisfies Record<AtomIsotope, string>

// =============================================================================
// ERROR TYPE CONSTANTS (CONST ASSERTION)
// =============================================================================

/**
 * Immutable error type definitions with const assertion
 */
export const ERROR_TYPES = [
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
  'RULE_ARGUMENT_ERROR',
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

export type KnishIOErrorType = typeof ERROR_TYPES[number]

// =============================================================================
// CRYPTO CONSTANTS (CONST ASSERTION)
// =============================================================================

/**
 * Hexadecimal characters with const assertion
 */
export const HEX_CHARS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'] as const
export type HexChar = typeof HEX_CHARS[number]

/**
 * Base17 characters for molecular hashing (includes g for base17)
 */
export const BASE17_CHARS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g'] as const
export type Base17Char = typeof BASE17_CHARS[number]

/**
 * Hash length constants
 */
export const HASH_LENGTHS = {
  WALLET_ADDRESS: 64,
  BUNDLE_HASH: 64,
  POSITION: 64,
  MOLECULAR_HASH_MIN: 32,
  MOLECULAR_HASH_MAX: 128
} as const

// =============================================================================
// PROTOCOL CONSTANTS (CONST ASSERTION)
// =============================================================================

/**
 * SDK version and protocol constants
 */
export const PROTOCOL_CONFIG = {
  DEFAULT_SDK_VERSION: 4,
  SUPPORTED_SDK_VERSIONS: [3, 4, 5],
  DEFAULT_TOKEN: 'USER',
  MAX_BATCH_SIZE: 1000,
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRY_ATTEMPTS: 3
} as const

/**
 * Network and endpoint constants
 */
export const NETWORK_CONFIG = {
  DEFAULT_CELL_SLUG: 'default',
  DEFAULT_LOGGING: false,
  GRAPHQL_ENDPOINTS: {
    QUERY: 'query',
    MUTATION: 'mutation', 
    SUBSCRIPTION: 'subscription'
  }
} as const

// =============================================================================
// TEMPLATE LITERAL TYPE PATTERNS
// =============================================================================

/**
 * Template literal types for validation patterns
 */
export type HexPattern = `${HexChar}${string}`
export type Base17Pattern = `${Base17Char}${string}`

/**
 * Specific hex patterns for different hash types
 */
export type WalletAddressPattern = `${HexChar}${HexChar}${string}` & { length: 64 }
export type BundleHashPattern = `${HexChar}${HexChar}${string}` & { length: 64 }
export type PositionPattern = `${HexChar}${HexChar}${string}` & { length: 64 }

/**
 * Token slug patterns (uppercase alphanumeric with underscores)
 */
export type TokenSlugPattern = `${Uppercase<string>}`

/**
 * Meta type patterns
 */
export type MetaTypePattern = `${string}`

/**
 * Error message templates
 */
export type ErrorMessageTemplate<T extends string> = `${T}: ${string}`
export type ValidationErrorTemplate<T extends string> = `Validation failed for ${T}`
export type OperationErrorTemplate<T extends string> = `Operation '${T}' failed`

// =============================================================================
// QUERY TYPE CONSTANTS (CONST ASSERTION)
// =============================================================================

/**
 * Query operation types
 */
export const QUERY_TYPES = [
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

export type QueryType = typeof QUERY_TYPES[number]

/**
 * Mutation operation types
 */
export const MUTATION_TYPES = [
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

export type MutationType = typeof MUTATION_TYPES[number]

/**
 * Subscription operation types  
 */
export const SUBSCRIPTION_TYPES = [
  'CreateMolecule',
  'ActiveSession',
  'ActiveWallet',
  'WalletStatus'
] as const

export type SubscriptionType = typeof SUBSCRIPTION_TYPES[number]

// =============================================================================
// VALIDATION CONSTANTS (CONST ASSERTION)
// =============================================================================

/**
 * Validation rule constants
 */
export const VALIDATION_RULES = {
  MIN_TOKEN_SLUG_LENGTH: 1,
  MAX_TOKEN_SLUG_LENGTH: 32,
  MIN_AMOUNT: 0,
  MAX_AMOUNT: Number.MAX_SAFE_INTEGER,
  MIN_META_KEY_LENGTH: 1,
  MAX_META_KEY_LENGTH: 255,
  TOKEN_SLUG_PATTERN: /^[A-Z0-9_]+$/,
  HEX_PATTERN: /^[0-9a-fA-F]+$/,
  BASE17_PATTERN: /^[0-9a-g]+$/i
} as const

/**
 * Environment variable keys with const assertion
 */
export const ENV_KEYS = [
  'NODE_ENV',
  'KNISHIO_NODE_URI',
  'KNISHIO_CELL_SLUG', 
  'KNISHIO_LOGGING',
  'KNISHIO_SERVER_SDK_VERSION'
] as const

export type EnvKey = typeof ENV_KEYS[number]

// =============================================================================
// TYPE HELPER CONSTANTS 
// =============================================================================

/**
 * Balance query types
 */
export const BALANCE_QUERY_TYPES = ['token', 'user'] as const
export type BalanceQueryType = typeof BALANCE_QUERY_TYPES[number]

/**
 * Node environment types
 */
export const NODE_ENVIRONMENTS = ['development', 'production', 'test'] as const  
export type NodeEnvironment = typeof NODE_ENVIRONMENTS[number]

/**
 * GraphQL operation names
 */
export const GRAPHQL_OPERATIONS = ['query', 'mutation', 'subscription'] as const
export type GraphQLOperation = typeof GRAPHQL_OPERATIONS[number]

// =============================================================================
// UTILITY TYPE HELPERS WITH CONST ASSERTIONS
// =============================================================================

/**
 * Create immutable lookup objects with const assertions
 */
export function createLookup<T extends readonly string[]>(
  values: T
): Record<T[number], T[number]> {
  return values.reduce((acc, value) => {
    (acc as any)[value] = value
    return acc
  }, {} as Record<T[number], T[number]>)
}

/**
 * Isotope lookup for O(1) access
 */
export const ISOTOPE_LOOKUP = createLookup(ISOTOPES)

/**
 * Error type lookup for O(1) access
 */
export const ERROR_TYPE_LOOKUP = createLookup(ERROR_TYPES)

/**
 * Query type lookup for O(1) access
 */
export const QUERY_TYPE_LOOKUP = createLookup(QUERY_TYPES)

// =============================================================================
// SATISFIES OPERATOR EXAMPLES (2025 PATTERN)
// =============================================================================

/**
 * Configuration with satisfies operator for type checking
 */
export const DEFAULT_CLIENT_CONFIG = {
  uri: undefined,
  cellSlug: NETWORK_CONFIG.DEFAULT_CELL_SLUG,
  serverSdkVersion: PROTOCOL_CONFIG.DEFAULT_SDK_VERSION,
  logging: NETWORK_CONFIG.DEFAULT_LOGGING
} as const satisfies Partial<{
  uri: string | string[] | undefined
  cellSlug: string | undefined
  serverSdkVersion: number
  logging: boolean
}>

/**
 * Error templates with satisfies operator
 */
export const ERROR_TEMPLATES = {
  VALIDATION_FAILED: 'Validation failed for field',
  OPERATION_FAILED: 'Operation failed',
  NETWORK_ERROR: 'Network error occurred',
  TIMEOUT_ERROR: 'Operation timed out'
} as const satisfies Record<string, string>

// =============================================================================
// EXPORTS
// =============================================================================

// Re-export specific constants for convenience
export {
  ISOTOPES as AtomIsotopes,
  ERROR_TYPES as ErrorTypes,
  HEX_CHARS as HexChars,
  PROTOCOL_CONFIG as Protocol,
  VALIDATION_RULES as ValidationRules
}