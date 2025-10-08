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
 * Cryptographic type definitions for KnishIO SDK
 * Ensures type safety for post-quantum cryptographic operations
 */

import type { WalletAddress, BundleHash, Position, TokenSlug } from './index'

// =============================================================================
// CRYPTOGRAPHIC ALGORITHM TYPES
// =============================================================================

export type HashAlgorithm = 'SHAKE256' | 'SHA3-256' | 'BLAKE2B'
export type SignatureAlgorithm = 'XMSS' | 'ML-KEM768' | 'SPHINCS+'
export type EncryptionAlgorithm = 'ML-KEM768' | 'Kyber768' | 'ChaCha20Poly1305'

// =============================================================================
// SHAKE256 SPECIFIC TYPES
// =============================================================================

export interface SHAKE256Options {
  input: string | Uint8Array
  outputLength: number // in bits
  encoding?: 'hex' | 'base64' | 'bytes'
}

export interface SHAKE256Result {
  hash: string
  algorithm: 'SHAKE256'
  inputLength: number
  outputLength: number
  timestamp: number
}

// =============================================================================
// KEY GENERATION TYPES
// =============================================================================

export interface KeyGenerationOptions {
  secret?: string | null
  token?: TokenSlug | string | null
  position?: Position | string | null
  algorithm?: SignatureAlgorithm
  keyLength?: number
}

export interface PrivateKey {
  readonly key: string
  readonly algorithm: SignatureAlgorithm
  readonly length: number
  readonly createdAt: number
}

export interface PublicKey {
  readonly key: string
  readonly address: WalletAddress
  readonly algorithm: SignatureAlgorithm
  readonly length: number
  readonly createdAt: number
}

export interface KeyPair {
  readonly privateKey: PrivateKey
  readonly publicKey: PublicKey
  readonly algorithm: SignatureAlgorithm
}

// =============================================================================
// XMSS (eXtended Merkle Signature Scheme) TYPES
// =============================================================================

export interface XMSSParameters {
  height: number // Tree height (typically 10, 16, or 20)
  winternitzParameter: number // Winternitz parameter (typically 16)
  hashFunction: 'SHAKE256' | 'SHA3-256'
}

export interface XMSSSignatureState {
  nextIndex: number
  secretSeed: string
  publicSeed: string
  root: string
  usedIndices: Set<number>
}

export interface XMSSSignature {
  signature: string
  index: number
  authPath: string[]
  randomization: string
  timestamp: number
}

// =============================================================================
// ML-KEM768 (Post-Quantum Key Encapsulation) TYPES
// =============================================================================

export interface MLKEMKeyPair {
  privateKey: Uint8Array
  publicKey: Uint8Array
  algorithm: 'ML-KEM768'
}

export interface MLKEMEncapsulationResult {
  ciphertext: Uint8Array
  sharedSecret: Uint8Array
}

export interface MLKEMDecapsulationOptions {
  ciphertext: Uint8Array
  privateKey: Uint8Array
}

// =============================================================================
// WALLET CRYPTOGRAPHIC TYPES
// =============================================================================

export interface WalletKeyGeneration {
  secret: string
  token: TokenSlug | string
  position: Position | string
  bundleHash?: BundleHash | string
}

export interface WalletCryptoResult {
  privateKey: string
  publicKey: string
  address: WalletAddress
  bundle: BundleHash
  position: Position
}

// =============================================================================
// SIGNATURE TYPES
// =============================================================================

export interface SignatureOptions {
  message: string | Uint8Array
  privateKey: PrivateKey | string
  algorithm?: SignatureAlgorithm
  oneTimeUse?: boolean
}

export interface SignatureResult {
  signature: string
  algorithm: SignatureAlgorithm
  messageHash: string
  publicKey: string
  timestamp: number
  otsFragments?: OTSFragment[]
}

export interface VerificationOptions {
  message: string | Uint8Array
  signature: string
  publicKey: PublicKey | string
  algorithm?: SignatureAlgorithm
}

export interface VerificationResult {
  valid: boolean
  algorithm: SignatureAlgorithm
  publicKey: string
  messageHash: string
  timestamp: number
  error?: string
}

// =============================================================================
// ONE-TIME SIGNATURE (OTS) TYPES
// =============================================================================

export interface OTSFragment {
  index: number
  fragment: string
  algorithm: SignatureAlgorithm
  atomIndex?: number
}

