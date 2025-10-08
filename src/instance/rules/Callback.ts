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

import Meta from './Meta'
import RuleArgumentException from './exception/RuleArgumentException'
import { isNumeric } from '@/libraries/strings'
import { intersect } from '@/libraries/array'
import { CodeException } from '@/exception'
import { parseWithSchema } from '@/schemas'
import type { MetaData, WalletAddress, TokenSlug, MetaType, MetaId } from '@/types'
import { z } from 'zod'

// Define callback action types as a discriminated union
export type CallbackAction = 
  | 'reject'
  | 'meta'
  | 'collect'
  | 'buffer'
  | 'remit'
  | 'burn'

// Zod schema for callback validation
const CallbackParamsSchema = z.object({
  action: z.string().min(1, 'Action cannot be empty'),
  metaType: z.union([z.string(), z.null()]).optional(),
  metaId: z.union([z.string(), z.null()]).optional(),
  meta: z.union([z.instanceof(Meta), z.record(z.unknown()), z.null()]).optional(),
  address: z.union([z.string(), z.null()]).optional(),
  token: z.union([z.string(), z.null()]).optional(),
  amount: z.union([z.string(), z.null()]).optional(),
  comparison: z.union([z.string(), z.null()]).optional()
}).strict()

interface CallbackParams {
  action: CallbackAction | string
  metaType?: MetaType | string | null
  metaId?: MetaId | string | null
  meta?: Meta<MetaData> | MetaData | null
  address?: WalletAddress | string | null
  token?: TokenSlug | string | null
  amount?: string | null
  comparison?: string | null
}

interface CallbackJSON {
  action: string
  metaType?: string
  metaId?: string
  meta?: MetaData
  address?: string
  token?: string
  amount?: string
  comparison?: string
}

/**
 * Callback class for rule-based actions
 */
export default class Callback {
  private __action: string
  private __metaType?: string | null
  private __metaId?: string | null
  private __meta?: Meta | null
  private __address?: string | null
  private __token?: string | null
  private __amount?: string | null
  private __comparison?: string | null

  constructor(params: CallbackParams) {
    // Validate parameters at runtime
    const validatedParams = parseWithSchema(CallbackParamsSchema, params, 'Callback constructor')
    
    if (!validatedParams.action) {
      throw new RuleArgumentException('Callback structure violated, missing mandatory "action" parameter.')
    }

    this.__action = validatedParams.action
    this.__metaType = validatedParams.metaType ?? null
    this.__metaId = validatedParams.metaId ?? null
    this.__address = validatedParams.address ?? null
    this.__token = validatedParams.token ?? null
    this.__amount = validatedParams.amount ?? null
    this.__comparison = validatedParams.comparison ?? null

    if (validatedParams.meta) {
      this.__meta = validatedParams.meta instanceof Meta 
        ? validatedParams.meta 
        : Meta.toObject(validatedParams.meta as MetaData)
    }
  }

  // Setters
  set comparison(comparison: string) {
    this.__comparison = comparison
  }

  set amount(amount: string) {
    if (!isNumeric(amount)) {
      throw new CodeException('Parameter amount should be a string containing numbers')
    }
    this.__amount = amount
  }

  set token(token: string) {
    this.__token = token
  }

  set address(address: string) {
    this.__address = address
  }

  set meta(meta: Meta<MetaData> | MetaData) {
    this.__meta = meta instanceof Meta ? meta : Meta.toObject(meta)
  }

  set metaType(metaType: string) {
    this.__metaType = metaType
  }

  set metaId(metaId: string) {
    this.__metaId = metaId
  }

  /**
   * Creates a Callback from a plain object with validation
   */
  static toObject(object: CallbackParams): Callback {
    // Use the constructor which already validates the object
    return new Callback(object)
  }

  /**
   * Converts to JSON representation
   */
  toJSON(): CallbackJSON {
    const meta: CallbackJSON = {
      action: this.__action
    }

    if (this.__metaType) {
      meta.metaType = this.__metaType
    }
    if (this.__metaId) {
      meta.metaId = this.__metaId
    }
    if (this.__meta) {
      meta.meta = this.__meta.toJSON()
    }

    if (this.__address) {
      meta.address = this.__address
    }

    if (this.__token) {
      meta.token = this.__token
    }

    if (this.__amount) {
      meta.amount = this.__amount
    }

    if (this.__comparison) {
      meta.comparison = this.__comparison
    }

    return meta
  }

  // Action type checkers using discriminated unions
  isReject(): this is Callback & { __action: 'reject' } {
    return this._is('reject')
  }

  isMeta(): this is Callback & { __action: 'meta' } {
    const prop = intersect(Object.keys(this.toJSON()), ['action', 'metaId', 'metaType', 'meta'])
    return prop.length === 4 && this._is('meta')
  }

  isCollect(): this is Callback & { __action: 'collect' } {
    const prop = intersect(Object.keys(this.toJSON()), ['action', 'address', 'token', 'amount', 'comparison'])
    return prop.length === 5 && this._is('collect')
  }

  isBuffer(): this is Callback & { __action: 'buffer' } {
    const prop = intersect(Object.keys(this.toJSON()), ['action', 'address', 'token', 'amount', 'comparison'])
    return prop.length === 5 && this._is('buffer')
  }

  isRemit(): this is Callback & { __action: 'remit' } {
    const prop = intersect(Object.keys(this.toJSON()), ['action', 'token', 'amount'])
    return prop.length === 3 && this._is('remit')
  }

  isBurn(): this is Callback & { __action: 'burn' } {
    const prop = intersect(Object.keys(this.toJSON()), ['action', 'token', 'amount', 'comparison'])
    return prop.length === 4 && this._is('burn')
  }

  /**
   * Private helper to check action type with type narrowing
   */
  private _is(type: CallbackAction): boolean {
    return this.__action.toLowerCase() === type.toLowerCase()
  }

  /**
   * Type-safe getter for action
   */
  get action(): string {
    return this.__action
  }
}