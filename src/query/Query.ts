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

import { CodeException } from '@/exception'
import type Response from '@/response/Response'
import type { GraphQLClient } from '@/types'
import type { TypedDocumentNode } from '@urql/core'

/**
 * Base Query class for constructing GraphQL queries
 */
export default class Query {
  protected client: GraphQLClient
  protected knishIOClient: any // Will be KnishIOClient type
  protected $__variables: Record<string, any> | null = null
  protected $__query: string | TypedDocumentNode<any, any> | null = null
  protected $__response: Response | null = null
  protected $__request: any = null

  /**
   * Create new Query instance
   */
  constructor(graphQLClient: GraphQLClient, knishIOClient: any) {
    this.client = graphQLClient
    this.knishIOClient = knishIOClient
  }

  /**
   * Return a response object
   * Used at KnishIOClient::createMolecule => sets the source wallet from the remainder one stored in response object
   */
  response(): Response | null {
    return this.$__response
  }

  /**
   * Builds a Response based on JSON input
   */
  async createResponseRaw(response: any): Promise<Response> {
    return this.createResponse(response)
  }

  /**
   * Returns a Response object
   */
  createResponse(json: any): Response {
    // Import here to avoid circular dependency
    const Response = require('@/response/Response').default
    return new Response({
      query: this,
      json
    })
  }

  /**
   * Compiles variables for the query
   * Can be overridden by subclasses to add specific variables
   */
  compiledVariables(variables: Record<string, any> | null = null): Record<string, any> {
    return variables || {}
  }

  /**
   * Gets the current variables
   */
  variables(): Record<string, any> | null {
    return this.$__variables
  }

  /**
   * Gets the node URI
   */
  uri(): string {
    return this.client.getUri()
  }

  /**
   * Creates a new Request for the given parameters
   */
  createQuery({ variables = null }: { variables?: Record<string, any> | null }): any {
    this.$__variables = this.compiledVariables(variables)

    // Uri is a required parameter
    const uri = this.uri()
    if (!uri) {
      throw new CodeException('Query::createQuery() - Node URI was not initialized for this client instance!')
    }

    if (this.$__query === null) {
      throw new CodeException('Query::createQuery() - GraphQL query was not initialized!')
    }

    return {
      query: this.$__query,
      variables: this.variables()
    }
  }

  /**
   * Creates the query context
   */
  createQueryContext(): Record<string, any> {
    return {}
  }

  /**
   * Executes the Query and returns a Response
   */
  async execute({ 
    variables = {}, 
    context = {} 
  }: { 
    variables?: Record<string, any>
    context?: Record<string, any> 
  } = {}): Promise<Response | null> {
    this.$__request = this.createQuery({ variables })

    const mergedContext = {
      ...context,
      ...this.createQueryContext()
    }

    try {
      const queryParams = {
        ...this.$__request,
        context: mergedContext
      }
      const response = await this.client.query(queryParams)
      this.$__response = await this.createResponseRaw(response)
      return this.$__response
    } catch (error) {
      if ((error as any).name === 'AbortError') {
        this.knishIOClient.log('warn', 'Query was cancelled')
        const Response = require('@/response/Response').default
        return new Response({
          query: this,
          json: { data: null, errors: [{ message: 'Query was cancelled' }] }
        })
      }
      throw error
    }
  }
}