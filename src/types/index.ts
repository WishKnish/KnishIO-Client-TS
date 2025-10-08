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
 * Core TypeScript type definitions for the KnishIO SDK
 * Provides type safety for post-blockchain DLT operations
 */

// =============================================================================
// IMPORTS FOR CONST ASSERTIONS
// =============================================================================

import type { 
  AtomIsotope, 
  KnishIOErrorType, 
  HexChar, 
  Base17Char,
  HexPattern,
  Base17Pattern,
  WalletAddressPattern,
  BundleHashPattern,
  PositionPattern,
  TokenSlugPattern,
  ErrorMessageTemplate,
  ValidationErrorTemplate,
  OperationErrorTemplate,
  QueryType,
  MutationType,
  SubscriptionType,
  BalanceQueryType,
  NodeEnvironment
} from '../constants'

import { ISOTOPE_LOOKUP } from '../constants'

// =============================================================================
// BRANDED TYPES WITH TEMPLATE LITERAL PATTERNS (2025 TYPESCRIPT)
// =============================================================================

/**
 * Enhanced branded types with template literal validation
 * Provides both runtime and compile-time type safety
 */
export type WalletAddress = WalletAddressPattern & { readonly __brand: 'WalletAddress' }
export type BundleHash = BundleHashPattern & { readonly __brand: 'BundleHash' }
export type Position = PositionPattern & { readonly __brand: 'Position' }
export type MolecularHash = Base17Pattern & { readonly __brand: 'MolecularHash' }
export type TokenSlug = TokenSlugPattern & { readonly __brand: 'TokenSlug' }
export type MetaType = string & { readonly __brand: 'MetaType' }
export type MetaId = string & { readonly __brand: 'MetaId' }
export type BatchId = string & { readonly __brand: 'BatchId' }
export type CellSlug = string & { readonly __brand: 'CellSlug' }

// =============================================================================
// ENHANCED TEMPLATE LITERAL TYPES (2025 TYPESCRIPT)
// =============================================================================

/**
 * Advanced template literal types for validation
 * Leverages const assertions and pattern matching
 */
export type HexString = HexPattern & { readonly __hex: true }
export type Base17Hash = Base17Pattern & { readonly __base17: true }

// Re-export from constants for convenience
export type { HexChar, Base17Char } from '../constants'

/**
 * Specific length-validated hex types using template literals
 */
export type Hex64 = `${HexChar}${string}` & { length: 64 }
export type Hex32 = `${HexChar}${string}` & { length: 32 }
export type Hex16 = `${HexChar}${string}` & { length: 16 }

/**
 * URL and URI template patterns
 */
export type HttpUrl = `http://${string}`
export type HttpsUrl = `https://${string}`
export type WebSocketUrl = `ws://${string}` | `wss://${string}`
export type GraphQLEndpoint = `${HttpUrl | HttpsUrl}/graphql`

/**
 * Version template patterns
 */
export type SemanticVersion = `${number}.${number}.${number}`
export type SdkVersion = `v${SemanticVersion}`

// =============================================================================
// ATOM ISOTOPE TYPES WITH CONST ASSERTIONS (2025 TYPESCRIPT)
// =============================================================================

/**
 * Re-export isotope types from constants with const assertions
 * Provides immutable type definitions at compile-time
 */
export type { AtomIsotope } from '../constants'

/**
 * Enhanced isotope descriptions with const assertion
 * Uses satisfies operator for type checking
 */
export type IsotopeDescriptions = {
  readonly [K in AtomIsotope]: `${string} - ${string}`
}

/**
 * Template literal types for isotope-specific validation
 */
export type IsotopeCode<T extends AtomIsotope> = T
export type IsotopeDescription<T extends AtomIsotope> = T extends keyof IsotopeDescriptions 
  ? IsotopeDescriptions[T] 
  : never

// =============================================================================
// META DATA TYPES
// =============================================================================

export interface MetaData {
  [key: string]: string | number | boolean | null | MetaData | MetaData[]
}

export interface AtomMetaData extends MetaData {
  readonly key: string
  readonly value: string | number | boolean | null
}

// =============================================================================
// CORE INTERFACE TYPES
// =============================================================================

export interface AtomParams {
  position?: string | null
  walletAddress?: WalletAddress | null
  isotope?: AtomIsotope
  token?: TokenSlug | string
  value?: string | number | null
  batchId?: BatchId | string | null
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
  meta?: AtomMetaData[] | null
  otsFragment?: string | null
  index?: number | null
  createdAt?: string | null
  version?: number | null
}

export interface WalletParams {
  secret?: string | null
  bundle?: BundleHash | string | null
  token?: TokenSlug | string
  address?: WalletAddress | string | null
  position?: Position | string | null
  batchId?: BatchId | string | null
  characters?: string | null
}

export interface MoleculeParams {
  secret?: string | null
  bundle?: BundleHash | string | null
  sourceWallet?: WalletParams | null
  remainderWallet?: WalletParams | null
  cellSlug?: CellSlug | string | null
  version?: number
}

