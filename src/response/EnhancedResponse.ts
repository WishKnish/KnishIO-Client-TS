/*
  Enhanced Response Implementation for TypeScript SDK Gold Standard
  
  Provides comprehensive response interface with ValidationResult patterns,
  functional programming support, and enhanced error handling.
*/

import {
  EnhancedResponse,
  ValidationResult,
  ResponseError,
  ResponseMetadata,
  ValidationResultSchema
} from '@/types/response'

/**
 * Enhanced response implementation providing comprehensive interface
 * and functional programming patterns
 */
export class StandardResponse<T> implements EnhancedResponse<T> {
  private readonly _successful: boolean
  private readonly _payload: T | null
  private readonly _errorMessage: string | null
  private readonly _rawData: any
  private readonly _metadata: ResponseMetadata

  constructor(
    successful: boolean,
    payload: T | null = null,
    errorMessage: string | null = null,
    rawData: any = null,
    metadata?: Partial<ResponseMetadata>
  ) {
    this._successful = successful
    this._payload = payload
    this._errorMessage = errorMessage
    this._rawData = rawData
    this._metadata = {
      timestamp: new Date().toISOString(),
      operation: 'unknown',
      clientVersion: '1.0.0',
      ...metadata
    }
  }

  // Core response interface methods
  success(): boolean {
    return this._successful
  }

  payload(): T | null {
    return this._payload
  }

  reason(): string | null {
    return this._errorMessage
  }

  data(): any {
    return this._rawData
  }

  // Enhanced ValidationResult integration
  toValidationResult(): ValidationResult<T> {
    if (this._successful && this._payload !== null) {
      return {
        success: true,
        data: this._payload,
        warnings: []
      }
    } else {
      return {
        success: false,
        error: {
          message: this._errorMessage || 'Unknown error',
          context: this._rawData,
          timestamp: this._metadata.timestamp,
          operation: this._metadata.operation
        }
      }
    }
  }

  // Functional programming combinators
  map<U>(mapper: (value: T) => U): EnhancedResponse<U> {
    if (this._successful && this._payload !== null) {
      try {
        const mappedValue = mapper(this._payload)
        return new StandardResponse(true, mappedValue, null, this._rawData, this._metadata)
      } catch (error) {
        return new StandardResponse<U>(false, null as any, `Mapping failed: ${error instanceof Error ? error.message : String(error)}`, this._rawData, this._metadata)
      }
    } else {
      return new StandardResponse<U>(false, null as any, this._errorMessage, this._rawData, this._metadata)
    }
  }

  flatMap<U>(mapper: (value: T) => EnhancedResponse<U>): EnhancedResponse<U> {
    if (this._successful && this._payload !== null) {
      try {
        return mapper(this._payload)
      } catch (error) {
        return new StandardResponse<U>(false, null as any, `FlatMap failed: ${error instanceof Error ? error.message : String(error)}`, this._rawData, this._metadata)
      }
    } else {
      return new StandardResponse<U>(false, null as any, this._errorMessage, this._rawData, this._metadata)
    }
  }

  filter(predicate: (value: T) => boolean): EnhancedResponse<T> {
    if (this._successful && this._payload !== null) {
      try {
        if (predicate(this._payload)) {
          return this
        } else {
          return new StandardResponse<T>(false, null as any, 'Filter predicate failed', this._rawData, this._metadata)
        }
      } catch (error) {
        return new StandardResponse<T>(false, null as any, `Filter failed: ${error instanceof Error ? error.message : String(error)}`, this._rawData, this._metadata)
      }
    } else {
      return this
    }
  }

  // Enhanced error handling with callbacks
  onSuccess(callback: (payload: T) => void): EnhancedResponse<T> {
    if (this._successful && this._payload !== null) {
      try {
        callback(this._payload)
      } catch (error) {
        console.warn('Response.onSuccess callback failed:', error)
      }
    }
    return this
  }

  onFailure(callback: (error: string) => void): EnhancedResponse<T> {
    if (!this._successful) {
      try {
        callback(this._errorMessage || 'Unknown error')
      } catch (error) {
        console.warn('Response.onFailure callback failed:', error)
      }
    }
    return this
  }

  // Promise integration for async patterns
  toPromise(): Promise<T> {
    if (this._successful && this._payload !== null) {
      return Promise.resolve(this._payload)
    } else {
      return Promise.reject(new Error(this._errorMessage || 'Unknown error'))
    }
  }

  // Enhanced debugging with optional labels
  debug(label?: string): EnhancedResponse<T> {
    const debugPrefix = label ? `[${label}]` : '[Response]'
    
    if (this._successful) {
      console.debug(`${debugPrefix} Success:`, {
        payload: this._payload,
        metadata: this._metadata
      })
    } else {
      console.debug(`${debugPrefix} Failure:`, {
        error: this._errorMessage,
        rawData: this._rawData,
        metadata: this._metadata
      })
    }
    
    return this
  }

