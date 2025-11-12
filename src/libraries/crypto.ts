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
 * Cryptographic library for KnishIO TypeScript SDK
 * Ensures 100% compatibility with JavaScript SDK and cross-platform consistency
 */

import JsSHA from 'jssha'
import { randomString } from './strings'
import type { 
  BundleHash,
  Position,
  SHAKE256Options,
  SecretGenerationOptions,
  BundleHashOptions,
  PositionGenerationOptions 
} from '@/types'

// =============================================================================
// CONSTANTS - MUST MATCH JavaScript SDK EXACTLY
// =============================================================================

export const CRYPTO_CONSTANTS = {
  SECRET_LENGTH: 2048,
  BUNDLE_HASH_LENGTH: 64,
  POSITION_LENGTH: 64,
  ADDRESS_LENGTH: 64,
  MOLECULAR_HASH_OUTPUT_LENGTH: 256,
  SHAKE256_OUTPUT_LENGTH: 256,
  KEY_FRAGMENT_SIZE: 128,
  HASH_ITERATIONS: 16
} as const

// =============================================================================
// SHAKE256 IMPLEMENTATION - CRITICAL FOR CROSS-SDK COMPATIBILITY
// =============================================================================

/**
 * SHAKE256 hash function - MUST produce identical outputs to JavaScript SDK
 * Test vectors from validation/common-config.json:
 * - shake256("test", 256) === "b54ff7255705a71ee2925e4a3e30e41aed489a579d5595e0df13e32e1e4dd202"
 * - shake256("KnishIO", 256) === "35e3c3f33aefb940baaf430855ccb441c24b7b0542f682b8543f4c9d3a077c6e"
 * 
 * @param input - Input string to hash
 * @param outputLength - Output length in BITS (256 bits = 64 hex chars)
 */
export function shake256(input: string, outputLength: number): string {
  const sponge = new JsSHA('SHAKE256', 'TEXT')
  sponge.update(input)
  
  // CRITICAL FIX: outputLength parameter is in BITS (as per Implementation Guide)
  // JsSHA outputLen expects bits, so pass outputLength directly
  // 256 bits = 64 hex characters, 512 bits = 128 hex characters, etc.
  const result = sponge.getHash('HEX', { outputLen: outputLength })
  
  return result.toLowerCase()
}

/**
 * Enhanced SHAKE256 with options
 * @param options.input - Input string or Uint8Array to hash
 * @param options.outputLength - Output length in BITS
 * @param options.encoding - Output encoding format
 */
export function shake256Enhanced(options: SHAKE256Options): string {
  const { input, outputLength, encoding = 'hex' } = options

  // Always treat input as string for SHAKE256
  const inputStr = typeof input === 'string' ? input : Array.from(input).map(b => String.fromCharCode(b)).join('')
  const sponge = new JsSHA('SHAKE256', 'TEXT')
  sponge.update(inputStr)
  
  // outputLength is in BITS consistently across all encodings
  switch (encoding) {
    case 'hex':
      return sponge.getHash('HEX', { outputLen: outputLength }).toLowerCase()
    case 'base64':
      return sponge.getHash('B64', { outputLen: outputLength })
    case 'bytes':
      return sponge.getHash('UINT8ARRAY', { outputLen: outputLength }).toString()
    default:
      throw new Error(`Unsupported encoding: ${encoding}`)
  }
}

// =============================================================================
// SECRET GENERATION - MUST MATCH JavaScript SDK BEHAVIOR
// =============================================================================

/**
 * Generate secret from seed or random - MUST match JS SDK exactly
 * If seed provided: uses SHAKE256 to generate deterministic secret
 * If no seed: uses cryptographically secure random string
 */
export function generateSecret(seed: string | null = null, length: number = CRYPTO_CONSTANTS.SECRET_LENGTH): string {
  if (seed) {
    // Deterministic generation using SHAKE256 - MUST match JS SDK
    const sponge = new JsSHA('SHAKE256', 'TEXT')
    sponge.update(seed)
    // Fix: outputLen is in BITS, so for 1024 hex chars output, we need length*2 bits (matching JS SDK)
    return sponge.getHash('HEX', { outputLen: length * 2 }).toLowerCase()
  } else {
    // Cryptographically secure random generation
    return randomString(length)
  }
}

/**
 * Enhanced secret generation with options
 */
