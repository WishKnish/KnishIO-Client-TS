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

import Decimal from '@/libraries/Decimal'
import GraphQLClient from '@/libraries/GraphQLClient'
import {
  generateBundleHash
} from '@/libraries/crypto'
import Molecule from '@/core/Molecule'
import Wallet from '@/core/Wallet'
import AuthToken from '@/AuthToken'
import Query from '@/query/Query'
import Mutation from '@/mutation/Mutation'
import Response from '@/response/Response'

// 2025 TypeScript: Zod validation integration
import { 
  validateClientConfig, 
  validateTransferParams,
  type ValidationResult 
} from '@/validation/ValidationService'

// Enhanced configuration validation (Phase 2)
import { ConfigValidator } from '@/validation/UNIVERSAL_CONFIGURATION_INTERFACES'

// Query imports
import QueryBalance from '@/query/QueryBalance'
import QueryWalletList from '@/query/QueryWalletList'
import QueryWalletBundle from '@/query/QueryWalletBundle'
import QueryContinuId from '@/query/QueryContinuId'
// QueryMeta is not needed - using QueryMetaType instead
import QueryMetaType from '@/query/QueryMetaType'
import QueryBatch from '@/query/QueryBatch'
import QueryBatchHistory from '@/query/QueryBatchHistory'
import QueryAtom from '@/query/QueryAtom'
import QueryPolicy from '@/query/QueryPolicy'
import QueryActiveSession from '@/query/QueryActiveSession'
import QueryUserActivity from '@/query/QueryUserActivity'
import QueryToken from '@/query/QueryToken'
import QueryMetaTypeViaAtom from '@/query/QueryMetaTypeViaAtom'

// Mutation imports
import MutationCreateToken from '@/mutation/MutationCreateToken'
import MutationRequestTokens from '@/mutation/MutationRequestTokens'
import MutationTransferTokens from '@/mutation/MutationTransferTokens'
import MutationCreateWallet from '@/mutation/MutationCreateWallet'
import MutationClaimShadowWallet from '@/mutation/MutationClaimShadowWallet'
import MutationCreateMeta from '@/mutation/MutationCreateMeta'
import MutationCreateRule from '@/mutation/MutationCreateRule'
import MutationCreateIdentifier from '@/mutation/MutationCreateIdentifier'
import MutationActiveSession from '@/mutation/MutationActiveSession'
import MutationDepositBufferToken from '@/mutation/MutationDepositBufferToken'
import MutationWithdrawBufferToken from '@/mutation/MutationWithdrawBufferToken'
import MutationRequestAuthorization from '@/mutation/MutationRequestAuthorization'
import MutationRequestAuthorizationGuest from '@/mutation/MutationRequestAuthorizationGuest'
import MutationLinkIdentifier from '@/mutation/MutationLinkIdentifier'

// Subscribe imports
import CreateMoleculeSubscribe from '@/subscribe/CreateMoleculeSubscribe'
import WalletStatusSubscribe from '@/subscribe/WalletStatusSubscribe'
import ActiveWalletSubscribe from '@/subscribe/ActiveWalletSubscribe'
import ActiveSessionSubscribe from '@/subscribe/ActiveSessionSubscribe'

// Exception imports
import {
  CodeException,
  UnauthenticatedException,
  TransferBalanceException,
  WalletShadowException
} from '@/exception'

// Type imports
import type {
  WalletAddress,
  BundleHash,
  TokenSlug,
  CellSlug,
  MetaType,
  MetaId,
  BatchId
} from '@/types'

/**
 * Base client class providing a powerful but user-friendly wrapper
 * around complex Knish.IO ledger transactions.
 */
export default class KnishIOClient {
  private $__secret: string = ''
  private $__bundle: string = ''
  private $__cellSlug: string | null = null
  private $__encrypt: boolean = false
  private $__uris: string[] = []
  private $__client: GraphQLClient
  private $__serverSdkVersion: number = 3
  private $__logging: boolean = false
  private $__authTokenObjects: Record<string, AuthToken | null> = {}
  private $__authToken: AuthToken | null = null
  private $__remainderWallet: Wallet | null = null
  private lastMoleculeQuery: Mutation | null = null
  private abortControllers: Map<string, AbortController> = new Map()

  /**
   * Enhanced constructor with standardized configuration validation (Phase 2 Enhancement)
   */
  constructor(config: {
    uri: string | string[]
    cellSlug?: string | null
    client?: GraphQLClient | null
    socket?: { socketUri: string | null; appKey?: string } | null
    serverSdkVersion?: number
    logging?: boolean
  }) {
    // Phase 2 Enhancement: Use standardized configuration validation
    const standardValidationResult = ConfigValidator.validateClientConfig(config)
    
    if (!standardValidationResult.isValid) {
      const errorDetails = standardValidationResult.errors.join(', ')
      throw new Error(`Invalid KnishIOClient configuration: ${errorDetails}`)
    }
    
    // Enhanced validation with warnings (Phase 2 improvement)
    if (standardValidationResult.warnings.length > 0 && config.logging) {
      console.warn('KnishIOClient Configuration Warnings:', standardValidationResult.warnings)
    }
    
    // Legacy validation for backward compatibility
    const legacyValidationResult = validateClientConfig(config)
    
    if (!legacyValidationResult.success) {
      const errorDetails = legacyValidationResult.error.details
        ?.map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ') || legacyValidationResult.error.message
      
      throw new Error(`KnishIOClient configuration validation failed: ${errorDetails}`)
    }
    
    // Use enhanced configuration with backward compatibility
    const validatedConfig = legacyValidationResult.data
    
    // Extract validated values (maintaining existing pattern)
    const {
      uri,
      cellSlug = null,
      client = null,
      socket = null,
      serverSdkVersion = 3,
      logging = false
    } = validatedConfig
    
    this.initialize({
      uri,
      cellSlug,
      socket,
      client,
      serverSdkVersion,
      logging
    })
  }

