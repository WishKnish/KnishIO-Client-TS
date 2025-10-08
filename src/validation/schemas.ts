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
 * Zod Validation Schemas for KnishIO SDK
 * 
 * Provides runtime validation with compile-time type safety
 * Implements 2025 TypeScript best practices with Zod integration
 */

import { z } from 'zod'

// =============================================================================
// CORE TYPE SCHEMAS (2025 TYPESCRIPT PATTERN)
// =============================================================================

/**
 * Branded type helper for Zod schemas
 * Creates runtime-validated branded types
 */
function createBrandedSchema<T extends string>(
  name: T,
  baseSchema: z.ZodString = z.string()
) {
  return baseSchema.brand(name)
}

// Crypto and identifier schemas with validation
export const WalletAddressSchema = createBrandedSchema('WalletAddress', 
  z.string().regex(/^[0-9a-fA-F]{64}$/, 'Invalid wallet address format')
)

export const BundleHashSchema = createBrandedSchema('BundleHash',
  z.string().regex(/^[0-9a-fA-F]{64}$/, 'Invalid bundle hash format')
)

export const PositionSchema = createBrandedSchema('Position',
  z.string().regex(/^[0-9a-fA-F]{64}$/, 'Invalid position format')
)

export const MolecularHashSchema = createBrandedSchema('MolecularHash',
  z.string().regex(/^[0-9a-g]+$/, 'Invalid molecular hash format (base17)')
)

export const TokenSlugSchema = createBrandedSchema('TokenSlug',
  z.string().min(1).max(32).regex(/^[A-Z0-9_]+$/, 'Token slug must be uppercase alphanumeric')
)

export const BatchIdSchema = createBrandedSchema('BatchId',
  z.string().uuid('Invalid batch ID format')
)

export const CellSlugSchema = createBrandedSchema('CellSlug',
  z.string().min(1).max(64).regex(/^[a-zA-Z0-9\-_.]+$/, 'Invalid cell slug format')
)

// =============================================================================
// ATOM ISOTOPE SCHEMAS (DISCRIMINATED UNIONS)
// =============================================================================

const ISOTOPES = ['C', 'V', 'U', 'T', 'M', 'I', 'R', 'B', 'F'] as const
export const AtomIsotopeSchema = z.enum(ISOTOPES)

// Isotope-specific validation
export const ValueAtomSchema = z.object({
  isotope: z.literal('V'),
  value: z.union([z.string(), z.number()]).refine(
    val => !isNaN(Number(val)), 
    'Value must be numeric'
  )
}).strict()

export const MetaAtomSchema = z.object({
  isotope: z.literal('M'),
  metaType: z.string().min(1),
  metaId: z.string().min(1),
  meta: z.array(z.object({
    key: z.string(),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()])
  }))
}).strict()

export const ContinueAtomSchema = z.object({
  isotope: z.literal('C')
}).strict()

// =============================================================================
// METADATA SCHEMAS (ENHANCED VALIDATION)
// =============================================================================

export const MetaDataSchema: z.ZodType<any> = z.lazy(() => 
  z.union([
    z.string(),
    z.number(), 
    z.boolean(),
    z.null(),
    z.record(z.string(), MetaDataSchema),
    z.array(MetaDataSchema)
  ])
)

export const AtomMetaDataSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()])
}).strict()

export const NormalizedMetaSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()])
}).passthrough() // Allow additional properties

// =============================================================================
// CORE ENTITY SCHEMAS
// =============================================================================

export const AtomParamsSchema = z.object({
  position: z.string().optional(),
  walletAddress: z.union([WalletAddressSchema, z.string()]).optional(),
  isotope: AtomIsotopeSchema.default('C'),
  token: z.union([TokenSlugSchema, z.string()]).default('USER'),
  value: z.union([z.string(), z.number(), z.null()]).optional(),
  batchId: z.union([BatchIdSchema, z.string(), z.null()]).optional(),
  metaType: z.string().optional(),
  metaId: z.string().optional(),
  meta: z.array(AtomMetaDataSchema).optional(),
  otsFragment: z.string().optional(),
  index: z.number().int().min(0).optional(),
  createdAt: z.string().optional(),
  version: z.number().int().min(1).optional()
}).strict()

