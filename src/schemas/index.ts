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
 * Zod Runtime Validation Schemas for KnishIO TypeScript SDK
 * 
 * Implements TypeScript 2025 best practices with comprehensive runtime validation
 * for all core data structures, ensuring type safety at runtime and compile time.
 */

import { z } from 'zod'

// =============================================================================
// BRANDED TYPE VALIDATION SCHEMAS
// =============================================================================

const hexStringRegex = /^[0-9a-fA-F]+$/
const base17HashRegex = /^[0-9a-g]+$/

export const HexStringSchema = z.string()
  .regex(hexStringRegex, 'Must be a valid hexadecimal string')
  .brand<'HexString'>()

export const WalletAddressSchema = z.string()
  .regex(hexStringRegex, 'Wallet address must be hexadecimal')
  .length(64, 'Wallet address must be exactly 64 characters')
  .brand<'WalletAddress'>()

export const BundleHashSchema = z.string()
  .regex(hexStringRegex, 'Bundle hash must be hexadecimal')
  .length(64, 'Bundle hash must be exactly 64 characters')
  .brand<'BundleHash'>()

export const PositionSchema = z.string()
  .regex(hexStringRegex, 'Position must be hexadecimal')
  .length(64, 'Position must be exactly 64 characters')
  .brand<'Position'>()

export const MolecularHashSchema = z.string()
  .regex(base17HashRegex, 'Molecular hash must be base17 format (0-9,a-g)')
  .min(1, 'Molecular hash cannot be empty')
  .brand<'MolecularHash'>()

export const TokenSlugSchema = z.string()
  .min(1, 'Token slug cannot be empty')
  .max(64, 'Token slug cannot exceed 64 characters')
  .transform(val => val.toUpperCase())
  .brand<'TokenSlug'>()

export const MetaTypeSchema = z.string()
  .min(1, 'Meta type cannot be empty')
  .max(256, 'Meta type cannot exceed 256 characters')
  .brand<'MetaType'>()

export const MetaIdSchema = z.string()
  .min(1, 'Meta ID cannot be empty')
  .brand<'MetaId'>()

export const BatchIdSchema = z.string()
  .min(1, 'Batch ID cannot be empty')
  .brand<'BatchId'>()

export const CellSlugSchema = z.string()
  .min(1, 'Cell slug cannot be empty')
  .max(64, 'Cell slug cannot exceed 64 characters')
  .brand<'CellSlug'>()

// =============================================================================
// ATOM ISOTOPE VALIDATION
// =============================================================================

export const AtomIsotopeSchema = z.enum(['C', 'V', 'U', 'T', 'M', 'I', 'R', 'B', 'F'], {
  errorMap: () => ({ message: 'Invalid atom isotope. Must be one of: C, V, U, T, M, I, R, B, F' })
})

// =============================================================================
// METADATA VALIDATION SCHEMAS
// =============================================================================

export const MetaDataValueSchema: z.ZodType<string | number | boolean | null> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null()
])

export const AtomMetaDataSchema = z.object({
  key: z.string().min(1, 'Meta key cannot be empty'),
  value: MetaDataValueSchema
}).strict()

export const MetaDataSchema: z.ZodType<Record<string, any>> = z.lazy(() =>
  z.record(z.union([
    MetaDataValueSchema,
    MetaDataSchema,
    z.array(MetaDataSchema)
  ]))
)

// =============================================================================
// CORE PARAMETER SCHEMAS
// =============================================================================

export const AtomParamsSchema = z.object({
  position: z.union([z.string(), z.null()]).optional(),
  walletAddress: z.union([WalletAddressSchema, z.string(), z.null()]).optional(),
  isotope: AtomIsotopeSchema.optional(),
  token: z.union([TokenSlugSchema, z.string()]).optional(),
  value: z.union([z.string(), z.number(), z.null()]).optional(),
  batchId: z.union([BatchIdSchema, z.string(), z.null()]).optional(),
  metaType: z.union([MetaTypeSchema, z.string(), z.null()]).optional(),
  metaId: z.union([MetaIdSchema, z.string(), z.null()]).optional(),
  meta: z.union([z.array(AtomMetaDataSchema), z.null()]).optional(),
  otsFragment: z.union([z.string(), z.null()]).optional(),
  index: z.union([z.number().int().min(0), z.null()]).optional(),
  createdAt: z.union([z.string(), z.null()]).optional(),
  version: z.union([z.number().int().min(1), z.null()]).optional()
}).strict()

export const WalletParamsSchema = z.object({
  secret: z.union([z.string(), z.null()]).optional(),
  bundle: z.union([BundleHashSchema, z.string(), z.null()]).optional(),
  token: z.union([TokenSlugSchema, z.string()]).optional(),
  address: z.union([WalletAddressSchema, z.string(), z.null()]).optional(),
  position: z.union([PositionSchema, z.string(), z.null()]).optional(),
  batchId: z.union([BatchIdSchema, z.string(), z.null()]).optional(),
  characters: z.union([z.string(), z.null()]).optional()
}).strict()

