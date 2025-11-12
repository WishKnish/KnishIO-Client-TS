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
 * GraphQL type definitions for KnishIO SDK
 * Provides type safety for all GraphQL operations
 */

import type {
  WalletAddress,
  BundleHash,
  TokenSlug,
  MetaType,
  MetaId,
  CellSlug,
  AtomIsotope,
  MetaData
} from './index'

// =============================================================================
// BASE GRAPHQL TYPES
// =============================================================================

export interface GraphQLRequest {
  query: string
  variables?: Record<string, unknown>
  operationName?: string | null
}

export interface GraphQLResponse<T = unknown> {
  data?: T | null
  errors?: GraphQLError[] | null
  extensions?: Record<string, unknown> | null
}

export interface GraphQLError {
  message: string
  locations?: Array<{
    line: number
    column: number
  }>
  path?: Array<string | number>
  extensions?: Record<string, unknown>
}

export interface GraphQLVariables {
  [key: string]: unknown
}

// =============================================================================
// QUERY OPERATION TYPES
// =============================================================================

export interface QueryOperation<TVariables = GraphQLVariables, TResult = unknown> {
  query(): string
  variables: TVariables
  createResponse(data: unknown): TResult
  getVariables(): TVariables
}

export interface QueryContinuIdVariables {
  bundle: BundleHash | string
}

export interface QueryContinuIdResult {
  ContinuId: {
    bundle: BundleHash
    position: string
    createdAt: string
  } | null
}

export interface QueryWalletBundleVariables {
  bundleHashes: Array<BundleHash | string>
}

export interface QueryWalletBundleResult {
  WalletBundle: Array<{
    bundleHash: BundleHash
    wallets: Array<{
      address: WalletAddress
      token: TokenSlug
      balance: string
      position: string
    }>
  }>
}

export interface QueryWalletListVariables {
  bundleHash?: BundleHash | string | null
  tokenSlug?: TokenSlug | string | null
  unspent?: boolean | null
  limit?: number | null
  offset?: number | null
}

export interface QueryWalletListResult {
  WalletList: Array<{
    address: WalletAddress
    token: TokenSlug
    balance: string
    position: string
    createdAt: string
  }>
}

export interface QueryBalanceVariables {
  bundleHash?: BundleHash | string | null
  address?: WalletAddress | string | null
  token?: TokenSlug | string | null
  type?: 'token' | 'user' | null
  unspent?: boolean | null
}

export interface QueryBalanceResult {
  Balance: Array<{
    address: WalletAddress
    position: string
    amount: string
    characters: string | null
    token: TokenSlug
  }>
}

export interface QueryMetaTypeVariables {
  metaType: MetaType | string
  metaId?: MetaId | string | null
  key?: string | null
  value?: string | null
  latest?: boolean | null
  filter?: string | null
  queryArgs?: Record<string, unknown> | null
  count?: number | null
  countBy?: string | null
  cellSlug?: CellSlug | string | null
}

export interface QueryMetaTypeResult {
  MetaType: Array<{
    metaType: MetaType
    metaId: MetaId
    meta: MetaData
    createdAt: string
  }>
}

export interface QueryBatchVariables {
  batchId: string
}

export interface QueryBatchResult {
  Batch: {
    batchId: string
    molecularHash: string
    height: number
    atoms: Array<{
      position: string
      walletAddress: WalletAddress
      isotope: AtomIsotope
      token: TokenSlug
      value: string | null
      createdAt: string
    }>
  } | null
}

export interface QueryActiveSessionVariables {
  bundleHash?: BundleHash | string | null
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
}

export interface QueryActiveSessionResult {
  ActiveSession: {
    sessionId: string
    bundleHash: BundleHash
    status: 'active' | 'expired' | 'inactive'
    createdAt: string
    expiresAt: string
  } | null
}

export interface QueryAtomVariables {
  position?: string | null
  isotope?: AtomIsotope | null
  token?: TokenSlug | string | null
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
  limit?: number | null
  offset?: number | null
}

export interface QueryAtomResult {
  Atom: Array<{
    position: string
    walletAddress: WalletAddress
    isotope: AtomIsotope
    token: TokenSlug
    value: string | null
    batchId: string | null
    metaType: MetaType | null
    metaId: MetaId | null
    meta: MetaData | null
    createdAt: string
    index: number
  }>
}

// =============================================================================
// MUTATION OPERATION TYPES
// =============================================================================

export interface MutationOperation<TVariables = GraphQLVariables, TResult = unknown> {
  createRequest(variables: TVariables): GraphQLRequest
  createResponse(data: unknown): TResult
  fillMolecule?(variables: TVariables): Promise<void>
}

