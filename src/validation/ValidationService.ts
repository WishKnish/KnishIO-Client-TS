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
 * ValidationService - Centralized validation for KnishIO SDK
 * 
 * Implements 2025 TypeScript patterns:
 * - Zod runtime validation with compile-time types
 * - Result<T, E> pattern for error handling
 * - Builder pattern for validation chains
 * - Branded types for domain safety
 */

import { z } from 'zod'
import type { 
  KnishIOClientConfig,
  TransferParams,
  CreateTokenParams,
  RequestTokensParams,
  BalanceQueryParams,
  MetaQueryParams,
  WalletQueryParams
} from '@/types'
import {
  Schemas,
  safeParse,
  validateStrict,
  validateWithDefaults,
  createTypeGuard,
  type ValidatedClientConfig,
  type ValidatedTransferParams,
  type ValidatedGraphQLResponse
} from './schemas'

// =============================================================================
// RESULT TYPE PATTERN (2025 TYPESCRIPT)
// =============================================================================

export type ValidationResult<T, E = ValidationError> = 
  | { success: true; data: T; warnings?: string[] }
  | { success: false; error: E }

export interface ValidationError {
  code: 'VALIDATION_ERROR' | 'SCHEMA_ERROR' | 'TYPE_ERROR'
  message: string
  field?: string
  value?: unknown
  details?: z.ZodIssue[]
  context?: string
}

export interface ValidationOptions {
  strict?: boolean
  allowUnknown?: boolean
  stripUnknown?: boolean
  context?: string
  warnings?: boolean
}

// =============================================================================
// VALIDATION SERVICE CLASS
// =============================================================================

/**
 * Centralized validation service using Zod schemas
 * Provides type-safe validation with enhanced error reporting
 */
export class ValidationService {
  private static instance: ValidationService
  private validationHistory: Array<{
    timestamp: number
    schema: string
    success: boolean
    error?: string
  }> = []