export const MoleculeParamsSchema = z.object({
  secret: z.union([z.string(), z.null()]).optional(),
  bundle: z.union([BundleHashSchema, z.string(), z.null()]).optional(),
  sourceWallet: z.union([WalletParamsSchema, z.null()]).optional(),
  remainderWallet: z.union([WalletParamsSchema, z.null()]).optional(),
  cellSlug: z.union([CellSlugSchema, z.string(), z.null()]).optional(),
  version: z.number().int().min(1).optional()
}).strict()

// =============================================================================
// CLIENT CONFIGURATION SCHEMAS
// =============================================================================

export const KnishIOClientConfigSchema = z.object({
  uri: z.union([z.string().url(), z.array(z.string().url())]).optional(),
  cellSlug: z.union([CellSlugSchema, z.string(), z.null()]).optional(),
  client: z.unknown().optional(),
  socket: z.unknown().optional(),
  serverSdkVersion: z.number().int().min(1).optional(),
  logging: z.boolean().optional()
}).strict()

// =============================================================================
// AUTHENTICATION SCHEMAS
// =============================================================================

export const AuthTokenParamsSchema = z.object({
  token: z.string().min(1, 'Auth token cannot be empty'),
  expiresAt: z.number().int().min(0, 'Expiration time must be positive'),
  encrypt: z.boolean(),
  pubkey: z.string().min(1, 'Public key cannot be empty')
}).strict()

export const AuthParamsSchema = z.object({
  cellSlug: z.union([CellSlugSchema, z.string(), z.null()]).optional(),
  encrypt: z.boolean().optional(),
  callback: z.function().args(z.unknown()).returns(z.void()).optional()
}).strict()

export const GuestAuthParamsSchema = z.object({
  cellSlug: z.union([CellSlugSchema, z.string(), z.null()]).optional()
}).strict()

// =============================================================================
// TOKEN OPERATION SCHEMAS
// =============================================================================

export const TransferParamsSchema = z.object({
  recipient: z.union([WalletAddressSchema, z.string()]),
  amount: z.union([z.number().positive(), z.string().min(1)]),
  token: z.union([TokenSlugSchema, z.string()]).optional(),
  callbackUrl: z.union([z.string().url(), z.null()]).optional(),
  metaType: z.union([MetaTypeSchema, z.string(), z.null()]).optional(),
  metaId: z.union([MetaIdSchema, z.string(), z.null()]).optional(),
  meta: z.union([MetaDataSchema, z.null()]).optional()
}).strict()

export const CreateTokenParamsSchema = z.object({
  token: z.union([TokenSlugSchema, z.string()]),
  amount: z.union([z.number().positive(), z.string().min(1)]),
  metaType: z.union([MetaTypeSchema, z.string(), z.null()]).optional(),
  metaId: z.union([MetaIdSchema, z.string(), z.null()]).optional(),
  meta: z.union([MetaDataSchema, z.null()]).optional(),
  fungible: z.boolean().optional(),
  splittable: z.number().int().min(0).optional(),
  supplyToken: z.union([TokenSlugSchema, z.string(), z.null()]).optional()
}).strict()

export const RequestTokensParamsSchema = z.object({
  amount: z.union([z.number().positive(), z.string().min(1)]),
  token: z.union([TokenSlugSchema, z.string()]).optional(),
  metaType: z.union([MetaTypeSchema, z.string(), z.null()]).optional(),
  metaId: z.union([MetaIdSchema, z.string(), z.null()]).optional(),
  meta: z.union([MetaDataSchema, z.null()]).optional()
}).strict()

// =============================================================================
// QUERY PARAMETER SCHEMAS
// =============================================================================

export const BalanceQueryParamsSchema = z.object({
  address: z.union([WalletAddressSchema, z.string(), z.null()]).optional(),
  bundleHash: z.union([BundleHashSchema, z.string(), z.null()]).optional(),
  token: z.union([TokenSlugSchema, z.string(), z.null()]).optional(),
  type: z.enum(['token', 'user']).nullable().optional()
}).strict()

export const MetaQueryParamsSchema = z.object({
  metaType: z.union([MetaTypeSchema, z.string()]),
  metaId: z.union([MetaIdSchema, z.string(), z.null()]).optional(),
  key: z.union([z.string(), z.null()]).optional(),
  value: z.union([z.string(), z.null()]).optional(),
  latest: z.union([z.boolean(), z.null()]).optional(),
  filter: z.union([z.string(), z.null()]).optional(),
  queryArgs: z.union([z.record(z.unknown()), z.null()]).optional(),
  count: z.union([z.number().int().min(1), z.null()]).optional(),
  countBy: z.union([z.string(), z.null()]).optional(),
  cellSlug: z.union([CellSlugSchema, z.string(), z.null()]).optional()
}).strict()

export const WalletQueryParamsSchema = z.object({
  bundleHash: z.union([BundleHashSchema, z.string(), z.null()]).optional(),
  tokenSlug: z.union([TokenSlugSchema, z.string(), z.null()]).optional(),
  unspent: z.union([z.boolean(), z.null()]).optional()
}).strict()