export interface MutationProposeMoleculeVariables {
  molecule: {
    molecularHash: string
    cellSlug: CellSlug | string | null
    atoms: Array<{
      position: string
      walletAddress: WalletAddress
      isotope: AtomIsotope
      token: TokenSlug
      value: string | null
      batchId: string | null
      metaType: MetaType | string | null
      metaId: MetaId | string | null
      meta: MetaData[] | null
      otsFragment: string | null
      index: number
      createdAt: string
    }>
    createdAt: string
  }
}

export interface MutationProposeMoleculeResult {
  ProposeMolecule: {
    molecularHash: string
    status: 'accepted' | 'rejected' | 'pending'
    response: string | null
    createdAt: string
  }
}

export interface MutationRequestAuthorizationVariables {
  bundleHash?: BundleHash | string | null
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
  cellSlug?: CellSlug | string | null
  molecule: MutationProposeMoleculeVariables['molecule']
}

export interface MutationRequestAuthorizationResult {
  RequestAuthorization: {
    authToken: string
    expiresAt: number
    pubkey: string
    encrypt: boolean
    molecularHash: string
  }
}

export interface MutationCreateTokenVariables {
  token: TokenSlug | string
  amount: string
  fungible?: boolean
  splittable?: number | null
  supplyToken?: TokenSlug | string | null
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
  meta?: MetaData | null
  molecule: MutationProposeMoleculeVariables['molecule']
}

export interface MutationCreateTokenResult {
  CreateToken: {
    token: TokenSlug
    amount: string
    fungible: boolean
    molecularHash: string
    createdAt: string
  }
}

export interface MutationTransferTokensVariables {
  recipient: WalletAddress | string
  amount: string
  token?: TokenSlug | string
  remainder?: boolean
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
  meta?: MetaData | null
  molecule: MutationProposeMoleculeVariables['molecule']
}

export interface MutationTransferTokensResult {
  TransferTokens: {
    molecularHash: string
    amount: string
    recipient: WalletAddress
    remainder: string | null
    createdAt: string
  }
}

export interface MutationCreateMetaVariables {
  metaType: MetaType | string
  metaId: MetaId | string
  meta: MetaData
  molecule: MutationProposeMoleculeVariables['molecule']
}

export interface MutationCreateMetaResult {
  CreateMeta: {
    metaType: MetaType
    metaId: MetaId
    meta: MetaData
    molecularHash: string
    createdAt: string
  }
}

export interface MutationActiveSessionVariables {
  bundleHash: BundleHash | string
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
}

export interface MutationActiveSessionResult {
  ActiveSession: {
    sessionId: string
    bundleHash: BundleHash
    status: 'active' | 'inactive'
    expiresAt: string
    createdAt: string
  }
}

export interface MutationRequestAuthorizationGuestVariables {
  cellSlug?: CellSlug | string | null
}

export interface MutationRequestAuthorizationGuestResult {
  RequestAuthorizationGuest: {
    authToken: string
    expiresAt: number
  }
}

// =============================================================================
// SUBSCRIPTION OPERATION TYPES
// =============================================================================

export interface SubscriptionOperation<TVariables = GraphQLVariables, TResult = unknown> {
  createRequest(variables: TVariables): GraphQLRequest
  handleData(data: unknown): TResult
}

export interface CreateMoleculeSubscribeVariables {
  operationName?: string
  bundleHash?: BundleHash | string | null
}

export interface CreateMoleculeSubscribeResult {
  CreateMolecule: {
    molecularHash: string
    status: 'accepted' | 'rejected' | 'pending'
    bundleHash: BundleHash
    atoms: Array<{
      position: string
      walletAddress: WalletAddress
      isotope: AtomIsotope
      token: TokenSlug
      value: string | null
    }>
    createdAt: string
  }
}

export interface WalletStatusSubscribeVariables {
  bundleHash: BundleHash | string
}

export interface WalletStatusSubscribeResult {
  WalletStatus: {
    bundleHash: BundleHash
    address: WalletAddress
    token: TokenSlug
    balance: string
    status: 'active' | 'inactive' | 'depleted'
    updatedAt: string
  }
}

export interface ActiveWalletSubscribeVariables {
  bundleHash: BundleHash | string
  token?: TokenSlug | string | null
}

export interface ActiveWalletSubscribeResult {
  ActiveWallet: {
    bundleHash: BundleHash
    address: WalletAddress
    token: TokenSlug
    balance: string
    lastActivity: string
    status: 'active' | 'inactive'
  }
}

// =============================================================================
// RESPONSE WRAPPER TYPES
// =============================================================================

