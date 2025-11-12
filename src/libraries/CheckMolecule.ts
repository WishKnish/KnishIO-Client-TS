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

import {
  AtomIndexException,
  AtomsMissingException,
  MolecularHashMismatchException,
  MolecularHashMissingException,
  PolicyInvalidException,
  SignatureMalformedException,
  SignatureMismatchException,
  TransferBalanceException,
  TransferMalformedException,
  TransferMismatchedException,
  TransferRemainderException,
  TransferToSelfException,
  TransferUnbalancedException,
  MetaMissingException,
  WrongTokenTypeException,
  BatchIdException
} from '@/exception'
import Atom from '@/core/Atom'
import Meta from '@/core/Meta'
import Wallet from '@/core/Wallet'
import Rule from '@/instance/rules/Rule'
import { base64ToHex, chunkSubstr } from '@/libraries/strings'
import { shake256 } from '@/libraries/crypto'
import Dot from '@/libraries/Dot'

// Type definitions for Molecule structure
interface MoleculeStructure {
  molecularHash: string | null
  atoms: Atom[]
  status?: string | null
  createdAt?: string
  cellSlug?: string | null
  cellSlugOrigin?: string | null
  bundle?: string | null
  
  // Methods that Molecule should have
  getIsotopes(isotope: string): Atom[]
  normalizedHash(): number[]
}

/**
 * CheckMolecule class - Validates molecular integrity and signatures
 * Matches JavaScript SDK CheckMolecule functionality exactly
 */
export default class CheckMolecule {
  private molecule: MoleculeStructure

  /**
   * Initialize CheckMolecule with a molecule to validate
   * @param molecule - The molecule to validate
   * @throws MolecularHashMissingException if molecular hash is null
   * @throws AtomsMissingException if no atoms present
   * @throws AtomIndexException if any atom has null index
   */
  constructor(molecule: MoleculeStructure) {
    // No molecular hash?
    if (molecule.molecularHash === null) {
      throw new MolecularHashMissingException()
    }

    // No atoms?
    if (!molecule.atoms.length) {
      throw new AtomsMissingException()
    }

    // Check atom indexes
    for (const atom of molecule.atoms) {
      if (atom.index === null) {
        throw new AtomIndexException()
      }
    }

    this.molecule = molecule
  }

  /**
   * Perform complete molecular validation
   * @param senderWallet - Optional wallet for balance validation
   * @return True if all validations pass
   */
  verify(senderWallet?: Wallet | null): boolean {
    return this.molecularHash() &&
      this.ots() &&
      this.batchId() &&
      this.continuId() &&
      this.isotopeM() &&
      this.isotopeT() &&
      this.isotopeC() &&
      this.isotopeU() &&
      this.isotopeI() &&
      this.isotopeR() &&
      this.isotopeV(senderWallet || null)
  }

  /**
   * Validate ContinuID requirement
   * @return True if valid
   * @throws AtomsMissingException if missing required ContinuID atom
   */
  continuId(): boolean {
    const firstAtom = this.molecule.atoms[0]

    if (firstAtom?.token === 'USER' && this.molecule.getIsotopes('I').length < 1) {
      throw new AtomsMissingException('Check::continuId() - Molecule is missing required ContinuID Atom!')
    }

    return true
  }

  /**
   * Validate batch ID consistency
   * @return True if valid
   * @throws BatchIdException if batch ID validation fails
   */
  batchId(): boolean {
    if (this.molecule.atoms.length > 0) {
      const signingAtom = this.molecule.atoms[0]

      if (signingAtom?.isotope === 'V' && signingAtom.batchId !== null) {
        const atoms = this.molecule.getIsotopes('V')
        const remainderAtom = atoms[atoms.length - 1]

        if (!remainderAtom || signingAtom.batchId !== remainderAtom.batchId) {
          throw new BatchIdException()
        }

        for (const atom of atoms) {
          if (atom.batchId === null) {
            throw new BatchIdException()
          }
        }
      }

      return true
    }

    throw new BatchIdException()
  }

