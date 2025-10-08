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
 * Meta class - Handles metadata normalization and aggregation
 * 
 * Provides static methods for processing metadata across atoms and molecules
 * Ensures consistent metadata handling across the SDK
 */

import type { MetaData } from '@/types'

// =============================================================================
// META TYPES AND INTERFACES
// =============================================================================

export interface NormalizedMeta {
  key: string
  value: string | number | boolean | null
  [additionalProps: string]: unknown
}

export interface MetaItem {
  key: string
  value: unknown
  [props: string]: unknown
}

export interface AggregatedMetaResult {
  [key: string]: unknown
}

// =============================================================================
// META CLASS IMPLEMENTATION
// =============================================================================

/**
 * Meta class - Static methods for metadata processing
 * Matches JavaScript SDK Meta class functionality exactly
 */
export default class Meta {
  // No instance properties - this class only provides static methods
  
  /**
   * Normalize metadata to consistent format
   * Matches JavaScript SDK Meta.normalizeMeta exactly
   */
  static normalizeMeta(meta: MetaData | MetaItem[] | null): NormalizedMeta[] {
    if (!meta) {
      return []
    }

    // Handle array of meta items
    if (Array.isArray(meta)) {
      return meta.map(item => {
        if (typeof item === 'object' && item !== null && 'key' in item) {
          return {
            ...item,
            key: String(item.key),
            value: item.value as string | number | boolean | null
          }
        }
        
        // Fallback for invalid items
        return {
          key: 'unknown',
          value: String(item) as string | number | boolean | null
        }
      })
    }

    // Handle object metadata - convert to array format
    if (typeof meta === 'object' && meta !== null) {
      return Object.entries(meta).map(([key, value]) => ({
        key,
        value: value as string | number | boolean | null
      }))
    }

    // Handle primitive values
    return [{
      key: 'value',
      value: meta as string | number | boolean | null
    }]
  }

  /**
   * Aggregate metadata into single object
   * Matches JavaScript SDK Meta.aggregateMeta exactly  
   */
  static aggregateMeta(metaItems: NormalizedMeta[] | MetaItem[] | null): AggregatedMetaResult {
    if (!metaItems || !Array.isArray(metaItems)) {
      return {}
    }

    const aggregated: AggregatedMetaResult = {}
    
    for (const item of metaItems) {
      if (item && typeof item === 'object' && 'key' in item) {
        const key = String(item.key)
        
        // Handle different value types appropriately
        if ('value' in item) {
          aggregated[key] = item.value
        } else {
          // If no explicit value property, use the entire item minus the key
          const { key: itemKey, ...restOfItem } = item as any
          aggregated[key] = Object.keys(restOfItem).length === 1 && 'value' in restOfItem 
            ? restOfItem.value 
            : restOfItem
        }
      }
    }

    return aggregated
  }

  /**
   * Merge multiple metadata arrays
   * Combines arrays while preserving order and handling duplicates
   */
  static mergeMeta(...metaArrays: (NormalizedMeta[] | MetaItem[] | null)[]): NormalizedMeta[] {
    const merged: NormalizedMeta[] = []
    const keysSeen = new Set<string>()

    for (const metaArray of metaArrays) {
      if (!metaArray || !Array.isArray(metaArray)) {
        continue
      }

      const normalized = this.normalizeMeta(metaArray)
      
      for (const item of normalized) {
        // Handle duplicate keys by appending index
        let finalKey = item.key
        let counter = 1
        
        while (keysSeen.has(finalKey)) {
          finalKey = `${item.key}_${counter}`
          counter++
        }
        
        keysSeen.add(finalKey)
        merged.push({
          ...item,
          key: finalKey
        })
      }
    }

    return merged
  }

  /**
   * Filter metadata by key pattern or predicate
   */
  static filterMeta(
    metaItems: NormalizedMeta[] | MetaItem[] | null,
    filter: string | RegExp | ((item: NormalizedMeta) => boolean)
  ): NormalizedMeta[] {
    if (!metaItems || !Array.isArray(metaItems)) {
      return []
    }

    const normalized = this.normalizeMeta(metaItems)
    
    if (typeof filter === 'string') {
      return normalized.filter(item => item.key.includes(filter))
    }
    
    if (filter instanceof RegExp) {
      return normalized.filter(item => filter.test(item.key))
    }
    
    if (typeof filter === 'function') {
      return normalized.filter(filter)
    }
    
    return normalized
  }

  /**
   * Find metadata item by key
   */
  static findMeta(
    metaItems: NormalizedMeta[] | MetaItem[] | null,
    key: string
  ): NormalizedMeta | null {
    if (!metaItems || !Array.isArray(metaItems)) {
      return null
    }

    const normalized = this.normalizeMeta(metaItems)
    return normalized.find(item => item.key === key) || null
  }

