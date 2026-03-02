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

import Atom from './Atom'
import AtomMeta from './AtomMeta'
import Wallet from './Wallet'
import Rule from '@/instance/rules/Rule'
import CheckMolecule from '@/libraries/CheckMolecule'
import { chunkSubstr, hexToBase64 } from '@/libraries/strings'
import { generateBundleHash, generateBatchId, generateOTSSignature } from '@/libraries/crypto'
import versions from '@/versions'
import {
  AtomsMissingException,
  BalanceInsufficientException,
  NegativeAmountException,
  SignatureMalformedException
} from '@/exception'
import type { AtomIsotope } from '@/types'

/**
 * Molecule class - Transaction container for KnishIO DLT
 * Essential implementation for basic transactions
 */
export default class Molecule {
  public status: string | null
  public molecularHash: string | null
  public createdAt: string
  public cellSlugOrigin: string | null
  public cellSlug: string | null
  public secret: string | null
  public bundle: string | null
  public sourceWallet: Wallet | null
  public remainderWallet: Wallet | null
  public atoms: Atom[]
  public version: string | null | undefined
  public continuIdPosition: string | null
  public parentHashes: string[]
  public local?: number

  /**
   * Create new Molecule instance
   * Matches JavaScript SDK constructor signature
   */
  constructor({
    secret = null,
    bundle = null,
    sourceWallet = null,
    remainderWallet = null,
    cellSlug = null,
    version = null,
    continuIdPosition = null
  }: {
    secret?: string | null
    bundle?: string | null
    sourceWallet?: Wallet | null
    remainderWallet?: Wallet | null
    cellSlug?: string | null
    version?: string | number | null
    continuIdPosition?: string | null
  } = {}) {
    this.status = null
    this.molecularHash = null
    this.createdAt = String(+new Date())
    this.cellSlugOrigin = this.cellSlug = cellSlug
    this.secret = secret
    this.bundle = bundle
    this.sourceWallet = sourceWallet
    this.continuIdPosition = continuIdPosition
    this.atoms = []
    this.parentHashes = []

    const versionRegistry = versions as Record<string | number, any>
    if (version !== null && Object.prototype.hasOwnProperty.call(versionRegistry, version)) {
      this.version = String(version)
    }
    // Only set version if it's a recognized version in the registry (matching JS SDK).
    // When version is not recognized, this.version stays undefined.
    // JSON.stringify omits undefined properties, so the server won't see a version field.

    // Set the remainder wallet for this transaction
    if (remainderWallet || sourceWallet) {
      this.remainderWallet = remainderWallet || Wallet.create({
        secret: secret!,
        bundle,
        token: sourceWallet!.token,
        batchId: sourceWallet!.batchId,
        characters: sourceWallet!.characters
      })
    } else {
      this.remainderWallet = null
    }
  }

  /**
   * Returns the cell slug delimiter
   */
  get cellSlugDelimiter(): string {
    return '.'
  }

  /**
   * Filters atoms by isotope(s)
   * Matches JavaScript SDK getIsotopes method
   */
  getIsotopes(isotopes: AtomIsotope | AtomIsotope[]): Atom[] {
    return Molecule.isotopeFilter(isotopes, this.atoms)
  }

  /**
   * Filters the atoms array by the supplied isotope list
   * Static version matching JavaScript SDK
   */
  static isotopeFilter(isotopes: AtomIsotope | AtomIsotope[], atoms: Atom[]): Atom[] {
    if (!Array.isArray(isotopes)) {
      isotopes = [isotopes]
    }
    return atoms.filter(atom => atom.isotope !== null && isotopes.includes(atom.isotope))
  }

  /**
   * Generates the next atomic index
   */
  static generateNextAtomIndex(atoms: Atom[]): number {
    return atoms.length
  }

  /**
   * Generates the next atomic index for this molecule
   */
  generateIndex(): number {
    return Molecule.generateNextAtomIndex(this.atoms)
  }

  /**
   * Add an atom to this molecule
   * Matches JavaScript SDK addAtom method
   */
  addAtom(atom: Atom): Molecule {
    // Reset the molecular hash
    this.molecularHash = null

    // Set atom's index
    atom.index = this.generateIndex()
    atom.version = this.version ?? undefined

    // Add atom
    this.atoms.push(atom)

    // Sort atoms
    this.atoms = Atom.sortAtoms(this.atoms)

    return this
  }

