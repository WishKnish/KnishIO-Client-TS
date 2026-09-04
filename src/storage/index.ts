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

import type { ISecretStorageProvider } from '@/types/storage'
import MemorySecretStorageProvider from './MemorySecretStorageProvider'
import WebCryptoSecretStorageProvider, { type IStorageBackend } from './WebCryptoSecretStorageProvider'

export interface CreateSecretStorageOptions {
  type?: 'webcrypto' | 'memory'
  defaultPassphrase?: string
  backend?: IStorageBackend
  hardwareBacked?: boolean
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
      hardwareBacked: options.hardwareBacked
    })
  }

  return new MemorySecretStorageProvider()
}
