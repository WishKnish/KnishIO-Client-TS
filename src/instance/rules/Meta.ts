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

import { MetaDataSchema, parseWithSchema } from '@/schemas'
import type { MetaData } from '@/types'

/**
 * Meta class for handling dynamic metadata objects with type safety
 * 
 * Uses TypeScript 2025 patterns with proper generics and runtime validation
 */
export default class Meta<T extends MetaData = MetaData> {
  private readonly __data: Map<string, T[keyof T]> = new Map()

  constructor(args: T = {} as T) {
    // Validate input at runtime using Zod
    const validatedArgs = parseWithSchema(MetaDataSchema, args, 'Meta constructor')
    
    // Store validated data
    for (const [key, value] of Object.entries(validatedArgs)) {
      this.__data.set(`__${key}`, value)
    }
  }

  /**
   * Creates a Meta object from a plain object with runtime validation
   */
  static toObject<U extends MetaData>(object: U): Meta<U> {
    return new Meta(object)
  }

  /**
   * Gets a metadata value by key
   */
  get<K extends keyof T>(key: K): T[K] | undefined {
    return this.__data.get(`__${String(key)}`) as T[K] | undefined
  }

  /**
   * Sets a metadata value by key
   */
  set<K extends keyof T>(key: K, value: T[K]): void {
    this.__data.set(`__${String(key)}`, value)
  }

  /**
   * Checks if a key exists
   */
  has<K extends keyof T>(key: K): boolean {
    return this.__data.has(`__${String(key)}`)
  }

  /**
   * Gets all keys
   */
  keys(): string[] {
    return Array.from(this.__data.keys()).map(key => 
      key.startsWith('__') ? key.substring(2) : key
    )
  }

  /**
   * Converts Meta object back to plain object
   */
  toJSON(): T {
    const object = {} as Record<string, T[keyof T]>

    for (const [key, value] of this.__data.entries()) {
      if (key.startsWith('__')) {
        const plainKey = key.substring(2)
        object[plainKey] = value
      }
    }

    return object as unknown as T
  }

  /**
   * Creates a typed copy of this Meta object
   */
  clone(): Meta<T> {
    return new Meta(this.toJSON())
  }

  /**
   * Merges another Meta object into this one
   */
  merge<U extends MetaData>(other: Meta<U>): Meta<T & U> {
    const combined = { ...this.toJSON(), ...other.toJSON() }
    return new Meta(combined)
  }

  /**
   * Type-safe iteration over metadata entries
   */
  forEach<K extends keyof T>(callback: (value: T[K], key: K) => void): void {
    for (const [key, value] of this.__data.entries()) {
      if (key.startsWith('__')) {
        const plainKey = key.substring(2) as K
        callback(value as T[K], plainKey)
      }
    }
  }

  /**
   * Returns the size of the metadata object
   */
  get size(): number {
    return this.__data.size
  }

  /**
   * Clears all metadata
   */
  clear(): void {
    this.__data.clear()
  }
}