export const WalletParamsSchema = z.object({
  secret: z.string().optional(),
  bundle: z.union([BundleHashSchema, z.string()]).optional(),
  token: z.union([TokenSlugSchema, z.string()]).default('USER'),
  address: z.union([WalletAddressSchema, z.string()]).optional(),
  position: z.union([PositionSchema, z.string()]).optional(),
  batchId: z.union([BatchIdSchema, z.string()]).optional(),
  characters: z.string().optional()
}).strict()

export const MoleculeParamsSchema = z.object({
  secret: z.string().optional(),
  bundle: z.union([BundleHashSchema, z.string()]).optional(),
  sourceWallet: WalletParamsSchema.optional(),
  remainderWallet: WalletParamsSchema.optional(),
  cellSlug: z.union([CellSlugSchema, z.string()]).optional(),
  version: z.number().int().min(1).optional()
}).strict()

// =============================================================================
// CLIENT CONFIGURATION SCHEMAS (ENV VALIDATION)
// =============================================================================

export const KnishIOClientConfigSchema = z.object({
  uri: z.union([
    z.string().url('Invalid URI format'),
    z.array(z.string().url('Invalid URI format')).min(1)
  ]).optional(),
  cellSlug: z.union([CellSlugSchema, z.string()]).optional(),
  client: z.unknown().optional(),
  socket: z.unknown().optional(),
  serverSdkVersion: z.number().int().min(1).max(10).default(4),
  logging: z.boolean().default(false)
}).strict()

// Environment configuration with validation
export const EnvironmentConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  KNISHIO_NODE_URI: z.string().url().optional(),
  KNISHIO_CELL_SLUG: z.string().optional(),
  KNISHIO_LOGGING: z.string().transform(val => val === 'true').default('false'),
  KNISHIO_SERVER_SDK_VERSION: z.string().transform(val => parseInt(val, 10)).default('4')
}).partial()

// =============================================================================
// OPERATION PARAMETER SCHEMAS
// =============================================================================

export const TransferParamsSchema = z.object({
  recipient: z.union([WalletAddressSchema, z.string()]),
  amount: z.union([z.number(), z.string()]).refine(
    val => Number(val) > 0,
    'Amount must be positive'
  ),
  token: z.union([TokenSlugSchema, z.string()]).optional(),
  callbackUrl: z.string().url().optional(),
  metaType: z.string().optional(),
  metaId: z.string().optional(),
  meta: MetaDataSchema.optional()
}).strict()

export const CreateTokenParamsSchema = z.object({
  token: z.union([TokenSlugSchema, z.string()]),
  amount: z.union([z.number(), z.string()]).refine(
    val => Number(val) > 0,
    'Amount must be positive'  
  ),
  metaType: z.string().optional(),
  metaId: z.string().optional(),
  meta: MetaDataSchema.optional(),
  fungible: z.boolean().default(true),
  splittable: z.number().int().min(0).optional(),
  supplyToken: z.union([TokenSlugSchema, z.string()]).optional()
}).strict()

export const RequestTokensParamsSchema = z.object({
  amount: z.union([z.number(), z.string()]).refine(
    val => Number(val) > 0,
    'Amount must be positive'
  ),
  token: z.union([TokenSlugSchema, z.string()]).optional(),
  metaType: z.string().optional(),
  metaId: z.string().optional(),
  meta: MetaDataSchema.optional()
}).strict()

// =============================================================================
// QUERY PARAMETER SCHEMAS
// =============================================================================

export const BalanceQueryParamsSchema = z.object({
  address: z.union([WalletAddressSchema, z.string()]).optional(),
  bundleHash: z.union([BundleHashSchema, z.string()]).optional(),
  token: z.union([TokenSlugSchema, z.string()]).optional(),
  type: z.enum(['token', 'user']).optional()
}).strict()

export const MetaQueryParamsSchema = z.object({
  metaType: z.string().min(1),
  metaId: z.string().optional(),
  key: z.string().optional(),
  value: z.string().optional(),
  latest: z.boolean().optional(),
  filter: z.string().optional(),
  queryArgs: z.record(z.unknown()).optional(),
  count: z.number().int().min(0).optional(),
  countBy: z.string().optional(),
  cellSlug: z.union([CellSlugSchema, z.string()]).optional()
}).strict()

export const WalletQueryParamsSchema = z.object({
  bundleHash: z.union([BundleHashSchema, z.string()]).optional(),
  tokenSlug: z.union([TokenSlugSchema, z.string()]).optional(),
  unspent: z.boolean().optional()
}).strict()

