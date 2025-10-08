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
import ResponseCreateMeta from '../response/ResponseCreateMeta'

/**
 * MutationCreateMeta class - Mutation for creating new Meta attached to some MetaType
 * Matches JavaScript SDK MutationCreateMeta implementation exactly
 */
export default class MutationCreateMeta extends MutationProposeMolecule {
  /**
   * Fills a molecule with an appropriate metadata atom
   * Matches JavaScript SDK fillMolecule method exactly
   */
  override fillMolecule({
    metaType,
    metaId,
    meta,
    policy
  }: {
    metaType: string
    metaId: string
    meta: any[] | any
    policy: any
  }): void {
    (this.$__molecule as any).initMeta({
      meta,
      metaType,
      metaId,
      policy
    });
    (this.$__molecule as any).sign({});
    (this.$__molecule as any).check()
  }

  /**
   * Builds a new Response object from a JSON object
   * Matches JavaScript SDK createResponse method exactly
   */
  override createResponse(json: any): ResponseCreateMeta {
    return new ResponseCreateMeta({
      query: this,
      json
    })
  }
}