export interface OTSKeyManager {
  generateNextKey(): Promise<PrivateKey>
  markKeyUsed(keyId: string): void
  rotateKeys(): Promise<void>
  getUsedKeyCount(): number
  getRemainingKeys(): number
}

// =============================================================================
// MOLECULAR HASH TYPES
// =============================================================================

export interface MolecularHashOptions {
  atoms: Array<{
    position: string
    walletAddress: WalletAddress
    isotope: string
    token: TokenSlug
    value: string | null
    metaType?: string | null
    metaId?: string | null
    createdAt: string
    index: number
  }>
  algorithm?: HashAlgorithm
}

export interface MolecularHashResult {
  hash: string
  algorithm: HashAlgorithm
  atomCount: number
  base17Hash: string
  timestamp: number
}

// =============================================================================
// ENCRYPTION/DECRYPTION TYPES
// =============================================================================

export interface EncryptionOptions {
  message: string | Uint8Array
  publicKey: PublicKey | string
  algorithm?: EncryptionAlgorithm
  additionalData?: Uint8Array
}

export interface EncryptionResult {
  ciphertext: string
  algorithm: EncryptionAlgorithm
  nonce: string
  tag: string
  timestamp: number
}

export interface DecryptionOptions {
  ciphertext: string
  privateKey: PrivateKey | string
  algorithm?: EncryptionAlgorithm
  nonce: string
  tag: string
  additionalData?: Uint8Array
}

export interface DecryptionResult {
  plaintext: string
  algorithm: EncryptionAlgorithm
  timestamp: number
  valid: boolean
}

// =============================================================================
// BUNDLE HASH GENERATION TYPES
// =============================================================================

export interface BundleHashOptions {
  secret: string
  source?: string | null
  algorithm?: HashAlgorithm
}

export interface BundleHashResult {
  hash: BundleHash
  algorithm: HashAlgorithm
  secretHash: string
  timestamp: number
}

// =============================================================================
// POSITION GENERATION TYPES
// =============================================================================

export interface PositionGenerationOptions {
  entropy?: Uint8Array | null
  algorithm?: HashAlgorithm
  length?: number
}

export interface PositionGenerationResult {
  position: Position
  entropy: string
  algorithm: HashAlgorithm
  timestamp: number
}

// =============================================================================
// SECRET GENERATION TYPES
// =============================================================================

export interface SecretGenerationOptions {
  seed?: string | null
  length?: number
  algorithm?: HashAlgorithm
}

export interface SecretGenerationResult {
  secret: string
  algorithm: HashAlgorithm
  seedUsed: boolean
  length: number
  timestamp: number
}

// =============================================================================
// CROSS-PLATFORM COMPATIBILITY TYPES
// =============================================================================

export interface TestVector {
  input: string
  expectedOutput: string
  algorithm: HashAlgorithm | SignatureAlgorithm
  parameters?: Record<string, unknown>
}

export interface CryptoCompatibilityResult {
  compatible: boolean
  algorithm: string
  testsPassed: number
  testsFailed: number
  errors: string[]
  details: Array<{
    test: string
    expected: string
    actual: string
    passed: boolean
  }>
}

// =============================================================================
// PERFORMANCE MONITORING TYPES
// =============================================================================

export interface CryptoPerformanceMetrics {
  operation: string
  algorithm: string
  duration: number
  inputSize: number
  outputSize: number
  timestamp: number
}

export interface CryptoPerformanceThresholds {
  shake256: number // max ms
  keyGeneration: number // max ms
  signing: number // max ms
  verification: number // max ms
  encryption: number // max ms
  decryption: number // max ms
}

// =============================================================================
// CRYPTOGRAPHIC LIBRARY INTERFACE TYPES
// =============================================================================

export interface CryptoLibrary {
  // Hash functions
  shake256(input: string, outputLength: number): Promise<string>
  sha3_256(input: string): Promise<string>
  
  // Key generation
  generateKeyPair(options: KeyGenerationOptions): Promise<KeyPair>
  generatePrivateKey(options: KeyGenerationOptions): Promise<PrivateKey>
  derivePublicKey(privateKey: PrivateKey): Promise<PublicKey>
  
  // Address generation
  generateAddress(publicKey: PublicKey | string): Promise<WalletAddress>
  
  // Signatures
  sign(options: SignatureOptions): Promise<SignatureResult>
  verify(options: VerificationOptions): Promise<VerificationResult>
  
