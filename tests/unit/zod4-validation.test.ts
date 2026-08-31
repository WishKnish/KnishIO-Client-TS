/**
 * Zod 4.5 migration regression suite.
 *
 * Before this file the SDK had ZERO test coverage of its zod schemas, so every one of the
 * v3->v4 breakages was invisible to CI. Each block below pins one construct that either
 * throws or silently changes value under Zod 4 if migrated carelessly.
 */
import { describe, it, expect } from 'vitest'
import Callback from '../../src/instance/rules/Callback'
import Meta from '../../src/instance/rules/Meta'
import {
  AtomIsotopeSchema,
  AuthParamsSchema,
  SubscriptionOptionsSchema,
  GraphQLResponseSchema
} from '../../src/schemas/index'
import { Schemas } from '../../src/validation/schemas'

describe('z.record requires a key schema in Zod 4 (single-arg throws a raw TypeError)', () => {
  it('accepts a plain-object callback meta', () => {
    const callback = new Callback({
      action: 'meta',
      metaType: 'walletBundle',
      metaId: 'x',
      meta: { foo: 'bar' }
    })

    expect(callback.toJSON().meta).toEqual({ foo: 'bar' })
  })

  it('still accepts an absent or null meta (the pre-fix passing cases)', () => {
    expect(new Callback({ action: 'reject' }).toJSON().action).toBe('reject')
    expect(new Callback({ action: 'reject', meta: null }).toJSON().action).toBe('reject')
  })

  it('parses nested metadata through the recursive MetaDataSchema record', () => {
    const meta = new Meta({ a: 'x', nested: { b: 1 } as never })

    expect(meta.toJSON()).toEqual({ a: 'x', nested: { b: 1 } })
  })

  it('accepts a GraphQL response carrying extensions', () => {
    const result = GraphQLResponseSchema.safeParse({
      data: { x: 1 },
      extensions: { trace: 'abc' }
    })

    expect(result.success).toBe(true)
  })
})

describe('z.enum custom error message survives the errorMap -> error rename', () => {
  it('reports the domain-specific isotope message, not the generic one', () => {
    const result = AtomIsotopeSchema.safeParse('Z')

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe(
      'Invalid atom isotope. Must be one of: C, V, U, T, M, I, R, B, F'
    )
  })

  it('still accepts every valid isotope', () => {
    for (const isotope of ['C', 'V', 'U', 'T', 'M', 'I', 'R', 'B', 'F']) {
      expect(AtomIsotopeSchema.safeParse(isotope).success).toBe(true)
    }
  })
})

describe('environment config emits parsed types, never raw default strings', () => {
  it('omits absent keys entirely', () => {
    expect(Schemas.EnvironmentConfig.parse({})).toEqual({})
  })

  it('transforms supplied values to boolean and number', () => {
    const parsed = Schemas.EnvironmentConfig.parse({
      KNISHIO_LOGGING: 'true',
      KNISHIO_SERVER_SDK_VERSION: '3'
    }) as { KNISHIO_LOGGING?: unknown; KNISHIO_SERVER_SDK_VERSION?: unknown }

    expect(parsed.KNISHIO_LOGGING).toBe(true)
    expect(typeof parsed.KNISHIO_LOGGING).toBe('boolean')
    expect(parsed.KNISHIO_SERVER_SDK_VERSION).toBe(3)
    expect(typeof parsed.KNISHIO_SERVER_SDK_VERSION).toBe('number')
  })
})

describe('function-typed schema fields survive the z.function() rewrite', () => {
  it('accepts a function and rejects a non-function', () => {
    expect(AuthParamsSchema.safeParse({ callback: () => {} }).success).toBe(true)
    expect(AuthParamsSchema.safeParse({ callback: 5 }).success).toBe(false)
    expect(AuthParamsSchema.safeParse({}).success).toBe(true)

    expect(SubscriptionOptionsSchema.safeParse({ callback: () => {} }).success).toBe(true)
    expect(SubscriptionOptionsSchema.safeParse({ callback: 5 }).success).toBe(false)
  })
})

