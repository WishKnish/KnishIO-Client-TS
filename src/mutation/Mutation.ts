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

import Query from '@/query/Query'
import type Response from '@/response/Response'

/**
 * Base class used to construct various GraphQL mutations
 */
export default class Mutation extends Query {
  /**
   * Creates a new Request for the given parameters
   */
  override createQuery({ variables = null }: { variables?: Record<string, any> | null }): any {
    const request = super.createQuery({ variables })
    request.mutation = request.query
    delete request.query
    return request
  }

  /**
   * Sends the Mutation to a Knish.IO node and returns the Response
   */
  override async execute({ 
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
      const mutationParams = {
        ...this.$__request,
        context: mergedContext
      }
      const response = await this.client.mutate(mutationParams)
      this.$__response = await this.createResponseRaw(response)
      return this.$__response
    } catch (error) {
      if ((error as any).name === 'AbortError') {
        this.knishIOClient.log('warn', 'Mutation was cancelled')
        const Response = require('@/response/Response').default
        return new Response({
          query: this,
          json: { data: null, errors: [{ message: 'Mutation was cancelled' }] }
        })
      }
      throw error
    }
  }
}