export interface QueryResponse<T = unknown> {
  success(): boolean
  reason(): string | null
  data(): T | null
  payload(): Record<string, unknown> | null
  errors(): GraphQLError[] | null
}

export interface MutationResponse<T = unknown> extends QueryResponse<T> {
  molecularHash(): string | null
  status(): 'accepted' | 'rejected' | 'pending' | null
}

// =============================================================================
// CLIENT WRAPPER TYPES
// =============================================================================

export interface GraphQLClient {
  query<TResult = unknown, TVariables = GraphQLVariables>(
    request: GraphQLRequest,
    variables?: TVariables
  ): Promise<GraphQLResponse<TResult>>

  mutation<TResult = unknown, TVariables = GraphQLVariables>(
    request: GraphQLRequest,
    variables?: TVariables
  ): Promise<GraphQLResponse<TResult>>

  // Alias for mutation() to match JS SDK interface
  mutate<TResult = unknown, TVariables = GraphQLVariables>(
    request: GraphQLRequest,
    variables?: TVariables
  ): Promise<GraphQLResponse<TResult>>

  subscription<TResult = unknown, TVariables = GraphQLVariables>(
    request: GraphQLRequest,
    variables?: TVariables
  ): AsyncIterableIterator<GraphQLResponse<TResult>>

  getUri(): string
}

export interface UrqlClientWrapper extends GraphQLClient {
  uri: string
  connected: boolean
  
  connect(): Promise<void>
  disconnect(): void
  
  // WebSocket subscription management
  subscribe<TResult = unknown>(
    query: string,
    variables?: GraphQLVariables,
    callback?: (data: TResult) => void
  ): string // returns subscription ID

  unsubscribe(subscriptionId: string): void
  unsubscribeAll(): void
  
  // Connection status
  onConnect(callback: () => void): void
  onDisconnect(callback: (reason: string) => void): void
  onError(callback: (error: Error) => void): void
}

// =============================================================================
// ERROR TYPES FOR GRAPHQL OPERATIONS
// =============================================================================

export type GraphQLErrorType =
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'EXECUTION_ERROR'
  | 'SUBSCRIPTION_ERROR'
  | 'CONNECTION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'SERVER_ERROR'

export interface KnishIOGraphQLError extends Error {
  type: GraphQLErrorType
  query?: string
  variables?: GraphQLVariables
  response?: GraphQLResponse
  statusCode?: number
  details?: Record<string, unknown>
}

// =============================================================================
// OPERATION BUILDER TYPES
// =============================================================================

export interface QueryBuilder<TVariables = GraphQLVariables> {
  setVariable<K extends keyof TVariables>(key: K, value: TVariables[K]): this
  setVariables(variables: Partial<TVariables>): this
  build(): GraphQLRequest
}

export interface MutationBuilder<TVariables = GraphQLVariables> extends QueryBuilder<TVariables> {
  withMolecule(molecule: MutationProposeMoleculeVariables['molecule']): this
}

// =============================================================================
// CACHING TYPES
// =============================================================================

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  key?: string // Custom cache key
  tags?: string[] // Cache tags for invalidation
}

export interface CachedQuery<T = unknown> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

export interface GraphQLCache {
  get<T = unknown>(key: string): CachedQuery<T> | null
  set<T = unknown>(key: string, data: T, options?: CacheOptions): void
  invalidate(key: string): void
  invalidateByTag(tag: string): void
  clear(): void
}

// =============================================================================
// BATCH OPERATIONS TYPES
// =============================================================================

export interface BatchedQuery {
  id: string
  query: string
  variables?: GraphQLVariables
}

export interface BatchedResponse<T = unknown> {
  id: string
  data?: T | null
  errors?: GraphQLError[] | null
}

export interface BatchExecutor {
  add<T = unknown>(query: BatchedQuery): Promise<T>
  execute(): Promise<BatchedResponse[]>
  clear(): void
}

// =============================================================================
// TYPE GUARDS FOR GRAPHQL TYPES
// =============================================================================

export function isGraphQLError(obj: unknown): obj is GraphQLError {
  return typeof obj === 'object' && 
         obj !== null && 
         'message' in obj &&
         typeof (obj as GraphQLError).message === 'string'
}

export function isGraphQLResponse<T = unknown>(obj: unknown): obj is GraphQLResponse<T> {
  return typeof obj === 'object' && 
         obj !== null && 
         ('data' in obj || 'errors' in obj)
}

export function hasGraphQLErrors(response: GraphQLResponse): boolean {
  return Array.isArray(response.errors) && response.errors.length > 0
}

// All types are already exported at their definitions above