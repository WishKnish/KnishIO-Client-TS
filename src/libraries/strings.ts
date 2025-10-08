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
 * String utility functions for KnishIO TypeScript SDK
 * Maintains compatibility with JavaScript SDK string operations
 */

// =============================================================================
// STRING CHUNKING AND MANIPULATION
// =============================================================================

/**
 * Split string into chunks of specified size
 * MUST match JavaScript SDK behavior exactly
 */
export function chunkSubstr(str: string, size: number): string[] {
  if (!str || size <= 0) {
    return []
  }
  
  const chunks: string[] = []
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.substring(i, i + size))
  }
  
  return chunks
}

/**
 * Generate cryptographically secure random string
 * Uses crypto.getRandomValues when available, falls back to Math.random
 */
export function randomString(
  length = 32,
  alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
): string {
  if (length <= 0) return ''
  
  let result = ''
  
  // Use crypto.getRandomValues if available (browser/Node.js crypto)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomValues = new Uint8Array(length)
    crypto.getRandomValues(randomValues)
    
    for (let i = 0; i < length; i++) {
      result += alphabet.charAt(randomValues[i] % alphabet.length)
    }
  } else {
    // Fallback to Math.random (less secure but compatible)
    for (let i = 0; i < length; i++) {
      result += alphabet.charAt(Math.floor(Math.random() * alphabet.length))
    }
  }
  
  return result
}

// =============================================================================
// BASE CONVERSION UTILITIES
// =============================================================================

/**
 * Convert between different character sets/bases
 * Ported from JavaScript SDK for cross-platform compatibility
 */
export function charsetBaseConvert(
  src: string,
  fromBase: number,
  toBase: number,
  srcSymbolTable = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  destSymbolTable = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
): string | number | boolean {
  if (!src || fromBase < 2 || toBase < 2 || fromBase > srcSymbolTable.length || toBase > destSymbolTable.length) {
    return false
  }
  
  try {
    // Convert from source base to decimal
    let decimalValue = 0
    const srcLength = src.length
    
    for (let i = 0; i < srcLength; i++) {
      const char = src.charAt(srcLength - 1 - i)
      const charIndex = srcSymbolTable.indexOf(char)
      
      if (charIndex === -1) {
        return false // Invalid character for source base
      }
      
      decimalValue += charIndex * Math.pow(fromBase, i)
    }
    
    // Convert from decimal to destination base
    if (decimalValue === 0) {
      return destSymbolTable.charAt(0)
    }
    
    let result = ''
    while (decimalValue > 0) {
      const remainder = decimalValue % toBase
      result = destSymbolTable.charAt(remainder) + result
      decimalValue = Math.floor(decimalValue / toBase)
    }
    
    return result
    
  } catch (error) {
    return false
  }
}

// =============================================================================
// HEX AND BINARY UTILITIES
// =============================================================================

/**
 * Convert buffer/byte array to hex string
 * Maintains compatibility with JavaScript SDK
 */
