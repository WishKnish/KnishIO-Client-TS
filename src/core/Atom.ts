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
 * Atom class - The fundamental unit of KnishIO DLT transactions
 * 
 * Atoms represent single, monodirectional actions in the distributed ledger.
 * They are the building blocks of Molecules and maintain strict type safety
 * while ensuring perfect compatibility with other SDK implementations.
 */

import { convertToBase17 } from '@/libraries/crypto'
import JsSHA from 'jssha'
import versions from '@/versions'
import { handleIsotope, isWalletAddress, isPosition } from '@/types/guards'
import Meta from '@/core/Meta'
import AtomMeta from '@/core/AtomMeta'
import type {
  AtomIsotope,
  AtomParams,
  WalletAddress,
  TokenSlug,
  MetaType,
  MetaId,
  BatchId
} from '@/types'

// =============================================================================
// ATOM CONSTANTS WITH CONST ASSERTIONS (2025 TYPESCRIPT)
// =============================================================================

/**
 * Atom default values with const assertions for immutability
 */
export const ATOM_DEFAULTS = {
  POSITION: '',
  WALLET_ADDRESS: '',
  ISOTOPE: 'C',
  TOKEN: 'USER',
  VALUE: null,
  BATCH_ID: null,
  META_TYPE: null,
  META_ID: null,
  META: [],
  OTS_FRAGMENT: null,
  INDEX: null,
  VERSION: null
} as const satisfies {
  readonly POSITION: string
  readonly WALLET_ADDRESS: string
  readonly ISOTOPE: AtomIsotope
  readonly TOKEN: string
  readonly VALUE: null
  readonly BATCH_ID: null
  readonly META_TYPE: null
  readonly META_ID: null
  readonly META: readonly []
  readonly OTS_FRAGMENT: null
  readonly INDEX: null
  readonly VERSION: null
}

/**
 * Atom validation constants with const assertions
 */
export const ATOM_VALIDATION = {
  MIN_INDEX: 0,
  MAX_INDEX: Number.MAX_SAFE_INTEGER,
  REQUIRED_FIELDS: ['position', 'walletAddress', 'isotope'] as const,
  OPTIONAL_FIELDS: ['token', 'value', 'batchId', 'metaType', 'metaId', 'meta'] as const
} as const

// =============================================================================
// ATOM INTERFACE AND TYPES
// =============================================================================

export interface AtomMetaData {
  readonly key: string
  readonly value: string | null
  readonly [props: string]: unknown
}

export interface AtomCreationParams extends AtomParams {
  version?: string | number | null | undefined
}

export interface AtomHashableData {
  position: string
  walletAddress: string
  isotope: AtomIsotope
  token: string
  value: string | null
  batchId: string | null
  metaType: string | null
  metaId: string | null
  meta: AtomMetaData[] | null
  createdAt: string
  index: number
  version?: string | number | null
}

// =============================================================================
// ATOM CLASS IMPLEMENTATION
// =============================================================================

/**
 * Atom - Represents a single, atomic operation in the distributed ledger
 * Maintains full compatibility with JavaScript SDK implementation
 */
export default class Atom {
  // Core properties matching JS SDK exactly (all default to null)
  public position: string | null
  public walletAddress: WalletAddress | string | null
  public isotope: AtomIsotope | null
  public token: TokenSlug | string | null
  public value: string | null
  public batchId: BatchId | string | null
  public metaType: MetaType | string | null
  public metaId: MetaId | string | null
  public meta: AtomMetaData[]
  public otsFragment: string | null
  public index: number | null
  public createdAt: string
  public version: string | undefined