export function generateSecretEnhanced(options: SecretGenerationOptions): string {
  const { 
    seed = null, 
    length = CRYPTO_CONSTANTS.SECRET_LENGTH,
    algorithm = 'SHAKE256' 
  } = options

  if (algorithm !== 'SHAKE256') {
    throw new Error('Only SHAKE256 algorithm is supported for cross-platform compatibility')
  }

  return generateSecret(seed, length)
}

// =============================================================================
// BUNDLE HASH GENERATION - MUST MATCH JavaScript SDK BEHAVIOR
// =============================================================================

/**
 * Generate bundle hash from secret - MUST produce identical results to JS SDK
 * Uses SHAKE256 with 256-bit output (64 hex characters)
 */
export function generateBundleHash(secret: string, source: string | null = null): BundleHash {
  if (!secret || secret.length === 0) {
    throw new Error('Secret is required for bundle hash generation')
  }

  let input = secret
  if (source) {
    input = secret + source
  }

  // Fix: BUNDLE_HASH_LENGTH is 64 (hex chars), but shake256 expects bits
  // So we multiply by 4: 64 hex chars * 4 = 256 bits (matching JS SDK)
  const hash = shake256(input, CRYPTO_CONSTANTS.BUNDLE_HASH_LENGTH * 4)
  return hash as BundleHash
}

/**
 * Enhanced bundle hash generation with options
 */
export function generateBundleHashEnhanced(options: BundleHashOptions): BundleHash {
  const { secret, source = null, algorithm = 'SHAKE256' } = options

  if (algorithm !== 'SHAKE256') {
    throw new Error('Only SHAKE256 algorithm is supported for cross-platform compatibility')
  }

  return generateBundleHash(secret, source)
}

// =============================================================================
// POSITION GENERATION - CRYPTOGRAPHICALLY SECURE RANDOM POSITIONS
// =============================================================================

/**
 * Generate cryptographically secure position
 * Must be 64 hex characters (256 bits)
 */
export function generatePosition(): Position {
  // Generate 32 random bytes (256 bits) and convert to hex
  const position = randomString(CRYPTO_CONSTANTS.POSITION_LENGTH, '0123456789abcdef')
  return position as Position
}

/**
 * Enhanced position generation with options
 */
export function generatePositionEnhanced(options: PositionGenerationOptions = {}): Position {
  const {
    entropy = null,
    algorithm: _algorithm = 'SHAKE256',
    length = CRYPTO_CONSTANTS.POSITION_LENGTH
  } = options

  if (entropy) {
    // Use provided entropy with SHAKE256
    const entropyString = Array.from(entropy).map(b => b.toString(16).padStart(2, '0')).join('')
    const hash = shake256(entropyString, length)
    return hash as Position
  }

  if (length !== CRYPTO_CONSTANTS.POSITION_LENGTH) {
    throw new Error(`Position length must be exactly ${CRYPTO_CONSTANTS.POSITION_LENGTH} characters`)
  }

  return generatePosition()
}

// =============================================================================
// BATCH ID GENERATION - DETERMINISTIC BATCH IDENTIFICATION
// =============================================================================

/**
 * Generate batch ID from molecular hash and index
 * Uses SHAKE256 to create deterministic batch identifiers
 */
export function generateBatchId({ 
  molecularHash = null, 
  index = null 
}: { 
  molecularHash?: string | null
  index?: number | null 
} = {}): string {
  let input = ''
  
  if (molecularHash) {
    input += molecularHash
  }
  
  if (index !== null) {
    input += index.toString()
  }
  
  // If no input provided, generate random batch ID
  if (input === '') {
    input = randomString(32)
  }
  
  // Use SHAKE256 to generate 64-character batch ID
  return shake256(input, 64)
}

// =============================================================================
// WALLET KEY GENERATION - MUST MATCH JavaScript SDK EXACTLY
// =============================================================================

/**
 * Generate wallet key from secret, token, and position
 * MUST match JS SDK algorithm exactly for cross-platform compatibility
 * 
 * Algorithm from JS SDK Wallet.generateKey():
 * 1. Convert secret to BigInt
 * 2. Add position as BigInt
 * 3. Convert result to hex string
 * 4. Hash with SHAKE256 (8192 bits)
 * 5. If token provided, append token and hash again
 * 6. Final hash with SHAKE256 (8192 bits)
 */