  /**
   * Add user remainder atom for ContinuID
   * Matches JavaScript SDK addContinuIdAtom exactly
   */
  addContinuIdAtom(): Molecule {
    // If remainder wallet is not USER token, create a new USER remainder wallet
    if (!this.remainderWallet || this.remainderWallet.token !== 'USER') {
      this.remainderWallet = Wallet.create({
        secret: this.secret!,
        bundle: this.bundle!
      })
    }

    // ContinuID metadata for chain integrity validation
    const continuIdMeta: Record<string, any> = {}

    // previousPosition: the current USER ContinuID position being consumed.
    // For non-USER source wallets (V/B isotopes), use the explicitly passed
    // continuIdPosition from createMolecule() instead of the TOKEN wallet position.
    if (this.continuIdPosition) {
      continuIdMeta.previousPosition = this.continuIdPosition
    } else if (this.sourceWallet && this.sourceWallet.position) {
      continuIdMeta.previousPosition = this.sourceWallet.position
    }

    // pubkey: ML-KEM public key for encrypted communication
    if (this.remainderWallet.pubkey) {
      continuIdMeta.pubkey = this.remainderWallet.pubkey
    }

    // characters: encoding format for the wallet
    if (this.remainderWallet.characters) {
      continuIdMeta.characters = this.remainderWallet.characters
    }

    this.addAtom(Atom.create({
      isotope: 'I',
      wallet: this.remainderWallet!,
      metaType: 'walletBundle',
      metaId: this.remainderWallet!.bundle!,
      meta: new AtomMeta(continuIdMeta)
    }))
    return this
  }

  /**
   * Add a policy R-isotope atom (matching JS SDK)
   */
  addPolicyAtom({
    metaType,
    metaId,
    meta = {},
    policy = {}
  }: {
    metaType: string
    metaId: string
    meta?: any
    policy?: Record<string, any>
  }): Molecule {
    const atomMeta = new AtomMeta(meta)
    atomMeta.addPolicy(policy)

    const wallet = Wallet.create({
      secret: this.secret!,
      bundle: this.sourceWallet!.bundle!,
      token: 'USER'
    })

    this.addAtom(Atom.create({
      wallet,
      isotope: 'R',
      metaType,
      metaId,
      meta: atomMeta
    }))
    return this
  }

  /**
   * Initialize a V-type molecule to transfer value
   * Essential method for basic transfers
   */
  initValue({
    recipientWallet,
    amount
  }: {
    recipientWallet: Wallet
    amount: number
  }): Molecule {
    if (!this.sourceWallet) {
      throw new Error('Source wallet required for value transfer')
    }

    if (Number(this.sourceWallet.balance) - amount < 0) {
      throw new BalanceInsufficientException()
    }

    // Initializing a new Atom to remove tokens from source (debit full balance)
    this.addAtom(Atom.create({
      isotope: 'V',
      wallet: this.sourceWallet,
      value: -Number(this.sourceWallet.balance)
    }))
    // Initializing a new Atom to add tokens to recipient
    this.addAtom(Atom.create({
      isotope: 'V',
      wallet: recipientWallet,
      value: amount,
      metaType: 'walletBundle',
      metaId: recipientWallet.bundle!
    }))
    // Initializing a remainder atom
    this.addAtom(Atom.create({
      isotope: 'V',
      wallet: this.remainderWallet!,
      value: Number(this.sourceWallet.balance) - amount,
      metaType: 'walletBundle',
      metaId: this.remainderWallet!.bundle!
    }))

    return this
  }

