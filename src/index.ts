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
 * KnishIO TypeScript SDK - Main Export Module
 * 
 * A comprehensive TypeScript implementation of the Knish.IO SDK for 
 * post-blockchain distributed ledger technology with enhanced type safety
 * and perfect cross-platform compatibility.
 */

// =============================================================================
// CORE CLASSES
// =============================================================================

// Core transaction classes
export { default as Atom } from './core/Atom'
export { default as Molecule } from './core/Molecule'
export { default as Wallet } from './core/Wallet'
export { default as Meta } from './core/Meta'
export { default as AtomMeta } from './core/AtomMeta'

// Validation
export { default as CheckMolecule } from './libraries/CheckMolecule'

// Utilities
export { default as Dot } from './libraries/Dot'
export { deepCloning, chunkArray, diff, intersect } from './libraries/array'

// Client and authentication
export { default as KnishIOClient } from './KnishIOClient'
export { default as AuthToken } from './AuthToken'
export { default as GraphQLClient } from './libraries/GraphQLClient'

// Base classes for queries and mutations
export { default as Query } from './query/Query'
export { default as Mutation } from './mutation/Mutation'
export { default as Response } from './response/Response'

// Essential Query classes (Phase 1)
export { default as QueryBalance } from './query/QueryBalance'
export { default as QueryWalletBundle } from './query/QueryWalletBundle'

// Phase 2 Tier 1 Query classes
export { default as QueryWalletList } from './query/QueryWalletList'
export { default as QueryAtom } from './query/QueryAtom'

// Phase 2 Tier 2 Priority 1: Meta Operations
export { default as QueryMetaType } from './query/QueryMetaType'
export { default as QueryMetaTypeViaAtom } from './query/QueryMetaTypeViaAtom'

// Phase 2 Tier 2 Priority 3: Essential Query Operations
export { default as QueryContinuId } from './query/QueryContinuId'
export { default as QueryBatch } from './query/QueryBatch'

// Essential Mutation classes (Phase 1)
export { default as MutationProposeMolecule } from './mutation/MutationProposeMolecule'
export { default as MutationTransferTokens } from './mutation/MutationTransferTokens'

// Phase 2 Tier 1 Mutation classes
export { default as MutationCreateWallet } from './mutation/MutationCreateWallet'
export { default as MutationRequestAuthorization } from './mutation/MutationRequestAuthorization'

// Phase 2 Tier 2 Priority 1: Meta Operations
export { default as MutationCreateMeta } from './mutation/MutationCreateMeta'

// Phase 2 Tier 2 Priority 2: Token Operations
export { default as MutationCreateToken } from './mutation/MutationCreateToken'
export { default as MutationRequestTokens } from './mutation/MutationRequestTokens'

// Essential Response classes (Phase 1)
export { default as ResponseBalance } from './response/ResponseBalance'
export { default as ResponseWalletBundle } from './response/ResponseWalletBundle'
export { default as ResponseProposeMolecule } from './response/ResponseProposeMolecule'
export { default as ResponseTransferTokens } from './response/ResponseTransferTokens'

// Phase 2 Tier 1 Response classes
export { default as ResponseWalletList } from './response/ResponseWalletList'
export { default as ResponseAtom } from './response/ResponseAtom'
export { default as ResponseCreateWallet } from './response/ResponseCreateWallet'
export { default as ResponseRequestAuthorization } from './response/ResponseRequestAuthorization'

// Phase 2 Tier 2 Priority 1: Meta Operations
export { default as ResponseCreateMeta } from './response/ResponseCreateMeta'
export { default as ResponseMetaType } from './response/ResponseMetaType'
export { default as ResponseMetaTypeViaAtom } from './response/ResponseMetaTypeViaAtom'

// Phase 2 Tier 2 Priority 2: Token Operations
export { default as ResponseCreateToken } from './response/ResponseCreateToken'
export { default as ResponseRequestTokens } from './response/ResponseRequestTokens'

// Phase 2 Tier 2 Priority 3: Essential Query Operations
export { default as ResponseContinuId } from './response/ResponseContinuId'
// QueryBatch uses base Response class directly

// Phase 2 Prerequisite classes (completed)
export { default as TokenUnit } from './core/TokenUnit'
export { default as PolicyMeta } from './core/PolicyMeta'

// =============================================================================
// LIBRARY FUNCTIONS AND UTILITIES
// =============================================================================

