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

import type { ISecretStorageProvider, SecretStorageMetadata } from '@/types/storage'
import SecretStorageException from '@/exception/SecretStorageException'
import { withSecureString } from '@/libraries/secureMemory'

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
    options?: { label?: string; passphrase?: string }
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
  }
}