  /**
   * Sign the molecule with one-time signature
   * Matches JavaScript SDK sign method
   */
  sign({
    bundle = null,
    anonymous = false,
    compressed = true
  }: {
    bundle?: string | null
    anonymous?: boolean
    compressed?: boolean
  } = {}): string | null {
    // Do we have atoms?
    if (this.atoms.length === 0 || this.atoms.filter(atom => !(atom instanceof Atom)).length !== 0) {
      throw new AtomsMissingException()
    }

    // Derive the user's bundle
    if (!anonymous && !this.bundle) {
      this.bundle = bundle || generateBundleHash(this.secret!, 'Molecule::sign')
    }

    // Hash atoms to get molecular hash
    this.molecularHash = Atom.hashAtoms({
      atoms: this.atoms
    })

    // Signing atom
    const signingAtom = this.atoms[0]
    if (!signingAtom) {
      throw new SignatureMalformedException('No atoms available for signing!')
    }

    // Set signing position from the first atom
    let signingPosition = signingAtom.position

    // Get signing wallet from first atom's metas (matching JS SDK exactly)
    // This handles buffer withdraw reconciliation where a different wallet signs
    const signingWalletMeta = signingAtom.aggregatedMeta ? signingAtom.aggregatedMeta() : null
    const signingWalletJson = signingWalletMeta?.signingWallet as string | undefined
    if (signingWalletJson) {
      try {
        const parsedSigningWallet = JSON.parse(signingWalletJson)
        if (parsedSigningWallet.position) {
          signingPosition = parsedSigningWallet.position
        }
      } catch {
        // Invalid JSON in signingWallet meta, use default position
      }
    }

    // Signing position is required
    if (!signingPosition) {
      throw new SignatureMalformedException('Signing wallet must have a position!')
    }

    // Generate the private signing key for this molecule
    const key = Wallet.generateKey({
      secret: this.secret!,
      token: signingAtom.token as string,
      position: signingPosition
    })

    // Use standardized WOTS+ signature generation from crypto library
    // This ensures 100% compatibility with Implementation Guide requirements
    let signatureFragments = generateOTSSignature(key, this.molecularHash)

    // Compressing the OTS
    if (compressed) {
      signatureFragments = hexToBase64(signatureFragments)
    }

    // Chunking the signature across multiple atoms
    const chunkedSignature = chunkSubstr(signatureFragments, Math.ceil(signatureFragments.length / this.atoms.length))

    let lastPosition: string | null = null

    for (let chunkCount = 0, condition = chunkedSignature.length; chunkCount < condition; chunkCount++) {
      const atom = this.atoms[chunkCount]
      const signatureChunk = chunkedSignature[chunkCount]
      if (atom && signatureChunk) {
        atom.otsFragment = signatureChunk
        lastPosition = atom.position
      }
    }

    return lastPosition
  }

  /**
   * Validate the molecular structure
   * Uses CheckMolecule for validation
   * Matches JavaScript SDK check method exactly
   */
  check(senderWallet: Wallet | null = null): boolean {
    return (new CheckMolecule(this as any)).verify(senderWallet)
  }

  /**
   * Convert Hm to numeric notation via EnumerateMolecule(Hm)
   * Required by CheckMolecule for OTS validation
   */
  normalizedHash(): number[] {
    if (!this.molecularHash) {
      throw new Error('Molecular hash not set')
    }
    return Molecule.normalize(Molecule.enumerate(this.molecularHash))
  }

  /**
   * Enumerate a hash string to numeric values
   * Matches JavaScript SDK Molecule.enumerate exactly
   */
  static enumerate(hash: string): number[] {
    const mapped: Record<string, number> = {
      '0': -8,
      '1': -7,
      '2': -6,
      '3': -5,
      '4': -4,
      '5': -3,
      '6': -2,
      '7': -1,
      '8': 0,
      '9': 1,
      'a': 2,
      'b': 3,
      'c': 4,
      'd': 5,
      'e': 6,
      'f': 7,
      'g': 8
    }
    const target: number[] = []
    const hashList = hash.toLowerCase().split('')

    for (let index = 0, len = hashList.length; index < len; ++index) {
      const symbol = hashList[index]

      if (symbol && typeof mapped[symbol] !== 'undefined') {
        target[index] = mapped[symbol]!
      }
    }

    return target
  }

  /**
   * Normalize enumerated string to ensure sum equals zero
   * Matches JavaScript SDK Molecule.normalize exactly
   */
  static normalize(mappedHashArray: number[]): number[] {
    let total = mappedHashArray.reduce((total, num) => total + num)

    const totalCondition = total < 0

    while (total < 0 || total > 0) {
      for (const index of Object.keys(mappedHashArray)) {
        const idx = Number(index)
        const condition = totalCondition ? (mappedHashArray[idx] ?? 0) < 8 : (mappedHashArray[idx] ?? 0) > -8

        if (condition) {
          if (totalCondition) {
            mappedHashArray[idx] = (mappedHashArray[idx] ?? 0) + 1
            total++
          } else {
            mappedHashArray[idx] = (mappedHashArray[idx] ?? 0) - 1
            total--
          }

          if (total === 0) {
            break
          }
        }
      }
    }

    return mappedHashArray
  }