  /**
   * Validate isotope I atoms
   * @return True if valid
   * @throws WrongTokenTypeException if token is not USER
   * @throws AtomIndexException if index is 0
   */
  isotopeI(): boolean {
    for (const atom of this.molecule.getIsotopes('I')) {
      if (atom.token !== 'USER') {
        throw new WrongTokenTypeException(`Check::isotopeI() - "${atom.token}" is not a valid Token slug for "${atom.isotope}" isotope Atoms!`)
      }

      if (atom.index === 0) {
        throw new AtomIndexException(`Check::isotopeI() - Isotope "${atom.isotope}" Atoms must have a non-zero index!`)
      }
    }

    return true
  }

  /**
   * Validate isotope U atoms
   * @return True if valid
   * @throws WrongTokenTypeException if token is not AUTH
   * @throws AtomIndexException if index is not 0
   */
  isotopeU(): boolean {
    for (const atom of this.molecule.getIsotopes('U')) {
      if (atom.token !== 'AUTH') {
        throw new WrongTokenTypeException(`Check::isotopeU() - "${atom.token}" is not a valid Token slug for "${atom.isotope}" isotope Atoms!`)
      }

      if (atom.index !== 0) {
        throw new AtomIndexException(`Check::isotopeU() - Isotope "${atom.isotope}" Atoms must have an index equal to 0!`)
      }
    }

    return true
  }

  /**
   * Validate isotope M atoms and their policies
   * @return True if valid
   * @throws MetaMissingException if meta is missing
   * @throws WrongTokenTypeException if token is not USER
   * @throws PolicyInvalidException if policy validation fails
   */
  isotopeM(): boolean {
    const policyArray = ['readPolicy', 'writePolicy']

    for (const atom of this.molecule.getIsotopes('M')) {
      if (atom.meta.length < 1) {
        throw new MetaMissingException()
      }

      if (atom.token !== 'USER') {
        throw new WrongTokenTypeException(`Check::isotopeM() - "${atom.token}" is not a valid Token slug for "${atom.isotope}" isotope Atoms!`)
      }

      const metas = Meta.aggregateMeta(atom.meta)

      for (const key of policyArray) {
        const policyRaw = metas[key]

        if (policyRaw) {
          const policy = JSON.parse(policyRaw as string) as Record<string, any>

          for (const [policyName, policyValue] of Object.entries(policy)) {
            if (!policyArray.includes(policyName)) {
              if (!Object.keys(metas).includes(policyName)) {
                throw new PolicyInvalidException(`${policyName} is missing from the meta.`)
              }

              for (const value of policyValue as any[]) {
                if (!Wallet.isBundleHash(value) && !['all', 'self'].includes(value)) {
                  throw new PolicyInvalidException(`${value} does not correspond to the format of the policy.`)
                }
              }
            }
          }
        }
      }
    }

    return true
  }

  /**
   * Validate isotope C atoms
   * @return True if valid
   * @throws WrongTokenTypeException if token is not USER
   * @throws AtomIndexException if index is not 0
   */
  isotopeC(): boolean {
    for (const atom of this.molecule.getIsotopes('C')) {
      if (atom.token !== 'USER') {
        throw new WrongTokenTypeException(`Check::isotopeC() - "${atom.token}" is not a valid Token slug for "${atom.isotope}" isotope Atoms!`)
      }

      if (atom.index !== 0) {
        throw new AtomIndexException(`Check::isotopeC() - Isotope "${atom.isotope}" Atoms must have an index equal to 0!`)
      }
    }

    return true
  }

