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

import Mutation from './Mutation'
import ResponseProposeMolecule from '../response/ResponseProposeMolecule'
import type GraphQLClient from '../libraries/GraphQLClient'
import type KnishIOClient from '../KnishIOClient'
import type Molecule from '../core/Molecule'

/**
 * MutationProposeMolecule - Foundation for all molecular proposals
 * Matches JavaScript SDK MutationProposeMolecule implementation exactly
 */
export default abstract class MutationProposeMolecule extends Mutation {
  protected $__molecule: Molecule
  protected $__remainderWallet: any | null = null

  /**
   * Create MutationProposeMolecule instance
   */
  constructor(graphQLClient: GraphQLClient, knishIOClient: KnishIOClient, molecule: Molecule) {
    super(graphQLClient, knishIOClient)

    this.$__molecule = molecule
    this.$__remainderWallet = null
    this.$__query = `
      mutation($molecule: MoleculeInput!) {
        ProposeMolecule(molecule: $molecule) {
          molecularHash,
          height,
          depth,
          status,
          reason,
          payload,
          createdAt,
          receivedAt,
          processedAt,
          broadcastedAt
        }
      }
    `
  }

  /**
   * Returns an object of query variables
   * Matches JavaScript SDK compiledVariables method exactly
   */
  override compiledVariables(variables: Record<string, any> | null = null): Record<string, any> {
    const _variables = super.compiledVariables(variables)
    return { ..._variables, ...{ molecule: this.molecule() } }
  }

  /**
   * Creates a new response from a JSON object
   * Matches JavaScript SDK createResponse method signature exactly
   */
  override createResponse(json: Record<string, unknown>): ResponseProposeMolecule {
    return new ResponseProposeMolecule({
      query: this,
      json
    })
  }

  /**
   * Executes the mutation
   * Matches JavaScript SDK execute method signature exactly
   */
  override async execute({ variables = null }: { variables?: Record<string, any> | null } = {}): Promise<ResponseProposeMolecule | null> {
    variables = variables || {}
    variables.molecule = this.molecule()

    const response = await super.execute({
      variables
    })

    return response as ResponseProposeMolecule | null
  }

  /**
   * Returns the remainder wallet
   * Matches JavaScript SDK remainderWallet method exactly
   */
  remainderWallet(): any | null {
    return this.$__remainderWallet
  }

  /**
   * Returns the molecule we are proposing
   * Matches JavaScript SDK molecule method exactly
   */
  molecule(): any {
    // Convert molecule to GraphQL input format
    // This should match the JavaScript SDK's molecule serialization
    return this.$__molecule.toJSON ? this.$__molecule.toJSON() : this.$__molecule
  }

  /**
   * Abstract method to be implemented by subclasses
   * Fills the molecule with specific mutation data
   */
  abstract fillMolecule(params: any): void
}