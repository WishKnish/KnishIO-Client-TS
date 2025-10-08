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
 * KnishIO Client-specific type definitions
 */

import type {
  WalletAddress,
  BundleHash,
  TokenSlug,
  MetaType,
  MetaId,
  CellSlug,
  MetaData,
  BaseResponse
} from './index'

// =============================================================================
// CLIENT INITIALIZATION TYPES
// =============================================================================

export interface KnishIOClientOptions {
  uri?: string | string[]
  cellSlug?: CellSlug | string | null
  client?: unknown | null
  socket?: unknown | null
  serverSdkVersion?: number
  logging?: boolean
}

export interface ClientInitializationResult {
  success: boolean
  uri: string
  cellSlug: CellSlug | null
  serverVersion: number
}

// =============================================================================
// WALLET OPERATION TYPES
// =============================================================================

export interface CreateWalletOptions {
  token?: TokenSlug | string
  cellSlug?: CellSlug | string | null
}

export interface ClaimShadowOptions {
  token: TokenSlug | string
  bundleHash?: BundleHash | string | null
}

export interface ClaimShadowsOptions {
  tokens: Array<TokenSlug | string>
  bundleHashes?: Array<BundleHash | string> | null
}

// =============================================================================
// TOKEN OPERATION TYPES  
// =============================================================================

export interface CreateTokenOptions {
  token: TokenSlug | string
  amount?: number | string
  fungible?: boolean
  splittable?: number | null
  position?: string | null
  supplyToken?: TokenSlug | string | null
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
  meta?: MetaData | null
  callbackUrl?: string | null
}

export interface TransferTokenOptions {
  recipient: WalletAddress | string
  amount: number | string
  token?: TokenSlug | string
  remainder?: boolean
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
  meta?: MetaData | null
  callbackUrl?: string | null
}

export interface RequestTokensOptions {
  to: WalletAddress | string
  amount: number | string
  token?: TokenSlug | string
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
  meta?: MetaData | null
}

export interface BurnTokensOptions {
  token: TokenSlug | string
  amount: number | string
  callbackUrl?: string | null
}

export interface ReplenishTokenOptions {
  token: TokenSlug | string
  amount: number | string
  callbackUrl?: string | null
}

export interface FuseTokenOptions {
  targetToken: TokenSlug | string
  tokens: Record<TokenSlug | string, number>
  callbackUrl?: string | null
}

// =============================================================================
// BUFFER TOKEN OPERATION TYPES
// =============================================================================

export interface DepositBufferOptions {
  token: TokenSlug | string
  amount: number | string
  targetWallet?: WalletAddress | string | null
  callbackUrl?: string | null
}

export interface WithdrawBufferOptions {
  token: TokenSlug | string
  amount: number | string
  sourceWallet?: WalletAddress | string | null
  callbackUrl?: string | null
}

// =============================================================================
// META OPERATION TYPES
// =============================================================================

export interface CreateMetaOptions {
  metaType: MetaType | string
  metaId: MetaId | string
  meta: MetaData
  callbackUrl?: string | null
}

export interface CreateIdentifierOptions {
  type: string
  contact: string
  code?: string | null
  callbackUrl?: string | null
}

export interface CreateRuleOptions {
  metaType: MetaType | string
  metaId: MetaId | string
  policy: Record<string, unknown>
  callbackUrl?: string | null
}

export interface CreatePolicyOptions {
  policy: Record<string, unknown>
  callbackUrl?: string | null
}

// =============================================================================
// QUERY OPERATION TYPES
// =============================================================================

export interface BalanceQueryOptions {
  address?: WalletAddress | string | null
  bundleHash?: BundleHash | string | null
  token?: TokenSlug | string | null
  type?: 'token' | 'user' | null
  unspent?: boolean | null
}

export interface WalletQueryOptions {
  bundleHash?: BundleHash | string | null
  tokenSlug?: TokenSlug | string | null
  unspent?: boolean | null
  limit?: number | null
  offset?: number | null
}

export interface BundleQueryOptions {
  bundleHashes: Array<BundleHash | string>
}

export interface ContinuIdOptions {
  bundle: BundleHash | string
}

