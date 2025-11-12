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

import JsSHA from 'jssha'
import { randomString, chunkSubstr } from '@/libraries/strings'
import { generateBundleHash, generateSecret, shake256, generateBatchId } from '@/libraries/crypto'
import WalletCredentialException from '@/exception/WalletCredentialException'
import { isWalletAddress, isBundleHash, isPosition } from '@/types'
// Post-quantum cryptography for ML-KEM768 key encapsulation
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'

/**
 * Wallet class - Identity and key management for KnishIO DLT
 * Essential implementation for transaction operations
 */
export default class Wallet {
  public token: string
  public balance: number
  public address: string | null
  public position: string | null
  public bundle: string | null
  public batchId: string | null
  public characters: string | null
  public key: string | null
  public privkey: any
  public pubkey: any
  public tokenUnits: any[]
  public tradeRates: Record<string, any>
  public molecules: Record<string, any>

  // Token metadata (populated from query responses)
  public tokenName?: string
  public tokenAmount?: string
  public tokenSupply?: string
  public tokenFungibility?: string
  public createdAt?: string

  constructor({
    secret = null,
    bundle = null,
    token = 'USER',
    address = null,
    position = null,
    batchId = null,
    characters = null
  }: {
    secret?: string | null
    bundle?: string | null
    token?: string
    address?: string | null
    position?: string | null
    batchId?: string | null
    characters?: string | null
  } = {}) {
    // TypeScript 2025: Exhaustive validation with type guards
    if (address !== null && !isWalletAddress(address)) {
      throw new WalletCredentialException('Invalid wallet address format')
    }
    if (bundle !== null && !isBundleHash(bundle)) {
      throw new WalletCredentialException('Invalid bundle hash format')
    }
    if (position !== null && !isPosition(position)) {
      throw new WalletCredentialException('Invalid position format')
    }
    this.token = token
    this.balance = 0
    this.molecules = {}
    
    // Empty values
    this.key = null
    this.privkey = null
    this.pubkey = null
    this.tokenUnits = []
    this.tradeRates = {}
    
    this.address = address
    this.position = position
    this.bundle = bundle
    this.batchId = batchId
    this.characters = characters

    if (secret) {
      // Set bundle from the secret
      this.bundle = this.bundle || generateBundleHash(secret, 'Wallet::constructor')
      
      // Generate a position for non-shadow wallet if not initialized
      this.position = this.position || Wallet.generatePosition()
      
      // Key & address initialization
      this.key = Wallet.generateKey({
        secret,
        token: this.token,
        position: this.position
      })
      this.address = this.address || Wallet.generateAddress(this.key)
      
      // Set characters
      this.characters = this.characters || 'BASE64'
      
      // Initialize ML-KEM768 keys (matches JavaScript SDK)
      this.initializeMLKEM()
    }
  }

  /**
   * Creates a new Wallet instance
   * Matches JavaScript SDK Wallet.create exactly
   */
  static create({
    secret = null,
    bundle = null,
    token = 'USER',
    batchId = null,
    characters = null
  }: {
    secret?: string | null
    bundle?: string | null
    token?: string
    batchId?: string | null
    characters?: string | null
  }): Wallet {
    let position = null
    
    // No credentials parameters provided?
    if (!secret && !bundle) {
      throw new WalletCredentialException()
    }
    
    // Secret, but no bundle?
    if (secret && !bundle) {
      position = Wallet.generatePosition()
      bundle = generateBundleHash(secret, 'Wallet::create')
    }
    
    // Wallet initialization
    return new Wallet({
      secret,
      bundle,
      token,
      position,
      batchId,
      characters
    })
  }


  /**
   * Generates a private key for the given parameters
   * MUST match JavaScript SDK Wallet.generateKey exactly using sponge pattern
   */
  static generateKey({
    secret,
    token,
    position
  }: {
    secret: string
    token: string
    position: string
  }): string {
    // Converting secret to bigInt
    const bigIntSecret = BigInt(`0x${secret}`)
    
    // Adding new position to the user secret to produce the indexed key
    const indexedKey = bigIntSecret + BigInt(`0x${position}`)
    
    // Hashing the indexed key to produce the intermediate key
    // CRITICAL FIX: Use sponge pattern exactly like JavaScript SDK
    const intermediateKeySponge = new JsSHA('SHAKE256', 'TEXT')
    intermediateKeySponge.update(indexedKey.toString(16))
    
    if (token) {
      // CRITICAL FIX: Update the SAME sponge with token (no concatenation)
      intermediateKeySponge.update(token)
    }
    
    // Hashing the intermediate key to produce the private key
    // CRITICAL FIX: Create NEW sponge for private key (matching JS SDK)
    const privateKeySponge = new JsSHA('SHAKE256', 'TEXT')
    privateKeySponge.update(intermediateKeySponge.getHash('HEX', { outputLen: 8192 }))
    
    return privateKeySponge.getHash('HEX', { outputLen: 8192 })
  }

