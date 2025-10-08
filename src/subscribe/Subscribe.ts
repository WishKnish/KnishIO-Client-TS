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

import type { GraphQLClient as IGraphQLClient } from '@/types'
import { CodeException } from '@/exception'
import type { DocumentNode } from 'graphql'
import { GraphQLRequestSchema, parseWithSchema } from '@/schemas'

// Define subscription-specific types for better type safety
interface SubscriptionRequest {
  query: DocumentNode | null
  variables: Record<string, unknown> | null
  fetchPolicy: 'no-cache'
}

interface SubscriptionVariables extends Record<string, unknown> {
  [key: string]: string | number | boolean | null | undefined | SubscriptionVariables | SubscriptionVariables[]
}

interface SubscriptionExecuteParams {
  variables?: SubscriptionVariables | null
  closure: (result: unknown) => void
}

interface SubscriptionCreateParams {
  variables?: SubscriptionVariables | null
}

// Type for GraphQL client with subscription support
interface GraphQLSubscriptionClient extends IGraphQLClient {
  subscribe?: (request: SubscriptionRequest, closure: (result: unknown) => void) => Promise<string>
  getUri?: () => string | null
}

/**
 * Base Subscribe class for GraphQL subscriptions with enhanced type safety
 * 
 * Implements TypeScript 2025 patterns with proper generics and runtime validation
 */
export default abstract class Subscribe {
  protected client: GraphQLSubscriptionClient
  protected $__variables: SubscriptionVariables | null = null
  protected $__subscribe: DocumentNode | null = null
  protected $__request: SubscriptionRequest | null = null

  /**
   * Constructor with type-safe client parameter
   */
  constructor(graphQLClient: IGraphQLClient) {
    this.client = graphQLClient as GraphQLSubscriptionClient
  }

  /**
   * Creates a new Request for the given parameters with validation
   */
  createSubscribe(params: SubscriptionCreateParams = {}): SubscriptionRequest {
    const { variables = null } = params
    
    this.$__variables = this.compiledVariables(variables)

    // Uri is a required parameter
    const uri = this.uri()

    if (!uri) {
      throw new CodeException('Subscribe::createSubscribe() - Node URI was not initialized for this client instance!')
    }

    if (this.$__subscribe === null) {
      throw new CodeException('Subscribe::createSubscribe() - GraphQL subscription was not initialized!')
    }

    const request: SubscriptionRequest = {
      query: this.$__subscribe,
      variables: this.variables(),
      fetchPolicy: 'no-cache'
    }

    return request
  }

  /**
   * Sends the Subscription to a Knish.IO node and returns the operation
   * Type-safe execution with proper error handling
   */
  async execute(params: SubscriptionExecuteParams): Promise<string> {
    const { variables = null, closure } = params
    
    if (!closure) {
      throw new CodeException(`${this.constructor.name}::execute() - closure parameter is required!`)
    }

    this.$__request = this.createSubscribe({
      variables
    })

    if (!this.client.subscribe) {
      throw new CodeException('GraphQL client does not support subscriptions')
    }

    return this.client.subscribe(this.$__request, closure)
  }

  /**
   * Returns a variables object for the Subscription with validation
   */
  protected compiledVariables(variables: SubscriptionVariables | null = null): SubscriptionVariables {
    return variables || {}
  }

  /**
   * Returns the Knish.IO endpoint URI with type safety
   */
  protected uri(): string | null {
    return this.client.getUri ? this.client.getUri() : null
  }

  /**
   * Returns the subscription variables object
   */
  variables(): SubscriptionVariables | null {
    return this.$__variables
  }

  /**
   * Type-safe setter for subscription DocumentNode
   */
  protected setSubscription(subscription: DocumentNode): void {
    this.$__subscribe = subscription
  }

  /**
   * Type-safe getter for subscription DocumentNode
   */
  protected getSubscription(): DocumentNode | null {
    return this.$__subscribe
  }
}