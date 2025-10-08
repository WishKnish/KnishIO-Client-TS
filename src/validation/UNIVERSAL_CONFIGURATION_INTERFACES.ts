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
 * UNIVERSAL_CONFIGURATION_INTERFACES.ts
 * 
 * Enhanced configuration interfaces compatible with Phase 2 standardization
 * across all KnishIO SDKs. Provides type-safe configuration validation with
 * enhanced error handling and warning system integration.
 * 
 * Features:
 * - Universal configuration schemas across all SDKs
 * - Enhanced validation with warnings and recommendations
 * - Environment variable integration
 * - Configuration migration support
 * - Performance optimization hints
 */

import { z } from 'zod'
import type { ValidationResult } from './ValidationService'

// =============================================================================
// UNIVERSAL CONFIGURATION TYPES
// =============================================================================

/**
 * Enhanced client configuration interface with Phase 2 improvements
 */
export interface UniversalClientConfig {
  // Core connection settings
  uri: string | string[]
  cellSlug?: string | null
  
  // Network configuration
  timeout?: number
  retries?: number
  retryDelay?: number
  
  // Security settings
  encryption?: boolean
  authToken?: string | null
  
  // Performance tuning
  connectionPoolSize?: number
  keepAlive?: boolean
  compression?: boolean
  
  // SDK behavior
  logging?: boolean
  serverSdkVersion?: number
  strictMode?: boolean
  
  // Advanced features
  socket?: {
    socketUri: string | null
    appKey?: string
  } | null
  client?: any | null
  
  // Environment integration
  environment?: 'development' | 'testing' | 'staging' | 'production'
  
  // Migration support
  legacyCompatibility?: boolean
  
  // Performance hints
  performanceHints?: {
    batchRequests?: boolean
    cacheResponses?: boolean
    preloadSchemas?: boolean
  }
}

/**
 * Enhanced validation result with warnings and recommendations
 */
export interface EnhancedValidationResult<T> {
  isValid: boolean
  data?: T
  errors: string[]
  warnings: string[]
  recommendations: string[]
  performance: {
    validationTime: number
    memoryUsage?: number
    cacheHit?: boolean
  }
  metadata: {
    version: string
    timestamp: number
    validator: string
  }
}

/**
 * Configuration validation options
 */
export interface ValidationOptions {
  strict?: boolean
  includeWarnings?: boolean
  includeRecommendations?: boolean
  includePerformanceHints?: boolean
  environment?: string
  legacyMode?: boolean
}

// =============================================================================
// CONFIGURATION VALIDATOR CLASS
// =============================================================================

/**
 * Universal configuration validator compatible with all KnishIO SDKs
 * Provides enhanced validation with warnings, recommendations, and performance hints
 */
export class ConfigValidator {
  private static instance: ConfigValidator
  private validationCache = new Map<string, EnhancedValidationResult<any>>()
  private performanceMetrics: Array<{ timestamp: number; duration: number }> = []

  private constructor() {}

  static getInstance(): ConfigValidator {
    if (!ConfigValidator.instance) {
      ConfigValidator.instance = new ConfigValidator()
    }
    return ConfigValidator.instance
  }

  /**
   * Validate client configuration with enhanced error reporting
   */
  static validateClientConfig(
    config: unknown, 
    options: ValidationOptions = {}
  ): EnhancedValidationResult<UniversalClientConfig> {
    return ConfigValidator.getInstance().validateConfig(config, options)
  }

  /**
   * Internal validation implementation
   */
  private validateConfig(
    config: unknown,
    options: ValidationOptions = {}
  ): EnhancedValidationResult<UniversalClientConfig> {
    const startTime = performance.now()
    const cacheKey = this.generateCacheKey(config, options)
    
    // Check cache if not in strict mode
    if (!options.strict && this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey)!
      cached.performance.cacheHit = true
      return cached
    }

