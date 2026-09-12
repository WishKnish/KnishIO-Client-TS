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

export { default as MemorySecretStorageProvider } from './MemorySecretStorageProvider'
export {
  default as WebCryptoSecretStorageProvider,
  MemoryStorageBackend,
  type IStorageBackend
} from './WebCryptoSecretStorageProvider'
export { default as FileStorageBackend } from './FileStorageBackend'
export { default as WebStorageBackend } from './WebStorageBackend'
export {
  default as WebAuthnPrfSecretStorageProvider,
  type WebAuthnPrfSecretStorageOptions,
  PRF_SALT_LABEL,
  KEK_INFO
} from './WebAuthnPrfSecretStorageProvider'
export {
  default as NonExtractableKeySecretStorageProvider,
  type NonExtractableKeyStorageOptions,
  type IKeyStore,
  IndexedDbKeyStore,
  MemoryKeyStore
} from './NonExtractableKeySecretStorageProvider'
export {
  sealEnvelope,
  openEnvelope,
  uint8ArrayToBase64,
  base64ToUint8Array,
  deriveEnvelopeKey,
  ENVELOPE_ALGORITHM,
  DEFAULT_ITERATIONS,
  SECRET_KEY_PREFIX,
  RECOVERY_KEY_PREFIX
} from './secretEnvelope'

import type { ISecretStorageProvider } from '@/types/storage'
import MemorySecretStorageProvider from './MemorySecretStorageProvider'
import WebCryptoSecretStorageProvider, { type IStorageBackend } from './WebCryptoSecretStorageProvider'

export interface CreateSecretStorageOptions {
  type?: 'webcrypto' | 'memory'
  defaultPassphrase?: string
  backend?: IStorageBackend
}

/**
 * Factory function to create a secret storage provider
 */
export function createDefaultSecretStorage(
  options: CreateSecretStorageOptions = {}
): ISecretStorageProvider {
  if (options.type === 'memory') {
    return new MemorySecretStorageProvider()
  }

  // Default to WebCrypto if available
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.subtle !== 'undefined') {
    return new WebCryptoSecretStorageProvider({
      backend: options.backend,
      defaultPassphrase: options.defaultPassphrase,
    })
  }

  return new MemorySecretStorageProvider()
}
