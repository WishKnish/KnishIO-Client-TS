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
import type { IStorageBackend } from './WebCryptoSecretStorageProvider'
import {
  sealEnvelope,
  openEnvelope,
  uint8ArrayToBase64,
  base64ToUint8Array
} from './secretEnvelope'

export const PRF_SALT_LABEL = 'knishio:secret-storage:webauthn-prf:v1'
export const KEK_INFO = 'knishio:secret-storage:kek:v1'
const KEY_PREFIX = 'knishio:secret:'
const GCM_IV_LENGTH = 12

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function base64UrlEncode(bytes: Uint8Array): string {
  return uint8ArrayToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  return base64ToUint8Array(base64)
}
function toUint8Array(buf: BufferSource): Uint8Array {
  if (buf instanceof Uint8Array) {
    return buf
  }
  if (ArrayBuffer.isView(buf)) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
  }
  return new Uint8Array(buf)
}


async function computePrfSalt(): Promise<Uint8Array> {
  const hash = await globalThis.crypto.subtle.digest('SHA-256', textEncoder.encode(PRF_SALT_LABEL))
  return new Uint8Array(hash)
}

async function deriveKekFromPrf(prfOutput: Uint8Array, prfSalt: Uint8Array): Promise<CryptoKey> {
  const hkdfKey = await globalThis.crypto.subtle.importKey(
    'raw',
    prfOutput as BufferSource,
    'HKDF',
    false,
    ['deriveKey']
  )

  return await globalThis.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: prfSalt as BufferSource,
      info: textEncoder.encode(KEK_INFO)
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

interface StoredPrfRecord {
  version: number
  credentialId: string
  iv: string
  ciphertext: string
}

export interface WebAuthnPrfSecretStorageOptions {
  backend: IStorageBackend
  rp: { id?: string; name: string }
  user: { id: Uint8Array; name: string; displayName: string }
  credentials?: Pick<CredentialsContainer, 'create' | 'get'>
  alias?: string
}

/**
 * Passkey PRF secret storage provider.
 * Wraps a random device passphrase under a KEK derived from the WebAuthn PRF extension.
 * The PRF secret is authenticator-bound but custody is unattested (isHardwareBacked returns false).
 */
export default class WebAuthnPrfSecretStorageProvider implements ISecretStorageProvider {
  public readonly providerType = 'webauthn-prf'
  private backend: IStorageBackend
  private rp: { id?: string; name: string }
  private user: { id: Uint8Array; name: string; displayName: string }
  private credentialsContainer?: Pick<CredentialsContainer, 'create' | 'get'>
  private alias: string
  private cachedPassphrase?: string

  constructor(options: WebAuthnPrfSecretStorageOptions) {
    this.backend = options.backend
    this.rp = options.rp
    this.user = options.user
    this.credentialsContainer = options.credentials
    this.alias = options.alias ?? 'default'
  }

  private get credentials(): Pick<CredentialsContainer, 'create' | 'get'> {
    if (this.credentialsContainer) {
      return this.credentialsContainer
    }
    if (typeof globalThis.navigator !== 'undefined' && globalThis.navigator.credentials) {
      return globalThis.navigator.credentials
    }
    throw SecretStorageException.unavailable(
      this.providerType,
      'WebAuthn credentials container is not available'
    )
  }

  private get recordKey(): string {
    return `knishio:webauthn-prf:${this.alias}`
  }

  isHardwareBacked(): boolean {
    // The PRF secret is bound to the authenticator hardware, but the derived KEK
    // material is handled by page JS and passkey attestation is not verified here.
    return false
  }

  async isAvailable(): Promise<boolean> {
    const hasWebCrypto =
      typeof globalThis.crypto !== 'undefined' &&
      typeof globalThis.crypto.subtle !== 'undefined'
    const hasCredentials = Boolean(
      this.credentialsContainer ||
      (typeof globalThis.navigator !== 'undefined' &&
        globalThis.navigator.credentials &&
        typeof globalThis.PublicKeyCredential !== 'undefined')
    )
    return hasWebCrypto && hasCredentials
  }

  /**
   * Enroll a new passkey credential with PRF support and wrap a random device passphrase
   */
  async enroll(): Promise<void> {
    const existing = await this.backend.getItem(this.recordKey)
    if (existing) {
      return
    }

    if (!await this.isAvailable()) {
      throw SecretStorageException.unavailable(this.providerType, 'WebAuthn PRF is not available')
    }

    const challenge = new Uint8Array(32)
    globalThis.crypto.getRandomValues(challenge)

    const credential = (await this.credentials.create({
      publicKey: {
        rp: this.rp,
        user: {
          id: this.user.id as BufferSource,
          name: this.user.name,
          displayName: this.user.displayName
        },
        challenge: challenge as BufferSource,
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 }
        ],
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required'
        },
        extensions: {
          prf: {}
        }
      }
    })) as PublicKeyCredential | null

    if (!credential) {
      throw SecretStorageException.unavailable(this.providerType, 'Authenticator creation returned null')
    }

    const extResults = credential.getClientExtensionResults?.()
    if (extResults?.prf?.enabled !== true) {
      throw SecretStorageException.unavailable(
        this.providerType,
        'authenticator does not support the PRF extension'
      )
    }

    const credentialIdBytes = new Uint8Array(credential.rawId)
    const prfSalt = await computePrfSalt()

    const getChallenge = new Uint8Array(32)
    globalThis.crypto.getRandomValues(getChallenge)

    const assertion = (await this.credentials.get({
      publicKey: {
        challenge: getChallenge as BufferSource,
        rpId: this.rp.id,
        allowCredentials: [
          {
            type: 'public-key',
            id: credentialIdBytes as BufferSource
          }
        ],
        userVerification: 'required',
        extensions: {
          prf: {
            eval: {
              first: prfSalt as BufferSource
            }
          }
        }
      }
    })) as PublicKeyCredential | null

    const getExtResults = assertion?.getClientExtensionResults?.()
    const firstOutput = getExtResults?.prf?.results?.first
    if (!firstOutput) {
      throw SecretStorageException.unavailable(
        this.providerType,
        'authenticator returned no PRF result'
      )
    }

    const prfBytes = toUint8Array(firstOutput)
    const kek = await deriveKekFromPrf(prfBytes, prfSalt)

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

      const record: StoredPrfRecord = {
        version: 1,
        credentialId: base64UrlEncode(credentialIdBytes),
        iv: uint8ArrayToBase64(iv),
        ciphertext: uint8ArrayToBase64(new Uint8Array(encryptedBuffer))
      }

      await this.backend.setItem(this.recordKey, JSON.stringify(record))
      this.cachedPassphrase = devicePassphrase
    } finally {
      zeroizeBytes(passphraseBytes)
      zeroizeBytes(devicePassphraseBytes)
    }
  }

  /**
   * Unlock the device passphrase using the enrolled WebAuthn PRF credential
   */
  private async unlock(): Promise<string> {
    if (this.cachedPassphrase) {
      return this.cachedPassphrase
    }

    const rawRecord = await this.backend.getItem(this.recordKey)
    if (!rawRecord) {
      throw SecretStorageException.unavailable(
        this.providerType,
        'no enrolled credential; call enroll() first'
      )
    }

    let record: StoredPrfRecord
    try {
      record = JSON.parse(rawRecord)
    } catch {
      throw SecretStorageException.decryptionFailed('Corrupted PRF record format')
    }

    const credentialIdBytes = base64UrlDecode(record.credentialId)
    const prfSalt = await computePrfSalt()

    const challenge = new Uint8Array(32)
    globalThis.crypto.getRandomValues(challenge)

    const assertion = (await this.credentials.get({
      publicKey: {
        challenge: challenge as BufferSource,
        rpId: this.rp.id,
        allowCredentials: [
          {
            type: 'public-key',
            id: credentialIdBytes as BufferSource
          }
        ],
        userVerification: 'required',
        extensions: {
          prf: {
            eval: {
              first: prfSalt as BufferSource
            }
          }
        }
      }
    })) as PublicKeyCredential | null

    const extResults = assertion?.getClientExtensionResults?.()
    const firstOutput = extResults?.prf?.results?.first
    if (!firstOutput) {
      throw SecretStorageException.unavailable(
        this.providerType,
        'authenticator returned no PRF result'
      )
    }

    const prfBytes = toUint8Array(firstOutput)
    const kek = await deriveKekFromPrf(prfBytes, prfSalt)

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
        'wrapped device passphrase failed authentication under the enrolled credential'
      )
    }
  }

  /**
   * Lock the provider by clearing cached passphrase material
   */
  lock(): void {
    this.cachedPassphrase = undefined
  }

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
    if (options?.passphrase) {
      throw new SecretStorageException(
        'WebAuthnPrfSecretStorageProvider derives its passphrase from the authenticator; options.passphrase is not accepted'
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
  }

  async retrieveSecret(
    bundleHash: string,
    options?: { passphrase?: string }
  ): Promise<string | null> {
    if (options?.passphrase) {
      throw new SecretStorageException(
        'WebAuthnPrfSecretStorageProvider derives its passphrase from the authenticator; options.passphrase is not accepted'
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
        'WebAuthnPrfSecretStorageProvider derives its passphrase from the authenticator; options.passphrase is not accepted'
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
    const result = await this.backend.removeItem(key)
    return result !== false
  }

  async hasSecret(bundleHash: string): Promise<boolean> {
    const raw = await this.backend.getItem(`${KEY_PREFIX}${bundleHash}`)
    return raw !== null
  }

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
}