  /**
   * Generates a wallet address
   * Matches JavaScript SDK Wallet.generateAddress exactly
   */
  static generateAddress(key: string): string {
    // Subdivide private key into 16 fragments of 128 characters each
    const keyFragments = chunkSubstr(key, 128)
    
    // Generating wallet digest
    let digestInput = ''
    
    for (let index = 0; index < keyFragments.length; index++) {
      let workingFragment = keyFragments[index]
      if (!workingFragment) continue
      
      // Hash each fragment 16 times
      for (let fragmentCount = 1; fragmentCount <= 16; fragmentCount++) {
        // Fix: Use 512 bits to get 128 hex chars output (matching JS SDK)
        workingFragment = shake256(workingFragment, 512)
      }
      
      digestInput += workingFragment
    }
    
    // Producing wallet address
    // Fix: Use 8192 bits to get 2048 hex chars for digest (matching JS SDK)
    const digest = shake256(digestInput, 8192)
    // Fix: Use 256 bits to get 64 hex chars for address (matching JS SDK)
    return shake256(digest, 256)
  }

  /**
   * Generate a random position for wallet
   * Matches JavaScript SDK Wallet.generatePosition exactly
   */
  static generatePosition(saltLength = 64): string {
    return randomString(saltLength, 'abcdef0123456789')
  }

  /**
   * Determines if the provided string is a bundle hash
   * Uses exhaustive type guard from types system
   * @param maybeBundleHash - String to check
   * @return True if valid bundle hash format
   */
  static isBundleHash(maybeBundleHash: unknown): maybeBundleHash is string {
    return typeof maybeBundleHash === 'string' && isBundleHash(maybeBundleHash)
  }

  /**
   * Get formatted token units from raw data
   * Stub implementation for now
   */
  static getTokenUnits(unitsData: any[]): any[] {
    // TODO: Implement TokenUnit class if needed
    return unitsData
  }

  /**
   * Create a remainder wallet for transactions
   * Used by Molecule for creating remainder atoms
   */
  createRemainder(secret: string): Wallet {
    return Wallet.create({
      secret,
      bundle: this.bundle,
      token: this.token,
      batchId: this.batchId,
      characters: this.characters
    })
  }

  /**
   * Sets up a batch ID - either using the sender's, or a new one
   * Matches JavaScript SDK Wallet.initBatchId exactly
   */
  initBatchId({
    sourceWallet,
    isRemainder = false
  }: {
    sourceWallet: Wallet
    isRemainder?: boolean
  }): void {
    if (sourceWallet.batchId) {
      this.batchId = isRemainder ? sourceWallet.batchId : generateBatchId({})
    }
  }

  /**
   * Split token units between wallets
   * Matches JavaScript SDK Wallet.splitUnits exactly
   *
   * @param units - Array of token unit IDs to transfer
   * @param remainderWallet - Wallet to receive units not being transferred
   * @param recipientWallet - Wallet to receive the transferred units (optional)
   */
  splitUnits(
    units: string[],
    remainderWallet: Wallet,
    recipientWallet: Wallet | null = null
  ): void {
    // No units supplied, nothing to split
    if (units.length === 0) {
      return
    }

    // Init recipient & remainder token units
    const recipientTokenUnits: any[] = []
    const remainderTokenUnits: any[] = []

    this.tokenUnits.forEach(tokenUnit => {
      if (units.includes(tokenUnit.id)) {
        recipientTokenUnits.push(tokenUnit)
      } else {
        remainderTokenUnits.push(tokenUnit)
      }
    })

    // Reset token units to the sending value
    this.tokenUnits = recipientTokenUnits

    // Set token units to recipient & remainder
    if (recipientWallet !== null) {
      recipientWallet.tokenUnits = recipientTokenUnits
    }
    remainderWallet.tokenUnits = remainderTokenUnits
  }

  /**
   * Get token units data
   * Stub for compatibility
   */
  getTokenUnitsData(): any[] {
    return this.tokenUnits
  }

  /**
   * Check if this is a shadow wallet
   * Shadow wallets don't have position or address set
   * @return True if this is a shadow wallet
   */
  isShadow(): boolean {
    return (
      (typeof this.position === 'undefined' || this.position === null) &&
      (typeof this.address === 'undefined' || this.address === null)
    )
  }

  // =============================================================================
  // POST-QUANTUM CRYPTOGRAPHY - ML-KEM768 INTEGRATION
  // =============================================================================

  /**
   * Initializes the ML-KEM key pair (matches JavaScript SDK exactly)
   */
  initializeMLKEM(): void {
    // Generate a 64-byte (512-bit) seed from the Knish.IO private key
    // Use deterministic approach: generateSecret(key, 64) → matches JS SDK exactly
    const seedHex = generateSecret(this.key!, 64)  // Matches JS SDK for cross-platform compatibility
    
    // Convert the hex string to a Uint8Array  
    const seed = new Uint8Array(64)
    for (let i = 0; i < 64; i++) {
      seed[i] = parseInt(seedHex.substr(i * 2, 2), 16)
    }
    
    const { publicKey, secretKey } = ml_kem768.keygen(seed)
    this.pubkey = this.serializeKey(publicKey)
    this.privkey = secretKey // Note: We're keeping privkey as UInt8Array for security
  }