  private constructor() {}

  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService()
    }
    return ValidationService.instance
  }

  // =============================================================================
  // CORE VALIDATION METHODS
  // =============================================================================

  /**
   * Validate client configuration with environment overrides
   */
  validateClientConfig(config: unknown): ValidationResult<ValidatedClientConfig> {
    try {
      // First get environment-mapped client config
      const envResult = this.validateEnvironmentConfig()
      const envMappedConfig = envResult.success ? envResult.data : {}

      // Merge environment config with provided config (provided config takes precedence)
      const mergedConfig = {
        ...envMappedConfig,
        ...(typeof config === 'object' && config !== null ? config : {})
      }

      const parseResult = safeParse(Schemas.ClientConfig, mergedConfig)
      
      if (!parseResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid client configuration',
            details: parseResult.error.issues,
            context: 'ClientConfig'
          }
        }
      }

      this.logValidation('ClientConfig', true)
      return {
        success: true,
        data: parseResult.data,
        warnings: this.generateConfigWarnings(parseResult.data)
      }
    } catch (error) {
      this.logValidation('ClientConfig', false, String(error))
      return {
        success: false,
        error: {
          code: 'SCHEMA_ERROR',
          message: `Validation failed: ${error}`,
          context: 'ClientConfig'
        }
      }
    }
  }

  /**
   * Validate environment configuration and map to client config format
   */
  validateEnvironmentConfig(): ValidationResult<Record<string, any>> {
    try {
      const env = {
        NODE_ENV: process.env.NODE_ENV,
        KNISHIO_NODE_URI: process.env.KNISHIO_NODE_URI,
        KNISHIO_CELL_SLUG: process.env.KNISHIO_CELL_SLUG,
        KNISHIO_LOGGING: process.env.KNISHIO_LOGGING,
        KNISHIO_SERVER_SDK_VERSION: process.env.KNISHIO_SERVER_SDK_VERSION
      }

      const parseResult = safeParse(Schemas.EnvironmentConfig, env)
      
      if (!parseResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid environment configuration',
            details: parseResult.error.issues,
            context: 'Environment'
          }
        }
      }

      // Map environment variables to client configuration properties
      const validatedEnv = parseResult.data
      const clientConfig: Record<string, any> = {}

      // Map KNISHIO_NODE_URI to uri
      if (validatedEnv.KNISHIO_NODE_URI) {
        clientConfig.uri = validatedEnv.KNISHIO_NODE_URI
      }

      // Map KNISHIO_CELL_SLUG to cellSlug  
      if (validatedEnv.KNISHIO_CELL_SLUG) {
        clientConfig.cellSlug = validatedEnv.KNISHIO_CELL_SLUG
      }

      // Map KNISHIO_LOGGING to logging
      if (validatedEnv.KNISHIO_LOGGING !== undefined) {
        clientConfig.logging = validatedEnv.KNISHIO_LOGGING
      }

      // Map KNISHIO_SERVER_SDK_VERSION to serverSdkVersion
      if (validatedEnv.KNISHIO_SERVER_SDK_VERSION !== undefined) {
        clientConfig.serverSdkVersion = validatedEnv.KNISHIO_SERVER_SDK_VERSION
      }

      return { success: true, data: clientConfig }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SCHEMA_ERROR',
          message: `Environment validation failed: ${error}`,
          context: 'Environment'
        }
      }
    }
  }

  /**
   * Validate transfer parameters with business logic
   */
  validateTransferParams(params: unknown): ValidationResult<ValidatedTransferParams> {
    try {
      const parseResult = safeParse(Schemas.TransferParams, params)
      
      if (!parseResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid transfer parameters',
            details: parseResult.error.issues,
            context: 'TransferParams'
          }
        }
      }

      // Additional business logic validation
      const businessValidation = this.validateTransferBusinessLogic(parseResult.data)
      if (!businessValidation.success) {
        return businessValidation
      }

      this.logValidation('TransferParams', true)
      return {
        success: true,
        data: parseResult.data,
        warnings: this.generateTransferWarnings(parseResult.data)
      }
    } catch (error) {
      this.logValidation('TransferParams', false, String(error))
      return {
        success: false,
        error: {
          code: 'SCHEMA_ERROR',
          message: `Transfer validation failed: ${error}`,
          context: 'TransferParams'
        }
      }
    }
  }

  /**
   * Validate GraphQL response structure
   */
  validateGraphQLResponse(response: unknown): ValidationResult<ValidatedGraphQLResponse> {
    try {
      const parseResult = safeParse(Schemas.GraphQLResponse, response)
      
      if (!parseResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid GraphQL response format',
            details: parseResult.error.issues,
            context: 'GraphQLResponse'
          }
        }
      }

      // Check for GraphQL errors
      if (parseResult.data.errors && parseResult.data.errors.length > 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'GraphQL response contains errors',
            details: parseResult.data.errors.map(err => ({
              code: 'invalid_type',
              expected: 'success',
              received: 'error',
              path: [],
              message: err.message
            } as z.ZodIssue)),
            context: 'GraphQLResponse'
          }
        }
      }

      this.logValidation('GraphQLResponse', true)
      return { success: true, data: parseResult.data }
    } catch (error) {
      this.logValidation('GraphQLResponse', false, String(error))
      return {
        success: false,
        error: {
          code: 'SCHEMA_ERROR',
          message: `GraphQL response validation failed: ${error}`,
          context: 'GraphQLResponse'
        }
      }
    }
  }

  // =============================================================================
  // BUILDER PATTERN FOR VALIDATION CHAINS
  // =============================================================================

  /**
   * Create a validation chain builder
   */
  createValidationChain<T>(): ValidationChainBuilder<T> {
    return new ValidationChainBuilder<T>(this)
  }

  // =============================================================================
  // TYPE GUARDS AND UTILITIES
  // =============================================================================

  /**
   * Runtime type guards for common types
   */
  readonly typeGuards = {
    isWalletAddress: createTypeGuard(Schemas.WalletAddress),
    isBundleHash: createTypeGuard(Schemas.BundleHash),
    isTokenSlug: createTypeGuard(Schemas.TokenSlug),
    isClientConfig: createTypeGuard(Schemas.ClientConfig),
    isTransferParams: createTypeGuard(Schemas.TransferParams),
    isGraphQLResponse: createTypeGuard(Schemas.GraphQLResponse)
  } as const

  /**
   * Validate any value against a specific schema
   */
  validate<T>(schema: z.ZodType<T>, value: unknown, options: ValidationOptions = {}): ValidationResult<T> {
    try {
      const parseResult = safeParse(schema, value)
      
      if (!parseResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: options.context ? `Validation failed in ${options.context}` : 'Validation failed',
            details: parseResult.error.issues,
            context: options.context
          }
        }
      }

      return { success: true, data: parseResult.data }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SCHEMA_ERROR',
          message: `Schema validation failed: ${error}`,
          context: options.context
        }
      }
    }
  }

  // =============================================================================
  // BUSINESS LOGIC VALIDATION
  // =============================================================================

  private validateTransferBusinessLogic(params: ValidatedTransferParams): ValidationResult<ValidatedTransferParams> {
    const warnings: string[] = []

    // Check for self-transfer
    if (params.recipient === params.recipient) {
      warnings.push('Transfer to same address detected')
    }

    // Validate amount ranges
    const amount = Number(params.amount)
    if (amount > 1000000) {
      warnings.push('Large transfer amount detected - consider splitting')
    }

    return { success: true, data: params, warnings }
  }

  private generateConfigWarnings(config: ValidatedClientConfig): string[] {
    const warnings: string[] = []

    if (!config.uri) {
      warnings.push('No URI specified - using default')
    }

    if (config.logging) {
      warnings.push('Logging enabled - may impact performance')
    }

    if (config.serverSdkVersion && config.serverSdkVersion < 4) {
      warnings.push('Using older server SDK version - consider upgrading')
    }

    return warnings
  }

  private generateTransferWarnings(params: ValidatedTransferParams): string[] {
    const warnings: string[] = []

    if (!params.token) {
      warnings.push('No token specified - using default USER token')
    }

    if (!params.metaType && !params.metaId) {
      warnings.push('No metadata specified for transfer')
    }

    return warnings
  }

  // =============================================================================
  // VALIDATION LOGGING AND MONITORING
  // =============================================================================

  private logValidation(schema: string, success: boolean, error?: string): void {
    this.validationHistory.push({
      timestamp: Date.now(),
      schema,
      success,
      error
    })

    // Keep only last 1000 validations
    if (this.validationHistory.length > 1000) {
      this.validationHistory = this.validationHistory.slice(-1000)
    }
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    total: number
    successful: number
    failed: number
    successRate: number
    schemaStats: Record<string, number>
    recentFailures: Array<{
      schema: string
      error?: string
      timestamp: number
    }>
  } {
    const total = this.validationHistory.length
    const successful = this.validationHistory.filter(v => v.success).length
    const failed = total - successful

    const schemaStats = this.validationHistory.reduce((acc, v) => {
      acc[v.schema] = (acc[v.schema] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      schemaStats,
      recentFailures: this.validationHistory
        .filter(v => !v.success)
        .slice(-10)
        .map(v => ({ schema: v.schema, error: v.error, timestamp: v.timestamp }))
    }
  }

  /**
   * Clear validation history
   */
  clearValidationHistory(): void {
    this.validationHistory = []
  }
}

// =============================================================================
// VALIDATION CHAIN BUILDER (FLUENT PATTERN)
// =============================================================================

export class ValidationChainBuilder<T> {
  private validators: Array<(value: T) => ValidationResult<T>> = []

  constructor(private service: ValidationService) {}

  /**
   * Add a schema validation step
   */
  schema<U>(schema: z.ZodType<U>): ValidationChainBuilder<T> {
    this.validators.push((value) => 
      this.service.validate(schema, value) as ValidationResult<T>
    )
    return this
  }

  /**
   * Add a custom validation step
   */
  custom(validator: (value: T) => ValidationResult<T>): ValidationChainBuilder<T> {
    this.validators.push(validator)
    return this
  }

  /**
   * Add a business logic validation step
   */
  business(validator: (value: T) => boolean, errorMessage: string): ValidationChainBuilder<T> {
    this.validators.push((value) => {
      if (validator(value)) {
        return { success: true, data: value }
      }
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: errorMessage,
          value,
          context: 'BusinessLogic'
        }
      }
    })
    return this
  }

  /**
   * Execute the validation chain
   */
  validate(value: unknown): ValidationResult<T> {
    let currentValue = value as T

    for (const validator of this.validators) {
      const result = validator(currentValue)
      if (!result.success) {
        return result
      }
      currentValue = result.data
    }

    return { success: true, data: currentValue }
  }
}

// =============================================================================
// SINGLETON INSTANCE AND UTILITIES
// =============================================================================

// Export singleton instance
export const validationService = ValidationService.getInstance()

// Convenience functions
export const validateClientConfig = (config: unknown): ValidationResult<ValidatedClientConfig> => 
  validationService.validateClientConfig(config)

export const validateTransferParams = (params: unknown): ValidationResult<ValidatedTransferParams> => 
  validationService.validateTransferParams(params)

export const validateGraphQLResponse = (response: unknown): ValidationResult<ValidatedGraphQLResponse> => 
  validationService.validateGraphQLResponse(response)

// Type guard exports
export const { typeGuards } = validationService

// Validation chain factory
export const createValidationChain = <T>(): ValidationChainBuilder<T> => 
  validationService.createValidationChain<T>()