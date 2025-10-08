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

import Wallet from '@/core/Wallet'

/**
 * AuthToken class for managing authentication tokens
 */
export default class AuthToken {
  private $__token: string
  private $__expiresAt: number
  private $__pubkey: string
  private $__encrypt: boolean
  private $__wallet?: Wallet

  /**
   * Create new AuthToken instance
   */
  constructor({
    token,
    expiresAt,
    encrypt,
    pubkey
  }: {
    token: string
    expiresAt: number
    encrypt: boolean
    pubkey: string
  }) {
    this.$__token = token
    this.$__expiresAt = expiresAt
    this.$__pubkey = pubkey
    this.$__encrypt = encrypt
  }

  /**
   * Static factory method to create AuthToken with wallet
   */
  static create(data: {
    token: string
    expiresAt: number
    encrypt: boolean
    pubkey: string
  }, wallet: Wallet): AuthToken {
    const authToken = new AuthToken(data)
    authToken.setWallet(wallet)
    return authToken
  }

  /**
   * Restore AuthToken from snapshot
   */
  static restore(snapshot: {
    token: string
    expiresAt: number
    pubkey: string
    encrypt: boolean
    wallet: {
      position: string
      characters: string | null
    }
  }, secret: string): AuthToken {
    const wallet = new Wallet({
      secret,
      token: 'AUTH',
      position: snapshot.wallet.position,
      characters: snapshot.wallet.characters
    })
    
    return AuthToken.create({
      token: snapshot.token,
      expiresAt: snapshot.expiresAt,
      pubkey: snapshot.pubkey,
      encrypt: snapshot.encrypt
    }, wallet)
  }

  /**
   * Set wallet for this auth token
   */
  setWallet(wallet: Wallet): void {
    this.$__wallet = wallet
  }

  /**
   * Get wallet
   */
  getWallet(): Wallet | undefined {
    return this.$__wallet
  }

  /**
   * Get auth token
   */
  getToken(): string {
    return this.$__token
  }

  /**
   * Get expiration timestamp
   */
  getExpiresAt(): number {
    return this.$__expiresAt
  }

  /**
   * Get public key
   */
  getPubkey(): string {
    return this.$__pubkey
  }

  /**
   * Check if encryption is enabled
   */
  isEncrypted(): boolean {
    return this.$__encrypt
  }

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    const now = Math.floor(Date.now() / 1000)
    return now >= this.$__expiresAt
  }

  /**
   * Get auth data for GraphQL client
   */
  getAuthData(): {
    token: string
    pubkey: string
    wallet: Wallet | undefined
  } {
    return {
      token: this.$__token,
      pubkey: this.$__pubkey,
      wallet: this.$__wallet
    }
  }

  /**
   * Create snapshot for persistence
   */
  toSnapshot(): {
    token: string
    expiresAt: number
    pubkey: string
    encrypt: boolean
    wallet?: {
      position: string | null
      characters: string | null
    }
  } {
    return {
      token: this.$__token,
      expiresAt: this.$__expiresAt,
      pubkey: this.$__pubkey,
      encrypt: this.$__encrypt,
      ...(this.$__wallet ? {
        wallet: {
          position: this.$__wallet.position,
          characters: this.$__wallet.characters
        }
      } : {})
    }
  }
}