  /**
   * Initializes a new Knish.IO client session
   */
  initialize({
    uri,
    cellSlug = null,
    socket = null,
    client = null,
    serverSdkVersion = 3,
    logging = false
  }: {
    uri: string | string[]
    cellSlug?: string | null
    socket?: { socketUri: string | null; appKey?: string } | null
    client?: GraphQLClient | null
    serverSdkVersion?: number
    logging?: boolean
  }): void {
    this.reset()

    this.$__logging = logging
    this.$__authTokenObjects = {}

    this.setUri(uri)

    if (cellSlug) {
      this.setCellSlug(cellSlug)
    }

    for (const url of this.$__uris) {
      this.$__authTokenObjects[url] = null
    }

    this.log('info', `KnishIOClient::initialize() - Initializing new Knish.IO client session for SDK version ${serverSdkVersion}...`)

    this.$__client = client || new GraphQLClient({
      socket: {
        socketUri: socket?.socketUri || null,
        appKey: socket?.appKey || 'knishio'
      },
      serverUri: this.getRandomUri(),
      encrypt: this.$__encrypt
    })

    this.$__serverSdkVersion = serverSdkVersion
  }

  /**
   * Get random uri from specified this.$__uris
   */
  getRandomUri(): string {
    const rand = Math.floor(Math.random() * this.$__uris.length)
    return this.$__uris[rand]
  }

  /**
   * Switch encryption on/off
   */
  switchEncryption(encrypt: boolean): boolean {
    if (this.$__encrypt === encrypt) {
      return false
    }
    this.log('info', `KnishIOClient::switchEncryption() - Forcing encryption ${encrypt ? 'on' : 'off'} to match node...`)

    // Set encryption
    this.$__encrypt = encrypt
    if ('setEncryption' in this.$__client) {
      (this.$__client as any).setEncryption(encrypt)
    }
    return true
  }

  /**
   * De-initializes the Knish.IO client session so that a new session can replace it
   */
  deinitialize(): void {
    this.log('info', 'KnishIOClient::deinitialize() - Clearing the Knish.IO client session...')
    this.reset()
  }

  /**
   * Subscribes the client to the node's broadcast socket
   */
  subscribe(): GraphQLClient {
    if (!('getSocketUri' in this.$__client) || !(this.$__client as any).getSocketUri()) {
      throw new CodeException('KnishIOClient::subscribe() - Socket client not initialized!')
    }
    return this.client()
  }

  /**
   * Gets the client's SDK version
   */
  getServerSdkVersion(): number {
    return this.$__serverSdkVersion
  }

  /**
   * Reset common properties
   */
  reset(): void {
    this.$__secret = ''
    this.$__bundle = ''
    this.$__encrypt = false
    this.$__cellSlug = null
    this.$__authToken = null
    this.$__remainderWallet = null
    this.lastMoleculeQuery = null
  }

  /**
   * Get the GraphQL client
   */
  client(): GraphQLClient {
    return this.$__client
  }

  /**
   * Sets the Knish.IO server URIs
   */
  setUri(uri: string | string[]): void {
    if (typeof uri === 'string') {
      this.$__uris = [uri]
    } else {
      this.$__uris = uri
    }
  }

  /**
   * Gets the Knish.IO server URIs
   */
  getUri(): string[] {
    return this.$__uris
  }

  /**
   * Sets the Cell slug
   */
  setCellSlug(cellSlug: string | null): void {
    this.$__cellSlug = cellSlug
  }

  /**
   * Gets the Cell slug
   */
  getCellSlug(): string | null {
    return this.$__cellSlug
  }

  /**
   * Returns whether a secret is stored for this session
   */
  hasSecret(): boolean {
    return !!this.$__secret && this.$__secret.length > 0
  }

  /**
   * Returns the stored secret
   */
  getSecret(): string {
    if (!this.hasSecret()) {
      throw new UnauthenticatedException('KnishIOClient::getSecret() - Unable to find a stored secret! Have you set a secret?')
    }
    return this.$__secret
  }

  /**
   * Returns whether a bundle hash is being stored for this session
   */
  hasBundle(): boolean {
    return !!this.$__bundle && this.$__bundle.length > 0
  }

  /**
   * Returns the stored bundle hash
   */
  getBundle(): string {
    if (!this.hasBundle()) {
      throw new UnauthenticatedException('KnishIOClient::getBundle() - Unable to find a stored bundle! Have you set a secret?')
    }
    return this.$__bundle
  }

  /**
   * Sets the remainder wallet for this session
   */
  setRemainderWallet(remainderWallet: Wallet): void {
    this.$__remainderWallet = remainderWallet
  }

  /**
   * Gets the remainder wallet for this session
   */
  getRemainderWallet(): Wallet | null {
    return this.$__remainderWallet
  }

  /**
   * Creates a new molecule for a transaction
   */
  async createMolecule({
    secret = null,
    bundle = null,
    sourceWallet = null,
    remainderWallet = null
  }: {
    secret?: string | null
    bundle?: string | null
    sourceWallet?: Wallet | null
    remainderWallet?: Wallet | null
  } = {}): Promise<Molecule> {
    this.log('info', 'KnishIOClient::createMolecule() - Creating a new molecule...')

    secret = secret || this.getSecret()
    bundle = bundle || this.getBundle()

    // Sets the source wallet as the last remainder wallet (to maintain ContinuID)
    if (!sourceWallet &&
      this.lastMoleculeQuery &&
      this.getRemainderWallet()?.token === 'USER' &&
      this.lastMoleculeQuery.response() &&
      this.lastMoleculeQuery.response()?.success()
    ) {
      sourceWallet = this.getRemainderWallet()
    }

    // Unable to use last remainder wallet; Figure out what wallet to use:
    if (!sourceWallet) {
      // Get source wallet
      sourceWallet = await this.getSourceWallet()
    }

    return new Molecule({
      secret,
      bundle,
      sourceWallet,
      remainderWallet
    })
  }

  /**
   * Creates a new molecule mutation
   */
  async createMoleculeMutation({
    mutationClass,
    molecule = null
  }: {
    mutationClass: typeof Mutation
    molecule?: Molecule | null
  }): Promise<Mutation> {
    this.log('info', `KnishIOClient::createMoleculeMutation() - Creating a new ${mutationClass.name} query...`)

    // If you don't supply the molecule, we'll generate one for you
    const _molecule = molecule || await this.createMolecule({})

    const mutation = new mutationClass(this.client(), this) as Mutation

    if (!(mutation instanceof Mutation)) {
      throw new CodeException(`${this.constructor.name}::createMoleculeMutation() - This method only accepts Mutation subclasses!`)
    }

    this.lastMoleculeQuery = mutation

    return mutation
  }