    const result: EnhancedValidationResult<UniversalClientConfig> = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: [],
      performance: {
        validationTime: 0,
        cacheHit: false
      },
      metadata: {
        version: '2.0.0',
        timestamp: Date.now(),
        validator: 'ConfigValidator'
      }
    }

    try {
      // Core validation
      const coreValidation = this.validateCoreConfig(config)
      if (!coreValidation.isValid) {
        result.isValid = false
        result.errors.push(...coreValidation.errors)
        return result
      }

      result.data = coreValidation.data

      // Enhanced validations
      if (options.includeWarnings !== false) {
        result.warnings.push(...this.generateWarnings(result.data))
      }

      if (options.includeRecommendations !== false) {
        result.recommendations.push(...this.generateRecommendations(result.data, options))
      }

      // Performance validation
      if (options.includePerformanceHints !== false) {
        result.warnings.push(...this.generatePerformanceWarnings(result.data))
      }

    } catch (error) {
      result.isValid = false
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    // Record performance metrics
    const endTime = performance.now()
    result.performance.validationTime = endTime - startTime
    this.recordPerformanceMetric(result.performance.validationTime)

    // Cache result
    this.validationCache.set(cacheKey, result)
    this.cleanupCache()

    return result
  }

  /**
   * Core configuration validation
   */
  private validateCoreConfig(config: unknown): EnhancedValidationResult<UniversalClientConfig> {
    const errors: string[] = []
    
    if (!config || typeof config !== 'object') {
      return {
        isValid: false,
        errors: ['Configuration must be an object'],
        warnings: [],
        recommendations: [],
        performance: { validationTime: 0 },
        metadata: { version: '2.0.0', timestamp: Date.now(), validator: 'ConfigValidator' }
      }
    }

    const typedConfig = config as Record<string, any>
    
    // Validate required URI field
    if (!typedConfig.uri) {
      errors.push('URI is required')
    } else if (typeof typedConfig.uri !== 'string' && !Array.isArray(typedConfig.uri)) {
      errors.push('URI must be a string or array of strings')
    } else if (Array.isArray(typedConfig.uri)) {
      if (typedConfig.uri.length === 0) {
        errors.push('URI array cannot be empty')
      } else if (!typedConfig.uri.every(u => typeof u === 'string' && u.length > 0)) {
        errors.push('All URI entries must be non-empty strings')
      }
    } else if (typeof typedConfig.uri === 'string' && typedConfig.uri.length === 0) {
      errors.push('URI cannot be empty')
    }

    // Validate optional fields with type checking
    if (typedConfig.cellSlug !== undefined && typedConfig.cellSlug !== null && typeof typedConfig.cellSlug !== 'string') {
      errors.push('cellSlug must be a string or null')
    }

    if (typedConfig.timeout !== undefined && (typeof typedConfig.timeout !== 'number' || typedConfig.timeout < 0)) {
      errors.push('timeout must be a positive number')
    }

    if (typedConfig.retries !== undefined && (typeof typedConfig.retries !== 'number' || typedConfig.retries < 0)) {
      errors.push('retries must be a non-negative number')
    }

    if (typedConfig.logging !== undefined && typeof typedConfig.logging !== 'boolean') {
      errors.push('logging must be a boolean')
    }

    if (typedConfig.serverSdkVersion !== undefined && (typeof typedConfig.serverSdkVersion !== 'number' || typedConfig.serverSdkVersion < 1)) {
      errors.push('serverSdkVersion must be a positive number')
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        warnings: [],
        recommendations: [],
        performance: { validationTime: 0 },
        metadata: { version: '2.0.0', timestamp: Date.now(), validator: 'ConfigValidator' }
      }
    }

    // Build validated config with defaults
    const validatedConfig: UniversalClientConfig = {
      uri: typedConfig.uri,
      cellSlug: typedConfig.cellSlug || null,
      timeout: typedConfig.timeout || 30000,
      retries: typedConfig.retries || 3,
      retryDelay: typedConfig.retryDelay || 1000,
      logging: typedConfig.logging || false,
      serverSdkVersion: typedConfig.serverSdkVersion || 3,
      strictMode: typedConfig.strictMode || false,
      encryption: typedConfig.encryption || false,
      socket: typedConfig.socket || null,
      client: typedConfig.client || null,
      environment: typedConfig.environment || 'development',
      legacyCompatibility: typedConfig.legacyCompatibility || false,
      connectionPoolSize: typedConfig.connectionPoolSize || 10,
      keepAlive: typedConfig.keepAlive !== false,
      compression: typedConfig.compression !== false,
      performanceHints: {
        batchRequests: typedConfig.performanceHints?.batchRequests !== false,
        cacheResponses: typedConfig.performanceHints?.cacheResponses !== false,
        preloadSchemas: typedConfig.performanceHints?.preloadSchemas !== false,
        ...(typedConfig.performanceHints || {})
      }
    }

    return {
      isValid: true,
      data: validatedConfig,
      errors: [],
      warnings: [],
      recommendations: [],
      performance: { validationTime: 0 },
      metadata: { version: '2.0.0', timestamp: Date.now(), validator: 'ConfigValidator' }
    }
  }

  /**
   * Generate configuration warnings
   */
  private generateWarnings(config: UniversalClientConfig): string[] {
    const warnings: string[] = []

    // URI warnings
    if (typeof config.uri === 'string' && !config.uri.startsWith('http')) {
      warnings.push('URI should use HTTP/HTTPS protocol')
    }

    // Timeout warnings
    if (config.timeout && config.timeout > 60000) {
      warnings.push('Timeout is very high (>60s), this may cause poor user experience')
    }

    if (config.timeout && config.timeout < 5000) {
      warnings.push('Timeout is very low (<5s), this may cause premature failures')
    }

    // Performance warnings
    if (config.logging && config.environment === 'production') {
      warnings.push('Logging is enabled in production environment')
    }

    if (config.serverSdkVersion && config.serverSdkVersion < 3) {
      warnings.push('Using older server SDK version, consider upgrading for better features and security')
    }

    // Security warnings
    if (!config.encryption && config.environment === 'production') {
      warnings.push('Encryption is disabled in production environment')
    }

    return warnings
  }

  /**
   * Generate configuration recommendations
   */
  private generateRecommendations(config: UniversalClientConfig, options: ValidationOptions): string[] {
    const recommendations: string[] = []

    // Performance recommendations
    if (config.performanceHints?.batchRequests === false) {
      recommendations.push('Enable request batching for better performance')
    }

    if (config.performanceHints?.cacheResponses === false) {
      recommendations.push('Enable response caching to reduce network overhead')
    }

    // Environment-specific recommendations
    if (options.environment === 'production') {
      recommendations.push('Consider enabling connection pooling for production environments')
      
      if (!config.compression) {
        recommendations.push('Enable compression to reduce bandwidth usage in production')
      }
    }

    // Security recommendations
    if (config.serverSdkVersion && config.serverSdkVersion >= 4) {
      recommendations.push('Consider enabling strict mode for enhanced security with SDK v4+')
    }

    return recommendations
  }

  /**
   * Generate performance warnings
   */
  private generatePerformanceWarnings(config: UniversalClientConfig): string[] {
    const warnings: string[] = []

    if (config.connectionPoolSize && config.connectionPoolSize > 50) {
      warnings.push('Large connection pool size may consume excessive memory')
    }

    if (!config.keepAlive) {
      warnings.push('Disabling keep-alive may impact performance with frequent requests')
    }

    return warnings
  }

  /**
   * Generate cache key for configuration
   */
  private generateCacheKey(config: unknown, options: ValidationOptions): string {
    return JSON.stringify({ config, options })
  }

  /**
   * Record performance metric
   */
  private recordPerformanceMetric(duration: number): void {
    this.performanceMetrics.push({
      timestamp: Date.now(),
      duration
    })

    // Keep only last 1000 metrics
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000)
    }
  }

  /**
   * Clean up validation cache
   */
  private cleanupCache(): void {
    if (this.validationCache.size > 500) {
      // Remove oldest entries
      const entries = Array.from(this.validationCache.entries())
      const toKeep = entries.slice(-250)
      this.validationCache.clear()
      toKeep.forEach(([key, value]) => this.validationCache.set(key, value))
    }
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    totalValidations: number
    cacheSize: number
    averageValidationTime: number
    recentValidations: number
  } {
    const recent = this.performanceMetrics.slice(-100)
    const avgTime = recent.reduce((sum, m) => sum + m.duration, 0) / recent.length || 0
    
    return {
      totalValidations: this.performanceMetrics.length,
      cacheSize: this.validationCache.size,
      averageValidationTime: Math.round(avgTime * 100) / 100,
      recentValidations: recent.length
    }
  }

  /**
   * Clear validation cache and metrics
   */
  clearCache(): void {
    this.validationCache.clear()
    this.performanceMetrics = []
  }
}

