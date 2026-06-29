/**
 * Live ML-KEM768 CipherHash encrypted-transport round-trip against a running validator
 * (PQ-transport Phase E, cycle 166 — TypeScript).
 *
 * The encrypted client conveys its AUTH source wallet's ML-KEM pubkey at auth (a signed
 * walletPubkey U-atom meta); the validator ML-KEM-decrypts the encrypted queryBalance request,
 * executes it, and encrypts the response back to that pubkey, which the client decrypts. The
 * transport is transparent → the encrypted result must equal the plaintext baseline.
 *
 * Gated on CIPHERHASH_TEST_URL (skips cleanly when unset → CI-safe). Run live:
 *   CIPHERHASH_TEST_URL=http://localhost:8081/graphql npx vitest run tests/unit/cipherhash-live.test.ts
 */

import { describe, it, expect } from 'vitest'
import KnishIOClient from '../../src/KnishIOClient'
import { generateSecret } from '../../src/libraries/crypto'

const testUrl = process.env.CIPHERHASH_TEST_URL || 'http://localhost:8081/graphql'
const runCipherHash = !!process.env.CIPHERHASH_TEST_URL

describe.skipIf(!runCipherHash)('CipherHash live ML-KEM round-trip (PQ Phase E)', () => {
  it('encrypted queryBalance round-trips (matches plaintext)', async () => {
    const secret = generateSecret()

    // ONE authenticated session (encrypt=true → conveys the AUTH wallet's ML-KEM pubkey as a
    // signed walletPubkey U-atom meta, so the validator can encrypt responses back to it). We then
    // vary ONLY the transport on this SAME session — the queried balance wallet stays fixed. (A
    // fresh second auth would rotate the USER remainder via ContinuID → a different address/
    // position/pubkey, which is correct protocol behaviour, not a transport bug.)
    const client = new KnishIOClient({ uri: testUrl, cellSlug: 'public', logging: false })
    await client.requestAuthToken({ secret, encrypt: true })

    // Encrypted round-trip: the validator ML-KEM-decrypts the request, executes it, and encrypts
    // the response back to the client's ML-KEM pubkey, which the client decrypts.
    const encResp = await client.queryBalance({ token: 'USER' })

    // Plaintext baseline of the SAME wallet on the SAME authed session — only the transport differs.
    client.switchEncryption(false)
    const plainResp = await client.queryBalance({ token: 'USER' })

    // The PQ transport must be transparent: not just a non-error response, but the SAME data.
    // A null decrypted payload would mean the transport silently dropped the data (cf. the
    // cycle-164 Kotlin @SerialName bug). toEqual is order-insensitive.
    expect(encResp.data()).not.toBeNull()
    expect(encResp.data()).toEqual(plainResp.data())
  }, 60000)
})
