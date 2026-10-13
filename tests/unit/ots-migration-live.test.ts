/**
 * Live OTS version migration against a running validator: an identity created by a client at OTS
 * version 1 moves to version 2 when a client set to version 2 signs in, and stays at version 2 when
 * a client at version 1 signs in afterwards.
 *
 * Gated on OTS_MIGRATION_TEST_URL (skips cleanly when unset):
 *   OTS_MIGRATION_TEST_URL=http://localhost:8081/graphql npx vitest run tests/unit/ots-migration-live.test.ts
 */

import { describe, it, expect } from 'vitest'
import KnishIOClient from '../../src/KnishIOClient'
import Wallet from '../../src/core/Wallet'
import { generateSecret, generateBundleHash } from '../../src/libraries/crypto'

const testUrl = process.env.OTS_MIGRATION_TEST_URL || 'http://localhost:8081/graphql'
const runMigration = !!process.env.OTS_MIGRATION_TEST_URL

describe.skipIf(!runMigration)('OTS version migration (live)', () => {
  it('a client set to OTS version 2 moves a version 1 identity to version 2', async () => {
    const secret = generateSecret()
    const bundle = generateBundleHash(secret)
    const client = async (otsVersion: 1 | 2): Promise<KnishIOClient> => {
      const knishio = new KnishIOClient({ uri: testUrl, cellSlug: 'public', logging: false, otsVersion })
      await knishio.requestAuthToken({ secret, encrypt: false })
      return knishio
    }
    const head = async (knishio: KnishIOClient): Promise<Wallet> => {
      const wallet = (await knishio.queryContinuId({ bundle, token: 'USER' }))?.payload() as Wallet | null
      expect(wallet?.position).toBeTruthy()
      expect(wallet?.address).toBeTruthy()
      return wallet!
    }
    const version = (wallet: Wallet): 1 | 2 | null =>
      Wallet.detectOtsVersion({ secret, token: 'USER', position: wallet.position, address: wallet.address, preferred: 1 })

    // A client at version 1 creates the identity
    const first = await client(1)
    const h1 = await head(first)
    expect(version(h1)).toBe(1)

    // A client at version 2 signs in from the version 1 head and leaves a version 2 head
    const second = await client(2)
    const h2 = await head(second)
    expect(h2.position).not.toBe(h1.position)
    expect(version(h2)).toBe(2)

    // The version 2 head signs a molecule
    const meta = await second.createMeta({ metaType: 'ots-migration', metaId: `ots-migration-${Date.now()}`, meta: { k: 'v' } })
    expect(meta.success()).toBe(true)
    const h3 = await head(second)
    expect(h3.position).not.toBe(h2.position)
    expect(version(h3)).toBe(2)

    // A client at version 1 signs in and the identity stays at version 2
    const third = await client(1)
    const h4 = await head(third)
    expect(h4.position).not.toBe(h3.position)
    expect(version(h4)).toBe(2)
  }, 120000)
})
