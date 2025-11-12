/**
 * Array utility functions
 * Essential utilities for KnishIO SDK operations
 */

/**
 * Deep clone an object or array
 * Matches JavaScript SDK deepCloning function exactly
 * Used by Molecule.toJSON() and other operations requiring immutable copies
 */
export function deepCloning<T>(
  o: T,  // Object to clone
  h?: any[]  // Cache for circular reference handling
): T {
  let i: any
  let r: any
  let x: any

  const t = [Array, Date, Number, String, Boolean]  // Types to treat specially
  const s = Object.prototype.toString  // Shortcut to toString
  h = h || []  // Create cache if not provided

  // Search cache for our object (handle circular references)
  for (i = 0; i < h.length; i += 2) {
    if (o === h[i]) {
      return h[i + 1] as T
    }
  }

  // Clone o if it is an uncached object and not null
  if (!r && o && typeof o === 'object') {
    r = {}  // Default result template: plain object

    // Handle special types by comparing toString outputs
    for (i = 0; i < t.length; i++) {
      // @ts-ignore - Dynamic type construction
      if (s.call(o) === s.call(x = new t[i](o as any))) {
        r = i ? x : []
      }
    }

    h.push(o, r)  // Add to cache before recursive call

    // Copy properties recursively
    for (i in o) {
      if (Object.prototype.hasOwnProperty.call(o, i)) {
        r[i] = deepCloning((o as any)[i], h)
      }
    }
  }

  return r || o
}

/**
 * Split an array into chunks of specified size
 * Used for batch processing operations
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  if (!arr.length) {
    return []
  }

  return [arr.slice(0, size)].concat(chunkArray(arr.slice(size), size))
}

/**
 * Find elements that are different between arrays
 * Returns elements that are unique to each array
 */
export function diff<T>(...arrays: T[][]): T[] {
  return [].concat(...arrays.map((arr, i) => {
    const others = arrays.slice(0)
    others.splice(i, 1)
    const unique: T[] = [...new Set([].concat(...others as any))] as T[]
    return arr.filter(item => !unique.includes(item))
  }) as any)
}

/**
 * Find common elements across all arrays
 * Returns only elements present in all arrays
 */
export function intersect<T>(...arrays: T[][]): T[] {
  if (arrays.length === 0) return []
  if (arrays.length === 1) return arrays[0]!
  
  return arrays.reduce((first, second) => 
    first.filter(item => second.includes(item))
  )
}