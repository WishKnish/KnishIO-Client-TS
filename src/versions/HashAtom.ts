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

import type Atom from '@/core/Atom'

// Define structured value types for better type safety
type StructuredValue = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined
  | StructuredObject
  | StructuredArray

type StructuredObject = Record<string, StructuredValue>
type StructuredArray = StructuredValue[]

// Define types for hashable values
type HashableValue = 
  | StructuredValue
  | Record<string, unknown>
  | unknown[]

// Type guard functions
function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function isPrimitive(value: unknown): value is string | number | boolean | null | undefined {
  return value === null || value === undefined || ['string', 'number', 'boolean'].includes(typeof value)
}

/**
 * HashAtom - Base class for versioned atomic hashing with enhanced type safety
 * 
 * Implements TypeScript 2025 patterns for structured data processing
 */
export default class HashAtom {
  /**
   * Creates a HashAtom instance from an Atom with proper typing
   */
  static create<T extends HashAtom>(this: new(params: Record<string, unknown>) => T, atom: Atom): T {
    const parameters: Record<string, unknown> = {}

    // Extract atom properties with type safety
    for (const key of Object.keys(atom)) {
      if (Object.prototype.hasOwnProperty.call(atom, key)) {
        parameters[key] = (atom as Record<string, unknown>)[key]
      }
    }

    return new this(parameters)
  }

  /**
   * Recursively structures an object or array for hashing consistency
   * Eliminates any types with proper generic constraints
   */
  static structure<T extends HashableValue>(object: T): StructuredValue {
    if (isPrimitive(object)) {
      return object
    }

    if (isArray(object)) {
      const result: StructuredArray = []
      for (const value of object) {
        result.push(HashAtom.isStructure(value) ? HashAtom.structure(value) : value as StructuredValue)
      }
      return result
    }

    if (isObject(object)) {
      const result: Array<Record<string, StructuredValue>> = []
      const keys = Object.keys(object).sort((first, second) => {
        if (first === second) {
          return 0
        }
        return (first < second) ? -1 : 1
      })

      for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          const item: Record<string, StructuredValue> = {}
          const value = object[key]
          item[key] = HashAtom.isStructure(value) ? HashAtom.structure(value) : value as StructuredValue
          result.push(item)
        }
      }

      if (result.length > 0) {
        return result
      }
    }

    // Fallback for unknown types
    return object as StructuredValue
  }

  /**
   * Type guard to determine if a value needs recursive structure processing
   */
  static isStructure(structure: unknown): structure is Record<string, unknown> | unknown[] {
    return isObject(structure) || isArray(structure)
  }

  /**
   * Returns the structured view of this HashAtom instance
   */
  view(): StructuredValue {
    return HashAtom.structure(this as Record<string, unknown>)
  }

  /**
   * Protected constructor to support subclass instantiation
   */
  protected constructor(params: Record<string, unknown> = {}) {
    // Assign parameters to instance
    Object.assign(this, params)
  }
}