  // Factory methods for enhanced response creation
  static success<T>(payload: T, rawData?: any, metadata?: Partial<ResponseMetadata>): StandardResponse<T> {
    return new StandardResponse(true, payload, null, rawData, metadata)
  }

  static failure<T>(errorMessage: string | ResponseError, rawData?: any, metadata?: Partial<ResponseMetadata>): StandardResponse<T> {
    const message = typeof errorMessage === 'string' ? errorMessage : errorMessage.message
    return new StandardResponse<T>(false, null as any, message, rawData, metadata)
  }

  static fromValidationResult<T>(result: ValidationResult<T>, rawData?: any, metadata?: Partial<ResponseMetadata>): StandardResponse<T> {
    if (result.success && result.data !== undefined) {
      return new StandardResponse<T>(true, result.data, null, rawData, {
        ...metadata,
        warnings: result.warnings
      })
    } else {
      return new StandardResponse<T>(false, null as any, result.error?.message || 'Validation failed', rawData, {
        ...metadata,
        error: result.error
      })
    }
  }

  // Enhanced error information extraction
  getErrorDetails(): ResponseError | null {
    if (!this._successful) {
      return {
        message: this._errorMessage || 'Unknown error',
        context: this._metadata.operation,
        timestamp: this._metadata.timestamp,
        operation: this._metadata.operation
      }
    }
    return null
  }

  // Response metadata access
  getMetadata(): ResponseMetadata {
    return { ...this._metadata }
  }

  // Enhanced response validation
  validate(): ValidationResult<T> {
    try {
      ValidationResultSchema.parse(this.toValidationResult())
      return {
        success: true,
        data: this._payload as T,
        warnings: ['Response validation successful']
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Response validation failed',
          details: [error instanceof Error ? error.message : String(error)]
        }
      }
    }
  }
}

// Factory class for creating standardized responses
export class ResponseFactory {
  
  static createSuccessResponse<T>(
    payload: T,
    operation: string,
    rawData?: any,
    duration?: number
  ): StandardResponse<T> {
    return StandardResponse.success(payload, rawData, {
      operation,
      ...(duration !== undefined ? { duration } : {}),
      timestamp: new Date().toISOString()
    })
  }

  static createErrorResponse<T>(
    errorMessage: string,
    operation: string,
    rawData?: any,
    duration?: number
  ): StandardResponse<T> {
    return StandardResponse.failure(errorMessage, rawData, {
      operation,
      ...(duration !== undefined ? { duration } : {}),
      timestamp: new Date().toISOString()
    })
  }

  static fromLegacyResponse<T>(
    legacyResponse: any,
    operation: string
  ): StandardResponse<T> {
    try {
      const isSuccessful = legacyResponse?.success?.() ?? false
      const payload = legacyResponse?.payload?.() ?? null
      const errorMessage = legacyResponse?.error?.() ?? legacyResponse?.reason?.() ?? null
      const rawData = legacyResponse?.data?.() ?? legacyResponse

      return isSuccessful 
        ? StandardResponse.success(payload, rawData, { operation })
        : StandardResponse.failure(errorMessage || 'Unknown error', rawData, { operation })
    } catch (error) {
      return StandardResponse.failure(
        `Legacy response conversion failed: ${error instanceof Error ? error.message : String(error)}`,
        legacyResponse,
        { operation }
      )
    }
  }
}

// Enhanced response utilities
export class ResponseUtils {
  
  static combineResponses<T>(responses: EnhancedResponse<T>[]): EnhancedResponse<T[]> {
    const successful = responses.every(r => r.success())
    
    if (successful) {
      const payloads = responses.map(r => r.payload()).filter((p): p is T => p !== null)
      return StandardResponse.success(payloads, responses, { operation: 'combineResponses' })
    } else {
      const errors = responses.filter(r => !r.success()).map(r => r.reason()).join('; ')
      return StandardResponse.failure(`Combined operation failed: ${errors}`, responses, { operation: 'combineResponses' })
    }
  }

  static async sequenceResponses<T>(
    operations: (() => Promise<EnhancedResponse<T>>)[]
  ): Promise<EnhancedResponse<T[]>> {
    const results: EnhancedResponse<T>[] = []
    
    for (const operation of operations) {
      try {
        const result = await operation()
        results.push(result)
        
        if (!result.success()) {
          // Fail fast on first error
          return StandardResponse.failure(
            `Sequence failed at operation ${results.length}: ${result.reason()}`,
            results,
            { operation: 'sequenceResponses' }
          )
        }
      } catch (error) {
        return StandardResponse.failure(
          `Sequence failed with exception: ${error instanceof Error ? error.message : String(error)}`,
          results,
          { operation: 'sequenceResponses' }
        )
      }
    }
    
    const payloads = results.map(r => r.payload()).filter((p): p is T => p !== null)
    return StandardResponse.success(payloads, results, { operation: 'sequenceResponses' })
  }
}

export default StandardResponse