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

import Meta, { type NormalizedMeta } from './Meta'

// Configuration constants matching JS SDK
const USE_META_CONTEXT = false
const DEFAULT_META_CONTEXT = 'https://www.schema.org'

/**
 * AtomMeta class - Manages metadata for atoms
 * Provides methods for metadata manipulation and wallet metadata
 */
export default class AtomMeta {
  private meta: NormalizedMeta[]

  /**
   * Create new AtomMeta instance
   * @param meta - Initial metadata (object or array)
   */
  constructor(meta: Record<string, any> | NormalizedMeta[] | null = null) {
    this.meta = Meta.normalizeMeta(meta)
  }

  /**
   * Merge additional metadata
   * @param meta - Metadata to merge
   * @return This instance for chaining
   */
  merge(meta: Record<string, any> | NormalizedMeta[]): AtomMeta {
    const normalized = Meta.normalizeMeta(meta)
    
    // Use Set to avoid duplicates based on key
    const existingKeys = new Set(this.meta.map(m => m.key))
    
    for (const item of normalized) {
      if (existingKeys.has(item.key)) {
        // Update existing key
        const index = this.meta.findIndex(m => m.key === item.key)
        if (index !== -1) {
          this.meta[index] = item
        }
      } else {
        // Add new key
        this.meta.push(item)
        existingKeys.add(item.key)
      }
    }
    
    return this
  }

  /**
   * Add context metadata if enabled
   * @param context - Context URL or null for default
   * @return This instance for chaining
   */
  addContext(context: string | null = null): AtomMeta {
    // Add context key if it is enabled
    if (USE_META_CONTEXT) {
      this.merge({ context: context || DEFAULT_META_CONTEXT })
    }
    
    return this
  }

  /**
   * Set atom wallet metadata
   * @param wallet - Wallet to extract metadata from
   * @return This instance for chaining
   */
  setAtomWallet(wallet: any): AtomMeta {
    const walletMeta: Record<string, any> = {
      pubkey: wallet.pubkey,
      characters: wallet.characters
    }

    // Add token units meta key if present
    if (wallet.tokenUnits && wallet.tokenUnits.length) {
      walletMeta.tokenUnits = JSON.stringify(wallet.getTokenUnitsData ? wallet.getTokenUnitsData() : wallet.tokenUnits)
    }

    // Add trade rates meta key if present
    if (wallet.tradeRates && Object.keys(wallet.tradeRates).length) {
      walletMeta.tradeRates = JSON.stringify(wallet.tradeRates)
    }

    // Merge all wallet's metas
    this.merge(walletMeta)
    return this
  }

  /**
   * Set full NEW wallet metadata
   * Used for shadow wallet claim & wallet creation & token creation
   * @param wallet - Wallet with full metadata
   * @return This instance for chaining
   */
  setMetaWallet(wallet: any): AtomMeta {
    this.merge({
      walletTokenSlug: wallet.token,
      walletBundleHash: wallet.bundle,
      walletAddress: wallet.address,
      walletPosition: wallet.position,
      walletBatchId: wallet.batchId,
      walletPubkey: wallet.pubkey,
      walletCharacters: wallet.characters
    })
    return this
  }

  /**
   * Set shadow wallet claim flag
   * @param shadowWalletClaim - Claim flag (converted to number)
   * @return This instance for chaining
   */
  setShadowWalletClaim(shadowWalletClaim: boolean | number): AtomMeta {
    this.merge({ shadowWalletClaim: Number(shadowWalletClaim) })
    return this
  }

  /**
   * Set signing wallet metadata
   * @param signingWallet - Wallet used for signing
   * @return This instance for chaining
   */
  setSigningWallet(signingWallet: any): AtomMeta {
    this.merge({
      signingWallet: JSON.stringify({
        tokenSlug: signingWallet.token,
        bundleHash: signingWallet.bundle,
        address: signingWallet.address,
        position: signingWallet.position,
        pubkey: signingWallet.pubkey,
        characters: signingWallet.characters
      })
    })
    return this
  }

  /**
   * Add policy metadata
   * @param policy - Policy object to add
   * @return This instance for chaining
   */
  addPolicy(policy: Record<string, any>): AtomMeta {
    // For now, just stringify the policy
    // TODO: Implement PolicyMeta class if needed
    this.merge({
      policy: JSON.stringify(policy)
    })
    
    return this
  }

  /**
   * Get the normalized metadata array
   * @return Array of normalized metadata items
   */
  get(): NormalizedMeta[] {
    return this.meta
  }

  /**
   * Convert metadata to plain object
   * @return Aggregated metadata object
   */
  toObject(): Record<string, any> {
    return Meta.aggregateMeta(this.meta)
  }

  /**
   * Convert metadata to JSON string
   * @return JSON string representation
   */
  toJSON(): string {
    return JSON.stringify(this.toObject())
  }

  /**
   * Get metadata value by key
   * @param key - Key to lookup
   * @param defaultValue - Default if not found
   * @return Value or default
   */
  getValue(key: string, defaultValue: any = null): any {
    return Meta.getMetaValue(this.meta, key, defaultValue)
  }

  /**
   * Check if metadata has a key
   * @param key - Key to check
   * @return True if key exists
   */
  hasKey(key: string): boolean {
    return Meta.hasKey(this.meta, key)
  }

  /**
   * Remove metadata by key
   * @param key - Key to remove
   * @return This instance for chaining
   */
  remove(key: string): AtomMeta {
    this.meta = Meta.removeMeta(this.meta, key)
    return this
  }

  /**
   * Clear all metadata
   * @return This instance for chaining
   */
  clear(): AtomMeta {
    this.meta = []
    return this
  }

  /**
   * Get count of metadata items
   * @return Number of items
   */
  count(): number {
    return this.meta.length
  }

  /**
   * Clone this AtomMeta instance
   * @return New AtomMeta with same data
   */
  clone(): AtomMeta {
    return new AtomMeta(Meta.clone(this.meta))
  }
}