// =============================================================================
// CLIENT CONFIGURATION TYPES
// =============================================================================

/**
 * Enhanced client configuration with const assertions and template literals
 */
export interface KnishIOClientConfig {
  readonly uri?: HttpUrl | HttpsUrl | readonly (HttpUrl | HttpsUrl)[]
  readonly cellSlug?: CellSlug | string | null
  readonly client?: unknown | null
  readonly socket?: unknown | null
  readonly serverSdkVersion?: 3 | 4 | 5 // Specific supported versions
  readonly logging?: boolean
  readonly timeout?: number
  readonly retryAttempts?: number
}

/**
 * Configuration with satisfies operator for type safety
 */
export type ValidatedClientConfig = KnishIOClientConfig & {
  readonly uri: NonNullable<KnishIOClientConfig['uri']>
  readonly serverSdkVersion: NonNullable<KnishIOClientConfig['serverSdkVersion']>
}

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

export interface AuthTokenParams {
  token: string
  expiresAt: number
  encrypt: boolean
  pubkey: string
}

export interface AuthParams {
  cellSlug?: CellSlug | string | null
  encrypt?: boolean
  callback?: (response: unknown) => void
}

export interface GuestAuthParams {
  cellSlug?: CellSlug | string | null
}

// =============================================================================
// TOKEN OPERATION TYPES
// =============================================================================

export interface TransferParams {
  recipient: WalletAddress | string
  amount: number | string
  token?: TokenSlug | string
  callbackUrl?: string | null
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
  meta?: MetaData | null
}

export interface CreateTokenParams {
  token: TokenSlug | string
  amount: number | string
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
  meta?: MetaData | null
  fungible?: boolean
  splittable?: number
  supplyToken?: TokenSlug | string | null
}

export interface RequestTokensParams {
  amount: number | string
  token?: TokenSlug | string
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
  meta?: MetaData | null
}

// =============================================================================
// QUERY PARAMETER TYPES
// =============================================================================

export interface BalanceQueryParams {
  address?: WalletAddress | string | null
  bundleHash?: BundleHash | string | null
  token?: TokenSlug | string | null
  type?: 'token' | 'user' | null
}

export interface MetaQueryParams {
  metaType: MetaType | string
  metaId?: MetaId | string | null
  key?: string | null
  value?: string | null
  latest?: boolean | null
  filter?: string | null
  queryArgs?: Record<string, unknown> | null
  count?: number | null
  countBy?: string | null
  cellSlug?: CellSlug | string | null
}

export interface WalletQueryParams {
  bundleHash?: BundleHash | string | null
  tokenSlug?: TokenSlug | string | null
  unspent?: boolean | null
}

// =============================================================================
// RESPONSE BASE TYPES
// =============================================================================

export interface BaseResponse<T = unknown> {
  success(): boolean
  reason(): string | null
  data(): T | null
  payload(): Record<string, unknown> | null
}

export interface ValidationResult {
  valid: boolean
  error?: string | null
  expected?: string
  actual?: unknown
}

// =============================================================================
// CRYPTOGRAPHIC TYPES
// =============================================================================

export interface CryptoOptions {
  seed?: string | null
  length?: number
  outputLength?: number
}

export interface KeyPairResult {
  privateKey: string
  publicKey: string
}

export interface SignatureResult {
  signature: string
  otsFragments?: string[]
}

// =============================================================================
// GRAPHQL OPERATION TYPES
// =============================================================================

export interface GraphQLRequest {
  query: string
  variables?: Record<string, unknown>
  operationName?: string | null
}

export interface GraphQLResponse<T = unknown> {
  data?: T | null
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: Array<string | number>
    extensions?: Record<string, unknown>
  }> | null
  extensions?: Record<string, unknown>
}

// =============================================================================
// SUBSCRIPTION TYPES
// =============================================================================

export interface SubscriptionOptions {
  operationName?: string
  query?: string
  variables?: Record<string, unknown>
  callback?: (data: unknown) => void
}

// =============================================================================
// ADVANCED UTILITY TYPES (2025 TYPESCRIPT)
// =============================================================================

/**
 * Enhanced utility types with const assertions
 */