  /**
   * Returns JSON-ready object for cross-SDK compatibility (2025 TS best practices)
   * 
   * Includes all necessary fields for cross-SDK validation while excluding sensitive data.
   * Follows 2025 TypeScript best practices with proper error handling and type safety.
   *
   * @param options - Serialization options
   * @param options.includeValidationContext - Include sourceWallet/remainderWallet for validation (default: true)
   * @param options.includeOtsFragments - Include OTS signature fragments (default: true)
   * @param options.secureMode - Extra security checks (default: false)
   * @return JSON-serializable object
   * @throws Error if molecule is in invalid state for serialization
   */
  toJSON(options: {
    includeValidationContext?: boolean
    includeOtsFragments?: boolean
    secureMode?: boolean
  } = {}): any {
    const {
      includeValidationContext = false,
      includeOtsFragments = true,
      secureMode = false
    } = options

    try {
      // Security check in secure mode
      if (secureMode && this.secret) {
        throw new Error('Cannot serialize molecule with secret in secure mode')
      }

      // Core molecule properties (server-compatible fields only)
      const serialized: any = {
        status: this.status,
        molecularHash: this.molecularHash,
        createdAt: this.createdAt,
        cellSlug: this.cellSlug,
        bundle: this.bundle,

        // Serialized atoms array with optional OTS fragments
        atoms: this.atoms.map(atom => atom.toJSON({
          includeOtsFragments
        }))
      }

      // Parent molecular hashes for DAG linkage (only include when non-empty
      // to maintain backward compatibility with servers that don't support it)
      if (this.parentHashes && this.parentHashes.length > 0) {
        serialized.parentHashes = this.parentHashes
      }

      // Extended context for Rust validator and local validation
      if (includeValidationContext) {
        serialized.cellSlugOrigin = this.cellSlugOrigin
        serialized.version = this.version

        if (this.sourceWallet) {
          serialized.sourceWallet = {
            address: this.sourceWallet.address,
            position: this.sourceWallet.position,
            token: this.sourceWallet.token,
            balance: this.sourceWallet.balance || '0',
            bundle: this.sourceWallet.bundle,
            batchId: this.sourceWallet.batchId || null,
            characters: this.sourceWallet.characters || 'BASE64',
            // Exclude sensitive fields like secret, key, privkey
            pubkey: this.sourceWallet.pubkey || null,
            tokenUnits: this.sourceWallet.tokenUnits || [],
            tradeRates: this.sourceWallet.tradeRates || {},
            molecules: this.sourceWallet.molecules || {}
          }
        }

        if (this.remainderWallet) {
          serialized.remainderWallet = {
            address: this.remainderWallet.address,
            position: this.remainderWallet.position,
            token: this.remainderWallet.token,
            balance: this.remainderWallet.balance || '0',
            bundle: this.remainderWallet.bundle,
            batchId: this.remainderWallet.batchId || null,
            characters: this.remainderWallet.characters || 'BASE64',
            // Exclude sensitive fields
            pubkey: this.remainderWallet.pubkey || null,
            tokenUnits: this.remainderWallet.tokenUnits || [],
            tradeRates: this.remainderWallet.tradeRates || {},
            molecules: this.remainderWallet.molecules || {}
          }
        }
      }

      return serialized

    } catch (error) {
      throw new Error(`Molecule serialization failed: ${(error as Error).message}`)
    }
  }

  /**
   * Returns the base cell slug portion
   */
  cellSlugBase(): string {
    return (this.cellSlug || '').split(this.cellSlugDelimiter)[0] || ''
  }

  // =============================================================================
  // STUB METHODS - Implement as needed (YAGNI)
  // =============================================================================

  /**
   * Initialize token creation
   * Matches JavaScript SDK initTokenCreation implementation
   */
  initTokenCreation({
    recipientWallet,
    amount,
    meta
  }: {
    recipientWallet: Wallet
    amount: number
    meta: any
  }): Molecule {
    if (!this.sourceWallet) {
      throw new Error('Source wallet required for token creation')
    }

    // Build meta using AtomMeta class (matching JavaScript SDK exactly)
    const atomMeta = new AtomMeta(meta)
    atomMeta.setMetaWallet(recipientWallet)

    // The primary atom tells the ledger that a certain amount of the new token is being issued
    this.addAtom(Atom.create({
      isotope: 'C',
      wallet: this.sourceWallet,
      value: amount,
      metaType: 'token',
      metaId: recipientWallet.token,
      meta: atomMeta,
      batchId: recipientWallet.batchId
    }))

    // Add ContinuID atom (matching JavaScript SDK)
    this.addContinuIdAtom()

    return this
  }

