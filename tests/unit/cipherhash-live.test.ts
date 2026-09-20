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

    // ONE session, transport toggled on it — the queried balance wallet stays fixed. (A fresh
    // second auth would rotate the USER remainder via ContinuID → a different address/position/
    // pubkey, which is correct protocol behaviour, not a transport bug.)
    //
    // The session authenticates PLAINTEXT on purpose. The AUTH wallet's ML-KEM pubkey is conveyed
    // as a signed `walletPubkey` U-atom meta regardless of `encrypt` (KnishIOClient.ts:2546-2553),
    // and the validator's CipherHash handler needs only that key — so an `encrypt: false` session
    // still speaks the encrypted transport. Authenticating with `encrypt: true` instead would make
    // the plaintext baseline leg below a silent downgrade, which the validator rejects when
    // ENFORCE_ENCRYPTED_TRANSPORT is at its secure default.
    const mlKemParameterSet = process.env.CIPHERHASH_MLKEM_PARAMETER_SET ? (Number(process.env.CIPHERHASH_MLKEM_PARAMETER_SET) as 768 | 1024) : 1024
    const client = new KnishIOClient({ uri: testUrl, cellSlug: 'public', logging: false, mlKemParameterSet })
    await client.requestAuthToken({ secret, encrypt: false })

    // Encrypted round-trip: the validator ML-KEM-decrypts the request, executes it, and encrypts
    // the response back to the client's ML-KEM pubkey, which the client decrypts.
    client.switchEncryption(true)
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

  // Live coverage of the enforcement path: extract_encrypt_flag → auth_tokens.encrypted →
  // requires_encrypted_transport. It also proves this SDK's signed `encrypt` meta literal is the
  // one the validator honours.
  it('a session authenticated with encrypt: true is refused when it drops to plaintext', async () => {
    const secret = generateSecret()
    const mlKemParameterSet = process.env.CIPHERHASH_MLKEM_PARAMETER_SET ? (Number(process.env.CIPHERHASH_MLKEM_PARAMETER_SET) as 768 | 1024) : 1024
    const client = new KnishIOClient({ uri: testUrl, cellSlug: 'public', logging: false, mlKemParameterSet })
    await client.requestAuthToken({ secret, encrypt: true })

    // The encrypted transport still works for this session.
    const encResp = await client.queryBalance({ token: 'USER' })
    expect(encResp.data()).not.toBeNull()

    // Dropping to plaintext on the same session is the silent downgrade the validator refuses.
    client.switchEncryption(false)
    await expect(client.queryBalance({ token: 'USER' }))
      .rejects.toThrow(/send requests through the CipherHash encrypted transport/)
  }, 60000)
})
