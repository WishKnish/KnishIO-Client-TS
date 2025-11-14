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

import { InvalidResponseException, UnauthenticatedException } from '@/exception'
import Dot from '@/libraries/Dot'
import type Query from '@/query/Query'
import { StandardResponse, ResponseFactory } from './EnhancedResponse'
import { UniversalResponse, ValidationResult } from '@/types/response'

/**
 * Base Response class for processing node responses
 * Enhanced with standardized interface and ValidationResult support
 */
export default class Response implements UniversalResponse<any> {
  public dataKey: string | null
  protected errorKey: string = 'exception'
  protected $__payload: any = null
  protected $__query: Query
  protected $__originResponse: any
  protected $__response: any

  /**
   * Class constructor
   */
  constructor({
    query,
    json,
    dataKey = null
  }: {
    query: Query
    json: any
    dataKey?: string | null
  }) {
    this.dataKey = dataKey
    this.$__query = query
    this.$__originResponse = json
    this.$__response = json

    if (typeof this.$__response === 'undefined' || this.$__response === null) {
      throw new InvalidResponseException()
    }

    if (Dot.has(this.$__response, this.errorKey)) {
      const error = Dot.get(this.$__response, this.errorKey)

      if (String(error).includes('Unauthenticated')) {
        throw new UnauthenticatedException('Unauthenticated request')
      }

      throw new InvalidResponseException()
    }

    // Check for GraphQL errors array
    if (this.$__response.errors && Array.isArray(this.$__response.errors) && this.$__response.errors.length > 0) {
      const errorMessage = this.$__response.errors[0].message || 'Unknown GraphQL error'

      if (errorMessage.includes('Unauthenticated')) {
        throw new UnauthenticatedException('Unauthenticated request')
      }

      throw new InvalidResponseException(`GraphQL Error: ${errorMessage}`)
    }

    this.init()
  }

  /**
   * Initialize response - can be overridden by subclasses
   */
  protected init(): void {
    // Override in subclasses
  }

  /**
   * Get response data
   */
  data(): any {
    if (!this.dataKey) {
      return this.response()
    }

    // Check if response has data field
    if (!this.response().data) {
      throw new InvalidResponseException('Response has no data field')
    }

    // Check key & return custom data from the response
    if (!Dot.has(this.response(), this.dataKey)) {
      throw new InvalidResponseException(`Missing expected field: ${this.dataKey}`)
    }

    return Dot.get(this.response(), this.dataKey)
  }

  /**
   * Get raw response
   */
  response(): any {
    return this.$__response
  }

  /**
   * Get response payload
   */
  payload(): any {
    return this.$__payload
  }

  /**
   * Check if response was successful
   */
  success(): boolean {
    // Default implementation - can be overridden
    return !this.$__response?.errors?.length
  }

  /**
   * Get error message if any
   */
  error(): string | null {
    if (this.$__response?.errors?.length) {
      return this.$__response.errors[0].message || 'Unknown error'
    }
    return null
  }

  /**
   * Enhanced interface methods for standardized response handling
   */
  
  /**
   * Get error reason (alias for error() to match standardized interface)
   */
  reason(): string | null {
    return this.error()
  }

  /**
   * Convert to enhanced response with ValidationResult support
   */
  toEnhanced<T>(): StandardResponse<T> {
    return ResponseFactory.fromLegacyResponse<T>(this, this.constructor.name)
  }

  /**
   * Convert to ValidationResult for enhanced error handling
   */
  toValidationResult<T>(): ValidationResult<T> {
    if (this.success() && this.payload() !== null) {
      return {
        success: true,
        data: this.payload() as T,
        warnings: []
      }
    } else {
      return {
        success: false,
        error: {
          message: this.reason() || 'Unknown error',
          context: this.constructor.name as any,
          details: this.$__response?.errors || []
        }
      }
    }
  }

  /**
   * Enhanced error handling with callbacks (matches enhanced interface)
   */
  onSuccess(callback: (payload: any) => void): Response {
    if (this.success() && this.payload() !== null) {
      try {
        callback(this.payload())
      } catch (error) {
        console.warn('Response.onSuccess callback failed:', error)
      }
    }
    return this
  }

  onFailure(callback: (error: string) => void): Response {
    if (!this.success()) {
      try {
        callback(this.reason() || 'Unknown error')
      } catch (error) {
        console.warn('Response.onFailure callback failed:', error)
      }
    }
    return this
  }

  /**
   * Debug logging with enhanced context
   */
  debug(label?: string): Response {
    const debugPrefix = label ? `[${label}]` : `[${this.constructor.name}]`
    
    if (this.success()) {
      console.debug(`${debugPrefix} Success:`, {
        payload: this.payload(),
        query: this.$__query?.constructor?.name,
        dataKey: this.dataKey
      })
    } else {
      console.debug(`${debugPrefix} Failure:`, {
        error: this.reason(),
        errors: this.$__response?.errors,
        rawData: this.$__response
      })
    }
    
    return this
  }

  /**
   * Promise conversion for enhanced async patterns
   */
  toPromise<T>(): Promise<T> {
    if (this.success() && this.payload() !== null) {
      return Promise.resolve(this.payload() as T)
    } else {
      return Promise.reject(new Error(this.reason() || 'Unknown error'))
    }
  }
}