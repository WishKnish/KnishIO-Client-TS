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
import { PROTOCOL_CONFIG } from '@/constants'
import { handleIsotope, isWalletAddress, isPosition } from '@/types/guards'
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
  VERSION: PROTOCOL_CONFIG.DEFAULT_SDK_VERSION
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
  readonly VERSION: number
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
  readonly value: string | number | boolean | null
  readonly [additionalProps: string]: unknown
}

export interface AtomCreationParams extends AtomParams {
  version?: number
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
}

// =============================================================================
// ATOM CLASS IMPLEMENTATION
// =============================================================================

/**
 * Atom - Represents a single, atomic operation in the distributed ledger
 * Maintains full compatibility with JavaScript SDK implementation
 */
export default class Atom {
  // Core properties matching JS SDK exactly
  public position: string
  public walletAddress: WalletAddress | string
  public isotope: AtomIsotope
  public token: TokenSlug | string
  public value: string | number | null
  public batchId: BatchId | string | null
  public metaType: MetaType | string | null
  public metaId: MetaId | string | null
  public meta: AtomMetaData[]
  public otsFragment: string | null
  public index: number | null
  public createdAt: string
  public version: number

  /**
   * Create a new Atom instance
   * Constructor signature matches JavaScript SDK exactly
   */
  constructor({
    position = ATOM_DEFAULTS.POSITION,
    walletAddress = ATOM_DEFAULTS.WALLET_ADDRESS as any,
    isotope = ATOM_DEFAULTS.ISOTOPE as AtomIsotope,
    token = ATOM_DEFAULTS.TOKEN,
    value = ATOM_DEFAULTS.VALUE,
    batchId = ATOM_DEFAULTS.BATCH_ID,
    metaType = ATOM_DEFAULTS.META_TYPE,
    metaId = ATOM_DEFAULTS.META_ID,
    meta = null,
    otsFragment = ATOM_DEFAULTS.OTS_FRAGMENT,
    index = ATOM_DEFAULTS.INDEX,
    createdAt = null,
    version = ATOM_DEFAULTS.VERSION
  }: AtomCreationParams = {}) {
    
    // Use const assertion values with nullish coalescing (2025 pattern)
    this.position = position ?? ATOM_DEFAULTS.POSITION
    this.walletAddress = walletAddress ?? ATOM_DEFAULTS.WALLET_ADDRESS
    this.isotope = isotope ?? ATOM_DEFAULTS.ISOTOPE
    this.token = token ?? ATOM_DEFAULTS.TOKEN
    this.value = value
    this.batchId = batchId
    this.metaType = metaType
    this.metaId = metaId
    this.meta = meta ? [...meta] : [...ATOM_DEFAULTS.META]
    this.otsFragment = otsFragment
    this.index = index
    this.version = version ?? ATOM_DEFAULTS.VERSION
    // CRITICAL: Use provided createdAt or generate timestamp in milliseconds as string (Implementation Guide requirement)
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
      isotope: this.isotope,
      token: this.token?.toString() || '',
      value: this.value !== null ? this.value.toString() : null,
      batchId: this.batchId?.toString() || null,
      metaType: this.metaType?.toString() || null,
      metaId: this.metaId?.toString() || null,
      meta: this.meta.length > 0 ? [...this.meta] : null,
      createdAt: this.createdAt,
      index: this.index !== null ? this.index : 0
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
    validateFields?: boolean
  } = {}): AtomHashableData & { otsFragment?: string | null } {
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

      // Core atom properties (always included) - use structured data for JSON
      const structuredData = this.getStructuredData()
      const serialized: AtomHashableData & { otsFragment?: string | null } = {
        ...structuredData
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
      isotope: this.isotope,
      token: this.token,
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
      F: () => true  // Fuse atoms
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
  }

  /**
   * Create atom from parameters - factory method
   * Matches JavaScript SDK Atom.create static method
   */
  static create(params: AtomCreationParams): Atom {
    return new Atom(params)
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
    const numberOfAtoms = String(atoms.length)
    let hashableValues: string[] = []

    // Step 2: Build hashableValues array exactly like JavaScript SDK
    for (const atom of atomList) {
      // Add number of atoms (matching JS SDK comment: "Add number of atoms (???)")
      hashableValues.push(numberOfAtoms)
      
      // Add atom's properties - concatenate the array returned by getHashableValues
      hashableValues = hashableValues.concat(atom.getHashableValues())
    }

    // Step 3: Create molecular hash using SHAKE256 exactly like JS SDK (iterative updates)
    const molecularSponge = new JsSHA('SHAKE256', 'TEXT')
    
    // CRITICAL FIX: Use iterative updates like JavaScript, not string concatenation
    for (const hashableValue of hashableValues) {
      molecularSponge.update(hashableValue)  // Match JavaScript SDK exactly
    }
    
    // Step 4: Get hex hash (256 bits = 64 hex chars) and convert to base17
    const hexHash = molecularSponge.getHash('HEX', { outputLen: 256 })
    
    // Step 5: Convert hex hash to base17 format (Implementation Guide requirement)
    return convertToBase17(hexHash.toLowerCase())
  }

  /**
   * Sort atoms by index
   * Matches JavaScript SDK sortAtoms method
   */
  static sortAtoms(atoms: Atom[]): Atom[] {
    return [...atoms].sort((a, b) => {
      const indexA = a.index !== null ? a.index : 0
      const indexB = b.index !== null ? b.index : 0
      return indexA - indexB
    })
  }

  /**
   * Generate next atom index for a collection
   * Matches JavaScript SDK generateNextAtomIndex method
   */
  static generateNextAtomIndex(atoms: Atom[]): number {
    if (!atoms || atoms.length === 0) {
      return 0
    }

    const indices = atoms
      .map(atom => atom.index !== null ? atom.index : 0)
      .filter(index => typeof index === 'number')

    return indices.length > 0 ? Math.max(...indices) + 1 : 0
  }

  /**
   * Filter atoms by isotope(s)
   * Matches JavaScript SDK isotopeFilter method  
   */
  static isotopeFilter(isotopes: AtomIsotope | AtomIsotope[], atoms: Atom[]): Atom[] {
    const targetIsotopes = Array.isArray(isotopes) ? isotopes : [isotopes]
    return atoms.filter(atom => targetIsotopes.includes(atom.isotope))
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
  static isIsotope(atom: Atom, isotope: AtomIsotope): boolean {
    return atom.isotope === isotope
  }

  /**
   * Get all unique isotopes from atom collection
   */
  static getUniqueIsotopes(atoms: Atom[]): AtomIsotope[] {
    const isotopes = new Set<AtomIsotope>()
    for (const atom of atoms) {
      isotopes.add(atom.isotope)
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
      if (!groups[atom.isotope]) {
        groups[atom.isotope] = []
      }
      groups[atom.isotope]!.push(atom)
    }
    
    return groups as Record<AtomIsotope, Atom[]>
  }
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Types are already exported from the types package