  /**
   * Validate isotope T atoms
   * @return True if valid
   * @throws MetaMissingException if required meta fields are missing
   * @throws WrongTokenTypeException if token is not USER
   * @throws AtomIndexException if index is not 0
   */
  isotopeT(): boolean {
    for (const atom of this.molecule.getIsotopes('T')) {
      const meta = atom.aggregatedMeta()
      const metaType = String(atom.metaType).toLowerCase()

      if (metaType === 'wallet') {
        for (const key of ['position', 'bundle']) {
          if (!Object.prototype.hasOwnProperty.call(meta, key) || !meta[key]) {
            throw new MetaMissingException(`Check::isotopeT() - Required meta field "${key}" is missing!`)
          }
        }
      }

      for (const key of ['token']) {
        if (!Object.prototype.hasOwnProperty.call(meta, key) || !meta[key]) {
          throw new MetaMissingException(`Check::isotopeT() - Required meta field "${key}" is missing!`)
        }
      }

      if (atom.token !== 'USER') {
        throw new WrongTokenTypeException(`Check::isotopeT() - "${atom.token}" is not a valid Token slug for "${atom.isotope}" isotope Atoms!`)
      }

      if (atom.index !== 0) {
        throw new AtomIndexException(`Check::isotopeT() - Isotope "${atom.isotope}" Atoms must have an index equal to 0!`)
      }
    }

    return true
  }

  /**
   * Validate isotope R atoms (rules)
   * @return True if valid
   * @throws MetaMissingException if rule validation fails
   */
  isotopeR(): boolean {
    for (const atom of this.molecule.getIsotopes('R')) {
      const metas = atom.aggregatedMeta()

      if (metas.policy) {
        const policy = JSON.parse(metas.policy as string)

        if (!Object.keys(policy).every(i => ['read', 'write'].includes(i))) {
          throw new MetaMissingException('Check::isotopeR() - Mixing rules with politics!')
        }
      }

      if (metas.rule) {
        const rules = JSON.parse(metas.rule as string)

        if (!Array.isArray(rules)) {
          throw new MetaMissingException('Check::isotopeR() - Incorrect rule format!')
        }

        for (const item of rules) {
          Rule.toObject(item)
        }

        if (rules.length < 1) {
          throw new MetaMissingException('Check::isotopeR() - No rules!')
        }
      }
    }

    return true
  }

  /**
   * Validate isotope V atoms (value transfers)
   * @param senderWallet - Optional wallet for balance validation
   * @return True if valid
   * @throws Various transfer exceptions for validation failures
   */
  isotopeV(senderWallet: Wallet | null = null): boolean {
    const isotopeV = this.molecule.getIsotopes('V')

    if (isotopeV.length === 0) {
      return true
    }

    const firstAtom = this.molecule.atoms[0]

    if (!firstAtom) {
      throw new AtomsMissingException('Check::isotopeV() - Missing first atom')
    }

    if (firstAtom.isotope === 'V' && isotopeV.length === 2) {
      const endAtom = isotopeV[isotopeV.length - 1]

      if (!endAtom) {
        throw new AtomsMissingException('Check::isotopeV() - Missing end atom')
      }

      if (firstAtom.token !== endAtom.token) {
        throw new TransferMismatchedException()
      }

      const endValue = endAtom.value !== null ? Number(endAtom.value) : 0
      if (endValue < 0) {
        throw new TransferMalformedException()
      }

      return true
    }

    let sum = 0
    let value = 0

    for (const index in this.molecule.atoms) {
      if (Object.prototype.hasOwnProperty.call(this.molecule.atoms, index)) {
        const vAtom = this.molecule.atoms[index]

        // Not V? Next...
        if (!vAtom || vAtom.isotope !== 'V') {
          continue
        }

        // Making sure we're in integer land
        value = vAtom.value !== null ? Number(vAtom.value) : 0

        if (Number.isNaN(value)) {
          throw new TypeError('Invalid isotope "V" values')
        }

        // Making sure all V atoms of the same token
        if (vAtom.token !== firstAtom.token) {
          throw new TransferMismatchedException()
        }

        // Checking non-primary atoms
        if (Number(index) > 0) {
          // Negative V atom in a non-primary position?
          if (value < 0) {
            throw new TransferMalformedException()
          }

          // Cannot be sending and receiving from the same address
          if (vAtom.walletAddress === firstAtom.walletAddress) {
            throw new TransferToSelfException()
          }
        }

        // Adding this Atom's value to the total sum
        sum += value
      }
    }

    // All atoms must sum to zero for a balanced transaction
    if (sum !== 0) {
      throw new TransferUnbalancedException()
    }

    // If we're provided with a senderWallet argument, we can perform additional checks
    if (senderWallet) {
      const firstValue = firstAtom.value !== null ? Number(firstAtom.value) : 0

      if (Number.isNaN(firstValue)) {
        throw new TypeError('Invalid isotope "V" values')
      }

      const remainder = senderWallet.balance + firstValue

      // Is there enough balance to send?
      if (remainder < 0) {
        throw new TransferBalanceException()
      }

      // Does the remainder match what should be there in the source wallet, if provided?
      if (remainder !== sum) {
        throw new TransferRemainderException()
      }
    } else if (sum !== 0) {
      // No senderWallet, but have a remainder?
      throw new TransferRemainderException()
    }

    // Looks like we passed all the tests!
    return true
  }

