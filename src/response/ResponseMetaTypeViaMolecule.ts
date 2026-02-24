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
                        (///////////////(                (//////////////)
                       (////////////////(               (///////////////)
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

import type Query from '../query/Query'
import Response from './Response'
import CheckMolecule from '../libraries/CheckMolecule'

/**
 * Response for MetaType queries via Molecule data.
 *
 * Instead of relying solely on the instance-level `metas` field,
 * this response can extract metadata from molecule atoms' `metasJson`,
 * and provides cryptographic integrity verification via `verifyIntegrity()`.
 */
export default class ResponseMetaTypeViaMolecule extends Response {
  /**
   * Class constructor
   */
  constructor({
    query,
    json
  }: {
    query: Query
    json: any
  }) {
    super({
      query,
      json,
      dataKey: 'data.MetaTypeViaAtom'
    })
  }

  /**
   * Extracts metas from a molecule's atoms' metasJson for a specific instance.
   * Filters atoms by matching metaType and metaId, then parses metasJson.
   */
  static extractMetasFromMolecule(
    molecule: any,
    metaType: string,
    metaId: string
  ): Array<{
    molecularHash: string
    position: string
    key: string
    value: string
    createdAt: string
  }> {
    if (!molecule || !molecule.atoms) {
      return []
    }

    const metas: Array<{
      molecularHash: string
      position: string
      key: string
      value: string
      createdAt: string
    }> = []

    for (const atom of molecule.atoms) {
      if (atom.metaType !== metaType || atom.metaId !== metaId) {
        continue
      }

      if (!atom.metasJson) {
        continue
      }

      let parsed: any
      try {
        parsed = JSON.parse(atom.metasJson)
        if (!Array.isArray(parsed)) {
          continue
        }
      } catch (e) {
        continue
      }

      for (const entry of parsed) {
        metas.push({
          molecularHash: molecule.molecularHash,
          position: atom.position,
          key: entry.key,
          value: entry.value,
          createdAt: atom.createdAt
        })
      }
    }

    return metas
  }

  /**
   * Returns meta type instance results with metas synthesized from molecule data.
   * Produces the same payload format as ResponseMetaType and ResponseMetaTypeViaAtom:
   * { instances, instanceCount, paginatorInfo }
   */
  override payload(): any | null {
    const metaTypeData = this.data()

    if (!metaTypeData || metaTypeData.length === 0) {
      return null
    }

    const response: any = {
      instances: {},
      instanceCount: {},
      paginatorInfo: {}
    }

    const metaData = metaTypeData.pop()

    if (metaData.instances) {
      response.instances = metaData.instances.map((instance: any) => {
        // Prefer server-filtered metas when available
        let metas = instance.metas
        if (!metas || metas.length === 0) {
          // Fallback: synthesize from molecule atoms' metasJson
          metas = ResponseMetaTypeViaMolecule.extractMetasFromMolecule(
            instance.molecule,
            instance.metaType,
            instance.metaId
          )
        }

        return {
          ...instance,
          metas
        }
      })
    }

    if (metaData.instanceCount) {
      response.instanceCount = metaData.instanceCount
    }

    if (metaData.paginatorInfo) {
      response.paginatorInfo = metaData.paginatorInfo
    }

    return response
  }

  /**
   * Verifies the cryptographic integrity of all molecules associated
   * with meta instances in this response.
   */
  verifyIntegrity(): {
    verified: boolean
    molecules: Array<{
      molecularHash: string | null
      verified: boolean
      error: string | null
    }>
  } {
    const results: Array<{
      molecularHash: string | null
      verified: boolean
      error: string | null
    }> = []
    const metaTypeData = this.data()

    if (!metaTypeData || metaTypeData.length === 0) {
      return { verified: true, molecules: results }
    }

    const instances = metaTypeData[metaTypeData.length - 1]?.instances || []

    for (const instance of instances) {
      if (!instance.molecule) continue
      results.push(CheckMolecule.verifyFromServerData(instance.molecule))
    }

    return {
      verified: results.length === 0 || results.every((r: any) => r.verified),
      molecules: results
    }
  }
}