describe('batch ID keeps Zod 3 UUID acceptance', () => {
  it('accepts the shapes z.uuid() would have rejected', () => {
    // Neither of these carries a valid RFC 9562 version/variant nibble, so Zod 4's
    // z.uuid() rejects them. v3's regex accepted them, and so must we.
    expect(Schemas.BatchId.safeParse('ffffffff-ffff-ffff-ffff-ffffffffffff').success).toBe(true)
    expect(Schemas.BatchId.safeParse('1234abcd-12ab-9cde-8fab-1234567890ab').success).toBe(true)
    expect(Schemas.BatchId.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
  })

  it('still rejects malformed batch IDs', () => {
    expect(Schemas.BatchId.safeParse('550e8400e29b41d4a716446655440000').success).toBe(false)
    expect(Schemas.BatchId.safeParse('g50e8400-e29b-41d4-a716-446655440000').success).toBe(false)
  })
})

describe('token slug reachable through the Schemas registry is regex-only', () => {
  it('requires an already-uppercase slug', () => {
    expect(Schemas.TokenSlug.safeParse('USER').success).toBe(true)
    expect(Schemas.TokenSlug.safeParse('usr').success).toBe(false)
  })
})

describe('metadata reserved-key handling is unchanged from Zod 3', () => {
  it('preserves prototype-named keys verbatim', () => {
    // Measured against both versions: `constructor`, `toString` and friends are ordinary
    // string keys to the record parser and survive intact. Pinned because Zod 4.5 shipped
    // reserved-key hardening, and metadata keys are hashed into R-isotope atoms.
    expect(new Meta({ toString: 'x', ok: 'y' }).toJSON()).toEqual({ toString: 'x', ok: 'y' })
    expect(new Meta({ constructor: 'x', ok: 'y' } as never).toJSON())
      .toEqual({ constructor: 'x', ok: 'y' })
  })

  it('strips __proto__, exactly as Zod 3 did', () => {
    const meta = new Meta(JSON.parse('{"__proto__":"evil","ok":"y"}'))

    expect(meta.toJSON()).toEqual({ ok: 'y' })
    expect(Object.prototype.hasOwnProperty.call(meta.toJSON(), '__proto__')).toBe(false)
  })
})

describe('URL validation must not rewrite the endpoint it validates', () => {
  it('returns the configured uri verbatim', () => {
    // Zod 4's z.url() would normalize both of these (strip :80, lowercase the host). The
    // parsed value is what KnishIOClient hands to initialize(), so it must survive intact.
    expect(Schemas.ClientConfig.parse({ uri: 'http://api.knish.io:80/graphql' }).uri)
      .toBe('http://api.knish.io:80/graphql')
    expect(Schemas.ClientConfig.parse({ uri: 'https://API.Knish.IO/GraphQL' }).uri)
      .toBe('https://API.Knish.IO/GraphQL')
  })

  it('accepts the URI shapes the SDK is configured with, and rejects non-URIs', () => {
    for (const uri of [
      'https://api.knish.io/graphql',
      'http://localhost:8080/graphql',
      'wss://api.knish.io/graphql',
      'http://[::1]:8080/'
    ]) {
      expect(Schemas.ClientConfig.safeParse({ uri }).success).toBe(true)
    }

    expect(Schemas.ClientConfig.safeParse({ uri: 'api.knish.io' }).success).toBe(false)
    expect(Schemas.ClientConfig.safeParse({ uri: '' }).success).toBe(false)
  })

  it('accepts an array of URIs', () => {
    const parsed = Schemas.ClientConfig.parse({
      uri: ['https://a.knish.io/graphql', 'https://b.knish.io:8443/graphql']
    })

    expect(parsed.uri).toEqual(['https://a.knish.io/graphql', 'https://b.knish.io:8443/graphql'])
  })
})