  /**
   * Burn tokens
   */
  burnToken({
    amount,
    walletBundle: _walletBundle = null
  }: {
    amount: number
    walletBundle?: string | null
  }): Molecule {
    if (!this.sourceWallet) {
      throw new Error('Source wallet required for token burning')
    }
    
    if (amount < 0) {
      throw new NegativeAmountException('Molecule::burnToken() - Amount to burn must be positive!')
    }

    if (Number(this.sourceWallet.balance) - amount < 0) {
      throw new BalanceInsufficientException()
    }

    // Create burn address wallet (null bundle = token destruction)
    const burnWallet = new Wallet({
      bundle: '0000000000000000000000000000000000000000000000000000000000000000',
      token: this.sourceWallet.token
    })

    // V-atom 1: Debit full balance from source
    this.addAtom(Atom.create({
      isotope: 'V',
      wallet: this.sourceWallet,
      value: -Number(this.sourceWallet.balance)
    }))

    // V-atom 2: Credit burn amount to burn address
    this.addAtom(Atom.create({
      isotope: 'V',
      wallet: burnWallet,
      value: amount,
      metaType: 'walletBundle',
      metaId: burnWallet.bundle!
    }))

    // V-atom 3: Remainder back to source identity
    this.addAtom(Atom.create({
      isotope: 'V',
      wallet: this.remainderWallet!,
      value: Number(this.sourceWallet.balance) - amount,
      metaType: 'walletBundle',
      metaId: this.remainderWallet!.bundle!
    }))

    return this
  }

  /**
   * Initialize authorization request
   * Creates U-isotope (authorization) atom for requesting auth token
   * Matches JavaScript SDK Molecule.initAuthorization
   */
  initAuthorization({ meta }: { meta: Record<string, any> }): Molecule {
    if (!this.sourceWallet) {
      throw new Error('Source wallet required for authorization')
    }

    // Create U-isotope atom for authorization (matching JS SDK)
    this.addAtom(Atom.create({
      isotope: 'U',
      wallet: this.sourceWallet,
      meta: new AtomMeta(meta)
    }))

    // Add ContinuID atom (matching JavaScript SDK)
    this.addContinuIdAtom()

    return this
  }

  /**
   * Initialize meta
   */
  initMeta({
    meta,
    metaType,
    metaId,
    policy
  }: {
    meta: any
    metaType: string
    metaId: string
    policy?: any
  }): Molecule {
    if (!this.sourceWallet) {
      throw new Error('Source wallet required for meta creation')
    }
    
    // Initializing a new Atom to hold our metadata (matching JS SDK)
    this.addAtom(Atom.create({
      isotope: 'M',
      wallet: this.sourceWallet,
      metaType,
      metaId,
      meta: new AtomMeta(meta)
    }))

    // Only add policy atom if policy is provided and not empty
    if (policy && Object.keys(policy).length > 0) {
      this.addPolicyAtom({
        metaType,
        metaId,
        meta,
        policy
      })
    }

    // User remainder atom
    this.addContinuIdAtom()

    return this
  }

  /**
   * Initialize wallet creation
   * Uses source wallet for atom properties (matching JavaScript SDK)
   * The wallet being created is stored in metadata
   */
  initWalletCreation(wallet: Wallet, atomMeta: AtomMeta | null = null): Molecule {
    if (!this.sourceWallet) {
      throw new Error('Source wallet required for wallet creation')
    }

    // Matching JS SDK: use AtomMeta.setMetaWallet() for wallet metadata
    if (!atomMeta) {
      atomMeta = new AtomMeta()
    }
    atomMeta.setMetaWallet(wallet)

    const creationAtom = Atom.create({
      isotope: 'C',
      wallet: this.sourceWallet,
      metaType: 'wallet',
      metaId: wallet.address!,
      meta: atomMeta,
      batchId: wallet.batchId
    })
    this.addAtom(creationAtom)
    this.addContinuIdAtom()

    return this
  }

  /**
   * Creates atoms for rule definition
   * Matches JavaScript SDK Molecule.createRule method
   *
   * @param metaType - The meta type for the rule
   * @param metaId - The meta ID for the rule
   * @param rule - Array of Rule objects or rule data
   * @param policy - Optional policy object
   * @return This molecule instance for chaining
   */
  createRule({
    metaType,
    metaId,
    rule,
    policy = {}
  }: {
    metaType: string
    metaId: string
    rule: Rule[] | any[] | any  // Accept single object or array
    policy?: Record<string, any>
  }): Molecule {
    if (!this.sourceWallet) {
      throw new Error('Source wallet required for createRule')
    }

    // Normalize rule to array (accept single object or array)
    const ruleArray = Array.isArray(rule) ? rule : [rule]

    // Convert rules to objects (matching JavaScript SDK)
    const rules: Record<string, any>[] = []
    for (const r of ruleArray) {
      rules.push(r instanceof Rule ? r : Rule.toObject(r))
    }

    // Create atom meta with rules
    const atomMeta = new AtomMeta({
      rule: JSON.stringify(rules)
    })

    // Add policies to meta object only if policy exists and has keys (matching JS SDK)
    if (policy && Object.keys(policy).length > 0) {
      atomMeta.addPolicy(policy)
    }

    // Create R-isotope atom for rule (matching JS SDK)
    this.addAtom(Atom.create({
      isotope: 'R',
      wallet: this.sourceWallet,
      metaType,
      metaId,
      meta: atomMeta
    }))

    // Add ContinuID atom
    this.addContinuIdAtom()

    return this
  }