  /**
   * Executes a query or mutation
   */
  async executeQuery(query: Query | Mutation, variables: Record<string, any> | null = null): Promise<Response | null> {
    // Check and refresh authorization token if needed
    if (this.$__authToken && this.$__authToken.isExpired()) {
      this.log('info', 'KnishIOClient::executeQuery() - Access token is expired. Getting new one...')
      await this.requestAuthToken({
        secret: this.$__secret,
        cellSlug: this.$__cellSlug,
        encrypt: this.$__encrypt
      })
    }

    // Execute the query
    return await query.execute({ variables: variables || {} })
  }

  /**
   * Sets the secret for this session
   */
  setSecret(secret: string): void {
    this.$__secret = secret
    this.$__bundle = generateBundleHash(secret)
  }

  /**
   * Sets the auth token for this session
   */
  setAuthToken(authToken: AuthToken): void {
    this.$__authToken = authToken
    
    // Set auth data on the client
    if ('setAuthData' in this.$__client) {
      (this.$__client as any).setAuthData(authToken.getAuthData())
    }
  }

  /**
   * Gets source wallet - basic implementation
   */
  async getSourceWallet(): Promise<Wallet> {
    // For now, create a new wallet with the current secret
    // In full implementation, this would query the ledger
    return Wallet.create({
      secret: this.getSecret(),
      bundle: this.getBundle(),
      token: 'USER'
    })
  }

