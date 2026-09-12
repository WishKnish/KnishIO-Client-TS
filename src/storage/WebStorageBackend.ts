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
 * Browser persistent storage backend wrapping Web Storage (localStorage or sessionStorage).
 * Adapts the Web Storage API (length + key(i)) to IStorageBackend.keys(), filtering
 * by a prefix (defaults to 'knishio:') so unrelated items are ignored.
 */
export default class WebStorageBackend implements IStorageBackend {
  private readonly storage: Storage
  readonly prefix: string

  constructor(storage?: Storage, prefix = 'knishio:') {
    if (storage) {
      this.storage = storage
    } else if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      this.storage = globalThis.localStorage
    } else {
      throw SecretStorageException.unavailable(
        'web-storage',
        'WebStorageBackend requires a Storage object or global localStorage'
      )
    }
    this.prefix = prefix
  }

  getItem(key: string): string | null {
    return this.storage.getItem(key)
  }

  setItem(key: string, value: string): void {
    this.storage.setItem(key, value)
  }

  removeItem(key: string): boolean {
    const existed = this.storage.getItem(key) !== null
    this.storage.removeItem(key)
    return existed
  }

  keys(): string[] {
    const result: string[] = []
    const len = this.storage.length
    for (let i = 0; i < len; i++) {
      const k = this.storage.key(i)
      if (k !== null) {
        if (!this.prefix || k.startsWith(this.prefix)) {
          result.push(k)
        }
      }
    }
    return result
  }
}
