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

const CIPHER_HASH_QUERY = 'query ( $Hash: String! ) { CipherHash ( Hash: $Hash ) { hash } }'

/**
 * Light parse of a GraphQL request body's operation type + root field name, for the CipherHash
 * bypass decision (no full GraphQL parse needed). Operation type = the first query/mutation/
 * subscription keyword (default 'query' for an anonymous `{ ... }`); root field = the first
 * identifier inside the top-level selection set.
 */
function parseOperation(query: string): { type: string; name: string } {
  const typeMatch = (query || '').match(/\b(query|mutation|subscription)\b/i)
  const type = typeMatch?.[1]?.toLowerCase() ?? 'query'
  const braceIdx = (query || '').indexOf('{')
  const nameMatch = braceIdx >= 0 ? query.slice(braceIdx + 1).match(/[A-Za-z_][A-Za-z0-9_]*/) : null
  return { type, name: nameMatch?.[0] ?? '' }
}

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
      // PQ-transport Phase E: when encryption is on, route fetch through the CipherHash wrapper
      // (encrypt the request body to the validator's ML-KEM pubkey, decrypt the response).
      // Omitted → urql uses the global fetch (plaintext).
      ...(this.cipherLink ? { fetch: ((input: any, init: any) => this.cipherFetch(input, init)) as typeof fetch } : {}),
      fetchOptions: () => ({
        headers: {
          'X-Auth-Token': this.$__authToken
        },
        // Add 60 second timeout
        signal: AbortSignal.timeout(60000)
      })
    })
  }

  /**
   * Whether an outgoing GraphQL request body should be wrapped in CipherHash. Bypass (plaintext):
   * introspection `__schema`, `ContinuId`, the `AccessToken` mutation, and the U-isotope
   * `ProposeMolecule` (auth bootstrap — the key exchange itself can't be encrypted). Mirrors the
   * Kotlin/PHP/validator bypass set.
   */
  private shouldEncrypt(body: string): boolean {
    let parsed: any
    try {
      parsed = JSON.parse(body)
    } catch (e) {
      return false
    }
    const { type, name } = parseOperation(parsed.query)
    if (type === 'query' && (name === '__schema' || name === 'ContinuId')) return false
    if (type === 'mutation' && name === 'AccessToken') return false
    if (type === 'mutation' && name === 'ProposeMolecule') {
      const isotope = parsed.variables?.molecule?.atoms?.[0]?.isotope
      if (isotope === 'U') return false
    }
    return true
  }

  /**
   * Custom `fetch` that wraps a GraphQL request in the ML-KEM CipherHash envelope and decrypts the
   * response (PQ-transport Phase E). Operates on the raw POST body (mirrors the JS/Kotlin transform).
   * Reads the CURRENT client wallet + validator pubkey from auth.
   */
  private async cipherFetch(input: any, init: any): Promise<Response> {
    const wallet = this.$__wallet
    const serverPubkey = this.$__pubkey
    let encryptedRequest = false
    let requestInit = init

    if (wallet && serverPubkey && init && typeof init.body === 'string' && this.shouldEncrypt(init.body)) {
      const hashVar = await wallet.encryptStringML768(init.body, serverPubkey)
      requestInit = { ...init, body: JSON.stringify({ query: CIPHER_HASH_QUERY, variables: { Hash: hashVar } }) }
      encryptedRequest = true
    }

    const response = await fetch(input, requestInit)
    if (!encryptedRequest) {
      return response
    }

    // Decrypt the CipherHash response back to the inner GraphQL response JSON.
    const text = await response.text()
    const init2 = { status: response.status, statusText: response.statusText, headers: response.headers }
    let parsed: any
    try {
      parsed = JSON.parse(text)
    } catch (e) {
      return new Response(text, init2)
    }
    const hash = parsed?.data?.CipherHash?.hash
    if (typeof hash !== 'string') {
      // Plaintext (e.g. a validator-side error response) — pass through unchanged.
      return new Response(text, init2)
    }
    const decrypted = await wallet!.decryptMyMessageML768(JSON.parse(hash))
    return new Response(decrypted != null ? decrypted : text, init2)
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
    const { query, variables, context } = request
    // Forward the urql context (e.g. requestPolicy: 'network-only'). Without
    // this 3rd arg urql ignores requestPolicy and defaults to cache-first,
    // serving stale results from a long-lived client's in-memory cache.
    const result = await this.$__client.query(query, variables || {}, context).toPromise()
    return this.formatResponse<TResult>(result)
  }

  async mutation<TResult = unknown>(
    request: GraphQLRequest
  ): Promise<GraphQLResponse<TResult>> {
    const { query, variables, context } = request
    // Support both query and mutation properties for backward compatibility
    const mutationString = (request as any).mutation || query
    const result = await this.$__client.mutation(mutationString, variables || {}, context).toPromise()
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

  /**
   * F-8a (cross-SDK parity, 2026-06-03): re-point the GraphQL-subscription WebSocket
   * without changing the HTTP endpoint. `setUri` only updates `serverUri`, leaving the
   * subscription socket pinned to whatever was passed at construction; this lets a
   * caller re-derive the socket when the endpoint changes.
   */
  setSocketUri(socketUri: string): void {
    this.socketUri = socketUri
    this.$__client = this.createUrqlClient({
      serverUri: this.serverUri,
      socket: { socketUri },
      encrypt: this.cipherLink
    })
  }

  socketDisconnect(): void {
    if (this.socketUri) {
      this.unsubscribeAll()
    }
  }
}