export type DeepPartial<T> = {
  readonly [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>
export type OptionalBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Const assertion utility type
 */
export type AsConst<T> = T extends readonly unknown[] 
  ? readonly [...T] 
  : T extends Record<string, unknown> 
    ? { readonly [K in keyof T]: AsConst<T[K]> } 
    : T

/**
 * Template literal utility for creating branded types
 */
export type Branded<T, B extends string> = T & { readonly __brand: B }

/**
 * Conditional types for isotope-specific atoms with const assertions
 */
export type AtomWithIsotope<I extends AtomIsotope> = AtomParams & { 
  readonly isotope: I 
}

/**
 * Enhanced atom types with template literal validation
 */
export type ValueAtom = AtomWithIsotope<'V'> & { 
  readonly value: number | string
} & { readonly __atomType: 'ValueAtom' }

export type MetaAtom = AtomWithIsotope<'M'> & { 
  readonly metaType: MetaType | string
  readonly metaId: MetaId | string
  readonly meta: readonly AtomMetaData[]
} & { readonly __atomType: 'MetaAtom' }

export type ContinueAtom = AtomWithIsotope<'C'> & { 
  readonly __atomType: 'ContinueAtom' 
}

/**
 * Union type for all atom variants
 */
export type AnyAtom = ValueAtom | MetaAtom | ContinueAtom

/**
 * Template literal type for operation names
 */
export type OperationName<T extends string> = `${Lowercase<T>}Operation`

/**
 * Exhaustive check utility with template literals
 */
export type Exhaustive<T> = T extends never ? never : `Unhandled case: ${T & string}`

/**
 * Template literal type for creating API method names
 */
export type ApiMethodName<T extends string> = `${Lowercase<T>}${Capitalize<string>}`

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Enhanced ErrorContext with conditional properties (2025 TypeScript)
 * Supports flexible error context while maintaining type safety
 */
export interface ErrorContext {
  readonly operation?: string
  readonly parameters?: Record<string, unknown>
  readonly timestamp?: number
  readonly stack?: string
  // Exception-specific context properties
  readonly reason?: string
  readonly expiresAt?: number
  readonly credentialType?: string
  readonly field?: string
  readonly value?: unknown
  readonly expected?: string
  readonly actual?: unknown
  readonly code?: string
  readonly severity?: 'low' | 'medium' | 'high'
  readonly recoverable?: boolean
  readonly retryable?: boolean
  // Allow additional properties with proper typing
  readonly [key: string]: unknown
}

/**
 * Re-export error types from constants with const assertions
 * Provides immutable error type definitions
 */
export type { KnishIOErrorType } from '../constants'

/**
 * Template literal types for error messages
 */
export type ErrorMessage<T extends KnishIOErrorType> = ErrorMessageTemplate<T>
export type ValidationError<T extends string> = ValidationErrorTemplate<T>
export type OperationError<T extends string> = OperationErrorTemplate<T>

/**
 * Enhanced error context with template literals
 */
export type ErrorContextKey = `error_${string}` | `validation_${string}` | `operation_${string}`

// =============================================================================
// MODULE DECLARATION AUGMENTATIONS
// =============================================================================

declare global {
  interface String {
    toCamelCase(): string
    toSnakeCase(): string
  }
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isHexString(value: string): value is HexString {
  return /^[0-9a-fA-F]+$/.test(value)
}

export function isWalletAddress(value: string): value is WalletAddress {
  return isHexString(value) && value.length === 64
}

export function isBundleHash(value: string): value is BundleHash {
  return isHexString(value) && value.length === 64
}

export function isPosition(value: string): value is Position {
  return isHexString(value) && value.length === 64
}

export function isMolecularHash(value: string): value is MolecularHash {
  return /^[0-9a-g]+$/.test(value.toLowerCase()) // Base17 format
}

/**
 * Enhanced type guards using const assertions from constants
 */
export function isAtomIsotope(value: string): value is AtomIsotope {
  return value in ISOTOPE_LOOKUP
}

/**
 * Type guard for GraphQL operations using template literals
 */
export function isGraphQLOperation(value: string): value is 'query' | 'mutation' | 'subscription' {
  return ['query', 'mutation', 'subscription'].includes(value)
}

/**
 * Type guard for environment using const assertions
 */
export function isNodeEnvironment(value: string): value is NodeEnvironment {
  return (['development', 'production', 'test'] as const).includes(value as NodeEnvironment)
}

// =============================================================================
// FACTORY FUNCTIONS FOR BRANDED TYPES
// =============================================================================

export function createWalletAddress(value: string): WalletAddress {
  if (!isWalletAddress(value)) {
    throw new Error(`Invalid wallet address: ${value}`)
  }
  return value as WalletAddress
}

export function createBundleHash(value: string): BundleHash {
  if (!isBundleHash(value)) {
    throw new Error(`Invalid bundle hash: ${value}`)
  }
  return value as BundleHash
}

export function createPosition(value: string): Position {
  if (!isPosition(value)) {
    throw new Error(`Invalid position: ${value}`)
  }
  return value as Position
}

export function createTokenSlug(value: string): TokenSlug {
  if (!value || value.length === 0) {
    throw new Error('Token slug cannot be empty')
  }
  return value.toUpperCase() as TokenSlug
}

export function createMolecularHash(value: string): MolecularHash {
  if (!isMolecularHash(value)) {
    throw new Error(`Invalid molecular hash: ${value}`)
  }
  return value as MolecularHash
}

// =============================================================================
// EXPORTS
// =============================================================================

export * from './client'
export * from './crypto'
export * from './graphql'

// All types are already exported via the export * statements above