export function bufferToHexString(byteArray: Uint8Array | ArrayBuffer | number[]): string {
  let bytes: Uint8Array
  
  if (byteArray instanceof ArrayBuffer) {
    bytes = new Uint8Array(byteArray)
  } else if (Array.isArray(byteArray)) {
    bytes = new Uint8Array(byteArray)
  } else {
    bytes = byteArray
  }
  
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert hex string to buffer/byte array
 * Maintains compatibility with JavaScript SDK
 */
export function hexStringToBuffer(hexString: string): Uint8Array {
  if (!hexString || hexString.length % 2 !== 0) {
    throw new Error('Invalid hex string')
  }
  
  const cleanHex = hexString.replace(/^0x/i, '').toLowerCase()
  const bytes = new Uint8Array(cleanHex.length / 2)
  
  for (let i = 0; i < cleanHex.length; i += 2) {
    const byteValue = parseInt(cleanHex.substring(i, i + 2), 16)
    if (isNaN(byteValue)) {
      throw new Error(`Invalid hex characters at position ${i}: ${cleanHex.substring(i, i + 2)}`)
    }
    bytes[i / 2] = byteValue
  }
  
  return bytes
}

// =============================================================================
// BASE64 CONVERSION UTILITIES
// =============================================================================

/**
 * Convert hex string to base64
 * Uses native btoa when available, falls back to manual conversion
 */
export function hexToBase64(hexString: string): string {
  if (!hexString) return ''
  
  try {
    const cleanHex = hexString.replace(/^0x/i, '')
    
    // Convert hex to bytes
    const bytes = hexStringToBuffer(cleanHex)
    
    // Convert to base64
    if (typeof btoa !== 'undefined') {
      // Browser environment
      return btoa(String.fromCharCode(...bytes))
    } else {
      // Node.js environment or manual conversion
      return Buffer.from(bytes).toString('base64')
    }
  } catch (error) {
    throw new Error(`Failed to convert hex to base64: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Convert base64 string to hex
 * Uses native atob when available, falls back to manual conversion
 */
export function base64ToHex(base64String: string): string {
  if (!base64String) return ''
  
  try {
    let bytes: Uint8Array
    
    if (typeof atob !== 'undefined') {
      // Browser environment
      const binaryString = atob(base64String)
      bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
    } else {
      // Node.js environment
      bytes = new Uint8Array(Buffer.from(base64String, 'base64'))
    }
    
    return bufferToHexString(bytes)
    
  } catch (error) {
    throw new Error(`Failed to convert base64 to hex: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Check if string is valid hexadecimal
 */
export function isHex(str: string): boolean {
  if (!str || typeof str !== 'string') return false
  
  const cleanStr = str.replace(/^0x/i, '')
  return /^[0-9a-fA-F]+$/.test(cleanStr)
}

/**
 * Check if string is numeric
 */
export function isNumeric(str: string): boolean {
  if (!str || typeof str !== 'string') return false
  
  return /^-?\d+\.?\d*$/.test(str)
}

/**
 * Check if string is valid base64
 */
export function isBase64(str: string): boolean {
  if (!str || typeof str !== 'string') return false
  
  try {
    return btoa ? str === btoa(atob(str)) : Buffer.from(str, 'base64').toString('base64') === str
  } catch {
    return false
  }
}

// =============================================================================
// STRING FORMATTING UTILITIES
// =============================================================================

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  if (!str) return ''
  
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
}

/**
 * Convert string to snake_case
 */
export function toSnakeCase(str: string): string {
  if (!str) return ''
  
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .toLowerCase()
}

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
  if (!str) return ''
  
  return str
    .replace(/([A-Z])/g, '-$1')
    .replace(/^-/, '')
    .toLowerCase()
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  if (!str) return ''
  
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Convert string to title case
 */
export function toTitleCase(str: string): string {
  if (!str) return ''
  
  return str
    .split(/\s+/)
    .map(word => capitalize(word))
    .join(' ')
}

// =============================================================================
// STRING PADDING AND ALIGNMENT
// =============================================================================

/**
 * Pad string to left with specified character
 */
export function padLeft(str: string, length: number, padChar = ' '): string {
  if (!str) str = ''
  
  while (str.length < length) {
    str = padChar + str
  }
  
  return str
}

/**
 * Pad string to right with specified character
 */
export function padRight(str: string, length: number, padChar = ' '): string {
  if (!str) str = ''
  
  while (str.length < length) {
    str = str + padChar
  }
  
  return str
}

/**
 * Truncate string to specified length with ellipsis
 */
export function truncate(str: string, length: number, ellipsis = '...'): string {
  if (!str || str.length <= length) return str
  
  return str.substring(0, length - ellipsis.length) + ellipsis
}

// =============================================================================
// UNICODE AND ENCODING UTILITIES
// =============================================================================

/**
 * Escape string for safe usage in various contexts
 */
export function escapeString(str: string): string {
  if (!str) return ''
  
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

/**
 * Unescape string
 */
export function unescapeString(str: string): string {
  if (!str) return ''
  
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}

// =============================================================================
// STRING PROTOTYPE EXTENSIONS (FOR COMPATIBILITY)
// =============================================================================

declare global {
  interface String {
    toCamelCase(): string
    toSnakeCase(): string
  }
}

// Add methods to String prototype for compatibility with JS SDK
if (typeof String.prototype.toCamelCase === 'undefined') {
  String.prototype.toCamelCase = function(): string {
    return toCamelCase(this.toString())
  }
}

if (typeof String.prototype.toSnakeCase === 'undefined') {
  String.prototype.toSnakeCase = function(): string {
    return toSnakeCase(this.toString())
  }
}

// All functions are already exported individually above