  /**
   * Initializes a token request molecule
   * Matches JavaScript SDK Molecule.initTokenRequest method
   *
   * @param token - Token slug to request
   * @param amount - Amount of tokens to request
   * @param metaType - Meta type (typically 'walletBundle')
   * @param metaId - Meta ID (typically recipient bundle hash)
   * @param meta - Optional additional metadata
   * @param batchId - Optional batch ID
   * @return This molecule instance for chaining
   */
  initTokenRequest({
    token,
    amount,
    metaType,
    metaId,
    meta = {},
    batchId = null
  }: {
    token: string
    amount: number
    metaType: string
    metaId: string
    meta?: Record<string, any>
    batchId?: string | null
  }): Molecule {
    if (!this.sourceWallet) {
      throw new Error('Source wallet required for initTokenRequest')
    }

    // Add token and amount to meta (matching JavaScript SDK exactly)
    const metaWithToken = { ...meta, token, amount: String(amount) }

    // Mark as local molecule
    this.local = 1

    // Create T-isotope atom for token request (matching JS SDK)
    this.addAtom(Atom.create({
      isotope: 'T',
      wallet: this.sourceWallet,
      value: amount,
      metaType,
      metaId,
      meta: new AtomMeta(metaWithToken),
      batchId
    }))

    // Add ContinuID atom
    this.addContinuIdAtom()

    return this
  }

  /**
   * Creates a Molecule instance from JSON data (2025 TS best practices)
   * 
   * Handles cross-SDK deserialization with robust error handling and validation.
   * Essential for cross-platform molecule validation and compatibility testing.
   *
   * @param json - JSON string or object to deserialize
   * @param options - Deserialization options
   * @param options.includeValidationContext - Reconstruct sourceWallet/remainderWallet (default: true)
   * @param options.validateStructure - Validate required fields (default: true)
   * @param options.strictMode - Strict validation mode (default: false)
   * @return Reconstructed molecule instance
   * @throws Error if JSON is invalid or required fields are missing
   */
  static fromJSON(json: string | any, options: {
    includeValidationContext?: boolean
    validateStructure?: boolean
    strictMode?: boolean
  } = {}): Molecule {
    const {
      includeValidationContext = true,
      validateStructure = true,
      strictMode = false
    } = options

    try {
      // Parse JSON safely
      const data = typeof json === 'string' ? JSON.parse(json) : json

      // Validate required fields in strict mode
      if (strictMode || validateStructure) {
        if (!data.molecularHash || !Array.isArray(data.atoms)) {
          throw new Error('Invalid molecule data: missing molecularHash or atoms array')
        }
      }

      // Create minimal molecule instance (never include secret from JSON)
      const molecule = new Molecule({
        secret: null,
        bundle: data.bundle || null,
        cellSlug: data.cellSlug || null,
        version: data.version || null
      })

      // Populate core properties
      molecule.status = data.status
      molecule.molecularHash = data.molecularHash
      molecule.createdAt = data.createdAt || String(+new Date())
      molecule.cellSlugOrigin = data.cellSlugOrigin

      // Reconstruct atoms array with proper Atom instances
      if (Array.isArray(data.atoms)) {
        molecule.atoms = data.atoms.map((atomData: any, index: number) => {
          try {
            return Atom.fromJSON(atomData)
          } catch (error) {
            throw new Error(`Failed to reconstruct atom ${index}: ${(error as Error).message}`)
          }
        })
      }

      // Reconstruct parent hashes for DAG linkage
      molecule.parentHashes = Array.isArray(data.parentHashes) ? [...data.parentHashes] : []

      // Reconstruct validation context if available and requested
      if (includeValidationContext) {
        if (data.sourceWallet) {
          // Create source wallet for validation (without secret for security)
          molecule.sourceWallet = new Wallet({
            secret: null,
            token: data.sourceWallet.token,
            position: data.sourceWallet.position,
            bundle: data.sourceWallet.bundle,
            batchId: data.sourceWallet.batchId,
            characters: data.sourceWallet.characters
          })
          
          // Set additional properties for validation context
          molecule.sourceWallet.balance = String(data.sourceWallet.balance != null ? data.sourceWallet.balance : 0)
          molecule.sourceWallet.address = data.sourceWallet.address as any
          if (data.sourceWallet.pubkey) {
            molecule.sourceWallet.pubkey = data.sourceWallet.pubkey
          }
          molecule.sourceWallet.tokenUnits = data.sourceWallet.tokenUnits || []
          molecule.sourceWallet.tradeRates = data.sourceWallet.tradeRates || {}
          molecule.sourceWallet.molecules = data.sourceWallet.molecules || {}
        }

        if (data.remainderWallet) {
          // Create remainder wallet for validation (without secret for security)
          molecule.remainderWallet = new Wallet({
            secret: null,
            token: data.remainderWallet.token,
            position: data.remainderWallet.position,
            bundle: data.remainderWallet.bundle,
            batchId: data.remainderWallet.batchId,
            characters: data.remainderWallet.characters
          })
          
          // Set additional properties for validation context
          molecule.remainderWallet.balance = String(data.remainderWallet.balance != null ? data.remainderWallet.balance : 0)
          molecule.remainderWallet.address = data.remainderWallet.address as any
          if (data.remainderWallet.pubkey) {
            molecule.remainderWallet.pubkey = data.remainderWallet.pubkey
          }
          molecule.remainderWallet.tokenUnits = data.remainderWallet.tokenUnits || []
          molecule.remainderWallet.tradeRates = data.remainderWallet.tradeRates || {}
          molecule.remainderWallet.molecules = data.remainderWallet.molecules || {}
        }
      }

      return molecule

    } catch (error) {
      throw new Error(`Molecule deserialization failed: ${(error as Error).message}`)
    }
  }