  /**
   * Get metadata value by key
   */
  static getMetaValue(
    metaItems: NormalizedMeta[] | MetaItem[] | null,
    key: string,
    defaultValue: unknown = null
  ): unknown {
    const item = this.findMeta(metaItems, key)
    return item ? item.value : defaultValue
  }

  /**
   * Set or update metadata item by key
   */
  static setMeta(
    metaItems: NormalizedMeta[] | MetaItem[] | null,
    key: string,
    value: unknown
  ): NormalizedMeta[] {
    const normalized = this.normalizeMeta(metaItems)
    const existingIndex = normalized.findIndex(item => item.key === key)
    
    const newItem: NormalizedMeta = {
      key,
      value: value as string | number | boolean | null
    }
    
    if (existingIndex >= 0) {
      // Update existing item
      normalized[existingIndex] = newItem
    } else {
      // Add new item
      normalized.push(newItem)
    }
    
    return normalized
  }

  /**
   * Remove metadata item by key
   */
  static removeMeta(
    metaItems: NormalizedMeta[] | MetaItem[] | null,
    key: string
  ): NormalizedMeta[] {
    if (!metaItems || !Array.isArray(metaItems)) {
      return []
    }

    const normalized = this.normalizeMeta(metaItems)
    return normalized.filter(item => item.key !== key)
  }

  /**
   * Convert metadata to JSON-serializable format
   */
  static toJSON(metaItems: NormalizedMeta[] | MetaItem[] | null): Record<string, unknown> {
    return this.aggregateMeta(this.normalizeMeta(metaItems))
  }

  /**
   * Create metadata from JSON object
   */
  static fromJSON(jsonData: Record<string, unknown>): NormalizedMeta[] {
    if (!jsonData || typeof jsonData !== 'object') {
      return []
    }

    return Object.entries(jsonData).map(([key, value]) => ({
      key,
      value: value as string | number | boolean | null
    }))
  }

  /**
   * Validate metadata structure
   */
  static validateMeta(metaItems: unknown): metaItems is NormalizedMeta[] {
    if (!Array.isArray(metaItems)) {
      return false
    }

    return metaItems.every(item => 
      item && 
      typeof item === 'object' && 
      'key' in item && 
      typeof item.key === 'string'
    )
  }

  /**
   * Get all unique keys from metadata
   */
  static getKeys(metaItems: NormalizedMeta[] | MetaItem[] | null): string[] {
    if (!metaItems || !Array.isArray(metaItems)) {
      return []
    }

    const normalized = this.normalizeMeta(metaItems)
    const keys = new Set<string>()
    
    for (const item of normalized) {
      keys.add(item.key)
    }
    
    return Array.from(keys)
  }

  /**
   * Check if metadata contains specific key
   */
  static hasKey(metaItems: NormalizedMeta[] | MetaItem[] | null, key: string): boolean {
    return this.getKeys(metaItems).includes(key)
  }

  /**
   * Get metadata statistics
   */
  static getStats(metaItems: NormalizedMeta[] | MetaItem[] | null): {
    totalItems: number
    uniqueKeys: number
    keys: string[]
    valueTypes: Record<string, number>
  } {
    if (!metaItems || !Array.isArray(metaItems)) {
      return {
        totalItems: 0,
        uniqueKeys: 0,
        keys: [],
        valueTypes: {}
      }
    }

    const normalized = this.normalizeMeta(metaItems)
    const keys = this.getKeys(normalized)
    const valueTypes: Record<string, number> = {}
    
    for (const item of normalized) {
      const type = item.value === null ? 'null' : typeof item.value
      valueTypes[type] = (valueTypes[type] || 0) + 1
    }
    
    return {
      totalItems: normalized.length,
      uniqueKeys: keys.length,
      keys,
      valueTypes
    }
  }

  /**
   * Deep clone metadata array
   */
  static clone(metaItems: NormalizedMeta[] | MetaItem[] | null): NormalizedMeta[] {
    if (!metaItems || !Array.isArray(metaItems)) {
      return []
    }

    const normalized = this.normalizeMeta(metaItems)
    return normalized.map(item => ({ ...item }))
  }

  /**
   * Sort metadata by key
   */
  static sort(
    metaItems: NormalizedMeta[] | MetaItem[] | null,
    descending = false
  ): NormalizedMeta[] {
    if (!metaItems || !Array.isArray(metaItems)) {
      return []
    }

    const normalized = this.normalizeMeta(metaItems)
    return normalized.sort((a, b) => {
      const comparison = a.key.localeCompare(b.key)
      return descending ? -comparison : comparison
    })
  }
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Types are already exported at the interface declarations