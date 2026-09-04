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
 * Memory hygiene and zeroization utilities for sensitive cryptographic material
 */

const textEncoder = new TextEncoder()

/**
 * Overwrite byte array contents with zeros
 */
export function zeroizeBytes(buffer: Uint8Array | number[]): void {
  if (buffer instanceof Uint8Array) {
    buffer.fill(0)
  } else if (Array.isArray(buffer)) {
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = 0
    }
  }
}

/**
 * Execute a callback with a byte buffer and guarantee zeroization upon completion
 */
export async function withSecureBytes<T>(
  bytes: Uint8Array,
  fn: (bytes: Uint8Array) => Promise<T> | T
): Promise<T> {
  try {
    return await fn(bytes)
  } finally {
    zeroizeBytes(bytes)
  }
}

/**
 * Execute a callback with a secret string, ensuring temporary byte buffers are cleared
 */
export async function withSecureString<T>(
  secret: string,
  fn: (cleanSecret: string) => Promise<T> | T
): Promise<T> {
  const bytes = textEncoder.encode(secret)
  try {
    return await fn(secret)
  } finally {
    zeroizeBytes(bytes)
  }
}

/**
 * Constant-time comparison of two byte arrays or strings to prevent timing attacks
 */
export function constantTimeCompare(
  a: Uint8Array | string,
  b: Uint8Array | string
): boolean {
  const bytesA = typeof a === 'string' ? textEncoder.encode(a) : a
  const bytesB = typeof b === 'string' ? textEncoder.encode(b) : b

  let result = bytesA.length === bytesB.length ? 0 : 1
  const len = Math.min(bytesA.length, bytesB.length)

  for (let i = 0; i < len; i++) {
    const byteA = bytesA[i] ?? 0
    const byteB = bytesB[i] ?? 0
    result |= byteA ^ byteB
  }

  // Zeroize temporary buffers if they were converted from strings
  if (typeof a === 'string') zeroizeBytes(bytesA)
  if (typeof b === 'string') zeroizeBytes(bytesB)

  return result === 0
}
