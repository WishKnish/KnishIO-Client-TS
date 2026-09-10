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
import { randomString, chunkSubstr, isHex } from '@/libraries/strings'
import { generateBundleHash, generateSecret, shake256, generateBatchId } from '@/libraries/crypto'
import WalletCredentialException from '@/exception/WalletCredentialException'
import { isBundleHash } from '@/types'
import TokenUnit from '@/core/TokenUnit'
// Post-quantum cryptography for ML-KEM key encapsulation
import { ml_kem768, ml_kem1024 } from '@noble/post-quantum/ml-kem.js'

const ML_KEM_PARAMS = {
  1024: { kem: ml_kem1024, pkBytes: 1568, skBytes: 3168, ctBytes: 1568 },
  768: { kem: ml_kem768, pkBytes: 1184, skBytes: 2400, ctBytes: 1088 }
} as const
const DEFAULT_ML_KEM_PARAMETER_SET = 1024

type MlKemParams = (typeof ML_KEM_PARAMS)[1024 | 768]
type MlKemKeypair = { pubkey: string; privkey: Uint8Array; params: MlKemParams }

/**
 * Wallet class - Identity and key management for KnishIO DLT
 * Essential implementation for transaction operations
 */
export default class Wallet {
  public token: string
  public balance: string
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
  public mlKemParameterSet: 1024 | 768

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
    characters = null,
    mlKemParameterSet = DEFAULT_ML_KEM_PARAMETER_SET
  }: {
    secret?: string | null
    bundle?: string | null
    token?: string
    address?: string | null
    position?: string | null
    batchId?: string | null
    characters?: string | null
    mlKemParameterSet?: 1024 | 768
  } = {}) {
    const paramSetNum = Number(mlKemParameterSet) as 1024 | 768
    if (!ML_KEM_PARAMS[paramSetNum]) {
      throw new Error(`KnishIO: unsupported ML-KEM parameter set ${mlKemParameterSet}; expected 1024 or 768.`)
    }
    this.mlKemParameterSet = paramSetNum
    this.token = token
    this.balance = '0'
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
      
      // Initialize ML-KEM keys (matches JavaScript SDK)
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
    characters = null,
    mlKemParameterSet = DEFAULT_ML_KEM_PARAMETER_SET
  }: {
    secret?: string | null
    bundle?: string | null
    token?: string
    batchId?: string | null
    characters?: string | null
    mlKemParameterSet?: 1024 | 768
  }): Wallet {
    let position: string | null = null

    // No credentials parameters provided?
    if (!secret && !bundle) {
      throw new WalletCredentialException()
    }

    // Secret, but no bundle?
    if (secret && !bundle) {
      position = Wallet.generatePosition()
      bundle = generateBundleHash(secret, 'Wallet::create')
    }

    // Wallet initialization (matching JS SDK exactly)
    // Bundle-only wallets (shadow) get no position/address generation
    return new Wallet({
      secret,
      bundle,
      token,
      position,
      batchId,
      characters,
      mlKemParameterSet
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
    // Normalize non-hex secret/position via SHAKE256 (matching JS/Rust SDKs)
    const secretHex = isHex(secret) ? secret : shake256(secret, 1024)
    const positionHex = isHex(position) ? position : shake256(position, 256)

    // Converting secret to bigInt
    const bigIntSecret = BigInt(`0x${secretHex}`)

    // Adding new position to the user secret to produce the indexed key
    const indexedKey = bigIntSecret + BigInt(`0x${positionHex}`)
    
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
   * Map raw token-unit tuples to TokenUnit instances.
   * Matches JS SDK Wallet.getTokenUnits (Wallet.js:190-196). The serialised shape reaches hashed
   * atom meta via AtomMeta.setAtomWallet -> JSON.stringify(getTokenUnitsData()), so returning raw
   * tuples here would diverge from every other SDK.
   */
  static getTokenUnits(unitsData: Array<[string, string, Record<string, any>?]>): TokenUnit[] {
    return unitsData.map(unitData => TokenUnit.createFromDB(unitData))
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
   * Split token units across MULTIPLE recipients (N-way sibling of splitUnits).
   *
   * The source retains the SENT union (all units leaving), each recipient gets its own
   * subset, and the remainder keeps the KEPT units (those not assigned to any recipient).
   * recipientUnitLists is parallel to recipientWallets. No-op when no units are sent.
   *
   * @param recipientUnitLists - per-recipient arrays of token unit IDs (parallel to recipientWallets)
   * @param recipientWallets - destination wallets
   * @param remainderWallet - wallet to receive the KEPT units
   */
  splitUnitsMulti(
    recipientUnitLists: string[][],
    recipientWallets: Wallet[],
    remainderWallet: Wallet
  ): void {
    const sentIds = new Set<string>(recipientUnitLists.flat())

    // Nothing to split (fungible transfer) — leave token units untouched
    if (sentIds.size === 0) {
      return
    }

    // Each recipient gets its own subset of the source's token units
    recipientWallets.forEach((recipientWallet, i) => {
      const ids = recipientUnitLists[i] ?? []
      recipientWallet.tokenUnits = this.tokenUnits.filter(tokenUnit => ids.includes(tokenUnit.id))
    })

    // The remainder keeps everything not sent to any recipient (KEPT)
    remainderWallet.tokenUnits = this.tokenUnits.filter(tokenUnit => !sentIds.has(tokenUnit.id))

    // The source carries the SENT union (the ownership authority the validator reads)
    this.tokenUnits = this.tokenUnits.filter(tokenUnit => sentIds.has(tokenUnit.id))
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
  // POST-QUANTUM CRYPTOGRAPHY - ML-KEM INTEGRATION
  // =============================================================================

  /**
   * Derive an ML-KEM keypair for an arbitrary parameter set from the wallet's key seed,
   * without mutating the wallet. The 64-byte `d‖z` seed takes no parameter-set input — only
   * the final `keygen` call differs — so one KnishIO wallet owns both an ML-KEM-768 and an
   * ML-KEM-1024 identity and either can be reconstructed on demand.
   *
   * Returns `null` when the wallet holds no key — a secret-less wallet, which is what a molecule
   * deserializer builds for validation context. `generateSecret(null, …)` does NOT throw, so
   * without this the wallet would derive a plausible-looking identity from a bogus seed and fail
   * three layers down at AES-GCM instead of at the missing key. The guard lives here rather than
   * at each call site so a new caller cannot miss it.
   *
   * @param parameterSet - 1024 or 768
   */
  private deriveMlKemKeypair(parameterSet: 1024 | 768): MlKemKeypair | null {
    const params = ML_KEM_PARAMS[parameterSet]
    if (!params) {
      throw new Error(`KnishIO: unsupported ML-KEM parameter set ${parameterSet}; expected 1024 or 768.`)
    }
    if (!this.key) {
      return null
    }
    // Generate a 64-byte (512-bit) seed from the Knish.IO private key
    // Use deterministic approach: generateSecret(key, 128) → 128 hex chars = 64 bytes
    const seedHex = generateSecret(this.key, 128)  // 128 hex chars = 64 bytes, matches JS SDK

    // Convert the hex string to a Uint8Array
    const seed = new Uint8Array(64)
    for (let i = 0; i < 64; i++) {
      seed[i] = parseInt(seedHex.substr(i * 2, 2), 16)
    }

    const { publicKey, secretKey } = params.kem.keygen(seed)
    return {
      pubkey: this.serializeKey(publicKey),
      privkey: secretKey,
      params
    }
  }

  /**
   * ML-KEM parameter set implied by a serialized public key's raw byte length. FIPS 203's key
   * lengths are disjoint (1568 bytes → ML-KEM-1024, 1184 bytes → ML-KEM-768), so a stored peer
   * key recovers the parameter set of the session it belongs to without a wire-format change.
   * Used by AuthToken.restore to resolve a snapshot that predates the field.
   *
   * @param pubkey - Base64-serialized ML-KEM public key
   * @return 1024, 768, or null when the length matches neither
   */
  static mlKemParameterSetFromPubkey(pubkey: string | null | undefined): 1024 | 768 | null {
    if (!pubkey) {
      return null
    }
    let byteLength: number
    try {
      byteLength = typeof Buffer !== 'undefined'
        ? Buffer.from(pubkey, 'base64').length
        : atob(pubkey).length
    } catch {
      return null
    }
    if (byteLength === ML_KEM_PARAMS[1024].pkBytes) {
      return 1024
    }
    if (byteLength === ML_KEM_PARAMS[768].pkBytes) {
      return 768
    }
    return null
  }

  /**
   * Initializes the ML-KEM key pair (matches JavaScript SDK exactly). Only ever reached from the
   * constructor's `secret` branch, so the derivation cannot come back empty here.
   */
  initializeMLKEM(): void {
    const derived = this.deriveMlKemKeypair(this.mlKemParameterSet)
    if (!derived) {
      return
    }
    this.pubkey = derived.pubkey
    this.privkey = derived.privkey // Note: We're keeping privkey as UInt8Array for security
  }


  // =============================================================================
  // HIGH-LEVEL MESSAGE ENCRYPTION (JavaScript SDK Compatibility)
  // =============================================================================

  async encryptMessage(message: any, recipientPubkey: string): Promise<{ cipherText: string; encryptedMessage: string }> {
    const messageString = JSON.stringify(message)
    const messageUint8 = new TextEncoder().encode(messageString)
    const deserializedPubkey = this.deserializeKey(recipientPubkey)
    // ML-KEM public keys are exactly the configured parameter set's length — 1568 bytes for
    // ML-KEM-1024, 1184 bytes for ML-KEM-768. A wrong-length key here almost always means the
    // node did not advertise an ML-KEM public key in its auth `key` field (e.g. a validator
    // predating the PQ-transport build). Fail with an actionable message rather than @noble's
    // cryptic `"publicKey" expected Uint8Array of length N, got length=M` assertion.
    const params = ML_KEM_PARAMS[this.mlKemParameterSet]
    if (deserializedPubkey.length !== params.pkBytes) {
      throw new Error(
        `KnishIO: cannot ML-KEM-encrypt — recipient public key is ${deserializedPubkey.length} bytes, ` +
        `expected ${params.pkBytes} (ML-KEM-${this.mlKemParameterSet}). The peer is not running ML-KEM-${this.mlKemParameterSet}; ` +
        'upgrade the peer, or step this client back to the other parameter set.'
      )
    }
    const { cipherText, sharedSecret } = params.kem.encapsulate(deserializedPubkey)
    const encryptedMessage = await this.encryptWithSharedSecret(messageUint8, sharedSecret)
    return {
      cipherText: this.serializeKey(cipherText),
      encryptedMessage: this.serializeKey(encryptedMessage)
    }
  }

  async decryptMessage(encryptedData: { cipherText: string; encryptedMessage: string }): Promise<any> {
    const decryptedString = await this._mlkemDecryptToString(encryptedData)
    return decryptedString === null ? null : JSON.parse(decryptedString)
  }

  /**
   * ML-KEM decapsulate + AES-256-GCM decrypt → the RAW decrypted UTF-8 string (no JSON.parse).
   * Shared by {@link decryptMessage} (which JSON.parses the result) and the PQ CipherHash transport
   * ({@link decryptMyMessageML}, which needs the raw response JSON text). PQ-transport Phase E.
   */
  async _mlkemDecryptToString(encryptedData: { cipherText: string; encryptedMessage: string }): Promise<string | null> {
    const { cipherText, encryptedMessage } = encryptedData
    const configuredParams = ML_KEM_PARAMS[this.mlKemParameterSet]
    const otherSet: 1024 | 768 = this.mlKemParameterSet === 1024 ? 768 : 1024
    const deserializedCipherText = this.deserializeKey(cipherText)

    // Inbound is PERMISSIVE: a ciphertext at either parameter set decrypts, provided it is addressed
    // to one of THIS wallet's own ML-KEM identities. The 64-byte seed is parameter-set-independent,
    // so the other identity is derived on demand and its private key is released with this call's
    // scope — never cached on the wallet. Outbound encapsulation stays STRICT (see encryptMessage);
    // reading a 768 record we own downgrades nothing, but encapsulating at 768 would.
    let params: MlKemParams = configuredParams
    let decapsPrivkey: Uint8Array = this.privkey
    if (deserializedCipherText.length !== configuredParams.ctBytes) {
      if (deserializedCipherText.length !== ML_KEM_PARAMS[otherSet].ctBytes) {
        console.error(
          `Wallet::decryptMessage() - Ciphertext length mismatch: got ${deserializedCipherText.length}, expected ${configuredParams.ctBytes}`
        )
        return null
      }
      // `null` here means the wallet holds no key to derive from (a secret-less validation
      // wallet); preserve the existing failure observable rather than decapsulating with nothing.
      const derived = this.deriveMlKemKeypair(otherSet)
      if (!derived) {
        console.error(
          `Wallet::decryptMessage() - cannot derive the ML-KEM-${otherSet} identity: wallet has no key`
        )
        return null
      }
      params = derived.params
      decapsPrivkey = derived.privkey
    }

    let sharedSecret
    try {
      sharedSecret = params.kem.decapsulate(deserializedCipherText, decapsPrivkey)
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
    try {
      return new TextDecoder().decode(decryptedUint8)
    } catch (e) {
      console.warn('Wallet::decryptMessage() - Decoding failed', e)
      console.info('Wallet::decryptMessage() - my public key', this.pubkey)
      console.info('Wallet::decryptMessage() - our shared secret', sharedSecret)
      console.info('Wallet::decryptMessage() - deserialized encrypted message', deserializedEncryptedMessage)
      console.info('Wallet::decryptMessage() - decrypted Uint8Array', decryptedUint8)
      return null
    }
  }

  /**
   * Canonical cross-SDK hashShare for a public key: standard base64 of SHAKE256(pubkey_utf8, 8 bytes)
   * — byte-matches the validator's hash_share and the JS/Kotlin/PHP hashShare. `shake256(pubkey, 64)`
   * = 64 bits = 8 bytes (hex) → hex-decode → standard base64 via serializeKey. PQ-transport Phase E.
   */
  hashShare(pubkey: string): string {
    const hex = shake256(pubkey, 64)
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
    }
    return this.serializeKey(bytes)
  }

  /**
   * Post-quantum (ML-KEM) CipherHash request envelope: a stringified single-recipient map
   * `{ "<hashShare(recipientPubkey)>": {cipherText, encryptedMessage} }` (object-valued, via
   * {@link encryptMessage}). Matches the Rust validator's CipherHash handler. PQ-transport Phase E.
   */
  async encryptStringML(message: any, recipientPubkey: string): Promise<string> {
    const envelope = await this.encryptMessage(message, recipientPubkey)
    return JSON.stringify({ [this.hashShare(recipientPubkey)]: envelope })
  }

  /**
   * Decrypt a CipherHash response map addressed to THIS wallet's ML-KEM pubkey
   * (`hashShare(this.pubkey)`) → the RAW decrypted GraphQL response JSON text (NOT JSON.parsed;
   * it replaces the HTTP response body for the normal parser). `null` if no entry / decrypt fails.
   *
   * A pre-bump peer addressed its envelope to `hashShare(our_768_pubkey)`, which a wallet
   * configured at ML-KEM-1024 would never find — so the other identity's share is tried too.
   * Without this, the permissive length dispatch in {@link _mlkemDecryptToString} is
   * unreachable on the transport path.
   */
  async decryptMyMessageML(map: Record<string, { cipherText: string; encryptedMessage: string }>): Promise<string | null> {
    let envelope = map[this.hashShare(this.pubkey)]
    if (!envelope) {
      // A secret-less wallet derives nothing, so the lookup is simply skipped.
      const otherSet: 1024 | 768 = this.mlKemParameterSet === 1024 ? 768 : 1024
      const other = this.deriveMlKemKeypair(otherSet)
      if (other) {
        envelope = map[this.hashShare(other.pubkey)]
      }
    }
    if (!envelope) {
      return null
    }
    return this._mlkemDecryptToString(envelope)
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
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(key).toString('base64')
    }
    // A single String.fromCharCode(...key) spread overflows the call stack once the
    // payload exceeds the engine's argument limit (~64K), so convert in chunks.
    let binary = ''
    const CHUNK_SIZE = 0x8000
    for (let i = 0; i < key.length; i += CHUNK_SIZE) {
      binary += String.fromCharCode(...key.subarray(i, i + CHUNK_SIZE))
    }
    return btoa(binary)
  }

  deserializeKey(serializedKey: string): Uint8Array {
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(serializedKey, 'base64'))
    }
    // Spreading the binary string ([...str]) allocates one single-char string per
    // byte — prohibitive for multi-MB payloads. Index directly instead.
    const binaryString = atob(serializedKey)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }
}