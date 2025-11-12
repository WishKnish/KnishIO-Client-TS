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
import Dot from '../libraries/Dot'
import Molecule from '../core/Molecule'
import type Query from '../query/Query'

/**
 * Response for proposing new Molecules
 * Matches JavaScript SDK ResponseProposeMolecule implementation exactly
 */
export default class ResponseProposeMolecule extends Response {
  private $__clientMolecule: any

  /**
   * Class constructor
   */
  constructor({
    query,
    json
  }: {
    query: Query
    json: Record<string, unknown>
  }) {
    super({
      query,
      json,
      dataKey: 'data.ProposeMolecule'
    })
    this.$__clientMolecule = (query as any).molecule()
    this.init()
  }

  /**
   * Initialize response object with payload data
   * Matches JavaScript SDK init method exactly
   */
  override init(): void {
    const payloadJson = Dot.get(this.data(), 'payload')
    try {
      this.$__payload = Object.prototype.toString.call(payloadJson) === '[object String]'
        ? JSON.parse(payloadJson as string)
        : payloadJson
    } catch (err) {
      this.$__payload = null
    }
  }

  /**
   * Returns the client molecule
   * Matches JavaScript SDK clientMolecule method exactly
   */
  clientMolecule(): any {
    return this.$__clientMolecule
  }

  /**
   * Returns the resulting molecule
   * Matches JavaScript SDK molecule method exactly
   */
  molecule(): Molecule | null {
    const data = this.data()

    if (!data) {
      return null
    }

    const molecule = new Molecule({})

    molecule.molecularHash = Dot.get(data, 'molecularHash')
    molecule.status = Dot.get(data, 'status')
    molecule.createdAt = Dot.get(data, 'createdAt')

    return molecule
  }

  /**
   * Returns whether molecule was accepted or not
   * Matches JavaScript SDK success method exactly
   */
  override success(): boolean {
    return this.status() === 'accepted'
  }

  /**
   * Returns the status of the proposal
   * Matches JavaScript SDK status method exactly
   */
  status(): string {
    return Dot.get(this.data(), 'status', 'rejected') as string
  }

  /**
   * Returns the reason for rejection
   * Matches JavaScript SDK reason method exactly
   */
  override reason(): string {
    return Dot.get(this.data(), 'reason', 'Invalid response from server') as string
  }

  /**
   * Returns payload object
   * Matches JavaScript SDK payload method exactly
   */
  override payload(): any {
    return this.$__payload
  }
}