  /**
   * Verify molecular hash matches atom content
   * @return True if valid
   * @throws MolecularHashMismatchException if hash doesn't match
   */
  molecularHash(): boolean {
    if (this.molecule.molecularHash !== Atom.hashAtoms({
      atoms: this.molecule.atoms
    })) {
      throw new MolecularHashMismatchException()
    }

    // Looks like we passed all the tests!
    return true
  }

  /**
   * Verify one-time signature (OTS)
   * @return True if valid
   * @throws SignatureMalformedException if signature format is invalid
   * @throws SignatureMismatchException if signature doesn't match
   */
  ots(): boolean {
    // Convert Hm to numeric notation via EnumerateMolecule(Hm)
    const normalizedHash = this.molecule.normalizedHash()

    // Rebuilding OTS out of all the atoms
    let ots = this.molecule.atoms.map(
      atom => atom.otsFragment || ''
    ).reduce(
      (accumulator, otsFragment) => accumulator + otsFragment
    )

    // Wrong size? Maybe it's compressed
    if (ots.length !== 2048) {
      // Attempting decompression
      ots = base64ToHex(ots)

      // Still wrong? That's a failure
      if (ots.length !== 2048) {
        throw new SignatureMalformedException()
      }
    }

    // Subdivide Kk into 16 segments of 256 bytes (128 characters) each
    const otsChunks = chunkSubstr(ots, 128)

    let keyFragments = ''

    for (const index in otsChunks) {
      let workingChunk = otsChunks[index]
      if (!workingChunk) continue
      
      const hashValue = normalizedHash[Number(index)] || 0

      for (let iterationCount = 0, condition = 8 + hashValue; iterationCount < condition; iterationCount++) {
        workingChunk = shake256(workingChunk, 512)
      }

      keyFragments += workingChunk
    }

    // Absorb the hashed Kk into the sponge to receive the digest Dk
    const digest = shake256(keyFragments, 8192)

    // Squeeze the sponge to retrieve a 128 byte (64 character) string that should match the sender's wallet address
    const address = shake256(digest, 256)

    // Signing atom
    const signingAtom = this.molecule.atoms[0]
    
    if (!signingAtom) {
      throw new SignatureMismatchException()
    }

    // Get a signing address
    let signingAddress = signingAtom.walletAddress

    // Get signing wallet from first atom's metas
    const signingWallet = Dot.get(signingAtom.aggregatedMeta(), 'signingWallet')

    // Try to get custom signing address from the metas (local molecule with server secret)
    if (signingWallet) {
      const parsedWallet = JSON.parse(signingWallet as string)
      const walletAddress = Dot.get(parsedWallet, 'address')
      if (walletAddress) {
        signingAddress = walletAddress as string
      }
    }

    if (address !== signingAddress) {
      throw new SignatureMismatchException()
    }

    // Looks like we passed all the tests!
    return true
  }
}