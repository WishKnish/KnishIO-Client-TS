/*
  Enhanced Response Types for TypeScript SDK Gold Standard
  
  Implements comprehensive response interface with ValidationResult patterns,
  enhanced error handling, and functional programming support.
*/

import { z } from 'zod'

// Universal response interface matching JavaScript SDK pattern
export interface UniversalResponse<T> {
  success(): boolean              // Operation success status
  payload(): T | null            // Result data (typed)
  reason(): string | null        // Error message/reason
  data(): any                    // Raw response data access
}

// Enhanced validation result pattern for TypeScript gold standard
export interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    details?: string[]
    code?: string
    context?: Record<string, any>
  }
  warnings?: string[]
}

// Enhanced error information with detailed context
export interface ResponseError {
  message: string
  code?: string
  details?: any
  context?: string
  timestamp?: string
  operation?: string
}

// Response validation schemas for runtime type checking
export const ResponseErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
  context: z.string().optional(),
  timestamp: z.string().optional(),
  operation: z.string().optional()
})

export const ValidationResultSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: ResponseErrorSchema.optional(),
  warnings: z.array(z.string()).optional()
})

// Enhanced response interface with functional programming support
export interface EnhancedResponse<T> extends UniversalResponse<T> {
  // Validation result conversion
  toValidationResult(): ValidationResult<T>
  
  // Functional programming combinators
  map<U>(mapper: (value: T) => U): EnhancedResponse<U>
  flatMap<U>(mapper: (value: T) => EnhancedResponse<U>): EnhancedResponse<U>
  filter(predicate: (value: T) => boolean): EnhancedResponse<T>
  
  // Error handling enhancements
  onSuccess(callback: (payload: T) => void): EnhancedResponse<T>
  onFailure(callback: (error: string) => void): EnhancedResponse<T>
  
  // Promise integration
  toPromise(): Promise<T>
  
  // Enhanced debugging
  debug(label?: string): EnhancedResponse<T>
}

// Configuration validation result for enhanced type safety
export interface ConfigValidationResult<T> extends ValidationResult<T> {
  originalConfig?: Record<string, any>
  validatedConfig?: T
  validationErrors?: Array<{
    field: string
    message: string
    received: any
    expected: string
  }>
}

// Response metadata for enhanced debugging and monitoring
export interface ResponseMetadata {
  timestamp: string
  operation: string
  duration?: number
  requestId?: string
  serverVersion?: string
  clientVersion: string
}

// Enhanced response type with comprehensive metadata
export interface StandardResponseWithMetadata<T> extends EnhancedResponse<T> {
  metadata(): ResponseMetadata
  correlationId(): string | null
  duration(): number | null
}

// Factory functions for consistent response creation
export interface ResponseFactory {
  success<T>(payload: T, metadata?: ResponseMetadata): EnhancedResponse<T>
  failure<T>(error: string | ResponseError, metadata?: ResponseMetadata): EnhancedResponse<T>
  fromValidationResult<T>(result: ValidationResult<T>, metadata?: ResponseMetadata): EnhancedResponse<T>
}

// Type guards for response type checking
export function isSuccessResponse<T>(response: EnhancedResponse<T>): response is EnhancedResponse<T> & { payload(): T } {
  return response.success() && response.payload() !== null
}

export function isErrorResponse<T>(response: EnhancedResponse<T>): response is EnhancedResponse<T> & { reason(): string } {
  return !response.success() && response.reason() !== null
}

// Enhanced response union type for comprehensive type checking
export type ResponseResult<T> = EnhancedResponse<T> | ValidationResult<T>

// Export specific response types
export type MetaResponse = EnhancedResponse<any>
export type TokenResponse = EnhancedResponse<any>
export type TransferResponse = EnhancedResponse<any>
export type BalanceResponse = EnhancedResponse<any>
export type WalletResponse = EnhancedResponse<any>
export type AuthResponse = EnhancedResponse<any>