// =============================================================================
// CRYPTOGRAPHIC SCHEMAS
// =============================================================================

export const CryptoOptionsSchema = z.object({
  seed: z.union([z.string(), z.null()]).optional(),
  length: z.number().int().min(1).optional(),
  outputLength: z.number().int().min(1).optional()
}).strict()

export const KeyPairResultSchema = z.object({
  privateKey: z.string().min(1, 'Private key cannot be empty'),
  publicKey: z.string().min(1, 'Public key cannot be empty')
}).strict()

export const SignatureResultSchema = z.object({
  signature: z.string().min(1, 'Signature cannot be empty'),
  otsFragments: z.array(z.string()).optional()
}).strict()

// =============================================================================
// GRAPHQL OPERATION SCHEMAS
// =============================================================================

export const GraphQLRequestSchema = z.object({
  query: z.string().min(1, 'GraphQL query cannot be empty'),
  variables: z.record(z.unknown()).optional(),
  operationName: z.union([z.string(), z.null()]).optional()
}).strict()

export const GraphQLErrorSchema = z.object({
  message: z.string(),
  locations: z.array(z.object({
    line: z.number().int().min(1),
    column: z.number().int().min(1)
  })).optional(),
  path: z.array(z.union([z.string(), z.number()])).optional(),
  extensions: z.record(z.unknown()).optional()
}).strict()

export const GraphQLResponseSchema = z.object({
  data: z.unknown().optional(),
  errors: z.array(GraphQLErrorSchema).nullable().optional(),
  extensions: z.record(z.unknown()).optional()
}).strict()

// =============================================================================
// SUBSCRIPTION SCHEMAS
// =============================================================================

export const SubscriptionOptionsSchema = z.object({
  operationName: z.string().optional(),
  query: z.string().optional(),
  variables: z.record(z.unknown()).optional(),
  callback: z.function().args(z.unknown()).returns(z.void()).optional()
}).strict()

// =============================================================================
// VALIDATION RESULT SCHEMAS
// =============================================================================

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  error: z.union([z.string(), z.null()]).optional(),
  expected: z.string().optional(),
  actual: z.unknown().optional()
}).strict()

// =============================================================================
// ERROR CONTEXT SCHEMAS
// =============================================================================

export const ErrorContextSchema = z.object({
  operation: z.string().optional(),
  parameters: z.record(z.unknown()).optional(),
  timestamp: z.number().int().min(0).optional(),
  stack: z.string().optional()
}).strict()

export const KnishIOErrorTypeSchema = z.enum([
  'ATOM_INDEX_ERROR',
  'ATOMS_MISSING_ERROR',
  'AUTHORIZATION_REJECTED_ERROR',
  'BALANCE_INSUFFICIENT_ERROR',
  'BATCH_ID_ERROR',
  'CODE_ERROR',
  'DECRYPTION_KEY_ERROR',
  'INVALID_RESPONSE_ERROR',
  'META_MISSING_ERROR',
  'MOLECULAR_HASH_MISMATCH_ERROR',
  'MOLECULAR_HASH_MISSING_ERROR',
  'NEGATIVE_AMOUNT_ERROR',
  'POLICY_INVALID_ERROR',
  'SIGNATURE_MALFORMED_ERROR',
  'SIGNATURE_MISMATCH_ERROR',
  'STACKABLE_UNIT_AMOUNT_ERROR',
  'STACKABLE_UNIT_DECIMALS_ERROR',
  'TRANSFER_BALANCE_ERROR',
  'TRANSFER_MALFORMED_ERROR',
  'TRANSFER_MISMATCHED_ERROR',
  'TRANSFER_REMAINDER_ERROR',
  'TRANSFER_TO_SELF_ERROR',
  'TRANSFER_UNBALANCED_ERROR',
  'UNAUTHENTICATED_ERROR',
  'WALLET_CREDENTIAL_ERROR',
  'WALLET_SHADOW_ERROR',
  'WRONG_TOKEN_TYPE_ERROR'
])

// =============================================================================
// UTILITY VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates and parses data using a Zod schema with enhanced error messages
 */
export function parseWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    const errorMessage = context 
      ? `${context}: ${result.error.message}`
      : result.error.message
    
    throw new Error(errorMessage)
  }
  
  return result.data
}

/**
 * Type-safe validation that returns a result object instead of throwing
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, error: result.error.message }
  }
}

/**
 * Validates multiple values with their respective schemas
 */
export function validateMultiple<T extends Record<string, any>>(
  validations: { [K in keyof T]: { schema: z.ZodSchema<T[K]>; data: unknown } }
): T {
  const result = {} as T
  
  for (const [key, { schema, data }] of Object.entries(validations)) {
    result[key as keyof T] = parseWithSchema(schema, data, `Field '${key}'`)
  }
  
  return result
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  z as ZodType
}

// Export all schemas for external use
export {
  z
}