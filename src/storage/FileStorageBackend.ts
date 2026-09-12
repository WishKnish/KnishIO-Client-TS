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

import type { IStorageBackend } from './WebCryptoSecretStorageProvider'
import SecretStorageException from '@/exception/SecretStorageException'

/**
 * Node-only persistent file storage backend.
 * Stores key-value entries in a JSON file with restrictive permissions (0o600).
 * Uses temporary file writing followed by atomic rename to prevent corruption.
 */
export default class FileStorageBackend implements IStorageBackend {
  readonly filePath: string
  private store: Map<string, string> = new Map()
  private loaded = false

  constructor(filePath: string) {
    if (!filePath) {
      throw new SecretStorageException('Storage file path cannot be empty')
    }
    this.filePath = filePath
  }

  private async getFs() {
    try {
      // Platform-specific: node:fs and node:path do not exist in browser runtimes
      // and cannot be statically imported without breaking browser bundles.
      const fs = await import('node:fs/promises')
      const path = await import('node:path')
      return { fs, path }
    } catch {
      throw SecretStorageException.unavailable(
        'file-storage',
        'FileStorageBackend is only supported in Node.js environments with node:fs access'
      )
    }
  }

  private async ensureLoaded(): Promise<Map<string, string>> {
    if (this.loaded) {
      return this.store
    }

    const { fs } = await this.getFs()

    try {
      const content = await fs.readFile(this.filePath, 'utf8')
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(content)
      } catch {
        throw SecretStorageException.decryptionFailed('Corrupted storage file format')
      }

      if (parsed && typeof parsed === 'object') {
        this.store = new Map(Object.entries(parsed).map(([k, v]) => [k, String(v)]))
      }
    } catch (err: unknown) {
      if (err instanceof SecretStorageException) {
        throw err
      }
      // If file does not exist (ENOENT), treat as empty map
      const nodeErr = err as { code?: string }
      if (nodeErr?.code !== 'ENOENT') {
        const msg = err instanceof Error ? err.message : String(err)
        throw new SecretStorageException(`Failed to read storage file: ${msg}`)
      }
      this.store = new Map()
    }

    this.loaded = true
    return this.store
  }

  private async persist(): Promise<void> {
    const { fs, path } = await this.getFs()

    const dir = path.dirname(this.filePath)
    if (dir && dir !== '.') {
      await fs.mkdir(dir, { recursive: true })
    }

    const tmpPath = `${this.filePath}.tmp.${Date.now()}_${Math.random().toString(36).slice(2)}`
    const data = JSON.stringify(Object.fromEntries(this.store), null, 2)

    try {
      await fs.writeFile(tmpPath, data, { mode: 0o600, encoding: 'utf8' })
      if (typeof process !== 'undefined' && process.platform !== 'win32') {
        try {
          await fs.chmod(tmpPath, 0o600)
        } catch {
          // Ignore chmod errors if file system does not support it
        }
      }
      await fs.rename(tmpPath, this.filePath)
    } catch (err: unknown) {
      try {
        await fs.unlink(tmpPath)
      } catch {
        // Ignore unlink cleanup error
      }
      const msg = err instanceof Error ? err.message : String(err)
      throw new SecretStorageException(`Failed to persist storage file: ${msg}`)
    }
  }

  async getItem(key: string): Promise<string | null> {
    await this.ensureLoaded()
    return this.store.get(key) ?? null
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.ensureLoaded()
    this.store.set(key, value)
    await this.persist()
  }

  async removeItem(key: string): Promise<boolean> {
    await this.ensureLoaded()
    const existed = this.store.delete(key)
    if (existed) {
      await this.persist()
    }
    return existed
  }

  async keys(): Promise<string[]> {
    await this.ensureLoaded()
    return Array.from(this.store.keys())
  }
}
