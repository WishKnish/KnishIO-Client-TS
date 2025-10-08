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

import MutationProposeMolecule from './MutationProposeMolecule'
import ResponseCreateRule from '@/response/ResponseCreateRule'
import type { MetaType, MetaId } from '@/types'

/**
 * Mutation for creating new Rule attached to some MetaType
 */
export default class MutationCreateRule extends MutationProposeMolecule {
  /**
   * Fills the molecule with rule creation data
   */
  override fillMolecule({
    metaType,
    metaId,
    rule,
    policy
  }: {
    metaType: MetaType
    metaId: MetaId
    rule: Record<string, any>[]
    policy: Record<string, any>
  }): void {
    (this.$__molecule as any).createRule({
      metaType,
      metaId,
      rule,
      policy
    })
    this.$__molecule.sign({})
    this.$__molecule.check()
  }

  /**
   * Builds a new Response object from a JSON string
   */
  override createResponse(json: Record<string, any>): ResponseCreateRule {
    return new ResponseCreateRule({
      query: this,
      json
    })
  }
}