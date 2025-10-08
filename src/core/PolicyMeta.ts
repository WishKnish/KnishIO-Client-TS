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

import { diff } from '../libraries/array'

/**
 * PolicyMeta class - Manages metadata access policies
 * Matches JavaScript SDK PolicyMeta implementation exactly
 */
export default class PolicyMeta {
  public policy: Record<string, any>

  /**
   * Create new PolicyMeta instance
   * Matches JavaScript SDK constructor signature exactly
   */
  constructor(policy: Record<string, any> = {}, metaKeys: string[] = []) {
    this.policy = PolicyMeta.normalizePolicy(policy)
    this.fillDefault(metaKeys)
  }

  /**
   * Normalize policy object structure
   * Matches JavaScript SDK normalizePolicy method exactly
   */
  static normalizePolicy(policy: Record<string, any> = {}): Record<string, any> {
    const policyMeta: Record<string, any> = {}
    
    for (const [policyKey, value] of Object.entries(policy)) {
      if (value !== null && ['read', 'write'].includes(policyKey)) {
        policyMeta[policyKey] = {}
        for (const [key, content] of Object.entries(value as Record<string, any>)) {
          policyMeta[policyKey][key] = content
        }
      }
    }
    
    return policyMeta
  }

  /**
   * Fill default policy values for metadata keys
   * Matches JavaScript SDK fillDefault method exactly
   */
  fillDefault(metaKeys: string[] = []): void {
    // Exactly match JavaScript SDK behavior with Array.from
    const readPolicy = Array.from(this.policy as any).filter((item: any) => item.action === 'read')
    const writePolicy = Array.from(this.policy as any).filter((item: any) => item.action === 'write')

    for (const [type, value] of Object.entries({
      read: readPolicy,
      write: writePolicy
    })) {
      const policyKey = (value as any[]).map((item: any) => item.key)

      if (!this.policy[type]) {
        this.policy[type] = {}
      }

      for (const key of diff(metaKeys, policyKey)) {
        if (!this.policy[type][key]) {
          this.policy[type][key] = (type === 'write' && !['characters', 'pubkey'].includes(key)) 
            ? ['self'] 
            : ['all']
        }
      }
    }
  }

  /**
   * Get the policy object
   * Matches JavaScript SDK get method exactly
   */
  get(): Record<string, any> {
    return this.policy
  }

  /**
   * Convert policy to JSON string
   * Matches JavaScript SDK toJson method exactly
   */
  toJson(): string {
    return JSON.stringify(this.get())
  }
}