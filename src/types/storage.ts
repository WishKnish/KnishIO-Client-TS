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

/**
 * Secret storage and hardware envelope encryption interfaces for KnishIO SDK
 * Enables secure persistence of master secrets across platforms (Web, Node, Mobile)
 */

export interface SecretStorageMetadata {
  bundleHash: string
  label?: string
  createdAt: number
  hardwareBacked: boolean
  providerType: string
}

export interface EncryptedSecretPayload {
  version: 1
  ciphertext: string // Base64 encoded
  iv: string         // Base64 encoded
  salt: string       // Base64 encoded
  tag?: string       // Base64 encoded for algorithms separating tag
  algorithm: 'AES-GCM' | 'AES-CBC'
  iterations?: number
  metadata: SecretStorageMetadata
}

export interface ISecretStorageProvider {
  /**
   * Unique identifier for this storage provider implementation
   */
  readonly providerType: string

  /**
   * Whether this provider is backed by hardware (TPM, Secure Enclave, StrongBox)
   */
  isHardwareBacked(): boolean

  /**
   * Check if the storage backend is available in the current environment
   */
  isAvailable(): Promise<boolean>

  /**
   * Store and encrypt a master secret for the given bundle
   */
  storeSecret(
    bundleHash: string,
    secret: string,
    options?: { label?: string; passphrase?: string }
  ): Promise<void>

  /**
   * Retrieve and decrypt the master secret for the given bundle
   */
  retrieveSecret(
    bundleHash: string,
    options?: { passphrase?: string }
  ): Promise<string | null>

  /**
   * Delete a stored secret
   */
  deleteSecret(bundleHash: string): Promise<boolean>

  /**
   * Check if a secret exists for the given bundle
   */
  hasSecret(bundleHash: string): Promise<boolean>

  /**
   * List all stored secret metadata without exposing plaintext secrets
   */
  listSecrets(): Promise<SecretStorageMetadata[]>

  /**
   * Execute a function with the unwrapped secret and zeroize memory upon completion
   */
  withSecret<T>(
    bundleHash: string,
    fn: (secret: string) => Promise<T> | T,
    options?: { passphrase?: string }
  ): Promise<T>
}