  // Encryption
  encrypt(options: EncryptionOptions): Promise<EncryptionResult>
  decrypt(options: DecryptionOptions): Promise<DecryptionResult>
  
  // Utility functions
  generateSecret(options: SecretGenerationOptions): Promise<string>
  generateBundleHash(options: BundleHashOptions): Promise<BundleHash>
  generatePosition(options?: PositionGenerationOptions): Promise<Position>
  generateBatchId(options?: { molecularHash?: string; index?: number }): Promise<string>
  
  // Validation
  validateHash(hash: string, algorithm: HashAlgorithm): boolean
  validateSignature(signature: string, algorithm: SignatureAlgorithm): boolean
  validatePublicKey(publicKey: string, algorithm: SignatureAlgorithm): boolean
  
  // Compatibility testing
  runCompatibilityTests(testVectors: TestVector[]): Promise<CryptoCompatibilityResult>
}

// =============================================================================
// ERROR TYPES FOR CRYPTOGRAPHIC OPERATIONS
// =============================================================================

export type CryptoErrorType =
  | 'INVALID_INPUT'
  | 'INVALID_KEY'
  | 'INVALID_SIGNATURE'
  | 'ENCRYPTION_FAILED'
  | 'DECRYPTION_FAILED'
  | 'KEY_GENERATION_FAILED'
  | 'HASH_COMPUTATION_FAILED'
  | 'INCOMPATIBLE_ALGORITHM'
  | 'INSUFFICIENT_ENTROPY'
  | 'KEY_ALREADY_USED'
  | 'SIGNATURE_VERIFICATION_FAILED'

export interface CryptoError extends Error {
  type: CryptoErrorType
  algorithm?: string
  operation?: string
  details?: Record<string, unknown>
}

// =============================================================================
// CONSTANTS FOR CRYPTOGRAPHIC OPERATIONS
// =============================================================================

export const CRYPTO_CONSTANTS = {
  SHAKE256_OUTPUT_LENGTH: 256,
  SECRET_LENGTH: 2048,
  POSITION_LENGTH: 64,
  ADDRESS_LENGTH: 64,
  BUNDLE_HASH_LENGTH: 64,
  
  XMSS_TREE_HEIGHT: 10,
  XMSS_WINTERNITZ_PARAMETER: 16,
  
  ML_KEM768_PUBLIC_KEY_SIZE: 1184,
  ML_KEM768_PRIVATE_KEY_SIZE: 2400,
  ML_KEM768_CIPHERTEXT_SIZE: 1088,
  ML_KEM768_SHARED_SECRET_SIZE: 32,
  
  KEY_FRAGMENT_SIZE: 128,
  OTS_FRAGMENT_COUNT: 16,
  HASH_ITERATION_COUNT: 16
} as const

// =============================================================================
// TYPE GUARDS FOR CRYPTOGRAPHIC TYPES
// =============================================================================

export function isPrivateKey(obj: unknown): obj is PrivateKey {
  return typeof obj === 'object' && 
         obj !== null && 
         'key' in obj && 
         'algorithm' in obj && 
         'length' in obj && 
         'createdAt' in obj
}

export function isPublicKey(obj: unknown): obj is PublicKey {
  return typeof obj === 'object' && 
         obj !== null && 
         'key' in obj && 
         'address' in obj && 
         'algorithm' in obj && 
         'length' in obj && 
         'createdAt' in obj
}

export function isKeyPair(obj: unknown): obj is KeyPair {
  return typeof obj === 'object' && 
         obj !== null && 
         'privateKey' in obj && 
         'publicKey' in obj && 
         'algorithm' in obj &&
         isPrivateKey((obj as KeyPair).privateKey) &&
         isPublicKey((obj as KeyPair).publicKey)
}

export function isSignatureResult(obj: unknown): obj is SignatureResult {
  return typeof obj === 'object' && 
         obj !== null && 
         'signature' in obj && 
         'algorithm' in obj && 
         'messageHash' in obj && 
         'publicKey' in obj && 
         'timestamp' in obj
}

export function isVerificationResult(obj: unknown): obj is VerificationResult {
  return typeof obj === 'object' && 
         obj !== null && 
         'valid' in obj && 
         'algorithm' in obj && 
         'publicKey' in obj && 
         'messageHash' in obj && 
         'timestamp' in obj
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

// All types are already exported at their definitions above