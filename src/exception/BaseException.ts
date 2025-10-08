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
 * Base exception class for all KnishIO SDK errors
 * Provides enhanced error handling with context and type safety
 */

import type { KnishIOErrorType, ErrorContext } from '@/types'

export interface BaseExceptionOptions {
  message?: string
  cause?: Error | unknown
  context?: ErrorContext
  code?: string
  details?: Record<string, unknown>
}

/**
 * Base exception class that all KnishIO SDK exceptions extend
 * Maintains compatibility with JavaScript SDK while adding TypeScript enhancements
 */
export default class BaseException extends Error {
  public readonly type: KnishIOErrorType
  public readonly context: ErrorContext | null
  public readonly code: string | null
  public readonly details: Record<string, unknown> | null
  public readonly timestamp: number

  constructor(
    type: KnishIOErrorType,
    message: string,
    options: BaseExceptionOptions = {}
  ) {
    super(message)
    
    // Maintain compatibility with Error interface
    this.name = this.constructor.name
    
    // KnishIO specific properties
    this.type = type
    this.context = options.context || null
    this.code = options.code || null
    this.details = options.details || null
    this.timestamp = Date.now()
    
    // Preserve stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
    
    // Chain the cause if provided
    if (options.cause) {
      this.cause = options.cause
    }
  }

  /**
   * Get human-readable error message with context
   */
  public getFullMessage(): string {
    let fullMessage = this.message
    
    if (this.context?.operation) {
      fullMessage += ` (Operation: ${this.context.operation})`
    }
    
    if (this.code) {
      fullMessage += ` [Code: ${this.code}]`
    }
    
    return fullMessage
  }

  /**
   * Get structured error data for logging/debugging
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      code: this.code,
      context: this.context,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    }
  }

  /**
   * Check if this exception is of a specific type
   */
  public isType(type: KnishIOErrorType): boolean {
    return this.type === type
  }

  /**
   * Get error context for the specific parameter
   */
  public getContextValue(key: keyof ErrorContext): unknown {
    return this.context?.[key] || null
  }

  /**
   * Add additional context to the exception
   */
  public withContext(additionalContext: Partial<ErrorContext>): this {
    if (this.context) {
      Object.assign(this.context, additionalContext)
    }
    return this
  }

  /**
   * Static factory method for creating exceptions with full context
   */
  static create<T extends BaseException>(
    this: new (type: KnishIOErrorType, message: string, options?: BaseExceptionOptions) => T,
    type: KnishIOErrorType,
    message: string,
    options: BaseExceptionOptions = {}
  ): T {
    return new this(type, message, {
      ...options,
      context: {
        timestamp: Date.now(),
        ...(new Error().stack ? { stack: new Error().stack } : {}),
        ...options.context
      }
    })
  }

  /**
   * Check if an error is a KnishIO SDK exception
   */
  static isKnishIOException(error: unknown): error is BaseException {
    return error instanceof BaseException
  }

  /**
   * Extract error type from any error
   */
  static getErrorType(error: unknown): KnishIOErrorType | null {
    if (BaseException.isKnishIOException(error)) {
      return error.type
    }
    return null
  }

  /**
   * Convert any error to a KnishIO exception
   */
  static fromError(
    error: Error | unknown,
    type: KnishIOErrorType = 'CODE_ERROR',
    additionalContext?: Partial<ErrorContext>
  ): BaseException {
    if (BaseException.isKnishIOException(error)) {
      return error
    }

    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined

    return new BaseException(type, message, {
      cause: error,
      context: {
        timestamp: Date.now(),
        ...(stack ? { stack } : {}),
        ...additionalContext
      }
    })
  }
}

// =============================================================================
// TYPE GUARDS AND UTILITY FUNCTIONS
// =============================================================================

/**
 * Type guard to check if an error is a specific KnishIO exception type
 */
export function isKnishIOError<T extends BaseException>(
  error: unknown,
  ExceptionClass: new (...args: any[]) => T
): error is T {
  return error instanceof ExceptionClass
}

/**
 * Type guard to check if an error has a specific error type
 */
export function hasErrorType(error: unknown, type: KnishIOErrorType): error is BaseException {
  return BaseException.isKnishIOException(error) && error.type === type
}

/**
 * Extract error message from any error-like object
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'Unknown error'
}

/**
 * Create error context for operations
 */
export function createErrorContext(
  operation: string,
  parameters: Record<string, unknown> = {},
  additionalContext: Partial<ErrorContext> = {}
): ErrorContext {
  const stack = new Error().stack
  return {
    operation,
    parameters,
    timestamp: Date.now(),
    ...(stack ? { stack } : {}),
    ...additionalContext
  }
}