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

import type {
  ISecretStorageProvider,
  SecretStorageMetadata,
  EncryptedSecretPayload
} from '@/types/storage'
import SecretStorageException from '@/exception/SecretStorageException'
import { zeroizeBytes, withSecureBytes } from '@/libraries/secureMemory'

/**
 * Storage backend adapter interface (supports Memory, LocalStorage, IndexedDB, etc.)
 */
export interface IStorageBackend {
  getItem(key: string): Promise<string | null> | string | null
  setItem(key: string, value: string): Promise<void> | void
  removeItem(key: string): Promise<boolean | void> | boolean | void
  keys(): Promise<string[]> | string[]
}

/**
 * Default in-memory backend
 */
export class MemoryStorageBackend implements IStorageBackend {
  private store: Map<string, string> = new Map()

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  removeItem(key: string): boolean {
    return this.store.delete(key)
  }

  keys(): string[] {
    return Array.from(this.store.keys())
  }
}

/**
 * Helper to convert Uint8Array to base64
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
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
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()
const KEY_PREFIX = 'knishio:secret:'
const DEFAULT_ITERATIONS = 100000

/**
 * Hardware-compatible envelope encryption secret storage provider
 * Uses WebCrypto AES-GCM (256-bit) with PBKDF2-HMAC-SHA256 key derivation
 */
export default class WebCryptoSecretStorageProvider implements ISecretStorageProvider {
  public readonly providerType = 'webcrypto-aes-gcm'
  private backend: IStorageBackend
  private defaultPassphrase?: string
  private hardwareBacked: boolean

  constructor(options: {
    backend?: IStorageBackend
    defaultPassphrase?: string
    hardwareBacked?: boolean
  } = {}) {
    this.backend = options.backend ?? new MemoryStorageBackend()
    this.defaultPassphrase = options.defaultPassphrase
    this.hardwareBacked = options.hardwareBacked ?? false
  }

  /**
   * Whether this provider is backed by hardware (e.g. WebAuthn PRF wrapping)
   */
  isHardwareBacked(): boolean {
    return this.hardwareBacked
  }

  /**
   * Check if WebCrypto subtle API is available
   */
  async isAvailable(): Promise<boolean> {
    return (
      typeof globalThis.crypto !== 'undefined' &&
      typeof globalThis.crypto.subtle !== 'undefined'
    )
  }

  /**
   * Derive an AES-GCM CryptoKey from a passphrase and salt using PBKDF2
   */
  private async deriveKey(passphrase: string, salt: Uint8Array, iterations = DEFAULT_ITERATIONS): Promise<CryptoKey> {
    if (!await this.isAvailable()) {
      throw SecretStorageException.unavailable(this.providerType, 'WebCrypto API is not available')
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
   * Store and encrypt a master secret
   */
  async storeSecret(
    bundleHash: string,
    secret: string,
    options?: { label?: string; passphrase?: string }
  ): Promise<void> {
    if (!bundleHash) {
      throw new SecretStorageException('Bundle hash cannot be empty')
    }
    if (!secret) {
      throw new SecretStorageException('Secret cannot be empty')
    }

    const passphrase = options?.passphrase ?? this.defaultPassphrase
    if (!passphrase) {
      throw new SecretStorageException('Passphrase required for envelope encryption')
    }

    const salt = new Uint8Array(16)
    const iv = new Uint8Array(12)
    globalThis.crypto.getRandomValues(salt)
    globalThis.crypto.getRandomValues(iv)

    const key = await this.deriveKey(passphrase, salt, DEFAULT_ITERATIONS)
    const secretBytes = textEncoder.encode(secret)

    try {
      const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv as BufferSource
        },
        key,
        secretBytes
      )

      const ciphertext = uint8ArrayToBase64(new Uint8Array(encryptedBuffer))
      const metadata: SecretStorageMetadata = {
        bundleHash,
        label: options?.label,
        createdAt: Date.now(),
        hardwareBacked: this.hardwareBacked,
        providerType: this.providerType
      }

      const payload: EncryptedSecretPayload = {
        version: 1,
        ciphertext,
        iv: uint8ArrayToBase64(iv),
        salt: uint8ArrayToBase64(salt),
        algorithm: 'AES-GCM',
        iterations: DEFAULT_ITERATIONS,
        metadata
      }

      await this.backend.setItem(`${KEY_PREFIX}${bundleHash}`, JSON.stringify(payload))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new SecretStorageException(`Encryption failed: ${msg}`)
    } finally {
      zeroizeBytes(secretBytes)
    }
  }

