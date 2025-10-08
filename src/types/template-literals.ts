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
 * Template Literal Type Definitions for KnishIO SDK
 * 
 * Implements 2025 TypeScript patterns:
 * - Advanced template literal types for validation
 * - Pattern-based type safety for APIs
 * - Const assertion integration
 */

import type { 
  AtomIsotope, 
  QueryType, 
  MutationType, 
  SubscriptionType,
  KnishIOErrorType 
} from '../constants'

// =============================================================================
// GRAPHQL TEMPLATE LITERAL TYPES
// =============================================================================

/**
 * GraphQL operation name template literals
 */
export type QueryOperationName<T extends QueryType> = `Query${T}`
export type MutationOperationName<T extends MutationType> = `Mutation${T}`
export type SubscriptionOperationName<T extends SubscriptionType> = `Subscribe${T}`

/**
 * GraphQL field selection template literals
 */
export type FieldSelection<T extends string> = `${T} { ${string} }`
export type NestedFieldSelection<T extends string, U extends string> = `${T} { ${U} { ${string} } }`

/**
 * GraphQL variable templates
 */
export type GraphQLVariable<T extends string> = `$${T}`
export type GraphQLVariableDeclaration<T extends string, U extends string> = `${GraphQLVariable<T>}: ${U}`

/**
 * Complete GraphQL operation templates
 */
export type GraphQLQuery<T extends string> = `query ${T}(${string}) { ${string} }`
export type GraphQLMutation<T extends string> = `mutation ${T}(${string}) { ${string} }`
export type GraphQLSubscription<T extends string> = `subscription ${T}(${string}) { ${string} }`

// =============================================================================
// API ENDPOINT TEMPLATE LITERALS
// =============================================================================

/**
 * REST API endpoint patterns
 */
export type APIEndpoint<T extends string> = `/api/${T}`
export type VersionedEndpoint<V extends string, T extends string> = `/api/${V}/${T}`
export type ResourceEndpoint<T extends string> = APIEndpoint<`${T}s`>
export type ResourceByIdEndpoint<T extends string, ID extends string> = APIEndpoint<`${T}s/${ID}`>

/**
 * KnishIO specific endpoint patterns
 */
export type KnishIOEndpoint<T extends string> = `/knishio/${T}`
export type CellEndpoint<C extends string, T extends string> = KnishIOEndpoint<`cells/${C}/${T}`>
export type WalletEndpoint<W extends string> = KnishIOEndpoint<`wallets/${W}`>
export type AtomEndpoint<A extends string> = KnishIOEndpoint<`atoms/${A}`>
export type MoleculeEndpoint<M extends string> = KnishIOEndpoint<`molecules/${M}`>

// =============================================================================
// ERROR MESSAGE TEMPLATE LITERALS
// =============================================================================

/**
 * Error message construction templates
 */
export type ErrorMessage<T extends KnishIOErrorType> = `${T}: ${string}`
export type DetailedErrorMessage<T extends KnishIOErrorType, D extends string> = `${T}: ${D}`
export type FieldValidationError<F extends string> = `Validation failed for field '${F}'`
export type OperationError<O extends string> = `Operation '${O}' failed`
export type NetworkError<E extends string> = `Network error: ${E}`

/**
 * Specific error templates for common cases
 */
export type WalletError<W extends string> = `Wallet error for ${W}`
export type AtomError<A extends AtomIsotope> = `Atom error for isotope ${A}`
export type MoleculeError<M extends string> = `Molecule error: ${M}`
export type AuthError<A extends string> = `Authentication error: ${A}`
export type ValidationError<F extends string, V extends string> = `Validation failed for ${F}: expected ${V}`

// =============================================================================
// CONFIGURATION TEMPLATE LITERALS
// =============================================================================

/**
 * Environment variable patterns
 */
export type EnvVar<T extends string> = `${Uppercase<T>}`
export type KnishIOEnvVar<T extends string> = EnvVar<`KNISHIO_${T}`>
export type NodeEnvVar<T extends string> = EnvVar<`NODE_${T}`>

/**
 * Configuration key patterns
 */
