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
import { withSecureString, zeroizeBytes } from '@/libraries/secureMemory'
import { sealEnvelope, openEnvelope } from './secretEnvelope'

interface MemorySecretEntry {
  secret: string
  metadata: SecretStorageMetadata
}

/**
 * In-memory secret storage provider
 * Used for testing, headless runners, and backward-compatible fallback
 */
export default class MemorySecretStorageProvider implements ISecretStorageProvider {
  public readonly providerType = 'memory'
  private secrets: Map<string, MemorySecretEntry> = new Map()
  private recoverySecrets: Map<string, string> = new Map()

  /**
   * Memory storage is not hardware backed
   */
  isHardwareBacked(): boolean {
    return false
  }

  /**
   * Memory storage is always available
   */
  async isAvailable(): Promise<boolean> {
    return true
  }

  /**
   * Store a secret in memory
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

    const metadata: SecretStorageMetadata = {
      bundleHash,
      label: options?.label,
      createdAt: Date.now(),
      hardwareBacked: false,
      providerType: this.providerType
    }

    this.secrets.set(bundleHash, { secret, metadata })

    if (options?.recoveryPassphrase) {
      const recoveryMetadata: SecretStorageMetadata = {
        bundleHash,
        label: options?.label,
        createdAt: Date.now(),
        hardwareBacked: false,
        providerType: 'webcrypto-aes-gcm'
      }
      const recoveryPayload = await sealEnvelope(secret, options.recoveryPassphrase, recoveryMetadata)
      this.recoverySecrets.set(bundleHash, JSON.stringify(recoveryPayload))
    }
  }

  /**
   * Retrieve a secret from memory
   */
  async retrieveSecret(bundleHash: string): Promise<string | null> {
    const entry = this.secrets.get(bundleHash)
    return entry ? entry.secret : null
  }

  /**
   * Delete a stored secret
   */
  async deleteSecret(bundleHash: string): Promise<boolean> {
    this.recoverySecrets.delete(bundleHash)
    return this.secrets.delete(bundleHash)
  }

  /**
   * Check if a secret exists
   */
  async hasSecret(bundleHash: string): Promise<boolean> {
    return this.secrets.has(bundleHash)
  }

  /**
   * List all stored secret metadata
   */
  async listSecrets(): Promise<SecretStorageMetadata[]> {
    return Array.from(this.secrets.values()).map(entry => ({ ...entry.metadata }))
  }

  /**
   * Execute callback with unwrapped secret and ensure cleanup
   */
  async withSecret<T>(
    bundleHash: string,
    fn: (secret: string) => Promise<T> | T
  ): Promise<T> {
    const entry = this.secrets.get(bundleHash)
    if (!entry) {
      throw SecretStorageException.notFound(bundleHash)
    }

    return withSecureString(entry.secret, fn)
  }

  /**
   * Clear all secrets from memory
   */
  clear(): void {
    this.secrets.clear()
    this.recoverySecrets.clear()
  }

  /**
   * Recover a secret using its recovery envelope and restore it
   */
  async recoverSecret(
    bundleHash: string,
    recoveryPassphrase: string,
    options?: { label?: string }
  ): Promise<void> {
    if (!bundleHash) {
      throw new SecretStorageException('Bundle hash cannot be empty')
    }
    if (!recoveryPassphrase) {
      throw new SecretStorageException('Recovery passphrase cannot be empty')
    }

    const raw = this.recoverySecrets.get(bundleHash)
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
      secretStr = new TextDecoder().decode(decryptedBytes)
    } finally {
      zeroizeBytes(decryptedBytes)
    }

    await this.storeSecret(bundleHash, secretStr, {
      ...options,
      recoveryPassphrase
    })
  }
}
