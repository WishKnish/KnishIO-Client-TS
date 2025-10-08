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
 * Create Uint8Array buffers from hexadecimal strings, and vice versa.
 */

// Global polyfill for environments that don't have self
if (typeof self === 'undefined') {
  // @ts-ignore - Polyfill for environments without self
  globalThis.self = globalThis
}

interface HexOptions {
  grouping?: number
  rowlength?: number
  uppercase?: boolean
}

export default class Hex {
  /**
   * Converts the given buffer to a string containing its hexadecimal representation.
   */
  static toHex(arr: ArrayLike<number> | ArrayBuffer | Uint8Array, options?: HexOptions): string {
    const numberToHex = (val: number, uppercase: boolean): string => {
      const set = uppercase
        ? ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
        : ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']

      return set[Math.floor(val / 16)] + set[val % 16]
    }

    const opts: Required<HexOptions> = Object.assign(
      {
        grouping: 0,
        rowlength: 0,
        uppercase: false
      },
      options || {}
    )

    // Convert to array-like structure for consistent access
    let arrayLike: ArrayLike<number>
    if (arr instanceof ArrayBuffer) {
      arrayLike = new Uint8Array(arr)
    } else {
      arrayLike = arr as ArrayLike<number>
    }

    let str = ''
    let group = 0
    let column = 0

    for (let i = 0; i < arrayLike.length; ++i) {
      str += numberToHex(arrayLike[i], opts.uppercase)

      if (i === arrayLike.length - 1) {
        break
      }

      if (opts.grouping > 0 && ++group === opts.grouping) {
        group = 0

        if (opts.rowlength > 0 && ++column === opts.rowlength) {
          column = 0
          str += '\n'
        } else {
          str += ' '
        }
      }
    }

    return str
  }

  /**
   * Takes a string containing hexadecimal and returns the equivalent as a Uint8Array buffer.
   * 
   * Whitespace is ignored. If an odd number of characters are specified,
   * it will act as if preceded with a leading 0; that is, "FFF" is equivalent to "0FFF".
   */
  static toUint8Array(str: string): Uint8Array {
    let target = str.toLowerCase().replace(/\s/g, '')

    if (target.length % 2 === 1) {
      target = `0${target}`
    }

    const buffer = new Uint8Array(Math.floor(target.length / 2))
    let curr = -1

    for (let i = 0; i < target.length; ++i) {
      const c = target[i]
      const val = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'].indexOf(c)

      if (val === -1) {
        throw new Error('unexpected character')
      }

      if (curr === -1) {
        curr = 16 * val
      } else {
        buffer[Math.floor(i / 2)] = curr + val
        curr = -1
      }
    }

    return buffer
  }
}