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
import type { IStorageBackend } from './WebCryptoSecretStorageProvider'
import {
  sealEnvelope,
  openEnvelope,
  uint8ArrayToBase64,
  base64ToUint8Array,
  SECRET_KEY_PREFIX,
  RECOVERY_KEY_PREFIX
} from './secretEnvelope'

const KEY_PREFIX = SECRET_KEY_PREFIX
const GCM_IV_LENGTH = 12

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

/**
 * Key store interface for storing non-extractable CryptoKeys
 */
export interface IKeyStore {
  get(name: string): Promise<CryptoKey | undefined>
  put(name: string, key: CryptoKey): Promise<void>
  delete(name: string): Promise<boolean>
}

/**
 * In-memory key store for tests and non-browser environments
 */
export class MemoryKeyStore implements IKeyStore {
  private keys: Map<string, CryptoKey> = new Map()

  async get(name: string): Promise<CryptoKey | undefined> {
    return this.keys.get(name)
  }

  async put(name: string, key: CryptoKey): Promise<void> {
    this.keys.set(name, key)
  }

  async delete(name: string): Promise<boolean> {
    return this.keys.delete(name)
  }
}

/**
 * IndexedDB key store for browser environments
 */
export class IndexedDbKeyStore implements IKeyStore {
  private dbName: string
  private storeName = 'keys'

  constructor(dbName = 'knishio-secret-storage') {
    this.dbName = dbName
  }

  // Executor form intentionally retained for browser runtime compatibility with ES2022 / browsers without Promise.withResolvers polyfill
  private async getDb(): Promise<IDBDatabase> {
    if (typeof globalThis.indexedDB === 'undefined') {
      throw SecretStorageException.unavailable(
        'webcrypto-nonextractable',
        'IndexedDB is not available'
      )
    }

    return new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open(this.dbName, 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async get(name: string): Promise<CryptoKey | undefined> {
    const db = await this.getDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly')
      const store = tx.objectStore(this.storeName)
      const request = store.get(name)
      request.onsuccess = () => resolve(request.result as CryptoKey | undefined)
      request.onerror = () => reject(request.error)
    })
  }

  async put(name: string, key: CryptoKey): Promise<void> {
    const db = await this.getDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite')
      const store = tx.objectStore(this.storeName)
      const request = store.put(key, name)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async delete(name: string): Promise<boolean> {
    const db = await this.getDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite')
      const store = tx.objectStore(this.storeName)
      const request = store.delete(name)
      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }
}

interface StoredKeyRecord {
  version: number
  iv: string
  ciphertext: string
}

export interface NonExtractableKeyStorageOptions {
  backend: IStorageBackend
  keyStore?: IKeyStore
  alias?: string
}

/**
 * Secret storage provider backed by a non-extractable CryptoKey stored in IndexedDB.
 * The KEK cannot be exported from the browser's WebCrypto context.
 */
export default class NonExtractableKeySecretStorageProvider implements ISecretStorageProvider {
  public readonly providerType = 'webcrypto-nonextractable'
  private backend: IStorageBackend
  private keyStore: IKeyStore
  private alias: string
  private cachedPassphrase?: string

  constructor(options: NonExtractableKeyStorageOptions) {
    this.backend = options.backend
    this.keyStore = options.keyStore ?? new IndexedDbKeyStore()
    this.alias = options.alias ?? 'default'
  }

  private get recordKey(): string {
    return `knishio:kek:webcrypto-nonextractable:${this.alias}`
  }

  private get kekStoreKey(): string {
    return `knishio:kek:${this.alias}`
  }

  isHardwareBacked(): boolean {
    // Non-extractable WebCrypto keys prevent JS extraction, but are not verified
    // hardware-enclave keys.
    return false
  }

  async isAvailable(): Promise<boolean> {
    return (
      typeof globalThis.crypto !== 'undefined' &&
      typeof globalThis.crypto.subtle !== 'undefined'
    )
  }

  /**
   * Unlock or initialize the device passphrase using the non-extractable KEK
   */
  private async unlock(): Promise<string> {
    if (this.cachedPassphrase) {
      return this.cachedPassphrase
    }

    if (!await this.isAvailable()) {
      throw SecretStorageException.unavailable(
        this.providerType,
        'WebCrypto API is not available'
      )
    }

    const rawRecord = await this.backend.getItem(this.recordKey)
    if (!rawRecord) {
      // First use: create non-extractable KEK and wrap new device passphrase
      let kek = await this.keyStore.get(this.kekStoreKey)
      if (!kek) {
        kek = await globalThis.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        )
        await this.keyStore.put(this.kekStoreKey, kek)
      }

      const devicePassphraseBytes = new Uint8Array(32)
      globalThis.crypto.getRandomValues(devicePassphraseBytes)
      const devicePassphrase = uint8ArrayToBase64(devicePassphraseBytes)

      const iv = new Uint8Array(GCM_IV_LENGTH)
      globalThis.crypto.getRandomValues(iv)

      const passphraseBytes = textEncoder.encode(devicePassphrase)
      try {
        const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv: iv as BufferSource
          },
          kek,
          passphraseBytes
        )