  /**
   * Convert JSON to Molecule instance - legacy method for compatibility
   */
  static jsonToObject(json: string): Molecule {
    return Molecule.fromJSON(json)
  }

  // =============================================================================
  // ISOTOPE INIT METHODS - MATCHING JAVASCRIPT SDK PARITY
  // =============================================================================

  /**
   * Initialize a P-type molecule for peer registration
   * Matches JavaScript SDK Molecule.initPeering implementation exactly
   *
   * @param host - The peer host URL to register
   * @return This molecule instance for chaining
   */
  initPeering({ host }: { host: string }): Molecule {
    if (!this.sourceWallet) {
      throw new Error('Source wallet required for peer registration')
    }

    this.addAtom(Atom.create({
      isotope: 'P',
      wallet: this.sourceWallet,
      metaType: 'walletBundle',
      metaId: this.bundle!,
      meta: new AtomMeta({ peerHost: host })
    }))

    this.addContinuIdAtom()

    return this
  }

  /**
   * Initialize an A-type molecule for an append request
   * Matches JavaScript SDK Molecule.initAppendRequest implementation exactly
   *
   * @param metaType - The target MetaType to append to
   * @param metaId - The target MetaId to append to
   * @param action - The action to perform
   * @param meta - Additional metadata
   * @return This molecule instance for chaining
   */
  initAppendRequest({
    metaType,
    metaId,
    action,
    meta = {}
  }: {
    metaType: string
    metaId: string
    action: string
    meta?: Record<string, any>
  }): Molecule {
    if (!this.sourceWallet) {
      throw new Error('Source wallet required for append request')
    }

    this.addAtom(Atom.create({
      isotope: 'A',
      wallet: this.sourceWallet,
      metaType,
      metaId,
      meta: new AtomMeta({ action, ...meta })
    }))

    this.addContinuIdAtom()

    return this
  }

