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

import HashAtom from './HashAtom'
import type { 
  Position, 
  WalletAddress, 
  AtomIsotope, 
  TokenSlug, 
  MetaType, 
  MetaId, 
  MetaData 
} from '@/types'

/**
 * Version4 atomic hashing implementation
 * Represents the structure for SDK version 4 atomic operations
 */
export default class Version4 extends HashAtom {
  public position: Position | null
  public walletAddress: WalletAddress | null
  public isotope: AtomIsotope | null
  public token: TokenSlug | null
  public value: number | string | null
  public batchId: string | null
  public metaType: MetaType | null
  public metaId: MetaId | null
  public meta: MetaData | null
  public index: number | null
  public createdAt: string | null
  public version: number | null

  constructor({
    position = null,
    walletAddress = null,
    isotope = null,
    token = null,
    value = null,
    batchId = null,
    metaType = null,
    metaId = null,
    meta = null,
    index = null,
    createdAt = null,
    version = null
  }: {
    position?: Position | null
    walletAddress?: WalletAddress | null
    isotope?: AtomIsotope | null
    token?: TokenSlug | null
    value?: number | string | null
    batchId?: string | null
    metaType?: MetaType | null
    metaId?: MetaId | null
    meta?: MetaData | null
    index?: number | null
    createdAt?: string | null
    version?: number | null
  } = {}) {
    super()
    
    this.position = position
    this.walletAddress = walletAddress
    this.isotope = isotope
    this.token = token
    this.value = value
    this.batchId = batchId
    this.metaType = metaType
    this.metaId = metaId
    this.meta = meta
    this.index = index
    this.createdAt = createdAt
    this.version = version
  }
}