  /**
   * Create a new Atom instance
   * Constructor signature matches JavaScript SDK exactly
   */
  constructor({
    position = null,
    walletAddress = null,
    isotope = null,
    token = null,
    value = null,
    batchId = null,
    metaType = null,
    metaId = null,
    meta = null,
    otsFragment = null,
    index = null,
    createdAt = null,
    version = null
  }: AtomCreationParams = {}) {
    
    // Match JS SDK constructor exactly
    this.position = position
    this.walletAddress = walletAddress
    this.isotope = isotope
    this.token = token
    this.value = value !== null && value !== undefined ? String(value) : null
    this.batchId = batchId
    this.metaType = metaType
    this.metaId = metaId
    this.meta = meta ? Meta.normalizeMeta(meta) as AtomMetaData[] : []
    this.otsFragment = otsFragment
    this.index = index
    // Match JS SDK: only set version if it exists in the version registry
    if (version !== null && version !== undefined && Object.prototype.hasOwnProperty.call(versions as Record<string, any>, version)) {
      this.version = String(version)
    }
    // Match JS SDK: always generate fresh createdAt (JS SDK has no createdAt parameter)
    this.createdAt = createdAt || String(+new Date())
  }

  // =============================================================================
  // INSTANCE METHODS - MATCH JAVASCRIPT SDK
  // =============================================================================

  /**
   * Get aggregated metadata for this atom
   * Matches JavaScript SDK Meta.aggregateMeta functionality
   */
  public aggregatedMeta(): Record<string, unknown> {
    const aggregated: Record<string, unknown> = {}
    
    for (const metaItem of this.meta) {
      if (metaItem && typeof metaItem === 'object' && 'key' in metaItem) {
        aggregated[metaItem.key] = metaItem.value
      }
    }
    
    return aggregated
  }

  /**
   * Get values that will be used for hashing
   * Must match JavaScript SDK getHashableValues exactly - returns array of strings!
   */
  public getHashableValues(): string[] {
    const hashableValues: string[] = []
    for (const property of Atom.getHashableProps()) {
      const value = (this as any)[property]

      // All nullable values are not hashed (only custom keys)
      if (value === null && !['position', 'walletAddress'].includes(property)) {
        continue
      }

      // Hashing individual meta keys and values
      if (property === 'meta') {
        for (const meta of value) {
          if (typeof meta.value !== 'undefined' && meta.value !== null) {
            hashableValues.push(String(meta.key))
            hashableValues.push(String(meta.value))
          }
        }
      } else {
        // Default value
        hashableValues.push(value === null ? '' : String(value))
      }
    }
    return hashableValues
  }

  /**
   * Get structured data for JSON serialization
   * Separate from hashable values to maintain proper typing
   */
  public getStructuredData(): AtomHashableData {
    return {
      position: this.position || '',
      walletAddress: this.walletAddress?.toString() || '',
      isotope: (this.isotope || 'C') as AtomIsotope,
      token: this.token?.toString() || '',
      value: this.value !== null ? this.value.toString() : null,
      batchId: this.batchId?.toString() || null,
      metaType: this.metaType?.toString() || null,
      metaId: this.metaId?.toString() || null,
      // Always return array for meta (server expects Vec<MetaItemInput>, not null)
      meta: this.meta.length > 0 ? [...this.meta] : [],
      createdAt: this.createdAt,
      index: this.index !== null ? this.index : 0,
      version: this.version ?? null
    }
  }

  /**
   * Returns JSON-ready object for cross-SDK compatibility (2025 TS best practices)
   * 
   * Provides clean serialization of atomic operations with optional OTS fragments.
   * Follows 2025 TypeScript best practices with proper type safety and validation.
   *
   * @param options - Serialization options
   * @param options.includeOtsFragments - Include OTS signature fragments (default: true)
   * @param options.validateFields - Validate required fields (default: false)
   * @return JSON-serializable object
   * @throws Error if atom is in invalid state for serialization
   */
  public toJSON(options: {
    includeOtsFragments?: boolean
    includeValidationContext?: boolean
    validateFields?: boolean
  } = {}): Record<string, unknown> {
    const {
      includeOtsFragments = true,
      validateFields = false
    } = options

    try {
      // Validate required fields if requested
      if (validateFields) {
        const requiredFields = ['position', 'walletAddress', 'isotope', 'token'] as const
        for (const field of requiredFields) {
          if (!this[field]) {
            throw new Error(`Required field '${field}' is missing or empty`)
          }
        }
      }

      // Core atom properties — matches JavaScript SDK Atom.toJSON() exactly
      // Uses ?? (nullish coalescing) not || (falsy coalescing) to preserve 0/false/"" values
      // No .toString() calls — raw values must match what getHashableValues() hashed
      const serialized: Record<string, unknown> = {
        position: this.position ?? '',
        walletAddress: this.walletAddress ?? '',
        isotope: this.isotope,
        token: this.token ?? '',
        value: this.value,
        batchId: this.batchId,
        metaType: this.metaType,
        metaId: this.metaId,
        meta: this.meta || [],
        index: this.index,
        createdAt: this.createdAt,
        version: this.version
      }

      // Optional OTS fragments (can be large, so optional)
      if (includeOtsFragments && this.otsFragment) {
        serialized.otsFragment = this.otsFragment
      }

      return serialized

    } catch (error) {
      throw new Error(`Atom serialization failed: ${(error as Error).message}`)
    }
  }