// String utilities - maintaining compatibility with JS SDK
import {
  chunkSubstr,
  randomString,
  charsetBaseConvert,
  bufferToHexString,
  hexStringToBuffer,
  hexToBase64,
  base64ToHex,
  isHex,
  isNumeric,
  toCamelCase,
  toSnakeCase,
  capitalize,
  truncate
} from './libraries/strings'

// Re-export for external use
export {
  chunkSubstr,
  randomString,
  charsetBaseConvert,
  bufferToHexString,
  hexStringToBuffer,
  hexToBase64,
  base64ToHex,
  isHex,
  isNumeric,
  toCamelCase,
  toSnakeCase,
  capitalize,
  truncate
}

// Cryptographic functions - ensuring cross-platform compatibility
import {
  shake256,
  generateSecret,
  generateBundleHash,
  generateBatchId,
  generatePosition,
  generateWalletKey,
  generateWalletAddress,
  validateSecret,
  validateBundleHash,
  validatePosition,
  validateWalletAddress,
  runCompatibilityTests,
  CRYPTO_CONSTANTS,
  // NEW: WOTS+ signature system and Base17 conversion  
  convertToBase17,
  enumerateMolecularHash,
  normalizeMolecularHash,
  generateOTSSignature,
  verifyOTSSignature,
  validateOTSSignature,
  validateMolecularHashForSignature,
  runExtendedCompatibilityTests,
  EXTENDED_COMPATIBILITY_TEST_VECTORS
} from './libraries/crypto'

// Re-export for external use
export {
  shake256,
  generateSecret,
  generateBundleHash,
  generateBatchId,
  generatePosition,
  generateWalletKey,
  generateWalletAddress,
  validateSecret,
  validateBundleHash,
  validatePosition,
  validateWalletAddress,
  runCompatibilityTests,
  CRYPTO_CONSTANTS,
  // NEW: WOTS+ signature system and Base17 conversion
  convertToBase17,
  enumerateMolecularHash,
  normalizeMolecularHash,
  generateOTSSignature,
  verifyOTSSignature,
  validateOTSSignature,
  validateMolecularHashForSignature,
  runExtendedCompatibilityTests,
  EXTENDED_COMPATIBILITY_TEST_VECTORS
}

// =============================================================================
// EXCEPTION SYSTEM
// =============================================================================

export {
  BaseException,
  AtomIndexException,
  AtomsMissingException,
  MolecularHashMismatchException,
  SignatureMismatchException,
  TransferBalanceException,
  WalletCredentialException,
  InvalidResponseException,
  ExceptionFactory,
  EXCEPTION_TYPES,
  EXCEPTION_CODES
} from './exception'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type {
  // Core types
  WalletAddress,
  BundleHash,
  Position,
  MolecularHash,
  TokenSlug,
  MetaType,
  MetaId,
  CellSlug,
  AtomIsotope,
  HexString,
  Base17Hash,
  MetaData,

  // Parameter types
  AtomParams,
  WalletParams,
  MoleculeParams,
  KnishIOClientConfig,
  AuthParams,
  TransferParams,
  CreateTokenParams,
  RequestTokensParams,

  // Query types
  BalanceQueryParams,
  MetaQueryParams,
  WalletQueryParams,

  // Response types
  BaseResponse,
  ValidationResult,

  // Cryptographic types
  SHAKE256Options,
  SecretGenerationOptions,
  BundleHashOptions,
  PositionGenerationOptions,
  KeyGenerationOptions,
  SignatureOptions,
  VerificationOptions,

  // GraphQL types
  GraphQLRequest,
  GraphQLResponse,
  GraphQLError,
  QueryOperation,
  MutationOperation
} from './types'

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

import {
  isHexString,
  isWalletAddress,
  isBundleHash,
  isPosition,
  isMolecularHash,
  isAtomIsotope,
  createWalletAddress,
  createBundleHash,
  createPosition,
  createTokenSlug,
  createMolecularHash
} from './types'

// Re-export for external use
export {
  isHexString,
  isWalletAddress,
  isBundleHash,
  isPosition,
  isMolecularHash,
  isAtomIsotope,
  createWalletAddress,
  createBundleHash,
  createPosition,
  createTokenSlug,
  createMolecularHash
}

// =============================================================================
// VERSION AND SDK INFORMATION
// =============================================================================

export const SDK_VERSION = '1.0.0'
export const SDK_NAME = 'KnishIO-Client-TS'
export const COMPATIBLE_SERVER_VERSIONS = [4, 5]

