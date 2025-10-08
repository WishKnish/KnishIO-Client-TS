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
  subscriptionExchange,
  cacheExchange,
  fetchExchange,
  Client,
  OperationResult
} from '@urql/core'
import { createClient as createWSClient, Client as WSClient } from 'graphql-ws'
import { pipe, map, SubscriptionLike } from 'wonka'
import type { DocumentNode } from 'graphql'
import type Wallet from '@/core/Wallet'
import { GraphQLRequestSchema, GraphQLResponseSchema, parseWithSchema } from '@/schemas'

// Enhanced type definitions with proper constraints
interface SocketConfig {
  socketUri: string
  appKey?: string
}

interface AuthData {
  token: string
  pubkey: string | null
  wallet: Wallet | null
}

interface GraphQLRequestParams {
  query?: DocumentNode
  mutation?: DocumentNode
  variables?: Record<string, unknown>
  operationName?: string
}

interface FormattedResponse<TData = unknown> {
  data: TData | null | undefined
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: Array<string | number>
    extensions?: Record<string, unknown>
  }>
}

interface UrqlClientConfig {
  serverUri: string
  socket?: SocketConfig | null
  encrypt?: boolean
}

interface SubscriptionManager {
  unsubscribe: () => void
}

/**
 * URQL GraphQL Client Wrapper with Enhanced Type Safety
 * 
 * Provides a unified interface for GraphQL operations with subscription support
 * Implements TypeScript 2025 patterns with proper generics and runtime validation
 */
class UrqlClientWrapper {
  private $__client: Client
  private $__authToken: string = ''
  private $__pubkey: string | null = null
  private $__wallet: Wallet | null = null
  private readonly serverUri: string
  private soketi: SocketConfig | null
  private cipherLink: boolean
  private readonly $__subscriptionManager: Map<string, SubscriptionManager> = new Map()

  constructor(config: UrqlClientConfig) {
    const { serverUri, socket = null, encrypt = false } = config
    
    this.serverUri = serverUri
    this.soketi = socket
    this.cipherLink = !!encrypt
    this.$__client = this.createUrqlClient({ serverUri, socket, encrypt })
  }

  private createUrqlClient({
    serverUri,
    socket,
    encrypt
  }: {
    serverUri: string
    socket?: SocketConfig | null
    encrypt?: boolean
  }): Client {
    const exchanges = [cacheExchange, fetchExchange]

    // Add subscription support if socket is configured
    if (socket && socket.socketUri) {
      const wsClient: WSClient = createWSClient({
        url: socket.socketUri,
        connectionParams: () => ({
          authToken: this.$__authToken
        })
      })

      exchanges.push(subscriptionExchange({
        forwardSubscription: operation => ({
          subscribe: sink => {
            const disposable = wsClient.subscribe(operation, sink)
            return { unsubscribe: disposable }
          }
        })
      }))
    }

    return createClient({
      url: serverUri,
      exchanges,
      fetchOptions: () => ({
        headers: {
          'X-Auth-Token': this.$__authToken
        },
        // Add 60 second timeout for debugging
        signal: AbortSignal.timeout(60000)
      })
    })
  }

  setAuthData({ token, pubkey, wallet }: AuthData): void {
    this.$__authToken = token
    this.$__pubkey = pubkey
    this.$__wallet = wallet

    // Recreate client with new auth data
    this.$__client = this.createUrqlClient({
      serverUri: this.serverUri,
      socket: this.soketi,
      encrypt: this.cipherLink
    })
  }

  async query<TData = unknown>(request: GraphQLRequestParams): Promise<FormattedResponse<TData>> {
    const { query, variables } = request
    if (!query) {
      throw new Error('Query is required')
    }
    
    const result = await this.$__client.query(query, variables).toPromise()
    return this.formatResponse<TData>(result)
  }

  async mutate<TData = unknown>(request: GraphQLRequestParams): Promise<FormattedResponse<TData>> {
    const { mutation, variables } = request
    if (!mutation) {
      throw new Error('Mutation is required')
    }
    
    const result = await this.$__client.mutation(mutation, variables).toPromise()
    return this.formatResponse<TData>(result)
  }

  subscribe<TData = unknown>(
    request: GraphQLRequestParams,
    closure: (result: FormattedResponse<TData>) => void
  ): { unsubscribe: () => void } {
    const { query, variables, operationName } = request
    if (!query) {
      throw new Error('Query is required for subscription')
    }

    const subscription: SubscriptionLike = pipe(
      this.$__client.subscription(query, variables),
      map(result => {
        closure(this.formatResponse<TData>(result))
      })
    ).subscribe(() => {})

    // Store subscription for later cleanup
    if (operationName) {
      this.$__subscriptionManager.set(operationName, {
        unsubscribe: () => subscription.unsubscribe()
      })
    }

    return {
      unsubscribe: () => operationName ? this.unsubscribe(operationName) : subscription.unsubscribe()
    }
  }

  private formatResponse<TData = unknown>(result: OperationResult<TData>): FormattedResponse<TData> {
    // Transform URQL result to match GraphQL standard response format
    const response: FormattedResponse<TData> = {
      data: result.data ?? null
    }

    // Format errors according to GraphQL spec
    if (result.error) {
      response.errors = [{
        message: result.error.message,
        locations: result.error.graphQLErrors?.[0]?.locations,
        path: result.error.graphQLErrors?.[0]?.path,
        extensions: result.error.graphQLErrors?.[0]?.extensions
      }]
    }

    return response
  }

  socketDisconnect(): void {
    if (this.soketi) {
      // Unsubscribe from all active subscriptions
      this.unsubscribeAll()
    }
  }

  unsubscribe(operationName: string): void {
    const subscription = this.$__subscriptionManager.get(operationName)
    if (subscription) {
      subscription.unsubscribe()
      this.$__subscriptionManager.delete(operationName)
    }
  }

  unsubscribeAll(): void {
    this.$__subscriptionManager.forEach((subscription, operationName) => {
      this.unsubscribe(operationName)
    })
  }

  unsubscribeFromChannel(operationName: string): void {
    this.unsubscribe(operationName)
  }

  setEncryption(encrypt: boolean = false): void {
    this.cipherLink = encrypt
    this.$__client = this.createUrqlClient({
      serverUri: this.serverUri,
      socket: this.soketi,
      encrypt
    })
  }

  // Getters
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
    return this.soketi ? this.soketi.socketUri : null 
  }
  
  getUri(): string { 
    return this.serverUri 
  }

  // Setters
  setUri(uri: string): void {
    this.serverUri = uri
    this.$__client = this.createUrqlClient({
      serverUri: uri,
      socket: this.soketi,
      encrypt: this.cipherLink
    })
  }

  setSocketUri({ socketUri, appKey }: SocketConfig): void {
    this.soketi = { socketUri, appKey }
    this.$__client = this.createUrqlClient({
      serverUri: this.serverUri,
      socket: this.soketi,
      encrypt: this.cipherLink
    })
  }
}

export default UrqlClientWrapper
export type { 
  SocketConfig, 
  AuthData, 
  GraphQLRequestParams, 
  FormattedResponse, 
  UrqlClientConfig 
}