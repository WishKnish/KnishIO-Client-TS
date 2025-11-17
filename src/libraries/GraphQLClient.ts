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

import {
  createClient,
  Client,
  subscriptionExchange,
  cacheExchange,
  fetchExchange
} from '@urql/core'
import { createClient as createWSClient } from 'graphql-ws'
import { pipe, subscribe } from 'wonka'
import type {
  GraphQLClient as IGraphQLClient,
  GraphQLRequest,
  GraphQLResponse
} from '@/types'
import type Wallet from '@/core/Wallet'

/**
 * GraphQL client wrapper for KnishIO SDK
 * Provides a unified interface for GraphQL operations
 */
export default class GraphQLClient implements IGraphQLClient {
  private $__client: Client
  private $__authToken: string = ''
  private $__pubkey: string | null = null
  private $__wallet: Wallet | null = null
  private serverUri: string
  private socketUri: string | null = null
  private cipherLink: boolean
  private $__subscriptionManager: Map<string, { unsubscribe: () => void }> = new Map()

  constructor({
    serverUri,
    socket = null,
    encrypt = false
  }: {
    serverUri: string
    socket?: { socketUri: string | null; appKey?: string } | null
    encrypt?: boolean
  }) {
    this.serverUri = serverUri
    this.socketUri = socket?.socketUri || null
    this.cipherLink = !!encrypt
    this.$__client = this.createUrqlClient({ serverUri, socket, encrypt })
  }

  private createUrqlClient({
    serverUri,
    socket
  }: {
    serverUri: string
    socket?: { socketUri: string | null } | null
    encrypt?: boolean
  }): Client {
    const exchanges = [cacheExchange, fetchExchange]

    // Add subscription support if socket is configured
    if (socket?.socketUri) {
      const wsClient = createWSClient({
        url: socket.socketUri,
        connectionParams: () => ({
          authToken: this.$__authToken
        })
      })

      exchanges.push(
        subscriptionExchange({
          forwardSubscription: (operation) => ({
            subscribe: (sink) => {
              const disposable = wsClient.subscribe(operation as any, sink as any)
              return { unsubscribe: disposable }
            }
          })
        })
      )
    }

    return createClient({
      url: serverUri,
      exchanges,
      fetchOptions: () => ({
        headers: {
          'X-Auth-Token': this.$__authToken
        },
        // Add 60 second timeout
        signal: AbortSignal.timeout(60000)
      })
    })
  }

  setAuthData({
    token,
    pubkey,
    wallet
  }: {
    token: string
    pubkey: string
    wallet?: Wallet
  }): void {
    this.$__authToken = token
    this.$__pubkey = pubkey
    this.$__wallet = wallet || null

    // Recreate client with new auth data
    this.$__client = this.createUrqlClient({
      serverUri: this.serverUri,
      socket: this.socketUri ? { socketUri: this.socketUri } : null,
      encrypt: this.cipherLink
    })
  }

  async query<TResult = unknown>(
    request: GraphQLRequest
  ): Promise<GraphQLResponse<TResult>> {
    const { query, variables } = request
    const result = await this.$__client.query(query, variables || {}).toPromise()
    return this.formatResponse<TResult>(result)
  }

  async mutation<TResult = unknown>(
    request: GraphQLRequest
  ): Promise<GraphQLResponse<TResult>> {
    const { query, variables } = request
    // Support both query and mutation properties for backward compatibility
    const mutationString = (request as any).mutation || query
    const result = await this.$__client.mutation(mutationString, variables || {}).toPromise()
    return this.formatResponse<TResult>(result)
  }

  // Alias for mutation() to match JS SDK interface
  async mutate<TResult = unknown>(
    request: GraphQLRequest
  ): Promise<GraphQLResponse<TResult>> {
    return this.mutation<TResult>(request)
  }

  async *subscription<TResult = unknown>(
    request: GraphQLRequest
  ): AsyncIterableIterator<GraphQLResponse<TResult>> {
    const { query, variables } = request

    // Create subscription stream
    const subscription = this.$__client.subscription(query, variables || {})

    // Convert wonka stream to async iterator
    const results: GraphQLResponse<TResult>[] = []
    const { unsubscribe } = pipe(
      subscription,
      subscribe((result) => {
        results.push(this.formatResponse<TResult>(result))
      })
    )

    try {
      while (true) {
        if (results.length > 0) {
          yield results.shift()!
        }
        // Small delay to prevent busy waiting
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    } finally {
      unsubscribe()
    }
  }

  subscribe(
    request: {
      query: string
      variables?: Record<string, any>
      operationName?: string
    },
    callback: (result: any) => void
  ): { unsubscribe: () => void } {
    const { query, variables, operationName = 'subscription' } = request

    const { unsubscribe } = pipe(
      this.$__client.subscription(query, variables || {}),
      subscribe((result) => {
        callback(this.formatResponse(result))
      })
    )

    // Store subscription for later cleanup
    this.$__subscriptionManager.set(operationName, { unsubscribe })

    return {
      unsubscribe: () => this.unsubscribe(operationName)
    }
  }

  private formatResponse<T>(result: any): GraphQLResponse<T> {
    // Match JS SDK (UrqlClientWrapper) response format exactly
    return {
      data: result.data,
      errors: result.error ? [result.error] : undefined
    } as GraphQLResponse<T>
  }

  unsubscribe(operationName: string): void {
    const subscription = this.$__subscriptionManager.get(operationName)
    if (subscription) {
      subscription.unsubscribe()
      this.$__subscriptionManager.delete(operationName)
    }
  }

  unsubscribeAll(): void {
    this.$__subscriptionManager.forEach((_subscription, operationName) => {
      this.unsubscribe(operationName)
    })
  }

  setEncryption(encrypt: boolean = false): void {
    this.cipherLink = encrypt
    this.$__client = this.createUrqlClient({
      serverUri: this.serverUri,
      socket: this.socketUri ? { socketUri: this.socketUri } : null,
      encrypt
    })
  }

  // Getters for compatibility
  getAuthToken(): string {
    return this.$__authToken
  }

  getPubKey(): string | null {
    return this.$__pubkey
  }

  getWallet(): Wallet | null {
    return this.$__wallet
  }

  getServerUri(): string {
    return this.serverUri
  }

  getSocketUri(): string | null {
    return this.socketUri
  }

  getUri(): string {
    return this.serverUri
  }

  setUri(uri: string): void {
    this.serverUri = uri
    this.$__client = this.createUrqlClient({
      serverUri: uri,
      socket: this.socketUri ? { socketUri: this.socketUri } : null,
      encrypt: this.cipherLink
    })
  }

  socketDisconnect(): void {
    if (this.socketUri) {
      this.unsubscribeAll()
    }
  }
}