// =============================================================================
// AUTHENTICATION SCHEMAS
// =============================================================================

export const AuthTokenParamsSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.number().int().min(0),
  encrypt: z.boolean(),
  pubkey: z.string().min(1)
}).strict()

export const AuthParamsSchema = z.object({
  cellSlug: z.union([CellSlugSchema, z.string()]).optional(),
  encrypt: z.boolean().optional(),
  callback: z.function().optional()
}).strict()

export const GuestAuthParamsSchema = z.object({
  cellSlug: z.union([CellSlugSchema, z.string()]).optional()
}).strict()

// =============================================================================
// GRAPHQL SCHEMAS
// =============================================================================

export const GraphQLRequestSchema = z.object({
  query: z.string().min(1),
  variables: z.record(z.unknown()).optional(),
  operationName: z.string().optional()
}).strict()

export const GraphQLErrorSchema = z.object({
  message: z.string(),
  locations: z.array(z.object({
    line: z.number().int(),
    column: z.number().int()
  })).optional(),
  path: z.array(z.union([z.string(), z.number()])).optional(),
  extensions: z.record(z.unknown()).optional()
}).strict()

export const GraphQLResponseSchema = z.object({
  data: z.unknown().optional(),
  errors: z.array(GraphQLErrorSchema).optional(),
  extensions: z.record(z.unknown()).optional()
}).strict()

// =============================================================================
// VALIDATION UTILITIES (2025 PATTERNS)
// =============================================================================

/**
 * Safe parsing with enhanced error information
 */
export function safeParse<T>(schema: z.ZodType<T>, data: unknown) {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    return {
      success: false as const,
      error: {
        issues: result.error.issues,
        message: result.error.message,
        formatted: result.error.format()
      }
    }
  }
  
  return {
    success: true as const,
    data: result.data
  }
}

/**
 * Strict validation that throws on failure
 */
export function validateStrict<T>(schema: z.ZodType<T>, data: unknown, context?: string): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const contextMsg = context ? ` in ${context}` : ''
      throw new Error(`Validation failed${contextMsg}: ${error.message}`)
    }
    throw error
  }
}

/**
 * Transform and validate with default fallbacks
 */
export function validateWithDefaults<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data)
}

/**
 * Runtime type guard generator
 */
export function createTypeGuard<T>(schema: z.ZodType<T>) {
  return (value: unknown): value is T => {
    return schema.safeParse(value).success
  }
}

// =============================================================================
// SCHEMA EXPORTS FOR EXTERNAL USE
// =============================================================================

export const Schemas = {
  // Core types
  WalletAddress: WalletAddressSchema,
  BundleHash: BundleHashSchema,
  Position: PositionSchema,
  MolecularHash: MolecularHashSchema,
  TokenSlug: TokenSlugSchema,
  BatchId: BatchIdSchema,
  CellSlug: CellSlugSchema,
  
  // Entities
  AtomParams: AtomParamsSchema,
  WalletParams: WalletParamsSchema,
  MoleculeParams: MoleculeParamsSchema,
  
  // Configuration
  ClientConfig: KnishIOClientConfigSchema,
  EnvironmentConfig: EnvironmentConfigSchema,
  
  // Operations
  TransferParams: TransferParamsSchema,
  CreateTokenParams: CreateTokenParamsSchema,
  RequestTokensParams: RequestTokensParamsSchema,
  
  // Queries
  BalanceQueryParams: BalanceQueryParamsSchema,
  MetaQueryParams: MetaQueryParamsSchema,
  WalletQueryParams: WalletQueryParamsSchema,
  
  // Auth
  AuthTokenParams: AuthTokenParamsSchema,
  AuthParams: AuthParamsSchema,
  GuestAuthParams: GuestAuthParamsSchema,
  
  // GraphQL
  GraphQLRequest: GraphQLRequestSchema,
  GraphQLResponse: GraphQLResponseSchema
} as const

// Type exports for compile-time usage
export type ValidatedWalletAddress = z.infer<typeof WalletAddressSchema>
export type ValidatedBundleHash = z.infer<typeof BundleHashSchema>
export type ValidatedTokenSlug = z.infer<typeof TokenSlugSchema>
export type ValidatedClientConfig = z.infer<typeof KnishIOClientConfigSchema>
export type ValidatedTransferParams = z.infer<typeof TransferParamsSchema>
export type ValidatedGraphQLResponse = z.infer<typeof GraphQLResponseSchema>