  /**
   * Retrieve and decrypt the master secret
   */
  async retrieveSecret(
    bundleHash: string,
    options?: { passphrase?: string }
  ): Promise<string | null> {
    const raw = await this.backend.getItem(`${KEY_PREFIX}${bundleHash}`)
    if (!raw) {
      return null
    }

    let payload: EncryptedSecretPayload
    try {
      payload = JSON.parse(raw)
    } catch {
      throw SecretStorageException.decryptionFailed('Corrupted payload format')
    }

    const passphrase = options?.passphrase ?? this.defaultPassphrase
    if (!passphrase) {
      throw new SecretStorageException('Passphrase required for secret decryption')
    }

    const salt = base64ToUint8Array(payload.salt)
    const iv = base64ToUint8Array(payload.iv)
    const ciphertext = base64ToUint8Array(payload.ciphertext)

    try {
      const key = await this.deriveKey(passphrase, salt, payload.iterations ?? DEFAULT_ITERATIONS)
      const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as BufferSource
        },
        key,
        ciphertext as BufferSource
      )

      const decryptedBytes = new Uint8Array(decryptedBuffer)
      try {
        return textDecoder.decode(decryptedBytes)
      } finally {
        zeroizeBytes(decryptedBytes)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw SecretStorageException.decryptionFailed(msg)
    }
  }

  /**
   * Delete a stored secret
   */
  async deleteSecret(bundleHash: string): Promise<boolean> {
    const key = `${KEY_PREFIX}${bundleHash}`
    const result = await this.backend.removeItem(key)
    return result !== false
  }

  /**
   * Check if a secret exists
   */
  async hasSecret(bundleHash: string): Promise<boolean> {
    const raw = await this.backend.getItem(`${KEY_PREFIX}${bundleHash}`)
    return raw !== null
  }

  /**
   * List all stored secret metadata
   */
  async listSecrets(): Promise<SecretStorageMetadata[]> {
    const keys = await this.backend.keys()
    const matchingKeys = keys.filter(k => k.startsWith(KEY_PREFIX))
    const results: SecretStorageMetadata[] = []

    for (const key of matchingKeys) {
      const raw = await this.backend.getItem(key)
      if (raw) {
        try {
          const payload = JSON.parse(raw) as EncryptedSecretPayload
          if (payload.metadata) {
            results.push(payload.metadata)
          }
        } catch {
          // Ignore unparseable entries
        }
      }
    }

    return results
  }

  /**
   * Execute callback with unwrapped secret, zeroizing the decrypted buffer upon completion
   */
  async withSecret<T>(
    bundleHash: string,
    fn: (secret: string) => Promise<T> | T,
    options?: { passphrase?: string }
  ): Promise<T> {
    const raw = await this.backend.getItem(`${KEY_PREFIX}${bundleHash}`)
    if (!raw) {
      throw SecretStorageException.notFound(bundleHash)
    }

    let payload: EncryptedSecretPayload
    try {
      payload = JSON.parse(raw)
    } catch {
      throw SecretStorageException.decryptionFailed('Corrupted payload format')
    }

    const passphrase = options?.passphrase ?? this.defaultPassphrase
    if (!passphrase) {
      throw new SecretStorageException('Passphrase required for secret decryption')
    }

    const salt = base64ToUint8Array(payload.salt)
    const iv = base64ToUint8Array(payload.iv)
    const ciphertext = base64ToUint8Array(payload.ciphertext)

    try {
      const key = await this.deriveKey(passphrase, salt, payload.iterations ?? DEFAULT_ITERATIONS)
      const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as BufferSource
        },
        key,
        ciphertext as BufferSource
      )

      const decryptedBytes = new Uint8Array(decryptedBuffer)
      return await withSecureBytes(decryptedBytes, async (bytes) => {
        const secretString = textDecoder.decode(bytes)
        return await fn(secretString)
      })
    } catch (err: unknown) {
      if (err instanceof SecretStorageException) {
        throw err
      }
      const msg = err instanceof Error ? err.message : String(err)
      throw SecretStorageException.decryptionFailed(msg)
    }
  }
}
