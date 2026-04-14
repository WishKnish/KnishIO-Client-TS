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
  generateBundleHash,
  generateSecret
} from '@/libraries/crypto'
import Molecule from '@/core/Molecule'
import Wallet from '@/core/Wallet'
import AuthToken from '@/AuthToken'
import Query from '@/query/Query'
import Mutation from '@/mutation/Mutation'
import Response from '@/response/Response'
import ResponseRequestAuthorization from '@/response/ResponseRequestAuthorization'

// 2025 TypeScript: Zod validation integration
import {
  validateClientConfig
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
import QueryMetaTypeViaMolecule from '@/query/QueryMetaTypeViaMolecule'
import QueryEmbeddingStatus from '@/query/QueryEmbeddingStatus'

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
import MutationPeering from '@/mutation/MutationPeering'
import MutationAppendRequest from '@/mutation/MutationAppendRequest'

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
  WalletShadowException,
  StackableUnitAmountException,
  AuthorizationRejectedException
} from '@/exception'

// Type imports
import type {
  WalletAddress,
  BundleHash,
  TokenSlug,
  CellSlug,
  MetaType,
  MetaId,
  BatchId,
  MetaFilter
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
  private $__client!: GraphQLClient
  private $__serverSdkVersion: number = 3
  private $__logging: boolean = false
  private $__authTokenObjects: Record<string, AuthToken | null> = {}
  private $__authToken: AuthToken | null = null
  private $__authInProcess: boolean = false
  private $__remainderWallet: Wallet | null = null
  private lastMoleculeQuery: Mutation | null = null
  private abortControllers: Map<string, AbortController> = new Map()
  private $__capabilityCache: Record<string, boolean> = {}

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
      uri: uri as string | string[],
      cellSlug: cellSlug as string | null,
      socket: socket as { socketUri: string | null; appKey?: string } | null,
      client: client as GraphQLClient | null,
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
    if (this.$__uris.length === 0) {
      throw new Error('No URIs configured')
    }
    const rand = Math.floor(Math.random() * this.$__uris.length)
    return this.$__uris[rand]!
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
    this.$__capabilityCache = {}
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
    // Update the underlying GraphQL client's URI
    if (this.$__client && 'setUri' in this.$__client) {
      (this.$__client as any).setUri(this.getRandomUri())
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
   * Instantiates a new Molecule and prepares this client session to operate on it
   * Matches JavaScript SDK createMolecule implementation
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

    // For non-USER source wallets (V/B isotopes), capture the current USER
    // ContinuID position BEFORE overwriting the client's remainder wallet.
    // This position is needed by addContinuIdAtom() for previousPosition metadata.
    let continuIdPosition: string | null = null
    if (sourceWallet && sourceWallet.token !== 'USER') {
      if (this.lastMoleculeQuery &&
        this.getRemainderWallet() &&
        this.getRemainderWallet()?.token === 'USER' &&
        this.lastMoleculeQuery.response() &&
        this.lastMoleculeQuery.response()?.success()
      ) {
        // Carry-forward: use last successful USER remainder wallet position
        continuIdPosition = this.getRemainderWallet()?.position || null
        this.log('info', `KnishIOClient::createMolecule() - Captured USER ContinuID position ${continuIdPosition?.substring(0, 16)}... for non-USER source wallet`)
      } else {
        // Query server for current ContinuID position
        const userWallet = await this.getSourceWallet()
        continuIdPosition = userWallet?.position || null
        this.log('info', `KnishIOClient::createMolecule() - Queried USER ContinuID position ${continuIdPosition?.substring(0, 16)}... for non-USER source wallet`)
      }
    }

    // Sets the source wallet as the last remainder wallet (to maintain ContinuID)
    if (!sourceWallet &&
      this.lastMoleculeQuery &&
      this.getRemainderWallet()?.token === 'USER' &&
      this.lastMoleculeQuery.response() &&
      this.lastMoleculeQuery.response()?.success()
    ) {
      sourceWallet = this.getRemainderWallet()
      this.log('info', `KnishIOClient::createMolecule() - Using carry-forward remainder wallet at position ${sourceWallet?.position?.substring(0, 16)}...`)
    }

    // Unable to use last remainder wallet; Figure out what wallet to use:
    if (!sourceWallet) {
      sourceWallet = await this.getSourceWallet()
    }

    // Set the remainder wallet for the next transaction (always USER token for ContinuID)
    this.setRemainderWallet(remainderWallet || Wallet.create({
      secret: secret!,
      bundle,
      token: 'USER',
      batchId: sourceWallet!.batchId,
      characters: sourceWallet!.characters
    }))

    return new Molecule({
      secret,
      sourceWallet,
      remainderWallet: this.getRemainderWallet()!,
      cellSlug: this.getCellSlug(),
      version: this.getServerSdkVersion(),
      continuIdPosition
    })
  }

  /**
   * Creates a new molecule mutation
   */
  async createMoleculeMutation<T extends Mutation>({
    mutationClass,
    molecule = null
  }: {
    mutationClass: new (client: GraphQLClient, knishIOClient: KnishIOClient, molecule: Molecule) => T
    molecule?: Molecule | null
  }): Promise<T> {
    this.log('info', `KnishIOClient::createMoleculeMutation() - Creating a new ${mutationClass.name} query...`)

    // If you don't supply the molecule, we'll generate one for you
    const _molecule = molecule || await this.createMolecule({})

    // Pass molecule to constructor for MutationProposeMolecule subclasses
    const mutation = new mutationClass(this.client(), this, _molecule)

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
    // Guard with $__authInProcess to prevent recursive auth refresh
    if (this.$__authToken && this.$__authToken.isExpired() && !this.$__authInProcess) {
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
   * Retrieves this session's wallet used for signing the next Molecule
   * Queries ContinuID from the server to get the authoritative position
   * Matches JavaScript SDK getSourceWallet implementation
   */
  async getSourceWallet(): Promise<Wallet> {
    // Match JavaScript SDK exactly: no try/catch, errors propagate
    let sourceWallet: Wallet | null = (await this.queryContinuId({
      bundle: this.getBundle()
    }))?.payload() as Wallet | null

    if (!sourceWallet) {
      sourceWallet = new Wallet({
        secret: this.getSecret()
      })
    } else {
      sourceWallet.key = Wallet.generateKey({
        secret: this.getSecret(),
        token: sourceWallet.token,
        position: sourceWallet.position!
      })
    }

    return sourceWallet
  }

  /**
   * Transfer tokens between wallets
   * Matches JavaScript SDK transferToken implementation exactly
   */
  async transferToken({
    bundleHash,
    token,
    amount = null,
    units = [],
    batchId = null,
    sourceWallet = null
  }: {
    bundleHash: string
    token: string
    amount?: number | null
    units?: string[]
    batchId?: string | null
    sourceWallet?: Wallet | null
  }): Promise<Response | null> {
    // Calculate amount & set meta key
    if (units.length > 0) {
      // Can't move stackable units AND provide amount
      if (amount !== null && amount > 0) {
        throw new StackableUnitAmountException()
      }

      amount = units.length
    }

    // Ensure amount is set
    if (amount === null) {
      amount = 0
    }

    // Get a source wallet
    if (sourceWallet === null) {
      sourceWallet = await this.querySourceWallet({
        token,
        amount
      })
    }

    // Do you have enough tokens?
    if (sourceWallet === null || Decimal.cmp(Number(sourceWallet.balance), amount) < 0) {
      throw new TransferBalanceException()
    }

    // Attempt to get the recipient's wallet
    const recipientWallet = Wallet.create({
      bundle: bundleHash,
      token
    })

    // Compute the batch ID for the recipient (typically used by stackable tokens)
    if (batchId !== null) {
      recipientWallet.batchId = batchId
    } else {
      recipientWallet.initBatchId({
        sourceWallet
      })
    }

    // Create a remainder from the source wallet
    const remainderWallet = sourceWallet.createRemainder(this.getSecret())

    // Token units splitting
    sourceWallet.splitUnits(
      units,
      remainderWallet,
      recipientWallet
    )

    // Build the molecule itself
    const molecule = await this.createMolecule({
      sourceWallet,
      remainderWallet
    })

    const query = await this.createMoleculeMutation({
      mutationClass: MutationTransferTokens,
      molecule
    })

    query.fillMolecule({
      recipientWallet,
      amount
    })

    return await this.executeQuery(query)
  }

  /**
   * Request authorization token (guest or profile)
   *
   * @param secret - User secret for profile auth (null for guest)
   * @param seed - Seed to generate secret (alternative to secret)
   * @param cellSlug - Cell slug for scoped access
   * @param encrypt - Whether to use encryption
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
  } = {}): Promise<Response | null> {
    // SDK versions 2 and below do not utilize an authorization token
    if (this.$__serverSdkVersion < 3) {
      this.log('warn', 'KnishIOClient::requestAuthToken() - Server SDK version does not require authorization...')
      return null
    }

    // Generate a secret from the seed if provided
    if (secret === null && seed) {
      secret = generateSecret(seed)
    }

    // Set cell slug if provided
    if (cellSlug) {
      this.setCellSlug(cellSlug)
    }

    // Auth in process...
    this.$__authInProcess = true

    // Auth token response
    let response: Response

    // Authorized user (profile auth with secret)
    if (secret) {
      response = await this.requestProfileAuthToken({
        secret,
        encrypt
      })
    } else {
      // Guest auth (no secret)
      response = await this.requestGuestAuthToken({
        cellSlug: cellSlug || this.getCellSlug(),
        encrypt
      })
    }

    // Log success
    if (this.$__authToken) {
      this.log('info', `KnishIOClient::requestAuthToken() - Successfully retrieved auth token...`)
    }

    // Handle encryption if needed
    this.switchEncryption(encrypt)

    // Auth process is stopped
    this.$__authInProcess = false

    return response
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
    const amountNum = typeof amount === 'string' ? Number(amount) : amount
    if (sourceWallet === null || Decimal.cmp(Number(sourceWallet.balance || 0), amountNum) < 0) {
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
      token,
      unspent
    })

    return response?.payload() || []
  }

  /**
   * Query wallet bundle metadata
   */
  async queryBundle({
    bundle = null,
    fields: _fields = null,
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
    fields: _fields = null,
    filter = null,
    queryArgs = null,
    count = null,
    countBy = null,
    throughAtom = true,
    throughMolecule = false,
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
    filter?: MetaFilter[] | null
    queryArgs?: Record<string, any> | null
    count?: number | null
    countBy?: string | null
    throughAtom?: boolean | null
    throughMolecule?: boolean | null
    values?: any[] | null
    keys?: string[] | null
    atomValues?: any[] | null
  }): Promise<Response> {
    this.log('info', `KnishIOClient::queryMeta() - Querying metaType: ${metaType}, metaId: ${metaId}...`)

    let query: Query
    let variables: Record<string, any>

    if (throughMolecule) {
      query = this.createQuery(QueryMetaTypeViaMolecule)
      variables = QueryMetaTypeViaMolecule.createVariables({
        metaType: metaType,
        metaId,
        key,
        value,
        latest,
        filter,
        queryArgs,
        countBy,
        values,
        keys,
        atomValues,
        cellSlug: this.getCellSlug()
      })
    } else if (throughAtom) {
      query = this.createQuery(QueryMetaTypeViaAtom)
      variables = QueryMetaTypeViaAtom.createVariables({
        metaType: metaType,
        metaId,
        key,
        value,
        latest,
        filter,
        queryArgs,
        countBy,
        values,
        keys,
        atomValues,
        cellSlug: this.getCellSlug()
      })
    } else {
      query = this.createQuery(QueryMetaType)
      variables = QueryMetaType.createVariables({
        metaType: metaType,
        metaId,
        key,
        value,
        latest,
        filter,
        queryArgs,
        count,
        countBy,
        cellSlug: this.getCellSlug()
      })
    }

    return this.executeQuery(query, variables) as Promise<Response>
  }

  /**
   * Queries meta assets and verifies cryptographic integrity of associated molecules.
   * Forces throughMolecule=true to ensure molecule data is available for verification.
   * Returns the same response as queryMeta(), with an additional `integrity` field on the payload.
   */
  async queryMetaVerified(params: {
    metaType: MetaType | string
    metaId?: MetaId | string | null
    key?: string | null
    value?: string | null
    latest?: boolean | null
    fields?: string[] | null
    filter?: MetaFilter[] | null
    queryArgs?: Record<string, any> | null
    count?: number | null
    countBy?: string | null
    values?: any[] | null
    keys?: string[] | null
    atomValues?: any[] | null
  }): Promise<Response> {
    const response = await this.queryMeta({ ...params, throughMolecule: true })
    const payload = response.payload()
    if (payload && typeof (response as any).verifyIntegrity === 'function') {
      payload.integrity = (response as any).verifyIntegrity()
    }
    return response
  }

  /**
   * Probes the connected server to check whether it supports a named root query field.
   * Result is cached per URI so the network round-trip happens at most once per URI.
   *
   * Uses GraphQL introspection which is universally supported by spec-compliant servers.
   *
   * @param fieldName - The root Query field name to check (e.g. 'embeddingStatus')
   * @returns true if the server schema includes the field, false otherwise
   */
  async hasQueryField(fieldName: string): Promise<boolean> {
    const uri = this.$__client.getUri()
    const cacheKey = `${uri}::${fieldName}`

    if (typeof this.$__capabilityCache[cacheKey] === 'boolean') {
      return this.$__capabilityCache[cacheKey]!
    }

    try {
      const result = await this.$__client.query({
        query: '{ __schema { queryType { fields { name } } } }',
        variables: {}
      })

      const data = result?.data as Record<string, any> | undefined
      const fields: Array<{ name: string }> = data?.__schema?.queryType?.fields || []
      const supported = fields.some((f: { name: string }) => f.name === fieldName)
      this.$__capabilityCache[cacheKey] = supported
      return supported
    } catch (err: any) {
      this.log('warn', `KnishIOClient::hasQueryField() - Capability probe for '${fieldName}' failed: ${err.message}`)
      this.$__capabilityCache[cacheKey] = false
      return false
    }
  }

  /**
   * Queries embedding status for one or more meta instances (DataBraid observability).
   *
   * If the connected server does not support the embeddingStatus query,
   * returns null without throwing an error (graceful degradation).
   *
   * Single mode: queryEmbeddingStatus({ metaType: 'product', metaId: 'SKU-001' })
   * Bulk mode:   queryEmbeddingStatus({ instances: [{ metaType: 'product', metaId: 'SKU-001' }, ...] })
   *
   * @returns Response with payload(), or null if the server does not support this query
   */
  async queryEmbeddingStatus({
    metaType = null,
    metaId = null,
    instances = null
  }: {
    metaType?: string | null
    metaId?: string | null
    instances?: Array<{ metaType: string; metaId: string }> | null
  }): Promise<Response | null> {
    this.log('info', `KnishIOClient::queryEmbeddingStatus() - Checking embedding status for metaType: ${metaType || '(bulk)'}...`)

    const supported = await this.hasQueryField('embeddingStatus')

    if (!supported) {
      this.log('warn', 'KnishIOClient::queryEmbeddingStatus() - Server does not support embeddingStatus query. Returning null.')
      return null
    }

    const query = this.createQuery(QueryEmbeddingStatus)
    const variables = QueryEmbeddingStatus.createVariables({ metaType, metaId, instances })

    return this.executeQuery(query, variables)
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
    filter?: MetaFilter[] | null
    latest?: boolean | null
    queryArgs?: Record<string, any> | null
  } = {}): Promise<Response> {
    this.log('info', 'KnishIOClient::queryAtom() - Querying atom instances')

    const query = this.createQuery(QueryAtom)

    const variables = QueryAtom.createVariables({
      molecularHashes,
      molecularHash,
      bundleHashes,
      bundleHash,
      positions,
      position,
      walletAddresses,
      walletAddress,
      isotopes,
      isotope,
      tokenSlugs,
      tokenSlug,
      cellSlugs,
      cellSlug,
      batchIds,
      batchId,
      values,
      value,
      metaTypes,
      metaType,
      metaIds,
      metaId,
      indexes,
      index,
      filter,
      latest,
      queryArgs
    })

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
    units: _units = null
  }: {
    token: TokenSlug | string
    amount?: number | string | null
    meta?: Record<string, any> | null
    batchId?: BatchId | string | null
    units?: string[] | null
  }): Promise<Response> {
    this.log('info', `KnishIOClient::createToken() - Creating token ${token}...`)

    // Create the molecule mutation
    const mutation = await this.createMoleculeMutation({ mutationClass: MutationCreateToken })

    // Create recipient wallet for new tokens
    const recipientWallet = new Wallet({
      secret: this.getSecret(),
      bundle: this.getBundle(),
      token,
      batchId: batchId as any
    })

    // Initialize the create token mutation
    await mutation.fillMolecule({
      recipientWallet,
      amount: amount ?? 0,
      meta
    })

    // Execute the mutation
    const response = await this.executeQuery(mutation)

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
    units: _units = null,
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

    // Create the molecule mutation
    const mutation = await this.createMoleculeMutation({ mutationClass: MutationRequestTokens })

    // Initialize the request tokens mutation
    await mutation.fillMolecule({
      token,
      amount: amount ?? 0,
      metaType: to || '',
      metaId: to || '',
      meta,
      batchId
    })

    // Execute the mutation
    const response = await this.executeQuery(mutation)

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
    units: _units = null,
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

    // Create remainder wallet from source (must be same token for V-isotope conservation)
    const remainderWallet = sourceWallet.createRemainder(this.getSecret())

    // Create molecule with the token-specific source and remainder wallets
    const molecule = await this.createMolecule({
      sourceWallet,
      remainderWallet
    })

    // Create a transfer to null address (burn)
    const mutation = await this.createMoleculeMutation({
      mutationClass: MutationTransferTokens,
      molecule
    })

    // Create recipient wallet for burn address
    const recipientWallet = new Wallet({
      secret: this.getSecret(),
      bundle: '0000000000000000000000000000000000000000000000000000000000000000',
      token
    })

    await mutation.fillMolecule({
      recipientWallet,
      amount: amount ?? 0
    })

    const response = await this.executeQuery(mutation)

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
    sourceWallet: _sourceWallet = null
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
    bundleHash: _bundleHash,
    tokenSlug,
    newTokenUnit: _newTokenUnit,
    fusedTokenUnitIds: _fusedTokenUnitIds,
    sourceWallet: _sourceWallet = null
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

    // Create the molecule mutation
    const mutation = await this.createMoleculeMutation({ mutationClass: MutationCreateWallet })

    // Create new wallet for this token
    const newWallet = new Wallet({
      secret: this.getSecret(),
      bundle: this.getBundle(),
      token
    })

    // Initialize the create wallet mutation
    await mutation.fillMolecule(newWallet)

    // Execute the mutation
    const response = await this.executeQuery(mutation)

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
    molecule: _molecule = null
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

    // Create the molecule mutation
    const mutation = await this.createMoleculeMutation({ mutationClass: MutationClaimShadowWallet })

    // Initialize the claim shadow wallet mutation
    await mutation.fillMolecule({
      token: token as TokenSlug,
      batchId: shadowWallet.batchId
    })

    // Execute the mutation
    const response = await this.executeQuery(mutation)

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

    // Create the molecule mutation — let createMolecule() handle sourceWallet via
    // carry-forward (remainder wallet from prior mutation) or server fallback
    const mutation = await this.createMoleculeMutation({
      mutationClass: MutationCreateMeta,
      molecule: await this.createMolecule({
        secret: this.getSecret()
      })
    })

    // Initialize the create meta mutation
    await mutation.fillMolecule({
      metaType,
      metaId,
      meta: meta || {},
      policy
    })

    // Execute the mutation
    const response = await this.executeQuery(mutation)

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

    // Create the molecule mutation — let createMolecule() handle sourceWallet via
    // carry-forward (remainder wallet from prior mutation) or server fallback
    const mutation = await this.createMoleculeMutation({
      mutationClass: MutationCreateRule,
      molecule: await this.createMolecule({
        secret: this.getSecret()
      })
    })

    // Initialize the create rule mutation
    await mutation.fillMolecule({
      metaType: metaType as MetaType,
      metaId: metaId as MetaId,
      rule,
      policy
    })

    // Execute the mutation
    const response = await this.executeQuery(mutation)

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

    // Create the molecule mutation
    const mutation = await this.createMoleculeMutation({ mutationClass: MutationCreateIdentifier })

    // Initialize the create identifier mutation
    await mutation.fillMolecule({
      type,
      contact,
      code
    })

    // Execute the mutation
    const response = await this.executeQuery(mutation)

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

    // Create the mutation (extends Mutation directly, not MutationProposeMolecule)
    const mutation = this.createQuery(MutationLinkIdentifier)

    // Execute with variables
    const response = await this.executeQuery(mutation, {
      bundle: this.getBundle(),
      type,
      content: contact
    })

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

    // Create the mutation (extends Mutation directly, not MutationProposeMolecule)
    const mutation = this.createQuery(MutationActiveSession)

    // Execute with variables (bundleHash matches GraphQL variable name)
    const response = await this.executeQuery(mutation, {
      bundleHash: bundle || this.getBundle(),
      metaType,
      metaId,
      ipAddress,
      browser,
      osCpu,
      resolution,
      timeZone,
      json
    })

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

    // Create remainder wallet from source (must be same token)
    const remainderWallet = sourceWallet.createRemainder(this.getSecret())

    // Build the molecule with the token-specific source and remainder wallets
    const molecule = await this.createMolecule({
      sourceWallet,
      remainderWallet
    })

    // Create the molecule mutation
    const mutation = await this.createMoleculeMutation({
      mutationClass: MutationDepositBufferToken,
      molecule
    })

    // Initialize the deposit buffer token mutation
    await mutation.fillMolecule({
      amount: typeof amount === 'string' ? Number(amount) : amount,
      tradeRates
    })

    // Execute the mutation
    const response = await this.executeQuery(mutation)

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

    // Create the molecule mutation
    const mutation = await this.createMoleculeMutation({ mutationClass: MutationWithdrawBufferToken })

    // Initialize the withdraw buffer token mutation
    const recipients: Record<string, any> = {}
    recipients[this.getBundle()] = amount
    // Only include signingWallet if it exists (exactOptionalPropertyTypes compliance)
    const fillMoleculeParams: any = { recipients }
    if (signingWallet) {
      fillMoleculeParams.signingWallet = signingWallet
    }
    await mutation.fillMolecule(fillMoleculeParams)

    // Execute the mutation
    const response = await this.executeQuery(mutation)

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

    // Create the mutation (extends Mutation directly, not MutationProposeMolecule)
    const mutation = this.createQuery(MutationRequestAuthorizationGuest)

    // Execute with variables
    const response = await this.executeQuery(mutation, {
      cellSlug: cellSlug || this.getCellSlug()
    })

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
   * Matches JavaScript SDK requestProfileAuthToken implementation
   */
  async requestProfileAuthToken({
    secret,
    encrypt = false
  }: {
    secret: string
    encrypt?: boolean
  }): Promise<ResponseRequestAuthorization> {
    this.log('info', 'KnishIOClient::requestProfileAuthToken() - Requesting profile auth token...')

    // Set the secret
    this.setSecret(secret)

    // Generate a signing wallet with AUTH token (matching JavaScript SDK)
    const wallet = new Wallet({
      secret,
      token: 'AUTH'
    })

    // Create a molecule with the AUTH wallet as source
    const molecule = await this.createMolecule({
      secret,
      sourceWallet: wallet
    })

    // Create the mutation with this specific molecule
    const mutation = await this.createMoleculeMutation({
      mutationClass: MutationRequestAuthorization,
      molecule
    })

    // Initialize the profile auth mutation
    mutation.fillMolecule({
      meta: { encrypt: encrypt ? 'true' : 'false' }
    })

    // Execute the mutation
    const response = await this.executeQuery(mutation) as ResponseRequestAuthorization

    if (!response) {
      throw new CodeException('Profile auth token request failed')
    }

    // Did the authorization molecule get accepted?
    if (response.success()) {
      // Create & set an auth token from the response data
      const authToken = AuthToken.create({
        token: response.token(),
        expiresAt: response.expiresAt(),
        encrypt: String(response.encrypt()) === 'true',
        pubkey: response.pubKey()
      }, wallet)
      this.setAuthToken(authToken)
    } else {
      throw new AuthorizationRejectedException(
        `KnishIOClient::requestProfileAuthToken() - Authorization attempt rejected by ledger. Reason: ${response.reason()}`
      )
    }

    // Handle encryption if needed
    if (encrypt) {
      this.switchEncryption(true)
    }

    return response
  }

  // =============================================================================
  // MUTATION METHODS - PEERING & APPEND REQUEST
  // =============================================================================

  /**
   * Register a peer node via P-isotope
   * Matches JavaScript SDK registerPeer implementation exactly
   */
  async registerPeer({ host }: { host: string }): Promise<Response> {
    this.log('info', `KnishIOClient::registerPeer() - Registering peer at ${host}...`)

    // Create the molecule mutation — let createMolecule() handle sourceWallet via
    // carry-forward (remainder wallet from prior mutation) or server fallback
    const mutation = await this.createMoleculeMutation({
      mutationClass: MutationPeering,
      molecule: await this.createMolecule({
        secret: this.getSecret()
      })
    })

    // Fill the molecule with peering data
    mutation.fillMolecule({ host })

    // Execute the mutation
    const response = await this.executeQuery(mutation)

    if (!response) {
      throw new CodeException('Peer registration failed')
    }

    return response
  }

  /**
   * Submit an append request via A-isotope
   * Matches JavaScript SDK appendRequest implementation exactly
   */
  async appendRequest({
    metaType,
    metaId,
    action,
    meta = {}
  }: {
    metaType: string
    metaId: string
    action: string
    meta?: Record<string, any>
  }): Promise<Response> {
    this.log('info', `KnishIOClient::appendRequest() - Submitting append request for ${metaType}:${metaId}...`)

    // Create the molecule mutation — let createMolecule() handle sourceWallet via
    // carry-forward (remainder wallet from prior mutation) or server fallback
    const mutation = await this.createMoleculeMutation({
      mutationClass: MutationAppendRequest,
      molecule: await this.createMolecule({
        secret: this.getSecret()
      })
    })

    // Fill the molecule with append request data
    mutation.fillMolecule({
      metaType,
      metaId,
      action,
      meta
    })

    // Execute the mutation
    const response = await this.executeQuery(mutation)

    if (!response) {
      throw new CodeException('Append request failed')
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