  /**
   * Create a deep copy of this atom
   */
  public clone(): Atom {
    return new Atom({
      position: this.position,
      walletAddress: this.walletAddress as any,
      isotope: this.isotope as AtomIsotope,
      token: this.token as string,
      value: this.value,
      batchId: this.batchId,
      metaType: this.metaType,
      metaId: this.metaId,
      meta: this.meta.map(m => ({ ...m })) as any,
      otsFragment: this.otsFragment,
      index: this.index,
      version: this.version
    })
  }

  /**
   * Check if atom is valid for inclusion in molecules
   * TypeScript 2025: Uses exhaustive type guards for compile-time completeness
   */
  public isValid(): boolean {
    // TypeScript 2025: Enhanced validation with type guards
    if (!isPosition(this.position) || !isWalletAddress(this.walletAddress)) {
      return false
    }

    // Null isotope is invalid
    if (!this.isotope) return false

    // Exhaustive isotope validation with compile-time completeness
    return handleIsotope(this.isotope, {
      V: () => this.value !== null && !isNaN(Number(this.value)), // Value atoms must have numeric value
      M: () => Boolean(this.metaType && this.metaId), // Meta atoms must have metaType and metaId
      C: () => true, // Continue atoms are always valid if position/address present
      U: () => true, // User atoms
      T: () => true, // Token atoms
      I: () => true, // Identity atoms
      R: () => true, // Rule atoms
      B: () => true, // Buffer atoms
      F: () => true, // Fuse atoms
      P: () => true, // Peer atoms
      A: () => Boolean(this.metaType && this.metaId) // Append atoms must have metaType and metaId
    })
  }

  // =============================================================================
  // STATIC METHODS - MATCH JAVASCRIPT SDK EXACTLY
  // =============================================================================

  /**
   * Get properties that should be included in hash calculation
   * MUST match JavaScript SDK implementation exactly
   */
  static getHashableProps(): string[] {
    return [
      'position',
      'walletAddress', 
      'isotope',
      'token',
      'value',
      'batchId',
      'metaType',
      'metaId',
      'meta',
      'createdAt'
    ]
    // NOTE: 'index' excluded - matches JavaScript canonical exactly
    // Index is for atom ordering, not hash calculation
  }

  /**
   * Get properties for unclaimed shadow wallets
   * Matches JavaScript SDK getUnclaimedProps
   */
  static getUnclaimedProps(): string[] {
    return [
      'otsFragment'
    ]
  }

