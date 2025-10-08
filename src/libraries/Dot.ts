/**
 * Utility class for accessing nested object properties using dot notation
 * Matches JavaScript SDK Dot class functionality exactly
 */
export default class Dot {
  private static arr: string[]
  private static key: string | number
  private static __nextKey: number
  private static __next: boolean

  /**
   * Initialize the Dot utility with the given object and key path
   * @param obj - The object or array to traverse
   * @param keys - The dot-notated string of keys
   * @private
   */
  private static __init(obj: any, keys: string): void {
    this.arr = String(keys).split('.')
    this.key = this.arr.shift() as string

    // Convert to number if the key is a valid integer
    const numberKey = Number(this.key)
    if (Number.isInteger(numberKey)) {
      this.key = numberKey
    }

    this.__nextKey = this.arr.length
    this.__next = this.__tic(obj)
  }

  /**
   * Check if the current key exists in the object
   * @param obj - The object or array to check
   * @return Whether the key exists
   * @private
   */
  private static __tic(obj: any): boolean {
    if (!Array.isArray(obj) && !(obj instanceof Object)) {
      return false
    }

    return typeof obj[this.key] !== 'undefined'
  }

  /**
   * Check if a nested property exists in an object using dot notation
   * @param obj - The object or array to search
   * @param keys - The path to the property, using dot notation
   * @return True if the property exists, false otherwise
   */
  static has(obj: any, keys: string): boolean {
    this.__init(obj, keys)

    if (!this.__next) {
      return false
    }

    if (this.__nextKey) {
      return this.has(obj[this.key], this.arr.join('.'))
    }

    return true
  }

  /**
   * Get a nested property from an object using dot notation
   * @param obj - The object or array to search
   * @param keys - The path to the property, using dot notation
   * @param defaultValue - The default value to return if the property doesn't exist
   * @return The value at the specified path, or defaultValue if not found
   */
  static get(obj: any, keys: string, defaultValue: any = null): any {
    this.__init(obj, keys)

    if (!this.__next) {
      return defaultValue
    }

    if (this.__nextKey) {
      return this.get(obj[this.key], this.arr.join('.'), defaultValue)
    }

    return obj[this.key]
  }

  /**
   * Set a nested property in an object using dot notation
   * @param obj - The object or array to modify
   * @param keys - The path to the property, using dot notation
   * @param value - The value to set
   * @return The modified object
   */
  static set(obj: any, keys: string, value: any): any {
    if (typeof obj !== 'object' || obj === null) {
      obj = {}
    }

    const keysArray = String(keys).split('.')
    let current = obj

    for (let i = 0; i < keysArray.length - 1; i++) {
      const key = keysArray[i]
      if (!key) continue // Skip undefined keys
      
      // Convert to number if valid integer
      const numberKey = Number(key)
      const actualKey: string | number = Number.isInteger(numberKey) ? numberKey : key

      if (!(actualKey in current) || typeof current[actualKey] !== 'object') {
        // Determine if next key is numeric to decide between array or object
        const nextKey = keysArray[i + 1]
        const nextNumberKey = Number(nextKey)
        current[actualKey] = Number.isInteger(nextNumberKey) ? [] : {}
      }

      current = current[actualKey]
    }

    const lastKey = keysArray[keysArray.length - 1]
    if (lastKey !== undefined) {
      const numberKey = Number(lastKey)
      const actualLastKey: string | number = Number.isInteger(numberKey) ? numberKey : lastKey
      current[actualLastKey] = value
    }

    return obj
  }

  /**
   * Delete a nested property from an object using dot notation
   * @param obj - The object or array to modify
   * @param keys - The path to the property, using dot notation
   * @return True if the property was deleted, false otherwise
   */
  static delete(obj: any, keys: string): boolean {
    if (!this.has(obj, keys)) {
      return false
    }

    const keysArray = String(keys).split('.')
    const lastKey = keysArray.pop() as string
    
    if (keysArray.length === 0) {
      const numberKey = Number(lastKey)
      const actualKey = Number.isInteger(numberKey) ? numberKey : lastKey
      delete obj[actualKey]
      return true
    }

    const parent = this.get(obj, keysArray.join('.'))
    if (parent && typeof parent === 'object') {
      const numberKey = Number(lastKey)
      const actualKey = Number.isInteger(numberKey) ? numberKey : lastKey
      delete parent[actualKey]
      return true
    }

    return false
  }

  /**
   * Flatten an object with nested properties into dot notation
   * @param obj - The object to flatten
   * @param prefix - The prefix for keys (used recursively)
   * @return A flattened object with dot-notation keys
   */
  static flatten(obj: any, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {}

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key]
        const newKey = prefix ? `${prefix}.${key}` : key

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(result, this.flatten(value, newKey))
        } else {
          result[newKey] = value
        }
      }
    }

    return result
  }

  /**
   * Expand a flattened object with dot-notation keys back to nested structure
   * @param obj - The flattened object with dot-notation keys
   * @return The expanded nested object
   */
  static expand(obj: Record<string, any>): any {
    const result: any = {}

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        this.set(result, key, obj[key])
      }
    }

    return result
  }
}