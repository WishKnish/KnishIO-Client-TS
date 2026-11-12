/**
 * Client operations that must behave as the JS reference (KnishIOClient.js) does, over a stubbed
 * transport: guest authorization, the variables queryToken / queryMeta / activeSession send,
 * cancelQuery, the base Query/Mutation response paths, and the public export surface.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import * as sdk from '../../src/index'
import KnishIOClient from '../../src/KnishIOClient'
import AuthToken from '../../src/AuthToken'
import Molecule from '../../src/core/Molecule'
import Wallet from '../../src/core/Wallet'
import Query from '../../src/query/Query'
import Response from '../../src/response/Response'
import MutationActiveSession from '../../src/mutation/MutationActiveSession'
import { AuthorizationRejectedException } from '../../src/exception'
import { generateBundleHash, generateSecret } from '../../src/libraries/crypto'

type Call = { variables: Record<string, unknown> }

const makeClient = () => new KnishIOClient({ uri: 'https://test.local/graphql', cellSlug: 'cell', logging: false })

afterEach(() => {
  vi.restoreAllMocks()
})

describe('requestGuestAuthToken', () => {
  it('signs up with an AUTH wallet derived from the fingerprint and keeps the token', async () => {
    const client = makeClient()
    vi.spyOn(client, 'getFingerprint').mockResolvedValue('fingerprint-1')
    const transport = client.client()
    // The reply carries exactly the fields MutationRequestAuthorizationGuest selects
    const mutate = vi.spyOn(transport, 'mutate').mockResolvedValue({
      data: { AccessToken: { token: 'guest-token', pubkey: 'server-key', expiresAt: Math.floor(Date.now() / 1000) + 3600 } }
    } as never)

    await client.requestGuestAuthToken({ cellSlug: 'cell', encrypt: true })

    // The AUTH wallet takes a fresh position, so its key is checked through the token it is bound to
    const authToken = client.getAuthToken()
    expect(authToken).toBeInstanceOf(AuthToken)
    expect(authToken!.getToken()).toBe('guest-token')
    const wallet = authToken!.getAuthData().wallet!
    expect([wallet.token, wallet.bundle]).toEqual(['AUTH', generateBundleHash(generateSecret('fingerprint-1'))])

    const { variables } = mutate.mock.calls[0]![0] as Call
    expect(variables).toEqual({ cellSlug: 'cell', pubkey: wallet.pubkey, encrypt: true })
    expect(String(variables.pubkey)).toMatch(/^[A-Za-z0-9+/]+=*$/)
    expect(client.client().getPubKey()).toBe('server-key')
    expect(client.client().getWallet()).toBe(wallet)
    expect(authToken!.getSnapshot().encrypt).toBe(true)
  })

  it('throws AuthorizationRejectedException when the ledger issues no token', async () => {
    const client = makeClient()
    vi.spyOn(client, 'getFingerprint').mockResolvedValue('fingerprint-1')
    vi.spyOn(client.client(), 'mutate').mockResolvedValue({ data: { AccessToken: null } } as never)

    await expect(client.requestGuestAuthToken({ cellSlug: 'cell', encrypt: false })).rejects.toThrow(AuthorizationRejectedException)
    expect(client.getAuthToken()).toBeNull()
  })
})

describe('query and mutation variables', () => {
  it('queryToken sends the slug', async () => {
    const client = makeClient()
    const query = vi.spyOn(client.client(), 'query').mockResolvedValue({ data: { Token: [] } } as never)
    await client.queryToken({ token: 'TEST' })
    expect((query.mock.calls[0]![0] as Call).variables).toEqual({ slug: 'TEST' })
  })

  it('queryMeta asks for the latest values by default', async () => {
    const client = makeClient()
    const query = vi.spyOn(client.client(), 'query').mockResolvedValue({ data: { MetaTypeViaAtom: [] } } as never)
    await client.queryMeta({ metaType: 'type', metaId: 'id' })
    expect((query.mock.calls[0]![0] as Call).variables.latest).toBe(true)
  })

  it('activeSession sends json as a JSON string', async () => {
    const client = makeClient()
    const mutate = vi.spyOn(client.client(), 'mutate').mockResolvedValue({ data: { ActiveSession: { remove: false } } } as never)
    const session = { bundle: 'b'.repeat(64), metaType: 't', metaId: 'i', ipAddress: '1', browser: 'b', osCpu: 'o', resolution: 'r', timeZone: 'z' }

    await client.activeSession({ ...session, json: { a: 1 } })
    await client.activeSession(session)

    expect((mutate.mock.calls[0]![0] as Call).variables.json).toBe('{"a":1}')
    expect((mutate.mock.calls[1]![0] as Call).variables.json).toBe('{}')
  })
})

describe('cancelQuery', () => {
  it('rejects the pending executeQuery with an abort error', async () => {
    const client = makeClient()
    vi.spyOn(client.client(), 'query').mockReturnValue(new Promise(() => {}) as never)
    const query = client.createQuery(sdk.QueryToken)
    const variables = { slug: 'TEST' }

    const pending = client.executeQuery(query, variables)
    client.cancelQuery(query, variables)

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('base response paths', () => {
  it('Query.createResponse builds a Response', () => {
    const client = makeClient()
    expect(new Query(client.client(), client).createResponse({ data: {} })).toBeInstanceOf(Response)
  })

  it('an aborted Mutation reports the cancellation through Response', async () => {
    const client = makeClient()
    vi.spyOn(client.client(), 'mutate').mockRejectedValue(new DOMException('aborted', 'AbortError'))
    // As in JS, the cancelled Response carries a GraphQL error, which Response raises
    await expect(new MutationActiveSession(client.client(), client).execute({ variables: {} }))
      .rejects.toThrow('GraphQL Error: Mutation was cancelled')
  })
})

describe('public surface', () => {
  const names = [
    'Decimal',
    'QueryActiveSession', 'QueryBatchHistory', 'QueryMetaTypeViaMolecule', 'QueryPolicy', 'QueryToken',
    'MutationActiveSession', 'MutationClaimShadowWallet', 'MutationCreateIdentifier', 'MutationCreateRule',
    'MutationDepositBufferToken', 'MutationLinkIdentifier', 'MutationRequestAuthorizationGuest', 'MutationWithdrawBufferToken',
    'ResponseActiveSession', 'ResponseAuthorizationGuest', 'ResponseClaimShadowWallet', 'ResponseCreateIdentifier',
    'ResponseCreateRule', 'ResponseLinkIdentifier', 'ResponseMetaTypeViaMolecule', 'ResponsePolicy',
    'ResponseQueryActiveSession', 'ResponseRequestAuthorizationGuest'
  ]

  it.each(names)('exports %s', (name) => {
    expect(typeof Reflect.get(sdk, name)).toBe('function')
  })

  it('Molecule.withParentHashes and signSync', () => {
    const secret = generateSecret('surface')
    const sourceWallet = new Wallet({ secret, token: 'USER', position: 'aa'.repeat(32) })
    const remainderWallet = new Wallet({ secret, token: 'USER', position: 'bb'.repeat(32) })
    const molecule = new Molecule({ secret, sourceWallet, remainderWallet })
    const hashes = ['h1', 'h2']

    expect(molecule.withParentHashes(hashes)).toBe(molecule)
    expect(molecule.parentHashes).toEqual(['h1', 'h2'])
    hashes.push('h3')
    expect(molecule.parentHashes).toEqual(['h1', 'h2'])
    expect(molecule.withParentHashes(null as never).parentHashes).toEqual([])

    molecule.initMeta({ meta: { a: '1' }, metaType: 't', metaId: 'i' })
    expect(molecule.signSync({})).toBe(molecule.sign({}))
  })

  it('Wallet balance helpers', () => {
    const wallet = new Wallet({ secret: generateSecret('surface'), token: 'TEST', position: 'aa'.repeat(32) })
    wallet.balance = '12.75'
    expect(wallet.balanceAsNumber()).toBe(12.75)
    expect(wallet.balanceAsBigInt()).toBe(12n)
    wallet.setBalanceBigInt(9007199254740993n)
    expect(wallet.balance).toBe('9007199254740993')
    wallet.setBalanceNumber(5)
    expect(wallet.balance).toBe('5')
  })

  it('AuthToken.getSnapshot equals toSnapshot', () => {
    const wallet = new Wallet({ secret: generateSecret('surface'), token: 'AUTH', position: 'aa'.repeat(32) })
    const authToken = AuthToken.create({ token: 't', expiresAt: 1, pubkey: 'k', encrypt: false }, wallet)
    expect(authToken.getSnapshot()).toEqual(authToken.toSnapshot())
    expect(authToken.getSnapshot()).toEqual({
      token: 't',
      expiresAt: 1,
      pubkey: 'k',
      encrypt: false,
      wallet: { token: 'AUTH', position: 'aa'.repeat(32), characters: wallet.characters, mlKemParameterSet: wallet.mlKemParameterSet, otsVersion: wallet.otsVersion }
    })
  })
})