  /**
   * Create atom from parameters - factory method
   * Matches JavaScript SDK Atom.create static method exactly
   * Processes wallet meta, extracts wallet fields, normalizes meta
   */
  static create({
    isotope,
    wallet = null,
    value = null,
    metaType = null,
    metaId = null,
    meta = null,
    batchId = null
  }: {
    isotope: AtomIsotope | string
    wallet?: any | null
    value?: string | number | null
    metaType?: string | null
    metaId?: string | null
    meta?: AtomMeta | any[] | Record<string, any> | null
    batchId?: string | null
  }): Atom {
    // If meta object is not passed - create it
    let atomMeta: AtomMeta
    if (!meta) {
      atomMeta = new AtomMeta()
    } else if (meta instanceof AtomMeta) {
      // If meta object is already an instance of AtomMeta - use it
      atomMeta = meta
    } else {
      // Otherwise create from meta
      atomMeta = new AtomMeta(meta)
    }

    // If wallet has been passed => add related metas
    if (wallet) {
      // Add wallet's meta
      atomMeta.setAtomWallet(wallet)

      // If batch ID not passed: set it from the wallet
      if (!batchId) {
        batchId = wallet.batchId
      }
    }

    // Create the final atom
    return new Atom({
      position: wallet ? wallet.position : null,
      walletAddress: wallet ? wallet.address : null,
      isotope: isotope as AtomIsotope,
      token: wallet ? wallet.token : null,
      value,
      batchId,
      metaType,
      metaId,
      meta: atomMeta.get() as any
    })
  }

  /**
   * Creates an Atom instance from JSON data (2025 TS best practices)
   * 
   * Handles cross-SDK atom deserialization with robust error handling.
   * Essential for reconstructing atoms from other SDK implementations.
   *
   * @param json - JSON string or object to deserialize
   * @param options - Deserialization options
   * @param options.validateStructure - Validate required fields (default: true)
   * @param options.strictMode - Strict validation mode (default: false)
   * @return Reconstructed atom instance
   * @throws Error if JSON is invalid or required fields are missing
   */
  static fromJSON(json: string | Record<string, unknown>, options: {
    validateStructure?: boolean
    strictMode?: boolean
  } = {}): Atom {
    const {
      validateStructure = true,
      strictMode = false
    } = options

    try {
      // Parse JSON safely
      const data = typeof json === 'string' ? JSON.parse(json) : json

      // Validate required fields in strict mode
      if (strictMode || validateStructure) {
        const requiredFields = ['position', 'walletAddress', 'isotope', 'token'] as const
        for (const field of requiredFields) {
          if (!data[field]) {
            throw new Error(`Required field '${field}' is missing or empty`)
          }
        }
      }

      // Create atom instance with required fields
      const atom = new Atom({
        position: data.position as string,
        walletAddress: data.walletAddress as any,
        isotope: data.isotope as AtomIsotope,
        token: data.token as string,
        value: data.value as string | number | null,
        batchId: data.batchId as string | null,
        metaType: data.metaType as string | null,
        metaId: data.metaId as string | null,
        meta: data.meta as any,
        index: data.index as number | null,
        version: data.version as number
      })

      // Set additional properties that may not be in constructor
      if (data.otsFragment) {
        atom.otsFragment = data.otsFragment as string
      }
      if (data.createdAt) {
        atom.createdAt = data.createdAt as string
      }

      return atom

    } catch (error) {
      throw new Error(`Atom deserialization failed: ${(error as Error).message}`)
    }
  }

  /**
   * Convert JSON object back to Atom instance
   * Matches JavaScript SDK jsonToObject method - kept for compatibility
   */
  static jsonToObject(jsonData: Record<string, unknown>): Atom {
    return Atom.fromJSON(jsonData)
  }

