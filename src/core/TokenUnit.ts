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
 * TokenUnit class - Manages token utility data
 * Matches JavaScript SDK TokenUnit implementation exactly
 */
export default class TokenUnit {
  public id: string
  public name: string
  public metas: Record<string, any>

  /**
   * Create new TokenUnit instance
   * Matches JavaScript SDK constructor signature exactly
   */
  constructor(id: string, name: string, metas?: Record<string, any>) {
    this.id = id
    this.name = name
    this.metas = metas || {}
  }

  /**
   * Create TokenUnit from GraphQL response data
   * Matches JavaScript SDK createFromGraphQL method exactly
   */
  static createFromGraphQL(data: {
    id: string
    name: string
    metas?: any
  }): TokenUnit {
    let metas = data.metas || {}
    
    if (Array.isArray(metas) && metas.length) {
      try {
        metas = JSON.parse(metas as any)
        if (!metas) { // set an empty object instead of an array
          metas = {}
        }
      } catch (error) {
        metas = {}
      }
    }
    
    return new TokenUnit(
      data.id,
      data.name,
      metas
    )
  }

  /**
   * Create TokenUnit from database array data
   * Matches JavaScript SDK createFromDB method exactly
   */
  static createFromDB(data: [string, string, Record<string, any>?]): TokenUnit {
    return new TokenUnit(
      data[0],
      data[1],
      data.length > 2 ? data[2] : {}
    )
  }

  /**
   * Get fragment zone from metadata
   * Matches JavaScript SDK getFragmentZone method exactly
   */
  getFragmentZone(): any | null {
    return this.metas.fragmentZone || null
  }

  /**
   * Get fused token units from metadata
   * Matches JavaScript SDK getFusedTokenUnits method exactly
   */
  getFusedTokenUnits(): any | null {
    return this.metas.fusedTokenUnits || null
  }

  /**
   * Convert to data array format
   * Matches JavaScript SDK toData method exactly
   */
  toData(): [string, string, Record<string, any>] {
    return [this.id, this.name, this.metas]
  }

  /**
   * Convert to GraphQL response format
   * Matches JavaScript SDK toGraphQLResponse method exactly
   */
  toGraphQLResponse(): {
    id: string
    name: string
    metas: string
  } {
    return {
      id: this.id,
      name: this.name,
      metas: JSON.stringify(this.metas)
    }
  }
}