  // =============================================================================
  // HIGH-LEVEL MESSAGE ENCRYPTION (JavaScript SDK Compatibility)
  // =============================================================================

  async encryptMessage(message: any, recipientPubkey: string): Promise<{ cipherText: string; encryptedMessage: string }> {
    const messageString = JSON.stringify(message)
    const messageUint8 = new TextEncoder().encode(messageString)
    const deserializedPubkey = this.deserializeKey(recipientPubkey)
    const { cipherText, sharedSecret } = ml_kem768.encapsulate(deserializedPubkey)
    const encryptedMessage = await this.encryptWithSharedSecret(messageUint8, sharedSecret)
    return {
      cipherText: this.serializeKey(cipherText),
      encryptedMessage: this.serializeKey(encryptedMessage)
    }
  }

  async decryptMessage(encryptedData: { cipherText: string; encryptedMessage: string }): Promise<any> {
    const { cipherText, encryptedMessage } = encryptedData
    let sharedSecret
    try {
      sharedSecret = ml_kem768.decapsulate(this.deserializeKey(cipherText), this.privkey)
    } catch (e) {
      console.error('Wallet::decryptMessage() - Decapsulation failed', e)
      console.info('Wallet::decryptMessage() - my public key', this.pubkey)
      return null
    }
    let deserializedEncryptedMessage
    try {
      deserializedEncryptedMessage = this.deserializeKey(encryptedMessage)
    } catch (e) {
      console.warn('Wallet::decryptMessage() - Deserialization failed', e)
      console.info('Wallet::decryptMessage() - my public key', this.pubkey)
      console.info('Wallet::decryptMessage() - our shared secret', sharedSecret)
      return null
    }
    let decryptedUint8
    try {
      decryptedUint8 = await this.decryptWithSharedSecret(deserializedEncryptedMessage, sharedSecret)
    } catch (e) {
      console.warn('Wallet::decryptMessage() - Decryption failed', e)
      console.info('Wallet::decryptMessage() - my public key', this.pubkey)
      console.info('Wallet::decryptMessage() - our shared secret', sharedSecret)
      console.info('Wallet::decryptMessage() - deserialized encrypted message', deserializedEncryptedMessage)
      return null
    }
    let decryptedString
    try {
      decryptedString = new TextDecoder().decode(decryptedUint8)
    } catch (e) {
      console.warn('Wallet::decryptMessage() - Decoding failed', e)
      console.info('Wallet::decryptMessage() - my public key', this.pubkey)
      console.info('Wallet::decryptMessage() - our shared secret', sharedSecret)
      console.info('Wallet::decryptMessage() - deserialized encrypted message', deserializedEncryptedMessage)
      console.info('Wallet::decryptMessage() - decrypted Uint8Array', decryptedUint8)
      return null
    }
    return JSON.parse(decryptedString)
  }

  // =============================================================================
  // SYMMETRIC ENCRYPTION HELPERS (AES-GCM with shared secret)
  // =============================================================================

  /**
   * Encrypt data using AES-GCM with the given shared secret
   */
  private async encryptWithSharedSecret(message: Uint8Array, sharedSecret: Uint8Array): Promise<Uint8Array> {
    // Generate random IV for AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    // Import shared secret as CryptoKey
    const key = await crypto.subtle.importKey(
      'raw',
      sharedSecret as BufferSource,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    )
    
    // Encrypt the message
    const encryptedContent = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      message as BufferSource
    )
    
    // Combine IV and encrypted content
    const result = new Uint8Array(iv.length + encryptedContent.byteLength)
    result.set(iv)
    result.set(new Uint8Array(encryptedContent), iv.length)
    
    return result
  }

  /**
   * Decrypt data using AES-GCM with the given shared secret
   */
  private async decryptWithSharedSecret(encryptedMessage: Uint8Array, sharedSecret: Uint8Array): Promise<Uint8Array> {
    // Extract IV from the encrypted message
    const iv = encryptedMessage.slice(0, 12)
    const ciphertext = encryptedMessage.slice(12)
    
    // Import shared secret as CryptoKey
    const key = await crypto.subtle.importKey(
      'raw',
      sharedSecret as BufferSource,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )
    
    // Decrypt the message
    const decryptedContent = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext as BufferSource
    )
    
    return new Uint8Array(decryptedContent)
  }

  serializeKey(key: Uint8Array): string {
    return btoa(String.fromCharCode(...key))
  }

  deserializeKey(serializedKey: string): Uint8Array {
    const binaryString = atob(serializedKey)
    return new Uint8Array([...binaryString].map(char => char.charCodeAt(0)))
  }
}