/**
 * SDK Information object
 */
export const SDK_INFO = {
  name: SDK_NAME,
  version: SDK_VERSION,
  description: 'TypeScript SDK for Knish.IO post-blockchain distributed ledger',
  compatibleServerVersions: COMPATIBLE_SERVER_VERSIONS,
  features: [
    'Post-quantum cryptography (XMSS, ML-KEM768)',
    'Cross-platform compatibility',
    'Type-safe APIs',
    'DAG-based transaction processing',
    'GraphQL integration',
    'Real-time subscriptions',
    'Cellular architecture support'
  ],
  build: {
    target: 'ES2022',
    formats: ['esm', 'cjs', 'iife'],
    typescript: true,
    strictMode: true
  }
} as const

// =============================================================================
// INITIALIZATION AND CONFIGURATION
// =============================================================================

/**
 * Initialize the KnishIO SDK with global configuration
 * This is optional - the SDK can be used without global initialization
 */
export interface SDKConfig {
  defaultUri?: string | string[]
  defaultCellSlug?: string | null
  logging?: boolean
  cryptoValidation?: boolean
  compatibilityChecks?: boolean
}

let globalConfig: SDKConfig = {
  logging: false,
  cryptoValidation: true,
  compatibilityChecks: true
}

/**
 * Configure the SDK globally
 */
export function configureSDK(config: Partial<SDKConfig>): void {
  globalConfig = { ...globalConfig, ...config }
  
  if (config.compatibilityChecks) {
    // Run basic compatibility tests on initialization
    const compatibilityResult = runCompatibilityTests()
    if (!compatibilityResult.passed) {
      console.warn('KnishIO SDK: Compatibility tests failed. Cross-platform operations may not work correctly.')
      if (globalConfig.logging) {
        console.log('Compatibility test results:', compatibilityResult.results)
      }
    }
  }
}

/**
 * Get current global SDK configuration
 */
export function getSDKConfig(): SDKConfig {
  return { ...globalConfig }
}

// =============================================================================
// DEVELOPMENT AND DEBUGGING UTILITIES
// =============================================================================

/**
 * Development mode utilities (only available in development builds)
 */
export const DevUtils = process.env.NODE_ENV === 'development' ? {
  /**
   * Validate SDK installation and basic functionality
   */
  validateInstallation(): boolean {
    try {
      // Test basic cryptographic functions
      const testSecret = generateSecret('test-seed')
      const testBundle = generateBundleHash(testSecret)
      const testPosition = generatePosition()
      
      // Test string utilities
      const testChunks = chunkSubstr('abcdefghijklmnop', 4)
      
      // Test type validation
      const isValidBundle = isBundleHash(testBundle)
      const isValidPosition = isPosition(testPosition)
      
      return testSecret.length === 64 && 
             testBundle.length === 64 && 
             testPosition.length === 64 &&
             testChunks.length === 4 &&
             isValidBundle &&
             isValidPosition
    } catch (error) {
      console.error('SDK installation validation failed:', error)
      return false
    }
  },

  /**
   * Run comprehensive compatibility tests
   */
  runFullCompatibilityTests: runCompatibilityTests,

  /**
   * Get SDK build information
   */
  getBuildInfo() {
    return {
      ...SDK_INFO,
      buildTime: new Date().toISOString(),
      nodeVersion: typeof process !== 'undefined' ? process.version : 'unknown',
      environment: typeof window !== 'undefined' ? 'browser' : 'node'
    }
  }
} : {}

// =============================================================================
// COMPATIBILITY WITH JAVASCRIPT SDK
// =============================================================================

/**
 * Legacy export names for compatibility with JavaScript SDK
 * These maintain the exact same naming convention
 */
export {
  // Core exports (matching JS SDK exactly)
  shake256 as default, // The JS SDK doesn't export a default, but this maintains compatibility
}

// Maintain exact export structure as JS SDK index.js
export const KnishIO = {
  shake256,
  generateSecret,
  generateBundleHash,
  generateBatchId,
  chunkSubstr,
  randomString,
  isHex,
  SDK_VERSION,
  SDK_INFO
}

// =============================================================================
// FUTURE EXPORTS (PLACEHOLDERS)
// =============================================================================

// These will be uncommented as classes are implemented
// export { default as Query } from './query/Query'
// export { default as Mutation } from './mutation/Mutation'
// export { default as Response } from './response/Response'
// export { default as Subscribe } from './subscribe/Subscribe'