export type ConfigKey<T extends string> = `${Lowercase<T>}`
export type NestedConfigKey<P extends string, K extends string> = `${ConfigKey<P>}.${ConfigKey<K>}`

/**
 * URL and URI template patterns
 */
export type Protocol = 'http' | 'https' | 'ws' | 'wss'
export type URLWithProtocol<P extends Protocol, H extends string> = `${P}://${H}`
export type GraphQLEndpoint<H extends string> = URLWithProtocol<'https', `${H}/graphql`>
export type WebSocketEndpoint<H extends string> = URLWithProtocol<'wss', `${H}/ws`>

// =============================================================================
// ISOTOPE-SPECIFIC TEMPLATE LITERALS
// =============================================================================

/**
 * Isotope operation patterns
 */
export type IsotopeOperation<I extends AtomIsotope, O extends string> = `${I}_${Uppercase<O>}`
export type IsotopeValidation<I extends AtomIsotope> = `validate_${Lowercase<I>}_isotope`
export type IsotopeHandler<I extends AtomIsotope> = `handle${Capitalize<Lowercase<I>>}Isotope`

/**
 * Specific isotope patterns
 */
export type ValueOperation<O extends string> = IsotopeOperation<'V', O>
export type MetaOperation<O extends string> = IsotopeOperation<'M', O>
export type ContinueOperation<O extends string> = IsotopeOperation<'C', O>
export type TokenOperation<O extends string> = IsotopeOperation<'T', O>

// =============================================================================
// WALLET AND ADDRESS TEMPLATE LITERALS
// =============================================================================

/**
 * Wallet identifier patterns
 */
export type WalletPrefix = 'wallet'
export type WalletId<ID extends string> = `${WalletPrefix}_${ID}`
export type WalletAddress<A extends string> = `addr_${A}`
export type BundleRef<B extends string> = `bundle_${B}`

/**
 * Position and molecular patterns
 */
export type PositionRef<P extends string> = `pos_${P}`
export type MolecularRef<M extends string> = `mol_${M}`
export type AtomRef<A extends string> = `atom_${A}`

// =============================================================================
// QUERY AND FILTER TEMPLATE LITERALS
// =============================================================================

/**
 * Filter expression patterns
 */
export type FilterExpression<F extends string, O extends string, V extends string> = `${F} ${O} ${V}`
export type EqualsFilter<F extends string, V extends string> = FilterExpression<F, '=', V>
export type ContainsFilter<F extends string, V extends string> = FilterExpression<F, 'CONTAINS', V>
export type GreaterThanFilter<F extends string, V extends string> = FilterExpression<F, '>', V>

/**
 * Sort expression patterns
 */
export type SortDirection = 'ASC' | 'DESC'
export type SortExpression<F extends string, D extends SortDirection> = `${F} ${D}`
export type OrderByExpression<F extends string> = `ORDER BY ${F}`

/**
 * Query builder patterns
 */
export type SelectClause<F extends string> = `SELECT ${F}`
export type FromClause<T extends string> = `FROM ${T}`
export type WhereClause<C extends string> = `WHERE ${C}`
export type LimitClause<L extends number> = `LIMIT ${L}`

// =============================================================================
// VALIDATION PATTERN TEMPLATE LITERALS
// =============================================================================

/**
 * Validation rule patterns
 */
export type ValidationRule<T extends string> = `validate_${T}`
export type RequiredValidation<F extends string> = `${F}_required`
export type LengthValidation<F extends string, Min extends number, Max extends number> = `${F}_length_${Min}_${Max}`
export type PatternValidation<F extends string, P extends string> = `${F}_pattern_${P}`

/**
 * Type checking patterns
 */
export type TypeCheck<T extends string> = `is_${T}`
export type ArrayTypeCheck<T extends string> = `is_array_of_${T}`
export type ObjectTypeCheck<T extends string> = `is_object_with_${T}`

// =============================================================================
// CRYPTO AND HASH TEMPLATE LITERALS
// =============================================================================

/**
 * Hash algorithm patterns
 */
export type HashAlgorithm = 'sha256' | 'sha3_256' | 'blake2b' | 'shake256'
export type HashFunction<A extends HashAlgorithm> = `hash_${A}`
export type HashResult<A extends HashAlgorithm, L extends number> = `${A}_${L}_${string}`

