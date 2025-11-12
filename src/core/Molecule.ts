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
import CheckMolecule from '@/libraries/CheckMolecule'
import { chunkSubstr, hexToBase64 } from '@/libraries/strings'
import { generateBundleHash, generateOTSSignature } from '@/libraries/crypto'
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
  public version: string | null
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
    version = null
  }: {
    secret?: string | null
    bundle?: string | null
    sourceWallet?: Wallet | null
    remainderWallet?: Wallet | null
    cellSlug?: string | null
    version?: string | number | null
  } = {}) {
    this.status = null
    this.molecularHash = null
    this.createdAt = String(+new Date())
    this.cellSlugOrigin = this.cellSlug = cellSlug
    this.secret = secret
    this.bundle = bundle
    this.sourceWallet = sourceWallet
    this.atoms = []
    
    if (version !== null) {
      this.version = String(version)
    } else {
      this.version = null
    }

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
    return atoms.filter(atom => isotopes.includes(atom.isotope))
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
    atom.version = this.version ? Number(this.version) : 4

    // Add atom
    this.atoms.push(atom)

    // Sort atoms
    this.atoms = Atom.sortAtoms(this.atoms)

    return this
  }

  /**
   * Add user remainder atom for ContinuID
   */
  addContinuIdAtom(): Molecule {
    if (!this.remainderWallet) {
      throw new Error('Remainder wallet required for ContinuID atom')
    }

    this.addAtom(new Atom({
      isotope: 'I',
      position: this.remainderWallet.position!,
      walletAddress: this.remainderWallet.address! as any,
      token: 'USER',
      metaType: 'walletBundle',
      metaId: this.remainderWallet.bundle!
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

    if (this.sourceWallet.balance - amount < 0) {
      throw new BalanceInsufficientException()
    }

    // Initializing a new Atom to remove entire balance from source (UTXO model)
    this.addAtom(new Atom({
      isotope: 'V',
      position: this.sourceWallet.position!,
      walletAddress: this.sourceWallet.address! as any,
      token: this.sourceWallet.token,
      value: -this.sourceWallet.balance
    }))

    // Initializing a new Atom to add tokens to recipient
    this.addAtom(new Atom({
      isotope: 'V',
      position: recipientWallet.position!,
      walletAddress: recipientWallet.address! as any,
      token: recipientWallet.token,
      value: amount,
      metaType: 'walletBundle',
      metaId: recipientWallet.bundle!
    }))

    // Initializing a remainder atom (matching JavaScript SDK - uses existing remainderWallet)
    if (!this.remainderWallet) {
      throw new Error('Remainder wallet required for value transfer')
    }
    
    this.addAtom(new Atom({
      isotope: 'V',
      position: this.remainderWallet.position!,
      walletAddress: this.remainderWallet.address! as any,
      token: this.remainderWallet.token,
      value: this.sourceWallet.balance - amount,
      metaType: 'walletBundle',
      metaId: this.remainderWallet.bundle!
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
      includeValidationContext = true,
      includeOtsFragments = true,
      secureMode = false
    } = options

    try {
      // Security check in secure mode
      if (secureMode && this.secret) {
        throw new Error('Cannot serialize molecule with secret in secure mode')
      }

      // Core molecule properties (always included)
      const serialized: any = {
        status: this.status,
        molecularHash: this.molecularHash,
        createdAt: this.createdAt,
        cellSlug: this.cellSlug,
        cellSlugOrigin: this.cellSlugOrigin,
        version: this.version,
        bundle: this.bundle,
        
        // Serialized atoms array with optional OTS fragments
        atoms: this.atoms.map(atom => atom.toJSON({ 
          includeOtsFragments 
        }))
      }

      // Validation context (essential for cross-SDK validation)
      if (includeValidationContext) {
        if (this.sourceWallet) {
          serialized.sourceWallet = {
            address: this.sourceWallet.address,
            position: this.sourceWallet.position,
            token: this.sourceWallet.token,
            balance: this.sourceWallet.balance || 0,
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
            balance: this.remainderWallet.balance || 0,
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
    // Create a new token by adding atoms
    this.addAtom(new Atom({
      isotope: 'T',
      position: recipientWallet.position!,
      walletAddress: recipientWallet.address! as any,
      token: recipientWallet.token,
      value: amount,
      metaType: 'token',
      metaId: recipientWallet.token,
      meta: meta ? [{ key: 'tokenMeta', value: JSON.stringify(meta) }] : []
    }))
    
    // Add wallet bundle metadata
    this.addAtom(new Atom({
      isotope: 'M',
      position: recipientWallet.position!,
      walletAddress: recipientWallet.address! as any,
      token: recipientWallet.token,
      metaType: 'walletBundle',
      metaId: recipientWallet.bundle!,
      meta: meta ? [{ key: 'tokenMeta', value: JSON.stringify(meta) }] : []
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
    walletBundle = null
  }: {
    amount: number
    walletBundle?: string | null
  }): Molecule {
    if (!this.sourceWallet) {
      throw new Error('Source wallet required for token burning')
    }
    
    if (amount <= 0) {
      throw new NegativeAmountException()
    }
    
    if (this.sourceWallet.balance - amount < 0) {
      throw new BalanceInsufficientException()
    }
    
    // Burn tokens by removing from source
    this.addAtom(new Atom({
      isotope: 'V',
      position: this.sourceWallet.position!,
      walletAddress: this.sourceWallet.address! as any,
      token: this.sourceWallet.token,
      value: -amount,
      metaType: walletBundle ? 'walletBundle' : null,
      metaId: walletBundle || null
    }))
    
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
    
    const metaArray: Array<{ key: string; value: any }> = []
    
    // Convert meta to array format
    if (meta) {
      if (Array.isArray(meta)) {
        metaArray.push(...meta)
      } else if (typeof meta === 'object') {
        for (const [key, value] of Object.entries(meta)) {
          metaArray.push({ key, value })
        }
      } else {
        metaArray.push({ key: 'value', value: meta })
      }
    }
    
    // Add policy if provided
    if (policy) {
      metaArray.push({ key: 'policy', value: JSON.stringify(policy) })
    }
    
    // Create meta atom
    this.addAtom(new Atom({
      isotope: 'M',
      position: this.sourceWallet.position!,
      walletAddress: this.sourceWallet.address! as any,
      token: this.sourceWallet.token,
      metaType,
      metaId,
      meta: metaArray
    }))
    
    // Add ContinuID atom (matching JavaScript SDK)
    this.addContinuIdAtom()
    
    return this
  }

  /**
   * Initialize wallet creation
   */
  initWalletCreation(wallet: Wallet, atomMeta: AtomMeta | null = null): Molecule {
    // Create wallet creation atom
    const atom = new Atom({
      isotope: 'C',
      position: wallet.position!,
      walletAddress: wallet.address! as any,
      token: wallet.token,
      metaType: 'wallet',
      metaId: wallet.address!,
      meta: atomMeta ? atomMeta.get() as any : []
    })
    
    // Add wallet metadata
    if (!atomMeta) {
      atom.meta.push(
        { key: 'position', value: wallet.position! },
        { key: 'bundle', value: wallet.bundle! },
        { key: 'token', value: wallet.token },
        { key: 'batchId', value: wallet.batchId || '' },
        { key: 'characters', value: wallet.characters || '' }
      )
      
      if (wallet.pubkey) {
        atom.meta.push({ key: 'pubkey', value: wallet.pubkey })
      }
    }
    
    this.addAtom(atom)
    
    // Add ContinuID atom (matching JavaScript SDK)
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
          molecule.sourceWallet.balance = data.sourceWallet.balance || 0
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
          molecule.remainderWallet.balance = data.remainderWallet.balance || 0
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
}