export interface MetaQueryOptions {
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

export interface BatchQueryOptions {
  batchId: string
}

export interface BatchHistoryOptions {
  batchId: string
}

export interface AtomQueryOptions {
  position?: string | null
  isotope?: string | null
  token?: TokenSlug | string | null
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
  limit?: number | null
  offset?: number | null
}

export interface ActiveSessionOptions {
  bundleHash?: BundleHash | string | null
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
}

export interface UserActivityOptions {
  bundleHash?: BundleHash | string | null
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
  dateFrom?: string | null
  dateTo?: string | null
  limit?: number | null
  offset?: number | null
}

export interface PolicyQueryOptions {
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
}

// =============================================================================
// SESSION & AUTHENTICATION TYPES
// =============================================================================

export interface ActiveSessionResult {
  sessionId: string
  bundleHash: BundleHash
  expiresAt: number
  status: 'active' | 'expired' | 'inactive'
}

export interface ProfileAuthOptions {
  profile: Record<string, unknown>
  cellSlug?: CellSlug | string | null
}

// =============================================================================
// SUBSCRIPTION OPERATION TYPES
// =============================================================================

export interface SubscribeOptions {
  operationName?: string
  variables?: Record<string, unknown>
  callback?: (data: unknown) => void
}

export interface WalletStatusSubscribeOptions extends SubscribeOptions {
  bundleHash: BundleHash | string
}

export interface ActiveWalletSubscribeOptions extends SubscribeOptions {
  bundleHash: BundleHash | string
  token?: TokenSlug | string | null
}

export interface ActiveSessionSubscribeOptions extends SubscribeOptions {
  bundleHash: BundleHash | string
}

// =============================================================================
// MOLECULE CREATION TYPES
// =============================================================================

export interface CreateMoleculeOptions {
  cellSlug?: CellSlug | string | null
  sourceWallet?: unknown | null
  remainderWallet?: unknown | null
}

export interface MoleculeMutationOptions {
  mutationClass: unknown
  variables?: Record<string, unknown>
  fillMolecule?: boolean
}

// =============================================================================
// RESPONSE TYPES FOR SPECIFIC OPERATIONS
// =============================================================================

export interface ResponseCreateWallet extends BaseResponse<{
  address: WalletAddress
  bundle: BundleHash
  token: TokenSlug
  createdAt: string
}> {}

export interface ResponseCreateToken extends BaseResponse<{
  token: TokenSlug
  amount: string
  fungible: boolean
  molecularHash: string
  createdAt: string
}> {}

export interface ResponseTransferTokens extends BaseResponse<{
  molecularHash: string
  amount: string
  recipient: WalletAddress
  remainder?: string | null
  createdAt: string
}> {}

export interface ResponseRequestTokens extends BaseResponse<{
  molecularHash: string
  amount: string
  token: TokenSlug
  createdAt: string
}> {}

export interface ResponseBalance extends BaseResponse<{
  address: WalletAddress
  position: string
  amount: string
  characters: string | null
  token: TokenSlug
}> {}

export interface ResponseWalletList extends BaseResponse<{
  wallets: Array<{
    address: WalletAddress
    token: TokenSlug
    balance: string
    position: string
    createdAt: string
  }>
}> {}

export interface ResponseWalletBundle extends BaseResponse<{
  bundleHash: BundleHash
  wallets: Array<{
    address: WalletAddress
    token: TokenSlug
    balance: string
  }>
}> {}

export interface ResponseContinuId extends BaseResponse<{
  bundle: BundleHash
  position: string
  createdAt: string
}> {}

export interface ResponseCreateMeta extends BaseResponse<{
  metaType: MetaType
  metaId: MetaId
  meta: MetaData
  molecularHash: string
  createdAt: string
}> {}

export interface ResponseCreateIdentifier extends BaseResponse<{
  type: string
  contact: string
  molecularHash: string
  createdAt: string
}> {}

export interface ResponseCreateRule extends BaseResponse<{
  metaType: MetaType
  metaId: MetaId
  policy: Record<string, unknown>
  molecularHash: string
  createdAt: string
}> {}

export interface ResponseClaimShadowWallet extends BaseResponse<{
  address: WalletAddress
  token: TokenSlug
  molecularHash: string
  createdAt: string
}> {}

export interface ResponseRequestAuthorization extends BaseResponse<{
  authToken: string
  expiresAt: number
  pubkey: string
  encrypt: boolean
}> {}

export interface ResponseRequestAuthorizationGuest extends BaseResponse<{
  authToken: string
  expiresAt: number
}> {}

export interface ResponseMetaType extends BaseResponse<{
  metaType: MetaType
  instances: Array<{
    metaId: MetaId
    meta: MetaData
    createdAt: string
  }>
}> {}

export interface ResponseAtom extends BaseResponse<{
  atoms: Array<{
    position: string
    walletAddress: WalletAddress
    isotope: string
    token: TokenSlug
    value: string | null
    metaType: MetaType | null
    metaId: MetaId | null
    createdAt: string
  }>
}> {}

export interface ResponseQueryActiveSession extends BaseResponse<{
  sessionId: string
  bundleHash: BundleHash
  status: string
  createdAt: string
  expiresAt: string
}> {}

export interface ResponseQueryUserActivity extends BaseResponse<{
  activities: Array<{
    type: string
    description: string
    data: Record<string, unknown>
    createdAt: string
  }>
}> {}

export interface ResponsePolicy extends BaseResponse<{
  policy: Record<string, unknown>
  metaType: MetaType | null
  metaId: MetaId | null
  createdAt: string
}> {}

export interface ResponseActiveSession extends BaseResponse<ActiveSessionResult> {}

// =============================================================================
// DEVICE FINGERPRINTING TYPES
// =============================================================================

export interface FingerprintData {
  userAgent: string
  language: string
  platform: string
  timezone: string
  screen: {
    width: number
    height: number
    colorDepth: number
  }
  canvas?: string
  webgl?: string
  fonts?: string[]
  plugins?: string[]
}

// =============================================================================
// CONFIGURATION & UTILITY TYPES
// =============================================================================

export interface LogLevel {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: number
  context?: Record<string, unknown>
}

export interface ConnectionStatus {
  connected: boolean
  uri: string
  latency?: number
  lastCheck: number
}

export interface ServerVersion {
  version: string
  compatible: boolean
  features: string[]
}

// =============================================================================
// BUILDER PATTERN TYPES
// =============================================================================

export interface KnishIOClientBuilder {
  withUri(uri: string | string[]): this
  withCellSlug(cellSlug: CellSlug | string): this
  withLogging(enabled: boolean): this
  withServerVersion(version: number): this
  build(): Promise<unknown> // Will be the actual client instance
}

// =============================================================================
// ERROR CONTEXT TYPES
// =============================================================================

export interface ClientErrorContext {
  operation: string
  parameters: Record<string, unknown>
  uri?: string
  cellSlug?: CellSlug | string | null
  timestamp: number
  stack?: string
}

// All types are already exported at their definitions above