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
 * Persisted session shape. Shared by {@link AuthToken.restore} and {@link AuthToken.toSnapshot}
 * so the two can never drift: a field either round-trips or neither side compiles.
 *
 * `wallet.mlKemParameterSet` is optional because snapshots persisted before ML-KEM-1024 became
 * the default do not carry it — see {@link AuthToken.resolveMlKemParameterSet}. `wallet.token` is
 * optional because snapshots persisted before re-logins were signed from the USER ContinuID
 * wallet do not carry it; every such session was signed from an AUTH wallet.
 */
export type AuthTokenSnapshot = {
  token: string
  expiresAt: number
  pubkey: string
  encrypt: boolean
  wallet?: {
    token?: string
    position: string | null
    characters: string | null
    mlKemParameterSet?: 1024 | 768
  }
}

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
   * ML-KEM parameter set a restored session must use, resolved in three tiers:
   * an explicit snapshot field, then the stored validator key's length, then ML-KEM-768.
   *
   * The final tier is deliberately NOT the constructor default. A snapshot with neither an
   * explicit field nor a recognisable key can only have come from a pre-bump build, and every
   * pre-bump build was 768-only — defaulting to 1024 would make the restored wallet advertise
   * a public key the validator never recorded for that token.
   */
  static resolveMlKemParameterSet(snapshot: AuthTokenSnapshot): 1024 | 768 {
    const explicit = snapshot.wallet?.mlKemParameterSet
    if (explicit) {
      return Number(explicit) === 768 ? 768 : 1024
    }
    return Wallet.mlKemParameterSetFromPubkey(snapshot.pubkey) ?? 768
  }

  /**
   * Restore AuthToken from snapshot
   */
  static restore(snapshot: AuthTokenSnapshot, secret: string): AuthToken {
    const wallet = new Wallet({
      secret,
      token: snapshot.wallet?.token ?? 'AUTH',
      position: snapshot.wallet?.position ?? null,
      characters: snapshot.wallet?.characters ?? null,
      mlKemParameterSet: AuthToken.resolveMlKemParameterSet(snapshot)
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
   * Get expire interval in milliseconds (matching JS SDK pattern)
   */
  getExpireInterval(): number {
    return (this.$__expiresAt * 1000) - Date.now()
  }

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    return !this.$__expiresAt || this.getExpireInterval() < 0
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
   * Create snapshot for persistence. The wallet's ML-KEM parameter set is recorded beside its
   * position and characters so a stepped-back ML-KEM-768 session restores as 768 rather than
   * silently taking the constructor default.
   */
  toSnapshot(): AuthTokenSnapshot {
    return {
      token: this.$__token,
      expiresAt: this.$__expiresAt,
      pubkey: this.$__pubkey,
      encrypt: this.$__encrypt,
      ...(this.$__wallet ? {
        wallet: {
          token: this.$__wallet.token,
          position: this.$__wallet.position,
          characters: this.$__wallet.characters,
          mlKemParameterSet: this.$__wallet.mlKemParameterSet
        }
      } : {})
    }
  }
}