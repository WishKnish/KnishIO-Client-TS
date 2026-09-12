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
  EncryptedSecretPayload,
  StorageOptions
} from '@/types/storage'
import SecretStorageException from '@/exception/SecretStorageException'
import { zeroizeBytes, withSecureBytes } from '@/libraries/secureMemory'
import {
  sealEnvelope,
  openEnvelope,
  SECRET_KEY_PREFIX,
  RECOVERY_KEY_PREFIX
} from './secretEnvelope'

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


const textDecoder = new TextDecoder()
const KEY_PREFIX = SECRET_KEY_PREFIX
/**
 * Software envelope-encryption secret storage provider: WebCrypto AES-256-GCM with PBKDF2-HMAC-SHA256.
 * Writes the cross-SDK envelope format; never hardware-backed.
 */
export default class WebCryptoSecretStorageProvider implements ISecretStorageProvider {
  public readonly providerType = 'webcrypto-aes-gcm'
  private backend: IStorageBackend
  private defaultPassphrase?: string

  constructor(options: {
    backend?: IStorageBackend
    defaultPassphrase?: string
  } = {}) {
    this.backend = options.backend ?? new MemoryStorageBackend()
    this.defaultPassphrase = options.defaultPassphrase
  }

  /**
   * True only when this provider holds a non-exportable key inside platform-secure
   * hardware (Android TEE/StrongBox, Secure Enclave, TPM) and learned that from the
   * platform itself — never from a caller argument. Software envelope providers
   * return false. The value is persisted as `metadata.hardwareBacked` in every
   * envelope this provider writes.
   */
  isHardwareBacked(): boolean {
    return false
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
   * Store and encrypt a master secret
   */
  async storeSecret(
    bundleHash: string,
    secret: string,
    options?: StorageOptions
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

    if (!await this.isAvailable()) {
      throw SecretStorageException.unavailable(this.providerType, 'WebCrypto API is not available')
    }

    try {
      const metadata: SecretStorageMetadata = {
        bundleHash,
        label: options?.label,
        createdAt: Date.now(),
        hardwareBacked: false,
        providerType: this.providerType
      }

      const payload = await sealEnvelope(secret, passphrase, metadata)
      await this.backend.setItem(`${KEY_PREFIX}${bundleHash}`, JSON.stringify(payload))

      if (options?.recoveryPassphrase) {
        const recoveryMetadata: SecretStorageMetadata = {
          bundleHash,
          label: options?.label,
          createdAt: Date.now(),
          hardwareBacked: false,
          providerType: 'webcrypto-aes-gcm'
        }
        const recoveryPayload = await sealEnvelope(secret, options.recoveryPassphrase, recoveryMetadata)
        await this.backend.setItem(`${RECOVERY_KEY_PREFIX}${bundleHash}`, JSON.stringify(recoveryPayload))
      }
    } catch (err: unknown) {
      if (err instanceof SecretStorageException) {
        throw err
      }
      const msg = err instanceof Error ? err.message : String(err)
      throw new SecretStorageException(`Encryption failed: ${msg}`)
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

    if (!await this.isAvailable()) {
      throw SecretStorageException.unavailable(this.providerType, 'WebCrypto API is not available')
    }

    try {
      const decryptedBytes = await openEnvelope(payload, passphrase)
      try {
        return textDecoder.decode(decryptedBytes)
      } finally {
        zeroizeBytes(decryptedBytes)
      }
    } catch (err: unknown) {
      if (err instanceof SecretStorageException) {
        throw err
      }
      const msg = err instanceof Error ? err.message : String(err)
      throw SecretStorageException.decryptionFailed(msg)
    }
  }

  /**
   * Delete a stored secret
   */
  async deleteSecret(bundleHash: string): Promise<boolean> {
    const key = `${KEY_PREFIX}${bundleHash}`
    const recoveryKey = `${RECOVERY_KEY_PREFIX}${bundleHash}`
    const result = await this.backend.removeItem(key)
    await this.backend.removeItem(recoveryKey)
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
    const matchingKeys = keys.filter(k => k.startsWith(KEY_PREFIX) && !k.startsWith(RECOVERY_KEY_PREFIX))
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

    if (!await this.isAvailable()) {
      throw SecretStorageException.unavailable(this.providerType, 'WebCrypto API is not available')
    }

    try {
      const decryptedBytes = await openEnvelope(payload, passphrase)
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

  /**
   * Recover a secret using its recovery envelope and re-enroll it
   */
  async recoverSecret(
    bundleHash: string,
    recoveryPassphrase: string,
    options?: { label?: string; passphrase?: string }
  ): Promise<void> {
    if (!bundleHash) {
      throw new SecretStorageException('Bundle hash cannot be empty')
    }
    if (!recoveryPassphrase) {
      throw new SecretStorageException('Recovery passphrase cannot be empty')
    }

    const raw = await this.backend.getItem(`${RECOVERY_KEY_PREFIX}${bundleHash}`)
    if (!raw) {
      throw SecretStorageException.notFound(bundleHash)
    }

    let payload: EncryptedSecretPayload
    try {
      payload = JSON.parse(raw)
    } catch {
      throw SecretStorageException.decryptionFailed('Corrupted recovery payload format')
    }

    let decryptedBytes: Uint8Array
    try {
      decryptedBytes = await openEnvelope(payload, recoveryPassphrase)
    } catch (err: unknown) {
      if (err instanceof SecretStorageException) {
        throw err
      }
      const msg = err instanceof Error ? err.message : String(err)
      throw SecretStorageException.decryptionFailed(msg)
    }

    let secretStr: string
    try {
      secretStr = textDecoder.decode(decryptedBytes)
    } finally {
      zeroizeBytes(decryptedBytes)
    }

    const storePassphrase = options?.passphrase ?? this.defaultPassphrase ?? recoveryPassphrase
    await this.storeSecret(bundleHash, secretStr, {
      ...options,
      passphrase: storePassphrase,
      recoveryPassphrase
    })
  }
}
