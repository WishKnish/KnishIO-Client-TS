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

import type { EncryptedSecretPayload, SecretStorageMetadata } from '@/types/storage'
import SecretStorageException from '@/exception/SecretStorageException'
import { zeroizeBytes } from '@/libraries/secureMemory'

export const ENVELOPE_ALGORITHM = 'AES-GCM'
export const DEFAULT_ITERATIONS = 100000
export const SECRET_KEY_PREFIX = 'knishio:secret:'
export const RECOVERY_KEY_PREFIX = 'knishio:recovery:'
const GCM_IV_LENGTH = 12
const SALT_LENGTH = 16

const textEncoder = new TextEncoder()

/**
 * Helper to convert Uint8Array to base64
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    const byte = bytes[i]
    if (byte !== undefined) {
      binary += String.fromCharCode(byte)
    }
  }
  return btoa(binary)
}

/**
 * Helper to convert base64 to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Derive an AES-GCM CryptoKey from a passphrase and salt using PBKDF2
 */
export async function deriveEnvelopeKey(
  passphrase: string,
  salt: Uint8Array,
  iterations = DEFAULT_ITERATIONS
): Promise<CryptoKey> {
  if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle === 'undefined') {
    throw new SecretStorageException('WebCrypto API is not available')
  }

  const passphraseBytes = textEncoder.encode(passphrase)
  try {
    const baseKey = await globalThis.crypto.subtle.importKey(
      'raw',
      passphraseBytes,
      'PBKDF2',
      false,
      ['deriveKey']
    )

    return await globalThis.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  } finally {
    zeroizeBytes(passphraseBytes)
  }
}

/**
 * Seal a secret string into an EncryptedSecretPayload envelope
 */
export async function sealEnvelope(
  secret: string,
  passphrase: string,
  metadata: SecretStorageMetadata
): Promise<EncryptedSecretPayload> {
  if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle === 'undefined') {
    throw new SecretStorageException('WebCrypto API is not available')
  }

  const salt = new Uint8Array(SALT_LENGTH)
  const iv = new Uint8Array(GCM_IV_LENGTH)
  globalThis.crypto.getRandomValues(salt)
  globalThis.crypto.getRandomValues(iv)

  const key = await deriveEnvelopeKey(passphrase, salt, DEFAULT_ITERATIONS)
  const secretBytes = textEncoder.encode(secret)

  try {
    const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
      {
        name: ENVELOPE_ALGORITHM,
        iv: iv as BufferSource
      },
      key,
      secretBytes
    )

    const ciphertext = uint8ArrayToBase64(new Uint8Array(encryptedBuffer))
    return {
      version: 1,
      ciphertext,
      iv: uint8ArrayToBase64(iv),
      salt: uint8ArrayToBase64(salt),
      algorithm: ENVELOPE_ALGORITHM,
      iterations: DEFAULT_ITERATIONS,
      metadata
    }
  } finally {
    zeroizeBytes(secretBytes)
  }
}

/**
 * Open an EncryptedSecretPayload envelope with a passphrase, returning the decrypted secret bytes
 */
export async function openEnvelope(
  payload: EncryptedSecretPayload,
  passphrase: string
): Promise<Uint8Array> {
  if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle === 'undefined') {
    throw new SecretStorageException('WebCrypto API is not available')
  }

  const salt = base64ToUint8Array(payload.salt)
  const iv = base64ToUint8Array(payload.iv)
  const ciphertext = base64ToUint8Array(payload.ciphertext)

  const key = await deriveEnvelopeKey(passphrase, salt, payload.iterations ?? DEFAULT_ITERATIONS)
  const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
    {
      name: ENVELOPE_ALGORITHM,
      iv: iv as BufferSource
    },
    key,
    ciphertext as BufferSource
  )

  return new Uint8Array(decryptedBuffer)
}