  /**
   * Transfer tokens between wallets
   * Enhanced with 2025 TypeScript validation patterns
   */
  async transferToken(params: {
    bundleHash: string
    token: string
    amount?: number | null
    units?: string[]
    batchId?: string | null
    sourceWallet?: Wallet | null
  }): Promise<ValidationResult<Response | null>> {
    // 2025 Pattern: Validate parameters with Zod
    const transferParams = {
      recipient: params.bundleHash,
      amount: params.amount || 0,
      token: params.token
    }
    
    const validationResult = validateTransferParams(transferParams)
    
    if (!validationResult.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid transfer parameters',
          details: validationResult.error.details,
          context: 'transferToken'
        }
      }
    }
    
    // Use validated parameters
    const validatedParams = validationResult.data
    let {
      bundleHash,
      token,
      amount = null,
      units = [],
      batchId = null,
      sourceWallet = null
    } = params
    // Calculate amount & set meta key
    if (units.length > 0) {
      // Can't move stackable units AND provide amount
      if (amount && amount > 0) {
        throw new CodeException('Cannot specify both amount and units')
      }
      amount = units.length
    }

    // Build recipient wallet
    const recipientWallet = Wallet.create({
      bundle: bundleHash,
      token,
      batchId
    })

    // Get source wallet
    if (!sourceWallet) {
      sourceWallet = await this.getSourceWallet()
    }

    // Check balance
    if (!sourceWallet.balance || sourceWallet.balance < (amount || 0)) {
      throw new TransferBalanceException()
    }

    // Create remainder wallet
    const remainderWallet = sourceWallet.createRemainder(this.getSecret())

    // Build the molecule itself
    const molecule = await this.createMolecule({
      sourceWallet,
      remainderWallet
    })

    // For now, return a basic implementation
    // Full implementation would create and execute MutationTransferTokens
    return null
  }

  /**
   * Request authorization token
   */
  async requestAuthToken({
    secret = null,
    seed = null,
    cellSlug = null,
    encrypt = false
  }: {
    secret?: string | null
    seed?: string | null
    cellSlug?: string | null
    encrypt?: boolean
  }): Promise<Response | null> {
    // SDK versions 2 and below do not utilize an authorization token
    if (this.$__serverSdkVersion < 3) {
      this.log('warn', 'KnishIOClient::authorize() - Server SDK version does not require an authorization...')
      return null
    }

    // For now, return null - full implementation would handle authorization
    return null
  }

  /**
   * Logging utility
   */
  log(level: 'info' | 'warn' | 'error', message: string): void {
    if (this.$__logging) {
      switch (level) {
        case 'info':
          console.log(`[INFO] ${message}`)
          break
        case 'warn':
          console.warn(`[WARN] ${message}`)
          break
        case 'error':
          console.error(`[ERROR] ${message}`)
          break
      }
    }
  }

  /**
   * Creates a Query instance
   */
  createQuery<T extends Query>(QueryClass: new (client: GraphQLClient, knishIOClient: KnishIOClient) => T): T {
    return new QueryClass(this.client(), this)
  }

  /**
   * Creates a Subscribe instance
   */
  createSubscribe<T>(SubscribeClass: new (client: GraphQLClient) => T): T {
    return new SubscribeClass(this.client())
  }

  /**
   * Helper to hash secret into bundle hash
   */
  hashSecret(secret: string, source: string | null = null): string {
    const bundleHash = generateBundleHash(secret, source)
    this.$__bundle = bundleHash
    return bundleHash
  }

  /**
   * Get current auth token
   */
  getAuthToken(): AuthToken | null {
    return this.$__authToken
  }

  /**
   * Cancel a specific query
   */
  cancelQuery(query: Query | Mutation, variables: Record<string, any> | null = null): void {
    const queryKey = `${query.constructor.name}_${JSON.stringify(variables || {})}`
    const controller = this.abortControllers.get(queryKey)
    
    if (controller) {
      controller.abort()
      this.abortControllers.delete(queryKey)
    }
  }

  /**
   * Cancel all pending queries
   */
  cancelAllQueries(): void {
    for (const controller of this.abortControllers.values()) {
      controller.abort()
    }
    this.abortControllers.clear()
  }

  // =============================================================================
  // QUERY METHODS
  // =============================================================================

  /**
   * Query wallet balance for a specific token
   */
  async queryBalance({
    token,
    bundle = null,
    type = 'regular'
  }: {
    token: TokenSlug | string
    bundle?: BundleHash | string | null
    type?: 'regular' | 'stackable'
  }): Promise<Response> {
    const query = this.createQuery(QueryBalance)
    
    return this.executeQuery(query, {
      bundleHash: bundle || this.getBundle(),
      token,
      type
    }) as Promise<Response>
  }

  /**
   * Get source wallet with sufficient balance for a transaction
   */
  async querySourceWallet({
    token,
    amount,
    type = 'regular'
  }: {
    token: TokenSlug | string
    amount: number | string
    type?: 'regular' | 'stackable'
  }): Promise<Wallet> {
    const response = await this.queryBalance({
      token,
      type
    })
    
    const sourceWallet = response.payload() as Wallet | null

    // Do you have enough tokens?
    if (sourceWallet === null || Decimal.cmp(sourceWallet.balance || 0, amount) < 0) {
      throw new TransferBalanceException()
    }

    // Check shadow wallet
    if (!sourceWallet.position || !sourceWallet.address) {
      throw new TransferBalanceException('Source wallet cannot be a shadow wallet.')
    }

    return sourceWallet
  }

  /**
   * Query wallet list
   */
  async queryWallets({
    bundle = null,
    token = null,
    unspent = true
  }: {
    bundle?: BundleHash | string | null
    token?: TokenSlug | string | null
    unspent?: boolean
  } = {}): Promise<Wallet[]> {
    this.log('info', `KnishIOClient::queryWallets() - Querying wallets${bundle ? ` for ${bundle}` : ''}...`)

    const walletQuery = this.createQuery(QueryWalletList)

    const response = await this.executeQuery(walletQuery, {
      bundleHash: bundle || this.getBundle(),
      tokenSlug: token,
      unspent
    })

    return response?.payload() || []
  }

  /**
   * Query wallet bundle metadata
   */
  async queryBundle({
    bundle = null,
    fields = null,
    raw = false
  }: {
    bundle?: BundleHash | string | string[] | null
    fields?: string[] | null
    raw?: boolean
  } = {}): Promise<any> {
    this.log('info', `KnishIOClient::queryBundle() - Querying wallet bundle metadata${bundle ? ` for ${bundle}` : ''}...`)

    // Bundle default init & to array conversion
    if (!bundle) {
      bundle = this.getBundle()
    }
    if (typeof bundle === 'string') {
      bundle = [bundle]
    }

    const query = this.createQuery(QueryWalletBundle)
    const response = await this.executeQuery(query, { bundleHashes: bundle })
    
    return raw ? response : response?.payload()
  }

  /**
   * Query next ContinuId wallet
   */
  async queryContinuId({
    bundle
  }: {
    bundle: BundleHash | string
  }): Promise<Response> {
    const query = this.createQuery(QueryContinuId)

    return this.executeQuery(query, {
      bundle
    }) as Promise<Response>
  }

  /**
   * Query metadata
   */
  async queryMeta({
    metaType,
    metaId = null,
    key = null,
    value = null,
    latest = null,
    fields = null,
    filter = null,
    queryArgs = null,
    count = null,
    countBy = null,
    throughAtom = null,
    values = null,
    keys = null,
    atomValues = null
  }: {
    metaType: MetaType | string
    metaId?: MetaId | string | null
    key?: string | null
    value?: string | null
    latest?: boolean | null
    fields?: string[] | null
    filter?: string | null
    queryArgs?: Record<string, any> | null
    count?: number | null
    countBy?: string | null
    throughAtom?: boolean | null
    values?: any[] | null
    keys?: string[] | null
    atomValues?: any[] | null
  }): Promise<Response> {
    this.log('info', `KnishIOClient::queryMeta() - Querying metaType: ${metaType}, metaId: ${metaId}...`)

    let query: Query

    if (throughAtom === true) {
      query = this.createQuery(QueryMetaTypeViaAtom)
    } else {
      query = this.createQuery(QueryMetaType)
    }

    const variables: Record<string, any> = {
      metaType: metaType.toUpperCase(),
      metaId
    }

    if (filter !== null) {
      variables.filter = filter
    }
    if (latest !== null) {
      variables.latest = latest
    }
    if (key !== null) {
      variables.key = key
    }
    if (value !== null) {
      variables.value = value
    }
    if (queryArgs !== null) {
      variables.queryArgs = queryArgs
    }
    if (count !== null) {
      variables.count = count
    }
    if (countBy !== null) {
      variables.countBy = countBy
    }
    if (values !== null) {
      variables.values = values
    }
    if (keys !== null) {
      variables.keys = keys
    }
    if (atomValues !== null) {
      variables.atomValues = atomValues
    }

    return this.executeQuery(query, variables) as Promise<Response>
  }

  /**
   * Query cascading meta instances for batchId
   */
  async queryBatch({
    batchId
  }: {
    batchId: BatchId | string
  }): Promise<Response> {
    this.log('info', `KnishIOClient::queryBatch() - Querying cascading meta instances for batchId: ${batchId}...`)

    const query = this.createQuery(QueryBatch)

    return this.executeQuery(query, {
      batchId
    }) as Promise<Response>
  }

  /**
   * Query batch history
   */
  async queryBatchHistory({
    batchId
  }: {
    batchId: BatchId | string
  }): Promise<Response> {
    this.log('info', `KnishIOClient::queryBatchHistory() - Querying cascading meta instances for batchId: ${batchId}...`)

    const query = this.createQuery(QueryBatchHistory)

    return this.executeQuery(query, {
      batchId
    }) as Promise<Response>
  }

  /**
   * Query atoms with comprehensive filters
   */
  async queryAtom({
    molecularHashes = null,
    molecularHash = null,
    bundleHashes = null,
    bundleHash = null,
    positions = null,
    position = null,
    walletAddresses = null,
    walletAddress = null,
    isotopes = null,
    isotope = null,
    tokenSlugs = null,
    tokenSlug = null,
    cellSlugs = null,
    cellSlug = null,
    batchIds = null,
    batchId = null,
    values = null,
    value = null,
    metaTypes = null,
    metaType = null,
    metaIds = null,
    metaId = null,
    indexes = null,
    index = null,
    filter = null,
    latest = null,
    queryArgs = null
  }: {
    molecularHashes?: string[] | null
    molecularHash?: string | null
    bundleHashes?: string[] | null
    bundleHash?: string | null
    positions?: string[] | null
    position?: string | null
    walletAddresses?: string[] | null
    walletAddress?: string | null
    isotopes?: string[] | null
    isotope?: string | null
    tokenSlugs?: string[] | null
    tokenSlug?: string | null
    cellSlugs?: string[] | null
    cellSlug?: string | null
    batchIds?: string[] | null
    batchId?: string | null
    values?: any[] | null
    value?: any | null
    metaTypes?: string[] | null
    metaType?: string | null
    metaIds?: string[] | null
    metaId?: string | null
    indexes?: number[] | null
    index?: number | null
    filter?: string | null
    latest?: boolean | null
    queryArgs?: Record<string, any> | null
  } = {}): Promise<Response> {
    const query = this.createQuery(QueryAtom)

    const variables: Record<string, any> = {}

    // Add all non-null parameters to variables
    if (molecularHashes !== null) variables.molecularHashes = molecularHashes
    if (molecularHash !== null) variables.molecularHash = molecularHash
    if (bundleHashes !== null) variables.bundleHashes = bundleHashes
    if (bundleHash !== null) variables.bundleHash = bundleHash
    if (positions !== null) variables.positions = positions
    if (position !== null) variables.position = position
    if (walletAddresses !== null) variables.walletAddresses = walletAddresses
    if (walletAddress !== null) variables.walletAddress = walletAddress
    if (isotopes !== null) variables.isotopes = isotopes
    if (isotope !== null) variables.isotope = isotope
    if (tokenSlugs !== null) variables.tokenSlugs = tokenSlugs
    if (tokenSlug !== null) variables.tokenSlug = tokenSlug
    if (cellSlugs !== null) variables.cellSlugs = cellSlugs
    if (cellSlug !== null) variables.cellSlug = cellSlug
    if (batchIds !== null) variables.batchIds = batchIds
    if (batchId !== null) variables.batchId = batchId
    if (values !== null) variables.values = values
    if (value !== null) variables.value = value
    if (metaTypes !== null) variables.metaTypes = metaTypes
    if (metaType !== null) variables.metaType = metaType
    if (metaIds !== null) variables.metaIds = metaIds
    if (metaId !== null) variables.metaId = metaId
    if (indexes !== null) variables.indexes = indexes
    if (index !== null) variables.index = index
    if (filter !== null) variables.filter = filter
    if (latest !== null) variables.latest = latest
    if (queryArgs !== null) variables.queryArgs = queryArgs

    return this.executeQuery(query, variables) as Promise<Response>
  }

  /**
   * Query policy
   */
  async queryPolicy({
    metaType,
    metaId
  }: {
    metaType: MetaType | string
    metaId: MetaId | string
  }): Promise<Response> {
    const query = this.createQuery(QueryPolicy)

    return this.executeQuery(query, {
      metaType,
      metaId
    }) as Promise<Response>
  }

  /**
   * Query active sessions
   */
  async queryActiveSession({
    bundleHash,
    metaType,
    metaId
  }: {
    bundleHash: BundleHash | string
    metaType: MetaType | string
    metaId: MetaId | string
  }): Promise<Response> {
    const query = this.createQuery(QueryActiveSession)

    return this.executeQuery(query, {
      bundleHash,
      metaType,
      metaId
    }) as Promise<Response>
  }

  /**
   * Query user activity
   */
  async queryUserActivity({
    bundleHash,
    metaType,
    metaId,
    ipAddress = null,
    browser = null,
    osCpu = null,
    resolution = null,
    timeZone = null,
    countBy = null,
    interval = null
  }: {
    bundleHash: BundleHash | string
    metaType: MetaType | string
    metaId: MetaId | string
    ipAddress?: string | null
    browser?: string | null
    osCpu?: string | null
    resolution?: string | null
    timeZone?: string | null
    countBy?: string | null
    interval?: string | null
  }): Promise<Response> {
    const query = this.createQuery(QueryUserActivity)

    const variables: Record<string, any> = {
      bundleHash,
      metaType,
      metaId
    }

    if (ipAddress !== null) variables.ipAddress = ipAddress
    if (browser !== null) variables.browser = browser
    if (osCpu !== null) variables.osCpu = osCpu
    if (resolution !== null) variables.resolution = resolution
    if (timeZone !== null) variables.timeZone = timeZone
    if (countBy !== null) variables.countBy = countBy
    if (interval !== null) variables.interval = interval

    return this.executeQuery(query, variables) as Promise<Response>
  }

  /**
   * Query token information
   */
  async queryToken({
    token
  }: {
    token: TokenSlug | string
  }): Promise<Response> {
    const query = this.createQuery(QueryToken)

    return this.executeQuery(query, {
      token
    }) as Promise<Response>
  }

  // =============================================================================
  // SUBSCRIPTION METHODS
  // =============================================================================

  /**
   * Subscribe to molecule creation events
   */
  async subscribeCreateMolecule({
    bundle,
    closure
  }: {
    bundle: BundleHash | string | null
    closure: (result: any) => void
  }): Promise<string> {
    const subscribe = this.createSubscribe(CreateMoleculeSubscribe)

    return await subscribe.execute({
      variables: {
        bundle: bundle || this.getBundle()
      },
      closure
    })
  }

  /**
   * Subscribe to wallet status updates
   */
  async subscribeWalletStatus({
    bundle,
    token,
    closure
  }: {
    bundle: BundleHash | string | null
    token: TokenSlug | string
    closure: (result: any) => void
  }): Promise<string> {
    if (!token) {
      throw new CodeException(`${this.constructor.name}::subscribeWalletStatus() - Token parameter is required!`)
    }

    const subscribe = this.createSubscribe(WalletStatusSubscribe)

    return await subscribe.execute({
      variables: {
        bundle: bundle || this.getBundle(),
        token
      },
      closure
    })
  }

  /**
   * Subscribe to active wallet updates
   */
  async subscribeActiveWallet({
    bundle,
    closure
  }: {
    bundle: BundleHash | string | null
    closure: (result: any) => void
  }): Promise<string> {
    const subscribe = this.createSubscribe(ActiveWalletSubscribe)

    return await subscribe.execute({
      variables: {
        bundle: bundle || this.getBundle()
      },
      closure
    })
  }

  /**
   * Subscribe to active session updates
   */
  async subscribeActiveSession({
    metaType,
    metaId,
    closure
  }: {
    metaType: MetaType | string
    metaId: MetaId | string
    closure: (result: any) => void
  }): Promise<string> {
    const subscribe = this.createSubscribe(ActiveSessionSubscribe)

    return await subscribe.execute({
      variables: {
        metaType,
        metaId
      },
      closure
    })
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(operationName: string): void {
    if ('unsubscribe' in this.$__client) {
      (this.$__client as any).unsubscribe(operationName)
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    if ('unsubscribeAll' in this.$__client) {
      (this.$__client as any).unsubscribeAll()
    }
  }

  // =============================================================================
  // MUTATION METHODS - TOKEN OPERATIONS
  // =============================================================================

  /**
   * Create a new token
   */
  async createToken({
    token,
    amount = null,
    meta = null,
    batchId = null,
    units = null
  }: {
    token: TokenSlug | string
    amount?: number | string | null
    meta?: Record<string, any> | null
    batchId?: BatchId | string | null
    units?: string[] | null
  }): Promise<Response> {
    this.log('info', `KnishIOClient::createToken() - Creating token ${token}...`)

    const mutation = this.createQuery(MutationCreateToken) as MutationCreateToken

    // Get source wallet
    const sourceWallet = await this.getSourceWallet()

    // Initialize the create token mutation
    await mutation.fillMolecule({
      sourceWallet,
      token: token.toUpperCase(),
      amount,
      meta,
      batchId,
      units
    })

    // Create the molecule mutation
    const moleculeMutation = await this.createMoleculeMutation({ mutationClass: mutation })

    // Execute the mutation
    const response = await this.executeQuery(moleculeMutation)

    if (!response) {
      throw new CodeException('Token creation failed')
    }

    return response
  }

  /**
   * Request tokens for recipient
   */
  async requestTokens({
    token,
    to = null,
    amount = null,
    units = null,
    meta = null,
    batchId = null
  }: {
    token: TokenSlug | string
    to?: WalletAddress | string | null
    amount?: number | string | null
    units?: string[] | null
    meta?: Record<string, any> | null
    batchId?: BatchId | string | null
  }): Promise<Response> {
    this.log('info', `KnishIOClient::requestTokens() - Requesting ${amount || 'units'} of ${token}...`)

    const mutation = this.createQuery(MutationRequestTokens) as MutationRequestTokens

    // Get source wallet if needed
    const sourceWallet = await this.getSourceWallet()

    // Initialize the request tokens mutation
    await mutation.fillMolecule({
      sourceWallet,
      token: token.toUpperCase(),
      to,
      amount,
      units,
      meta,
      batchId
    })

    // Create the molecule mutation
    const moleculeMutation = await this.createMoleculeMutation({ mutationClass: mutation })

    // Execute the mutation
    const response = await this.executeQuery(moleculeMutation)

    if (!response) {
      throw new CodeException('Token request failed')
    }

    return response
  }

  /**
   * Burn/destroy tokens
   */
  async burnTokens({
    token,
    amount = null,
    units = null,
    sourceWallet = null
  }: {
    token: TokenSlug | string
    amount?: number | string | null
    units?: string[] | null
    sourceWallet?: Wallet | null
  }): Promise<Response> {
    this.log('info', `KnishIOClient::burnTokens() - Burning ${amount || 'units'} of ${token}...`)

    // Get source wallet if not provided
    if (!sourceWallet) {
      sourceWallet = await this.querySourceWallet({
        token,
        amount: amount || 0
      })
    }

    // Create a transfer to null address (burn)
    const mutation = this.createQuery(MutationTransferTokens) as MutationTransferTokens

    await mutation.fillMolecule({
      sourceWallet,
      recipient: '0000000000000000000000000000000000000000000000000000000000000000', // Burn address
      token: token.toUpperCase(),
      amount,
      units
    })

    const moleculeMutation = await this.createMoleculeMutation({ mutationClass: mutation })
    const response = await this.executeQuery(moleculeMutation)

    if (!response) {
      throw new CodeException('Token burn failed')
    }

    return response
  }

  /**
   * Replenish tokens
   */
  async replenishToken({
    token,
    amount = null,
    units = null,
    sourceWallet = null
  }: {
    token: TokenSlug | string
    amount?: number | string | null
    units?: string[] | null
    sourceWallet?: Wallet | null
  }): Promise<Response> {
    this.log('info', `KnishIOClient::replenishToken() - Replenishing ${amount || 'units'} of ${token}...`)

    // Similar to requestTokens but with specific replenishment logic
    return this.requestTokens({
      token,
      amount,
      units
    })
  }

  /**
   * Fuse token units
   */
  async fuseToken({
    bundleHash,
    tokenSlug,
    newTokenUnit,
    fusedTokenUnitIds,
    sourceWallet = null
  }: {
    bundleHash: BundleHash | string
    tokenSlug: TokenSlug | string
    newTokenUnit: string
    fusedTokenUnitIds: string[]
    sourceWallet?: Wallet | null
  }): Promise<Response> {
    this.log('info', `KnishIOClient::fuseToken() - Fusing token units for ${tokenSlug}...`)

    // This would require a specific mutation for token fusion
    // For now, return a placeholder
    throw new CodeException('Token fusion not yet implemented')
  }

  // =============================================================================
  // MUTATION METHODS - WALLET OPERATIONS
  // =============================================================================

  /**
   * Create a new wallet for a token
   */
  async createWallet({
    token
  }: {
    token: TokenSlug | string
  }): Promise<Response> {
    this.log('info', `KnishIOClient::createWallet() - Creating wallet for token ${token}...`)

    const mutation = this.createQuery(MutationCreateWallet) as MutationCreateWallet

    // Get source wallet
    const sourceWallet = await this.getSourceWallet()

    // Initialize the create wallet mutation
    await mutation.fillMolecule({
      sourceWallet,
      token: token.toUpperCase()
    })

    // Create the molecule mutation
    const moleculeMutation = await this.createMoleculeMutation({ mutationClass: mutation })

    // Execute the mutation
    const response = await this.executeQuery(moleculeMutation)

    if (!response) {
      throw new CodeException('Wallet creation failed')
    }

    return response
  }

  /**
   * Claim a single shadow wallet
   */
  async claimShadowWallet({
    token,
    batchId = null,
    molecule = null
  }: {
    token: TokenSlug | string
    batchId?: BatchId | string | null
    molecule?: Molecule | null
  }): Promise<Response> {
    this.log('info', `KnishIOClient::claimShadowWallet() - Claiming shadow wallet for token ${token}...`)

    // Get shadow wallets
    const shadowWallets = await this.queryWallets({ token })
    
    if (!shadowWallets || shadowWallets.length === 0) {
      throw new WalletShadowException('No shadow wallets found')
    }

    // Find the shadow wallet with matching batchId
    const shadowWallet = batchId 
      ? shadowWallets.find(w => w.batchId === batchId)
      : shadowWallets[0]

    if (!shadowWallet) {
      throw new WalletShadowException('Shadow wallet not found')
    }

    if (!shadowWallet.isShadow()) {
      throw new WalletShadowException('Wallet is not a shadow wallet')
    }

    const mutation = this.createQuery(MutationClaimShadowWallet) as MutationClaimShadowWallet

    // Get source wallet
    const sourceWallet = await this.getSourceWallet()

    // Initialize the claim shadow wallet mutation
    await mutation.fillMolecule({
      sourceWallet,
      token: token.toUpperCase(),
      batchId: shadowWallet.batchId
    })

    // Create the molecule mutation
    const moleculeMutation = await this.createMoleculeMutation({ mutationClass: mutation })

    // Execute the mutation
    const response = await this.executeQuery(moleculeMutation)

    if (!response) {
      throw new CodeException('Shadow wallet claim failed')
    }

    return response
  }

  /**
   * Claim all shadow wallets for a token
   */
  async claimShadowWallets({
    token
  }: {
    token: TokenSlug | string
  }): Promise<Response[]> {
    this.log('info', `KnishIOClient::claimShadowWallets() - Claiming all shadow wallets for token ${token}...`)

    // Get all shadow wallets
    const shadowWallets = await this.queryWallets({ token })
    
    if (!shadowWallets || !Array.isArray(shadowWallets)) {
      throw new WalletShadowException()
    }

    // Verify they are all shadow wallets
    shadowWallets.forEach(shadowWallet => {
      if (!shadowWallet.isShadow()) {
        throw new WalletShadowException('Found non-shadow wallet in list')
      }
    })

    // Claim each shadow wallet
    const responses: Response[] = []
    for (const shadowWallet of shadowWallets) {
      const response = await this.claimShadowWallet({
        token,
        batchId: shadowWallet.batchId
      })
      responses.push(response)
    }

    return responses
  }

  // =============================================================================
  // MUTATION METHODS - METADATA OPERATIONS
  // =============================================================================

  /**
   * Create metadata entry
   */
  async createMeta({
    metaType,
    metaId,
    meta = null,
    policy = null
  }: {
    metaType: MetaType | string
    metaId: MetaId | string
    meta?: Record<string, any> | null
    policy?: any | null
  }): Promise<Response> {
    this.log('info', `KnishIOClient::createMeta() - Creating metadata for ${metaType}:${metaId}...`)

    const mutation = this.createQuery(MutationCreateMeta) as MutationCreateMeta

    // Get source wallet
    const sourceWallet = await this.getSourceWallet()

    // Initialize the create meta mutation
    await mutation.fillMolecule({
      sourceWallet,
      metaType: metaType.toUpperCase(),
      metaId,
      meta,
      policy
    })

    // Create the molecule mutation
    const moleculeMutation = await this.createMoleculeMutation({ mutationClass: mutation })

    // Execute the mutation
    const response = await this.executeQuery(moleculeMutation)

    if (!response) {
      throw new CodeException('Metadata creation failed')
    }

    return response
  }

  /**
   * Create a new rule
   */
  async createRule({
    metaType,
    metaId,
    rule,
    policy = null
  }: {
    metaType: MetaType | string
    metaId: MetaId | string
    rule: any
    policy?: any | null
  }): Promise<Response> {
    this.log('info', `KnishIOClient::createRule() - Creating rule for ${metaType}:${metaId}...`)

    const mutation = this.createQuery(MutationCreateRule) as MutationCreateRule

    // Get source wallet
    const sourceWallet = await this.getSourceWallet()

    // Initialize the create rule mutation
    await mutation.fillMolecule({
      sourceWallet,
      metaType: metaType.toUpperCase(),
      metaId,
      rule,
      policy
    })

    // Create the molecule mutation
    const moleculeMutation = await this.createMoleculeMutation({ mutationClass: mutation })

    // Execute the mutation
    const response = await this.executeQuery(moleculeMutation)

    if (!response) {
      throw new CodeException('Rule creation failed')
    }

    return response
  }

  /**
   * Create a policy
   */
  async createPolicy({
    metaType,
    metaId,
    policy = null
  }: {
    metaType: MetaType | string
    metaId: MetaId | string
    policy?: any | null
  }): Promise<Response> {
    this.log('info', `KnishIOClient::createPolicy() - Creating policy for ${metaType}:${metaId}...`)

    // Policies are created via createMeta with policy parameter
    return this.createMeta({
      metaType,
      metaId,
      meta: null,
      policy
    })
  }

  /**
   * Create an identifier
   */
  async createIdentifier({
    type,
    contact,
    code
  }: {
    type: string
    contact: string
    code: string
  }): Promise<Response> {
    this.log('info', `KnishIOClient::createIdentifier() - Creating identifier of type ${type}...`)

    const mutation = this.createQuery(MutationCreateIdentifier) as MutationCreateIdentifier

    // Get source wallet
    const sourceWallet = await this.getSourceWallet()

    // Initialize the create identifier mutation
    await mutation.fillMolecule({
      sourceWallet,
      type,
      contact,
      code
    })

    // Create the molecule mutation
    const moleculeMutation = await this.createMoleculeMutation({ mutationClass: mutation })

    // Execute the mutation
    const response = await this.executeQuery(moleculeMutation)

    if (!response) {
      throw new CodeException('Identifier creation failed')
    }

    return response
  }

  /**
   * Link an identifier
   */
  async linkIdentifier({
    type,
    contact
  }: {
    type: string
    contact: string
  }): Promise<Response> {
    this.log('info', `KnishIOClient::linkIdentifier() - Linking identifier of type ${type}...`)

    const mutation = this.createQuery(MutationLinkIdentifier) as MutationLinkIdentifier

    // Get source wallet
    const sourceWallet = await this.getSourceWallet()

    // Initialize the link identifier mutation
    await mutation.fillMolecule({
      sourceWallet,
      type,
      contact
    })

    // Create the molecule mutation
    const moleculeMutation = await this.createMoleculeMutation({ mutationClass: mutation })

    // Execute the mutation
    const response = await this.executeQuery(moleculeMutation)

    if (!response) {
      throw new CodeException('Identifier linking failed')
    }

    return response
  }

  // =============================================================================
  // MUTATION METHODS - SESSION & BUFFER OPERATIONS
  // =============================================================================

  /**
   * Declare an active session
   */
  async activeSession({
    bundle,
    metaType,
    metaId,
    ipAddress,
    browser,
    osCpu,
    resolution,
    timeZone,
    json = null
  }: {
    bundle: BundleHash | string
    metaType: MetaType | string
    metaId: MetaId | string
    ipAddress: string
    browser: string
    osCpu: string
    resolution: string
    timeZone: string
    json?: any | null
  }): Promise<Response> {
    this.log('info', `KnishIOClient::activeSession() - Declaring active session for ${metaType}:${metaId}...`)

    const mutation = this.createQuery(MutationActiveSession) as MutationActiveSession

    // Get source wallet
    const sourceWallet = await this.getSourceWallet()

    // Initialize the active session mutation
    await mutation.fillMolecule({
      sourceWallet,
      bundle,
      metaType: metaType.toUpperCase(),
      metaId,
      ipAddress,
      browser,
      osCpu,
      resolution,
      timeZone,
      json
    })

    // Create the molecule mutation
    const moleculeMutation = await this.createMoleculeMutation({ mutationClass: mutation })

    // Execute the mutation
    const response = await this.executeQuery(moleculeMutation)

    if (!response) {
      throw new CodeException('Active session declaration failed')
    }

    return response
  }

  /**
   * Deposit buffer tokens
   */
  async depositBufferToken({
    tokenSlug,
    amount,
    tradeRates,
    sourceWallet = null
  }: {
    tokenSlug: TokenSlug | string
    amount: number | string
    tradeRates: Record<string, number>
    sourceWallet?: Wallet | null
  }): Promise<Response> {
    this.log('info', `KnishIOClient::depositBufferToken() - Depositing ${amount} of ${tokenSlug} to buffer...`)

    // Get source wallet if not provided
    if (!sourceWallet) {
      sourceWallet = await this.querySourceWallet({
        token: tokenSlug,
        amount
      })
    }

    const mutation = this.createQuery(MutationDepositBufferToken) as MutationDepositBufferToken

    // Initialize the deposit buffer token mutation
    await mutation.fillMolecule({
      sourceWallet,
      tokenSlug: tokenSlug.toUpperCase(),
      amount,
      tradeRates
    })

    // Create the molecule mutation
    const moleculeMutation = await this.createMoleculeMutation({ mutationClass: mutation })

    // Execute the mutation
    const response = await this.executeQuery(moleculeMutation)

    if (!response) {
      throw new CodeException('Buffer token deposit failed')
    }

    return response
  }

  /**
   * Withdraw buffer tokens
   */
  async withdrawBufferToken({
    tokenSlug,
    amount,
    sourceWallet = null,
    signingWallet = null
  }: {
    tokenSlug: TokenSlug | string
    amount: number | string
    sourceWallet?: Wallet | null
    signingWallet?: Wallet | null
  }): Promise<Response> {
    this.log('info', `KnishIOClient::withdrawBufferToken() - Withdrawing ${amount} of ${tokenSlug} from buffer...`)

    // Get source wallet if not provided
    if (!sourceWallet) {
      sourceWallet = await this.getSourceWallet()
    }

    const mutation = this.createQuery(MutationWithdrawBufferToken) as MutationWithdrawBufferToken

    // Initialize the withdraw buffer token mutation
    await mutation.fillMolecule({
      sourceWallet,
      tokenSlug: tokenSlug.toUpperCase(),
      amount,
      signingWallet
    })

    // Create the molecule mutation
    const moleculeMutation = await this.createMoleculeMutation({ mutationClass: mutation })

    // Execute the mutation
    const response = await this.executeQuery(moleculeMutation)

    if (!response) {
      throw new CodeException('Buffer token withdrawal failed')
    }

    return response
  }

  // =============================================================================
  // AUTHENTICATION METHODS
  // =============================================================================

  /**
   * Request guest authentication token
   */
  async requestGuestAuthToken({
    cellSlug = null,
    encrypt = false
  }: {
    cellSlug?: CellSlug | string | null
    encrypt?: boolean
  } = {}): Promise<Response> {
    this.log('info', 'KnishIOClient::requestGuestAuthToken() - Requesting guest auth token...')

    const mutation = this.createQuery(MutationRequestAuthorizationGuest) as MutationRequestAuthorizationGuest

    // Initialize the guest auth mutation
    await mutation.fillMolecule({
      cellSlug: cellSlug || this.getCellSlug()
    })

    // Create the molecule mutation
    const moleculeMutation = await this.createMoleculeMutation({ mutationClass: mutation })

    // Execute the mutation
    const response = await this.executeQuery(moleculeMutation)

    if (!response) {
      throw new CodeException('Guest auth token request failed')
    }

    // Handle encryption if needed
    if (encrypt) {
      this.switchEncryption(true)
    }

    return response
  }

  /**
   * Request profile authentication token
   */
  async requestProfileAuthToken({
    secret,
    encrypt = false
  }: {
    secret: string
    encrypt?: boolean
  }): Promise<Response> {
    this.log('info', 'KnishIOClient::requestProfileAuthToken() - Requesting profile auth token...')

    // Set the secret
    this.setSecret(secret)

    const mutation = this.createQuery(MutationRequestAuthorization) as MutationRequestAuthorization

    // Get source wallet
    const sourceWallet = await this.getSourceWallet()

    // Initialize the profile auth mutation
    await mutation.fillMolecule({
      sourceWallet,
      cellSlug: this.getCellSlug()
    })

    // Create the molecule mutation
    const moleculeMutation = await this.createMoleculeMutation({ mutationClass: mutation })

    // Execute the mutation
    const response = await this.executeQuery(moleculeMutation)

    if (!response) {
      throw new CodeException('Profile auth token request failed')
    }

    // Handle encryption if needed
    if (encrypt) {
      this.switchEncryption(true)
    }

    return response
  }

  // =============================================================================
  // LEGACY/DEPRECATED METHODS
  // =============================================================================

  /**
   * @deprecated Use getCellSlug() instead
   */
  cellSlug(): string | null {
    return this.getCellSlug()
  }

  /**
   * @deprecated Use getUri() instead
   */
  uri(): string[] {
    return this.getUri()
  }
}