        const record: StoredKeyRecord = {
          version: 1,
          iv: uint8ArrayToBase64(iv),
          ciphertext: uint8ArrayToBase64(new Uint8Array(encryptedBuffer))
        }

        await this.backend.setItem(this.recordKey, JSON.stringify(record))
        this.cachedPassphrase = devicePassphrase
        return devicePassphrase
      } finally {
        zeroizeBytes(passphraseBytes)
        zeroizeBytes(devicePassphraseBytes)
      }
    }

    // Subsequent use: unwrap device passphrase with stored KEK
    let record: StoredKeyRecord
    try {
      record = JSON.parse(rawRecord)
    } catch {
      throw SecretStorageException.decryptionFailed('Corrupted key record format')
    }

    const kek = await this.keyStore.get(this.kekStoreKey)
    if (!kek) {
      throw SecretStorageException.unavailable(
        this.providerType,
        `no non-extractable key found for alias '${this.alias}'`
      )
    }

    const iv = base64ToUint8Array(record.iv)
    const ciphertext = base64ToUint8Array(record.ciphertext)

    try {
      const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as BufferSource
        },
        kek,
        ciphertext as BufferSource
      )

      const decryptedBytes = new Uint8Array(decryptedBuffer)
      try {
        this.cachedPassphrase = textDecoder.decode(decryptedBytes)
        return this.cachedPassphrase
      } finally {
        zeroizeBytes(decryptedBytes)
      }
    } catch {
      throw SecretStorageException.decryptionFailed(
        'wrapped device passphrase failed authentication under non-extractable key'
      )
    }
  }

  /**
   * Lock the provider by clearing cached passphrase material
   */
  lock(): void {
    this.cachedPassphrase = undefined
  }
  /**
   * Unenroll the non-extractable key, removing the stored wrapped record and KEK
   */
  async unenroll(): Promise<void> {
    this.lock()
    await this.backend.removeItem(this.recordKey)
    await this.keyStore.delete(this.kekStoreKey)
  }
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
    if (options?.passphrase) {
      throw new SecretStorageException(
        'NonExtractableKeySecretStorageProvider derives its passphrase from the non-extractable device key; options.passphrase is not accepted'
      )
    }

    if (!options?.recoveryPassphrase && !options?.allowUnrecoverable) {
      throw SecretStorageException.validationError(
        'Recovery passphrase required for non-exportable hardware key unless allowUnrecoverable is true'
      )
    }

    const passphrase = await this.unlock()
    const metadata: SecretStorageMetadata = {
      bundleHash,
      label: options?.label,
      createdAt: Date.now(),
      hardwareBacked: false,
      providerType: this.providerType
    }

    const payload: EncryptedSecretPayload = await sealEnvelope(secret, passphrase, metadata)
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
  }

  async retrieveSecret(
    bundleHash: string,
    options?: { passphrase?: string }
  ): Promise<string | null> {
    if (options?.passphrase) {
      throw new SecretStorageException(
        'NonExtractableKeySecretStorageProvider derives its passphrase from the non-extractable device key; options.passphrase is not accepted'
      )
    }

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

    const passphrase = await this.unlock()
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

  async withSecret<T>(
    bundleHash: string,
    fn: (secret: string) => Promise<T> | T,
    options?: { passphrase?: string }
  ): Promise<T> {
    if (options?.passphrase) {
      throw new SecretStorageException(
        'NonExtractableKeySecretStorageProvider derives its passphrase from the non-extractable device key; options.passphrase is not accepted'
      )
    }

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

    const passphrase = await this.unlock()
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

  async deleteSecret(bundleHash: string): Promise<boolean> {
    const key = `${KEY_PREFIX}${bundleHash}`
    const recoveryKey = `${RECOVERY_KEY_PREFIX}${bundleHash}`
    const result = await this.backend.removeItem(key)
    await this.backend.removeItem(recoveryKey)
    return result !== false
  }

  async hasSecret(bundleHash: string): Promise<boolean> {
    const raw = await this.backend.getItem(`${KEY_PREFIX}${bundleHash}`)
    return raw !== null
  }

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
   * Recover a secret using its recovery envelope and re-enroll it under a fresh non-extractable KEK
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

    await this.storeSecret(bundleHash, secretStr, {
      ...options,
      recoveryPassphrase
    })
  }
}