// =============================================================================
// ENVIRONMENT CONFIGURATION INTEGRATION
// =============================================================================

/**
 * Load configuration from environment variables
 */
export function loadEnvironmentConfig(): Partial<UniversalClientConfig> {
  const config: Partial<UniversalClientConfig> = {}

  if (process.env.KNISHIO_NODE_URI) {
    config.uri = process.env.KNISHIO_NODE_URI.includes(',') 
      ? process.env.KNISHIO_NODE_URI.split(',').map(u => u.trim())
      : process.env.KNISHIO_NODE_URI
  }

  if (process.env.KNISHIO_CELL_SLUG) {
    config.cellSlug = process.env.KNISHIO_CELL_SLUG
  }

  if (process.env.KNISHIO_TIMEOUT) {
    const timeout = parseInt(process.env.KNISHIO_TIMEOUT, 10)
    if (!isNaN(timeout)) {
      config.timeout = timeout
    }
  }

  if (process.env.KNISHIO_LOGGING) {
    config.logging = process.env.KNISHIO_LOGGING.toLowerCase() === 'true'
  }

  if (process.env.KNISHIO_SERVER_SDK_VERSION) {
    const version = parseInt(process.env.KNISHIO_SERVER_SDK_VERSION, 10)
    if (!isNaN(version)) {
      config.serverSdkVersion = version
    }
  }

  if (process.env.NODE_ENV) {
    config.environment = process.env.NODE_ENV as any
  }

  return config
}

/**
 * Merge configurations with precedence handling
 */
export function mergeConfigurations(
  base: Partial<UniversalClientConfig>,
  override: Partial<UniversalClientConfig>
): UniversalClientConfig {
  const merged = { ...base, ...override } as UniversalClientConfig

  // Ensure required fields have defaults
  if (!merged.uri) {
    throw new Error('URI is required in configuration')
  }

  // Apply intelligent defaults
  merged.timeout = merged.timeout || 30000
  merged.retries = merged.retries || 3
  merged.retryDelay = merged.retryDelay || 1000
  merged.logging = merged.logging || false
  merged.serverSdkVersion = merged.serverSdkVersion || 3
  merged.environment = merged.environment || 'development'

  return merged
}