/**
 * Signature patterns
 */
export type SignatureAlgorithm = 'ed25519' | 'secp256k1' | 'xmss'
export type SignatureFunction<A extends SignatureAlgorithm> = `sign_${A}`
export type VerifyFunction<A extends SignatureAlgorithm> = `verify_${A}`

/**
 * Key patterns
 */
export type KeyType = 'private' | 'public'
export type KeyFormat = 'hex' | 'base64' | 'pem'
export type KeyIdentifier<T extends KeyType, F extends KeyFormat> = `${T}_key_${F}`

// =============================================================================
// EVENT AND CALLBACK TEMPLATE LITERALS
// =============================================================================

/**
 * Event name patterns
 */
export type EventName<T extends string> = `on${Capitalize<T>}`
export type EventHandler<T extends string> = `handle${Capitalize<T>}`
export type EventListener<T extends string> = `${T}Listener`

/**
 * Callback patterns
 */
export type CallbackName<T extends string> = `${T}Callback`
export type SuccessCallback<T extends string> = `on${Capitalize<T>}Success`
export type ErrorCallback<T extends string> = `on${Capitalize<T>}Error`

/**
 * Lifecycle patterns
 */
export type LifecycleEvent<T extends string> = `on${Capitalize<T>}`
export type BeforeEvent<T extends string> = `before${Capitalize<T>}`
export type AfterEvent<T extends string> = `after${Capitalize<T>}`

// =============================================================================
// UTILITY TEMPLATE LITERAL HELPERS
// =============================================================================

/**
 * String manipulation templates
 */
export type CamelCase<S extends string> = S extends `${infer A}_${infer B}` 
  ? `${Lowercase<A>}${Capitalize<CamelCase<B>>}` 
  : Lowercase<S>

export type PascalCase<S extends string> = Capitalize<CamelCase<S>>

export type SnakeCase<S extends string> = S extends `${infer A}${infer B}` 
  ? A extends Lowercase<A> 
    ? `${A}${SnakeCase<B>}` 
    : `_${Lowercase<A>}${SnakeCase<B>}` 
  : S

export type KebabCase<S extends string> = S extends `${infer A}${infer B}` 
  ? A extends Lowercase<A> 
    ? `${A}${KebabCase<B>}` 
    : `-${Lowercase<A>}${KebabCase<B>}` 
  : S

/**
 * Path manipulation templates
 */
export type JoinPath<A extends string, B extends string> = `${A}/${B}`
export type DeepPath<T extends readonly string[]> = T extends readonly [infer First, ...infer Rest]
  ? First extends string
    ? Rest extends readonly string[]
      ? Rest['length'] extends 0
        ? First
        : `${First}.${DeepPath<Rest>}`
      : never
    : never
  : never

/**
 * Template literal type guards
 */
export type IsTemplate<T> = T extends `${string}` ? true : false
export type TemplateLength<T extends string> = T['length']
export type TemplateStartsWith<T extends string, P extends string> = T extends `${P}${string}` ? true : false
export type TemplateEndsWith<T extends string, S extends string> = T extends `${string}${S}` ? true : false

// =============================================================================
// CONST ASSERTION HELPERS FOR TEMPLATE LITERALS
// =============================================================================

/**
 * Create template literal patterns with const assertions
 */
export function createTemplate<T extends string>(template: T): T {
  return template
}

/**
 * Template literal builder with const assertions
 */
export class TemplateBuilder<T extends string = ''> {
  constructor(private readonly value: T) {}

  append<U extends string>(suffix: U): TemplateBuilder<`${T}${U}`> {
    return new TemplateBuilder(`${this.value}${suffix}` as const)
  }

  prepend<U extends string>(prefix: U): TemplateBuilder<`${U}${T}`> {
    return new TemplateBuilder(`${prefix}${this.value}` as const)
  }

  build(): T {
    return this.value
  }
}

/**
 * Factory function for template builder
 */
export function template<T extends string>(initial: T = '' as T): TemplateBuilder<T> {
  return new TemplateBuilder(initial)
}

// All types are already exported at their definitions above