  /**
   * Hash multiple atoms to create molecular hash
   * MUST match JavaScript SDK algorithm exactly for cross-platform compatibility
   * 
   * CRITICAL: This implementation must exactly mirror the JavaScript SDK approach:
   * 1. Sort atoms by index property  
   * 2. For each sorted atom: ADD number of atoms to hashableValues array
   * 3. CONCATENATE all atom's hashable values to the array
   * 4. Iterate through hashableValues array and update SHAKE256 sponge
   */
  static hashAtoms({ atoms }: { atoms: Atom[] }): string {
    if (!atoms || atoms.length === 0) {
      return ''
    }

    // Step 1: Sort atoms by index to ensure deterministic hashing (matches JS SDK)
    const atomList = Atom.sortAtoms(atoms)
    const molecularSponge = new JsSHA('SHAKE256', 'TEXT')

    // Step 2: Check for versioned hashing (matches JS SDK Atom.hashAtoms lines 365-366)
    const versionRegistry = versions as Record<number | string, any>
    if (atomList.every(atom => atom.version && Object.prototype.hasOwnProperty.call(versionRegistry, atom.version))) {
      // Versioned path: create structured view of each atom and hash as JSON
      molecularSponge.update(JSON.stringify(
        atomList.map(atom => versionRegistry[atom.version!].create(atom).view())
      ))
    } else {
      // Legacy path: field-by-field with incremental SHAKE256 updates
      const numberOfAtoms = String(atoms.length)
      let hashableValues: string[] = []

      for (const atom of atomList) {
        hashableValues.push(numberOfAtoms)
        hashableValues = hashableValues.concat(atom.getHashableValues())
      }

      for (const hashableValue of hashableValues) {
        molecularSponge.update(hashableValue)
      }
    }

    // Step 3: Get hex hash (256 bits = 64 hex chars) and convert to base17
    const hexHash = molecularSponge.getHash('HEX', { outputLen: 256 })

    // Step 4: Convert hex hash to base17 format (Implementation Guide requirement)
    return convertToBase17(hexHash.toLowerCase())
  }

  /**
   * Sort atoms by index
   * Matches JavaScript SDK sortAtoms method
   */
  static sortAtoms(atoms: Atom[]): Atom[] {
    return [...atoms].sort((first, second) => {
      // Match JS SDK exactly: first.index < second.index ? -1 : 1
      return first.index! < second.index! ? -1 : 1
    })
  }

  /**
   * Generate next atom index for a collection
   * Matches JavaScript SDK generateNextAtomIndex method
   */
  static generateNextAtomIndex(atoms: Atom[]): number {
    return atoms.length
  }

  /**
   * Filter atoms by isotope(s)
   * Matches JavaScript SDK isotopeFilter method  
   */
  static isotopeFilter(isotopes: AtomIsotope | AtomIsotope[], atoms: Atom[]): Atom[] {
    const targetIsotopes = Array.isArray(isotopes) ? isotopes : [isotopes]
    return atoms.filter(atom => atom.isotope !== null && targetIsotopes.includes(atom.isotope))
  }

  // =============================================================================
  // VALIDATION AND UTILITY METHODS
  // =============================================================================

  /**
   * Validate atom data structure
   */
  static validateAtom(atom: unknown): atom is Atom {
    if (!atom || typeof atom !== 'object') {
      return false
    }

    const atomObj = atom as Record<string, unknown>
    
    return typeof atomObj.position === 'string' &&
           typeof atomObj.walletAddress === 'string' &&
           typeof atomObj.isotope === 'string' &&
           typeof atomObj.token === 'string' &&
           (atomObj.value === null || typeof atomObj.value === 'string' || typeof atomObj.value === 'number') &&
           Array.isArray(atomObj.meta)
  }

  /**
   * Check if atom is a specific isotope type
   */
  static isIsotope(atom: Atom, isotope: AtomIsotope | null): boolean {
    return atom.isotope === isotope
  }

  /**
   * Get all unique isotopes from atom collection
   */
  static getUniqueIsotopes(atoms: Atom[]): AtomIsotope[] {
    const isotopes = new Set<AtomIsotope>()
    for (const atom of atoms) {
      if (atom.isotope !== null) {
        isotopes.add(atom.isotope)
      }
    }
    return Array.from(isotopes)
  }

  /**
   * Calculate total value for value atoms
   */
  static calculateTotalValue(atoms: Atom[]): number {
    return atoms
      .filter(atom => atom.isotope === 'V' && atom.value !== null)
      .reduce((total, atom) => total + Number(atom.value), 0)
  }

  /**
   * Group atoms by isotope
   */
  static groupByIsotope(atoms: Atom[]): Record<AtomIsotope, Atom[]> {
    const groups: Partial<Record<AtomIsotope, Atom[]>> = {}

    for (const atom of atoms) {
      const iso = atom.isotope
      if (iso === null) continue
      if (!groups[iso]) {
        groups[iso] = []
      }
      groups[iso]!.push(atom)
    }

    return groups as Record<AtomIsotope, Atom[]>
  }
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Types are already exported from the types package