  /**
   * Initialize a deposit buffer operation (B-isotope)
   * Matches JavaScript SDK Molecule.initDepositBuffer implementation exactly
   *
   * @param amount - Amount to deposit into buffer
   * @param tradeRates - Trade rates for the buffer wallet
   * @return This molecule instance for chaining
   */
  initDepositBuffer({
    amount,
    tradeRates
  }: {
    amount: number
    tradeRates?: Record<string, any>
  }): Molecule {
    if (!this.sourceWallet) {
      throw new Error('Source wallet required for buffer deposit')
    }

    if (Number(this.sourceWallet.balance) - amount < 0) {
      throw new BalanceInsufficientException()
    }

    // Create a buffer wallet
    const bufferWallet = Wallet.create({
      secret: this.secret!,
      bundle: this.bundle,
      token: this.sourceWallet.token,
      batchId: this.sourceWallet.batchId
    })
    if (tradeRates) {
      bufferWallet.tradeRates = tradeRates
    }

    // Debit full balance from source (V-isotope)
    this.addAtom(Atom.create({
      isotope: 'V',
      wallet: this.sourceWallet,
      value: -Number(this.sourceWallet.balance)
    }))

    // Deposit amount to buffer (B-isotope)
    this.addAtom(Atom.create({
      isotope: 'B',
      wallet: bufferWallet,
      value: amount,
      metaType: 'walletBundle',
      metaId: this.sourceWallet.bundle!
    }))

    // Remainder back to source
    this.addAtom(Atom.create({
      isotope: 'V',
      wallet: this.remainderWallet!,
      value: Number(this.sourceWallet.balance) - amount,
      metaType: 'walletBundle',
      metaId: this.sourceWallet.bundle!
    }))

    return this
  }

  /**
   * Initialize a withdraw buffer operation (B-isotope)
   * Matches JavaScript SDK Molecule.initWithdrawBuffer implementation exactly
   *
   * @param recipients - Map of recipientBundle → amount
   * @param signingWallet - Optional signing wallet for reconciliation
   * @return This molecule instance for chaining
   */
  initWithdrawBuffer({
    recipients,
    signingWallet = null
  }: {
    recipients: Record<string, number>
    signingWallet?: any | null
  }): Molecule {
    if (!this.sourceWallet) {
      throw new Error('Source wallet required for buffer withdrawal')
    }

    // Calculate total from all recipients
    let amount = 0
    for (const recipientAmount of Object.values(recipients || {})) {
      amount += recipientAmount
    }

    if (Number(this.sourceWallet.balance) - amount < 0) {
      throw new BalanceInsufficientException()
    }

    // Set a meta signing position for molecule correct reconciliation
    const firstAtomMeta = new AtomMeta()
    if (signingWallet) {
      firstAtomMeta.setSigningWallet(signingWallet)
    }

    // Debit full balance from source (B-isotope)
    this.addAtom(Atom.create({
      isotope: 'B',
      wallet: this.sourceWallet,
      value: -Number(this.sourceWallet.balance),
      meta: firstAtomMeta,
      metaType: 'walletBundle',
      metaId: this.sourceWallet.bundle!
    }))

    // Add recipient V-atoms (matching JS SDK: uses `new Atom()` with explicit token)
    for (const [recipientBundle, recipientAmount] of Object.entries(recipients || {})) {
      this.addAtom(new Atom({
        isotope: 'V',
        token: this.sourceWallet.token,
        value: recipientAmount as number,
        batchId: this.sourceWallet.batchId ? generateBatchId({}) : null,
        metaType: 'walletBundle',
        metaId: recipientBundle
      }))
    }

    // Remainder back to buffer
    this.addAtom(Atom.create({
      isotope: 'B',
      wallet: this.remainderWallet!,
      value: Number(this.sourceWallet.balance) - amount,
      metaType: 'walletBundle',
      metaId: this.remainderWallet!.bundle!
    }))

    return this
  }

  /**
   * Initialize shadow wallet claim
   * Matches JavaScript SDK Molecule.initShadowWalletClaim implementation exactly
   *
   * @param wallet - The shadow wallet to claim
   * @return This molecule instance for chaining
   */
  initShadowWalletClaim(wallet: Wallet): Molecule {
    const atomMeta = new AtomMeta()
    atomMeta.setShadowWalletClaim(true)
    return this.initWalletCreation(wallet, atomMeta)
  }

  /**
   * Initialize identifier creation
   * Matches JavaScript SDK Molecule.initIdentifierCreation implementation exactly
   *
   * @param type - Identifier type (phone or email)
   * @param contact - Phone number or email string
   * @param code - Verification code
   * @return This molecule instance for chaining
   */
  initIdentifierCreation({
    type,
    contact,
    code
  }: {
    type: string
    contact: string
    code: string
  }): Molecule {
    if (!this.sourceWallet) {
      throw new Error('Source wallet required for identifier creation')
    }

    const meta = {
      code,
      hash: generateBundleHash(contact.trim(), 'Molecule::initIdentifierCreation')
    }

    this.addAtom(Atom.create({
      isotope: 'C',
      wallet: this.sourceWallet,
      metaType: 'identifier',
      metaId: type,
      meta: new AtomMeta(meta)
    }))

    this.addContinuIdAtom()

    return this
  }
}