export function generateWalletKey({
  secret,
  token,
  position
}: {
  secret: string
  token: string | null
  position: string
}): string {
  if (!secret || !position) {
    throw new Error('Secret and position are required for key generation')
  }

  try {
    // Step 1: Convert secret to BigInt (must match JS SDK)
    const bigIntSecret = BigInt(`0x${secret}`)
    
    // Step 2: Add position as BigInt
    const indexedKey = bigIntSecret + BigInt(`0x${position}`)
    
    // Step 3: Create intermediate key sponge
    const intermediateKeySponge = new JsSHA('SHAKE256', 'TEXT')
    
    // Step 4: Update with hex string of indexed key
    intermediateKeySponge.update(indexedKey.toString(16))
    
    // Step 5: If token provided, update the SAME sponge with token
    if (token) {
      intermediateKeySponge.update(token)
    }
    
    // Step 6: Get intermediate hash (8192 bits = 2048 hex chars)
    // Step 7: Create new sponge for private key
    const privateKeySponge = new JsSHA('SHAKE256', 'TEXT')
    privateKeySponge.update(intermediateKeySponge.getHash('HEX', { outputLen: 8192 }))
    
    // Return final key (8192 bits = 2048 hex chars) - JS SDK doesn't call toLowerCase()
    return privateKeySponge.getHash('HEX', { outputLen: 8192 })
    
  } catch (error) {
    throw new Error(`Key generation failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// =============================================================================
// WALLET ADDRESS GENERATION - MUST MATCH JavaScript SDK EXACTLY
// =============================================================================

/**
 * Generate wallet address from key
 * MUST match JS SDK algorithm exactly for cross-platform compatibility
 * 
 * Algorithm from JS SDK Wallet.generateAddress():
 * 1. Split key into 16 fragments of 128 characters each
 * 2. For each fragment, hash 16 times with SHAKE256
 * 3. Combine all fragments and hash with SHAKE256
 * 4. Final hash with SHAKE256 (256 bits = 64 hex chars)
 */
export function generateWalletAddress(key: string): string {
  if (!key || key.length < 2048) {
    throw new Error('Key must be at least 2048 characters for address generation')
  }

  try {
    // Step 1: Split into 16 fragments of 128 characters each
    const keyFragments = []
    for (let i = 0; i < key.length; i += CRYPTO_CONSTANTS.KEY_FRAGMENT_SIZE) {
      keyFragments.push(key.substring(i, i + CRYPTO_CONSTANTS.KEY_FRAGMENT_SIZE))
    }
    
    // Step 2: Hash each fragment 16 times
    const digestSponge = new JsSHA('SHAKE256', 'TEXT')
    
    for (const fragment of keyFragments) {
      let workingFragment = fragment
      
      // Hash the fragment 16 times
      for (let fragmentCount = 1; fragmentCount <= CRYPTO_CONSTANTS.HASH_ITERATIONS; fragmentCount++) {
        const workingSponge = new JsSHA('SHAKE256', 'TEXT')
        workingSponge.update(workingFragment)
        workingFragment = workingSponge.getHash('HEX', { outputLen: 512 })
      }
      
      // Add processed fragment to digest
      digestSponge.update(workingFragment)
    }
    
    // Step 3: Get intermediate digest
    const intermediateDigest = digestSponge.getHash('HEX', { outputLen: 8192 })
    
    // Step 4: Final hash to create address
    const outputSponge = new JsSHA('SHAKE256', 'TEXT')
    outputSponge.update(intermediateDigest)
    
    return outputSponge.getHash('HEX', { outputLen: CRYPTO_CONSTANTS.ADDRESS_LENGTH * 4 })
    
  } catch (error) {
    throw new Error(`Address generation failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// =============================================================================
// VALIDATION FUNCTIONS - ENSURE DATA INTEGRITY
// =============================================================================

/**
 * Validate SHAKE256 hash format and length
 */
export function validateSHAKE256Hash(hash: string, expectedLength: number): boolean {
  if (!hash || typeof hash !== 'string') return false
  if (hash.length !== expectedLength) return false
  return /^[0-9a-f]+$/i.test(hash)
}

/**
 * Validate secret format and length
 */
export function validateSecret(secret: string): boolean {
  if (!secret || typeof secret !== 'string') return false
  if (secret.length !== CRYPTO_CONSTANTS.SECRET_LENGTH) return false
  return /^[0-9a-f]+$/i.test(secret)
}

/**
 * Validate bundle hash format
 */
export function validateBundleHash(bundleHash: string): boolean {
  return validateSHAKE256Hash(bundleHash, CRYPTO_CONSTANTS.BUNDLE_HASH_LENGTH)
}

/**
 * Validate position format
 */
export function validatePosition(position: string): boolean {
  return validateSHAKE256Hash(position, CRYPTO_CONSTANTS.POSITION_LENGTH)
}

/**
 * Validate wallet address format
 */
export function validateWalletAddress(address: string): boolean {
  return validateSHAKE256Hash(address, CRYPTO_CONSTANTS.ADDRESS_LENGTH)
}

// =============================================================================
// COMPATIBILITY TESTING - VERIFY CROSS-PLATFORM COMPATIBILITY
// =============================================================================

/**
 * Test vector for SHAKE256 compatibility
 * These values MUST match across all SDK implementations
 */
export const COMPATIBILITY_TEST_VECTORS = {
  shake256: [
    {
      input: 'test',
      outputLength: 256,
      expected: 'b54ff7255705a71ee2925e4a3e30e41aed489a579d5595e0df13e32e1e4dd202'
    },
    {
      input: 'KnishIO',
      outputLength: 256,
      expected: '35e3c3f33aefb940baaf430855ccb441c24b7b0542f682b8543f4c9d3a077c6e'
    }
  ]
} as const

/**
 * Run compatibility tests to verify cross-platform consistency
 */
export function runCompatibilityTests(): { passed: boolean; results: Array<{ test: string; passed: boolean; expected: string; actual: string }> } {
  const results = []
  let allPassed = true

  for (const testVector of COMPATIBILITY_TEST_VECTORS.shake256) {
    const actual = shake256(testVector.input, testVector.outputLength)
    const passed = actual === testVector.expected
    
    results.push({
      test: `shake256("${testVector.input}", ${testVector.outputLength})`,
      passed,
      expected: testVector.expected,
      actual
    })
    
    if (!passed) {
      allPassed = false
    }
  }

  return { passed: allPassed, results }
}

// =============================================================================
// BASE17 CONVERSION SYSTEM - CRITICAL FOR MOLECULAR HASH PROCESSING
// =============================================================================

/**
 * Base conversion utility for molecular hash processing
 * MUST match JavaScript SDK implementation exactly
 */
export function charsetBaseConvert(
  input: string,
  fromBase: number,
  toBase: number,
  fromCharset: string,
  toCharset: string
): string {
  if (input === '') return toCharset[0]!

  // Convert input from source base to decimal using BigInt for precision
  let decimal = 0n
  for (let i = 0; i < input.length; i++) {
    const char = input[i]!
    const value = BigInt(fromCharset.indexOf(char))
    if (value === -1n) {
      throw new Error(`Invalid character '${char}' for source base ${fromBase}`)
    }
    decimal = decimal * BigInt(fromBase) + value
  }

  // Convert decimal to target base
  if (decimal === 0n) return toCharset[0]!
  
  let result = ''
  while (decimal > 0n) {
    const remainder = decimal % BigInt(toBase)
    result = toCharset[Number(remainder)] + result
    decimal = decimal / BigInt(toBase)
  }
  
  return result
}

/**
 * Convert molecular hash from base16 to base17
 * Critical for WOTS+ signature generation
 */
export function convertToBase17(hexHash: string): string {
  const base16Charset = '0123456789abcdef'
  const base17Charset = '0123456789abcdefg'
  
  const base17Hash = charsetBaseConvert(hexHash, 16, 17, base16Charset, base17Charset)
  
  // Pad to 64 characters as required by Implementation Guide
  return base17Hash.padStart(64, '0')
}

// =============================================================================
// MOLECULAR HASH ENUMERATION AND NORMALIZATION - FOR WOTS+ SIGNATURES
// =============================================================================

/**
 * Enumerate molecular hash for signature generation
 * MUST match JavaScript SDK Molecule.enumerate() exactly
 */
export function enumerateMolecularHash(hash: string): number[] {
  const mapped: Record<string, number> = {
    '0': -8, '1': -7, '2': -6, '3': -5, '4': -4, '5': -3, '6': -2, '7': -1,
    '8': 0, '9': 1, 'a': 2, 'b': 3, 'c': 4, 'd': 5, 'e': 6, 'f': 7, 'g': 8
  }
  
  const target: number[] = []
  const hashList = hash.toLowerCase().split('')
  
  for (let index = 0; index < hashList.length; index++) {
    const symbol = hashList[index]!
    if (typeof mapped[symbol] !== 'undefined') {
      target[index] = mapped[symbol]!
    } else {
      throw new Error(`Invalid character '${symbol}' in molecular hash`)
    }
  }
  
  return target
}

/**
 * Normalize enumerated molecular hash for signature generation
 * MUST match JavaScript SDK Molecule.normalize() exactly
 */
export function normalizeMolecularHash(mappedHashArray: number[]): number[] {
  // Create a copy to avoid mutating the original
  const normalized = [...mappedHashArray]
  
  let total = normalized.reduce((sum, num) => sum + num, 0)
  const totalCondition = total < 0
  
  while (total !== 0) {
    for (let index = 0; index < normalized.length; index++) {
      const value = normalized[index]!
      const condition = totalCondition
        ? value < 8
        : value > -8

      if (condition) {
        if (totalCondition) {
          normalized[index] = value + 1
          total++
        } else {
          normalized[index] = value - 1
          total--
        }

        if (total === 0) break
      }
    }
  }
  
  return normalized
}

// =============================================================================
// WOTS+ ONE-TIME SIGNATURE IMPLEMENTATION - CRITICAL FOR TRANSACTION SIGNING
// =============================================================================

/**
 * Generate WOTS+ one-time signature for molecular hash
 * MUST match JavaScript SDK implementation exactly for cross-platform compatibility
 */
export function generateOTSSignature(privateKey: string, molecularHash: string): string {
  if (!privateKey || privateKey.length < 2048) {
    throw new Error('Private key must be at least 2048 characters for OTS signature')
  }
  
  if (!molecularHash || molecularHash.length !== 64) {
    throw new Error('Molecular hash must be exactly 64 characters')
  }
  
  try {
    // Step 1: Molecular hash is already base17 from Atom.hashAtoms(), enumerate and normalize it
    // Fix: Don't convert to base17 again - it's already base17 (matching JS SDK behavior)
    const enumerated = enumerateMolecularHash(molecularHash)
    const normalized = normalizeMolecularHash(enumerated)
    
    // Step 2: Subdivide private key into 16 chunks of 128 characters each
    const keyChunks: string[] = []
    for (let i = 0; i < privateKey.length; i += CRYPTO_CONSTANTS.KEY_FRAGMENT_SIZE) {
      keyChunks.push(privateKey.substring(i, i + CRYPTO_CONSTANTS.KEY_FRAGMENT_SIZE))
    }
    
    // Step 3: Generate signature fragments
    let signatureFragments = ''
    for (let index = 0; index < keyChunks.length; index++) {
      let workingChunk = keyChunks[index]!

      // Hash (8 - normalized[index]) times for signature generation
      const iterations = 8 - (normalized[index] || 0)
      for (let j = 0; j < iterations; j++) {
        const sponge = new JsSHA('SHAKE256', 'TEXT')
        sponge.update(workingChunk)
        workingChunk = sponge.getHash('HEX', { outputLen: 512 }) // 512 bits
      }
      signatureFragments += workingChunk
    }
    
    return signatureFragments
  } catch (error) {
    throw new Error(`OTS signature generation failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Verify WOTS+ one-time signature against molecular hash and address
 * MUST match JavaScript SDK implementation exactly
 */
export function verifyOTSSignature(
  otsFragments: string,
  molecularHash: string,
  signingAddress: string
): boolean {
  if (!otsFragments || !molecularHash || !signingAddress) {
    return false
  }
  
  try {
    // Step 1: Convert molecular hash to base17 and normalize
    const base17Hash = convertToBase17(molecularHash)
    const enumerated = enumerateMolecularHash(base17Hash)
    const normalized = normalizeMolecularHash(enumerated)
    
    // Step 2: Process OTS fragments (handle compression if needed)
    let ots = otsFragments
    if (ots.length !== 2048) {
      // If not 2048 chars, it might be base64 compressed - for now, assume uncompressed
      if (ots.length !== 2048) {
        return false // Invalid signature length
      }
    }
    
    // Step 3: Subdivide OTS into 16 segments of 128 characters each
    const otsChunks: string[] = []
    for (let i = 0; i < ots.length; i += CRYPTO_CONSTANTS.KEY_FRAGMENT_SIZE) {
      otsChunks.push(ots.substring(i, i + CRYPTO_CONSTANTS.KEY_FRAGMENT_SIZE))
    }
    
    // Step 4: Process each chunk for verification
    let keyFragments = ''
    for (let index = 0; index < otsChunks.length; index++) {
      let workingChunk = otsChunks[index]!

      // Hash (8 + normalized[index]) times for verification
      const iterations = 8 + (normalized[index] || 0)
      for (let j = 0; j < iterations; j++) {
        const sponge = new JsSHA('SHAKE256', 'TEXT')
        sponge.update(workingChunk)
        workingChunk = sponge.getHash('HEX', { outputLen: 512 }) // 512 bits
      }
      keyFragments += workingChunk
    }
    
    // Step 5: Generate digest from reconstructed key fragments
    const digestSponge = new JsSHA('SHAKE256', 'TEXT')
    digestSponge.update(keyFragments)
    const digest = digestSponge.getHash('HEX', { outputLen: 8192 }) // 8192 bits
    
    // Step 6: Generate address from digest
    const addressSponge = new JsSHA('SHAKE256', 'TEXT')
    addressSponge.update(digest)
    const reconstructedAddress = addressSponge.getHash('HEX', { outputLen: 256 }) // 256 bits
    
    // Step 7: Compare with expected signing address
    return reconstructedAddress.toLowerCase() === signingAddress.toLowerCase()
  } catch (error) {
    return false
  }
}

// =============================================================================
// ENHANCED VALIDATION FUNCTIONS - SUPPORT FOR NEW SIGNATURE SYSTEM
// =============================================================================

/**
 * Validate OTS signature format
 */
export function validateOTSSignature(signature: string): boolean {
  if (!signature || typeof signature !== 'string') return false
  
  // OTS signature should be 2048 characters (16 chunks * 128 chars each)
  // or compressed format
  return signature.length === 2048 || (signature.length > 0 && signature.length < 2048)
}

/**
 * Validate molecular hash for base17 conversion
 */
export function validateMolecularHashForSignature(hash: string): boolean {
  if (!hash || typeof hash !== 'string') return false
  if (hash.length !== 64) return false
  return /^[0-9a-f]+$/i.test(hash)
}

// =============================================================================
// UPDATED COMPATIBILITY TEST VECTORS - INCLUDING SIGNATURE TESTS
// =============================================================================

/**
 * Extended test vectors including signature generation
 */
export const EXTENDED_COMPATIBILITY_TEST_VECTORS = {
  ...COMPATIBILITY_TEST_VECTORS,
  base17Conversion: [
    {
      input: '0000000000000000000000000000000000000000000000000000000000000000',
      expected: '0000000000000000000000000000000000000000000000000000000000000000'
    }
  ],
  molecularEnumeration: [
    {
      input: '0000000000000000000000000000000000000000000000000000000000000000',
      expected: [-8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8, -8]
    }
  ]
} as const

/**
 * Run extended compatibility tests including signature system
 */
export function runExtendedCompatibilityTests(): { 
  passed: boolean
  results: Array<{ test: string; passed: boolean; expected: any; actual: any }>
} {
  const results = []
  let allPassed = true

  // Run original SHAKE256 tests
  const originalResults = runCompatibilityTests()
  results.push(...originalResults.results)
  if (!originalResults.passed) allPassed = false

  // Test base17 conversion
  for (const testVector of EXTENDED_COMPATIBILITY_TEST_VECTORS.base17Conversion) {
    const actual = convertToBase17(testVector.input)
    const passed = actual === testVector.expected
    
    results.push({
      test: `convertToBase17("${testVector.input}")`,
      passed,
      expected: testVector.expected,
      actual
    })
    
    if (!passed) allPassed = false
  }

  // Test molecular enumeration
  for (const testVector of EXTENDED_COMPATIBILITY_TEST_VECTORS.molecularEnumeration) {
    const actual = enumerateMolecularHash(testVector.input)
    const passed = JSON.stringify(actual) === JSON.stringify(testVector.expected)
    
    results.push({
      test: `enumerateMolecularHash("${testVector.input}")`,
      passed,
      expected: testVector.expected,
      actual
    })
    
    if (!passed) allPassed = false
  }

  return { passed: allPassed, results }
}

// All functions are already exported individually above