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

import Response from './Response'
import type Query from '@/query/Query'

/**
 * Response for QueryActiveSession
 */
export default class ResponseQueryActiveSession extends Response {
  /**
   * Constructor
   */
  constructor({
    query,
    json
  }: {
    query: Query
    json: Record<string, any>
  }) {
    super({
      query,
      json,
      dataKey: 'data.ActiveUser'
    })
  }

  /**
   * Returns processed active session data
   */
  override payload(): any {
    const list = this.data()

    if (!list) {
      return null
    }

    const activeUsers: any[] = []

    for (const item of list) {
      const activeSession = { ...item }

      if (activeSession.jsonData) {
        activeSession.jsonData = JSON.parse(activeSession.jsonData)
      }

      if (activeSession.createdAt) {
        activeSession.createdAt = new Date(activeSession.createdAt)
      }

      if (activeSession.updatedAt) {
        activeSession.updatedAt = new Date(activeSession.updatedAt)
      }

      activeUsers.push(activeSession)
    }

    return activeUsers
  }
}