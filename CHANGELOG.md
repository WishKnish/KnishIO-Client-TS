# Changelog

All notable changes to the KnishIO Client TS SDK are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Releases are published to npm (`@wishknish/knishio-client-ts`) from a git tag.
Conventions for tags, commits, and these entries: `docs/SDK-RELEASE-CONVENTIONS.md`
in the KnishIOClientSDK monorepo.

This file was backfilled on 2026-07-27 from the repository's own tag and commit
history. Entries at and below `0.7.8` are reconstructed from commit messages
rather than written at release time; where the history does not substantiate a
detail, the entry says so instead of guessing.

## [0.9.6] — 2026-08-31

### Changed — dependency refresh (Dependabot PR #3, validated and split)

- `@urql/core` `^5.2.0` → `^6.0.3`. urql 6 changes the default HTTP method for queries: it sends
  GET when query-string + variables fits under 2047 characters. Both client constructions now pin
  `preferGetMethod: false`, keeping every operation a POST exactly as under urql 5. This is not
  cosmetic — `GraphQLClient`'s CipherHash transport gates on `typeof init.body === 'string'`, and a
  GET has no body, so the ML-KEM request encryption would have silently degraded to plaintext URL
  parameters with no error raised. Pinned and covered by `tests/unit/urql-http-method.test.ts`,
  which was confirmed to fail (`Received: "GET"`) before the fix.
- `@noble/post-quantum` `^0.5.4` → `^0.7.0`, and with it `@noble/hashes`/`@noble/curves` 2.0 → 2.3
  plus a new `@noble/ciphers` transitive. 0.7.0's changelog describes a `MultiplyNTTs` "intermediate
  overflow" fix; it is a **performance** change, not a correctness one — `mod(mod(a1*b1)*zeta + a0*b0)`
  is mathematically identical to `mod(a1*b1*zeta + a0*b0)`, and 2³⁵ was already exact in a JS double.
  Verified rather than assumed: the byte-frozen `mlkem768.keygen.expectedPubkey` canonical vector
  (deterministic keygen) and all 7 SHAKE256 vectors pass unchanged.
- `jssha` `^3.3.1` → `^3.3.2`, `graphql-ws` `^6.0.7` → `^6.2.1`, `wonka` `^6.3.5` → `^6.3.6`,
  `graphql` `^16.11.0` → `^16.14.2`.
- `graphql` is deliberately **held at 16**. `graphql@17` declares `engines.node: ^22 || ^24 || ^25 || >=26`,
  which excludes the Node 20 that `ci.yml` and `audit.yml` run and contradicts this package's
  `engines.node: >=18.0.0`. Adopting it is a supported-runtime decision, not a dependency bump. The
  SDK's only two `graphql` imports are `import type { DocumentNode }`, so nothing in this codebase
  needs 17.
- Dev toolchain: `eslint` `^9` → `^10` (flat config needed no changes), `@typescript-eslint/*`
  8.63 → 8.67, `vitest`/`@vitest/coverage-v8` 4.1.10 → 4.1.11, `@types/node` `^22` → `^26`,
  `tsx` → `^4.23.12`, `prettier` → `^3.9.6`.
- Added a `resolutions` pin for `wonka` at `6.3.6`. urql 6 depends on `wonka@^6.3.2` and resolved
  its own nested `6.3.5`, so the SDK's `6.3.6` produced two copies and `tsc` treated the two
  `Source<T>` declarations as distinct types — 7 errors across both clients' `pipe()` chains. One
  instance fixes it and is semver-legal for urql's range.

### Removed

- `@thumbmarkjs/thumbmarkjs` and `isomorphic-fetch` dependencies, plus the `@types/isomorphic-fetch`
  dev dependency. All had **zero** references across 157 scanned source, test and config files.
  PR #3 proposed a 0.19.1 → 1.10.1 major for the former; adopting a major of an unused package is
  risk without benefit. **Consumer-visible:** if your application imported either package without
  declaring it, relying on this SDK to pull it in, add it to your own manifest. `tslib` is kept
  despite having no direct references because `tsconfig.json` sets `importHelpers: true`.
- `vite` and `vite-plugin-dts` dev dependencies, and the vestigial `dev: vite` script. There is no
  `vite.config.*`; `tsup` performs the build and the `.d.ts` emission, and vitest supplies its own
  vite. This also makes PR #3's `vite 7 → 8` major moot and resolves the pre-existing unmet peer
  (`vite-plugin-dts@5.0.3 doesn't provide typescript to unplugin-dts@1.0.3`) that was failing
  Dependabot's npm updates — `unplugin-dts` requires `typescript` as a non-optional peer that
  `vite-plugin-dts` never re-declares, and neither package has a newer release. `yarn explain
  peer-requirements` now reports zero unmet requirements.

### Fixed — bugs found by auditing the implementation against the JS SDK

Ordered by severity. Each was reproduced against the working tree before being fixed; none is
inferred from a comment or a changelog.

- **`AtomMeta.addPolicy` serialised the wrong string into hashed atom meta.** It did
  `JSON.stringify(policy)` on the caller's raw object, bypassing `PolicyMeta` entirely, so the
  `policy` meta value that `Atom.getHashableValues` pushes into the molecular hash omitted the
  `fillDefault` additions and the normalised key shape the JS SDK produces. Every policy-bearing
  molecule this SDK signed carried a digest no other implementation would reproduce. Now normalised
  through `PolicyMeta` first, matching `AtomMeta.js:170-175`. **Consumer-visible:** a policy-bearing
  molecule now hashes differently than it did under `≤0.9.5`, so any molecular hash your application
  recorded from this SDK for such a molecule will not match one produced here now. The new bytes are
  the correct ones — they are what every other SDK produces, and the old ones were reproducible by
  none — so this is a correction toward the cross-SDK contract, not a change of it. `PolicyMeta`
  itself was verified line-for-line against `PolicyMeta.js` and is a faithful port — including the
  `Array.from(this.policy)` quirk on a plain object — and was deliberately left untouched.
- **The 60-second request timeout never fired.** Both clients returned
  `signal: AbortSignal.timeout(60000)` from `fetchOptions()`, but urql's `makeFetchSource` does
  `t.signal = new AbortController().signal` unconditionally, discarding it. A request to an
  unresponsive validator hung indefinitely. The timeout is now applied inside the wrapping `fetch`
  that `GraphQLClient` controls, composed with urql's teardown signal via `AbortSignal.any`, so
  teardown-abort still works. The ineffective `signal` entry was removed from `UrqlClientWrapper`.
- **`Schemas.BatchId` rejected every batch ID the SDK generates.** The schema required a UUID-shaped
  `8-4-4-4-12` string, while `generateBatchId` returns `shake256(molecularHash + index, 256)` or
  `randomString(64)` over `abcdef0123456789` — 64 hex characters — which is also what the
  `isBatchId` guard requires. **Four** places defined "batch ID" and they disagreed: the two zod
  schemas demanded a UUID, while the guard and the generator used 64 hex. Both schemas corrected
  (`src/schemas/index.ts`, `src/validation/schemas.ts`), and `assertBatchId`'s diagnostics — public
  API through the `assertions.batchId` registry — no longer report `BatchId (UUID format)` /
  `UUID v4 format`, which would have sent a developer to supply the one shape `isBatchId` rejects.
  The predicate there was already correct, so only the messages changed. A test now pins agreement
  across all four on generated IDs, and asserts the message no longer claims UUID; it was confirmed
  to fail against the old strings.
- **`KnishIOClient.replenishToken` submitted the wrong molecule type.** It delegated to
  `requestTokens` — a different operation on the wire — because `Molecule.replenishToken` was
  missing from this SDK entirely. Ported from `Molecule.js:521-566`, preserving the two orderings
  that are load-bearing for the molecular hash, and the client now builds, signs and checks a real
  replenishment molecule. Added `MutationReplenishToken` for the concrete mutation type: the JS SDK
  instantiates `MutationProposeMolecule` directly, but that class is abstract here because it
  declares `fillMolecule`; the subclass inherits the identical `ProposeMolecule` document, so the
  request on the wire is unchanged.
- **`Wallet.getTokenUnits` returned its raw input.** A stub with a stale `TODO: Implement TokenUnit
  class if needed` — `TokenUnit` has existed and been exported since `src/index.ts:157`. Raw tuples
  reach hashed atom meta through `AtomMeta.setAtomWallet`'s `JSON.stringify(getTokenUnitsData())`,
  so they would have serialised differently from every other SDK. Now maps through
  `TokenUnit.createFromDB`, matching `Wallet.js:190-196`.
- `verifyOTSSignature` had an unreachable duplicate branch: the inner `if (ots.length !== 2048)`
  was identical to the outer one. Collapsed to a single check, with the comment corrected to
  describe the documented limitation it actually implements (compressed fragments are rejected,
  not expanded). Export-only — no internal caller — so this is cleanup, not a live defect.
- `actions/checkout` pins were commented `# v5` at all five sites while the pinned SHA
  `3d3c42e5aac5ba805825da76410c181273ba90b1` is tagged `v7`/`v7.0.1`. Nothing was functionally
  wrong, but this repo SHA-pins deliberately for supply-chain review and the comment is the
  human-readable audit trail. Comments corrected; the SHAs are unchanged.

Byte-identity for the two fixes that change hashed bytes was proven, not assumed: cross-SDK probes
built the same policy atom and the same replenishment molecule in both this SDK and
`sdks/KnishIO-Client-JS` from pinned inputs, and both digests were character-identical. Those
digests are pinned as hard-coded expectations in `tests/unit/atom-meta-policy.test.ts` and
`tests/unit/replenish-token.test.ts`. The 10 deterministic values in the cross-SDK self-test are
unchanged; `tests.bufferFamily.molecularHash` differs per run by construction (freshly random
wallet positions) and was confirmed to differ between two runs on an unchanged tree.

## [0.9.5] — 2026-08-31

### Changed — zod 3 → zod 4.5

- The `zod` dependency moves from `^3.23.8` to `^4.5.4`. **Consumer-visible:** installing this
  SDK now pulls zod 4.5 into your dependency tree instead of zod 3. If you pin zod 3 elsewhere,
  resolve that before upgrading. The SDK's own public type surface is unchanged — `dist/index.d.ts`
  contains no zod reference, and no exported symbol changed shape.
- Every zod construct the SDK used that Zod 4 removed or redefined was migrated. Three were hard
  failures rather than deprecations: `z.function().args().returns()` and `z.function().optional()`
  throw while building a module-level schema (so `src/schemas/index.ts` and
  `src/validation/schemas.ts` would not import at all), and single-argument `z.record(value)`
  throws a raw `TypeError` at parse time — escaping `safeParse`, so it could not even be reported
  as a validation failure. Callback fields are now `z.custom<fn>()` and all eleven records pass an
  explicit `z.string()` key schema.
- URL-shaped fields keep Zod 3 semantics deliberately. Zod 4's `z.url()` returns the *normalized*
  `URL.href` — stripping default ports and lowercasing the host — with no opt-out, and the parsed
  `uri` is the endpoint `KnishIOClient` actually calls. A refinement (`new URL()` in a try/catch,
  which is precisely what v3 did) validates without rewriting the value, so
  `http://api.knish.io:80/graphql` survives intact.
- `BatchIdSchema` keeps Zod 3's UUID acceptance by inlining v3's regex. Zod 4's `z.uuid()`
  additionally enforces the RFC 9562 version/variant nibbles and would have silently rejected
  batch IDs the SDK previously accepted.
- Molecular hashing, atom ordering, WOTS+ signing, SHAKE256 secret/bundle derivation and ML-KEM
  transport contain no zod code and are untouched. The one path where a zod parse reaches hashed
  bytes — R-isotope rule molecules, via `Callback`/`Meta` → `JSON.stringify(rules)` → atom meta —
  is now pinned by `tests/unit/rule-molecule-hash.test.ts` against a digest generated on the
  pre-migration tree. All six deterministic self-test molecular hashes, plus the canonical
  SHAKE256 secret and bundle hash, are byte-identical across the upgrade.

### Added

- `tests/unit/zod4-validation.test.ts` and `tests/unit/rule-molecule-hash.test.ts`. The schemas
  previously had **zero** test coverage, which is why a breaking dependency upgrade could have
  landed silently; each migrated construct now has an assertion that fails if it regresses.

### Fixed

- **`SDK_VERSION` now reports the real version.** The exported constant had read `'1.0.0'` since
  before the 0.7.x line while the manifest moved through 0.9.4 — the SDK told every consumer it
  was 1.0.0. It is now `'0.9.5'`, and `.github/scripts/check-version.sh` (the CI
  `version consistency` job, which previously inspected only `package.json`) parses this constant
  too, so the two can never diverge again. Verified in both directions: the gate passes on
  agreement and fails with `src/index.ts SDK_VERSION is '1.0.0' but package.json version is
  '0.9.5'` on drift. `SDK_INFO.version` is derived from the constant and is corrected with it.
  Downstream note: code that worked around the stale constant by reading
  `@wishknish/knishio-client-ts/package.json` no longer needs to, and any test asserting
  `SDK_VERSION === '1.0.0'` will need updating when it upgrades to 0.9.5.
- `EnvironmentConfigSchema` no longer carries `.default()` values that never applied. The outer
  `.partial()` already made every field optional, so under zod 3 the defaults were dead code; under
  zod 4 they would have started firing and — because v4's `.default()` no longer parses its own
  input — emitted the raw strings `'false'` and `'4'` where the client config requires a boolean and
  a number, silently enabling logging and passing a string server SDK version.
- The custom "Invalid atom isotope" message is emitted again. It was configured through
  `z.enum(..., { errorMap })`, which Zod 4 ignores silently, replacing it with a generic message.
- Dropped an obsolete `as z.ZodTypeAny` cast in `ValidationService.validateEnvironmentConfig`;
  Zod 4's covariant `ZodType` makes the schema assignable without it.
- Resolved the pre-existing high-severity `nanoid` advisory (`<3.3.18`, reached via `postcss` in
  the dev toolchain) by pulling `nanoid` to `3.3.18`. Dev-only, and it did not affect the shipped
  bundle, but the lockfile was being rewritten for the zod upgrade anyway and the fix satisfies
  the 7-day cooldown on its own. `yarn npm audit --all --recursive` now reports no high or
  critical advisories.

## [0.9.4] — 2026-08-05

### Fixed

- Cross-isotope (B/F) conservation is enforced in `src/libraries/CheckMolecule.ts` rather
  than bypassed, so a buffer molecule that creates or destroys value no longer verifies
  clean.

### Changed — cross-SDK gauntlet reporting integrity

- The self-test now publishes cross-validation **coverage**, not just a verdict:
  `crossValidation.{ran,targetsExpected,targetsValidated}` and `runId` sit alongside
  `crossSdkCompatible` in the results file. The boolean alone could not distinguish
  "validated every peer, all passed" from "validated nothing and so found no failures".
- `crossSdkCompatible` now defaults to **false** and must be earned. It was `true`, so every
  early return out of cross-validation published a pass.
- Cross-validation **fails** instead of reporting "compatible" when the shared results
  directory is missing or holds no peer results. Absence of evidence is not evidence of
  compatibility.
- Round 1 no longer asserts a cross-SDK verdict it cannot have.
- A coverage floor is required before a pass: every expected peer must have been validated,
  in addition to no individual check having failed.
- Each peer is now checked for all 7 required molecule types. The validation loop iterates
  the molecule keys that are **present**, so an omitted molecule was indistinguishable from
  a validated one.
- Peer results are matched with `*-results.json`. ``.endsWith('.json')`` also matched the canonical vector
  **masters** living in that directory and fed them into the peer loop as SDK results.

Contract for these fields: `sdks/canonical-test-keys.json` in the KnishIOClientSDK
monorepo. Audit: `docs/audits/REPORTING-INTEGRITY-2026-08-05.md`.

Note: the self-test that actually runs is `self-test.cjs`; the `self-test.ts` and
`self-test.js` copies in this repo are stale and are not produced by the tsup build.

## [0.9.3] — 2026-07-21

### Fixed

- Stack-safe base64 serialization of ML-KEM keys in `Wallet`: the previous
  `String.fromCharCode.apply(null, bytes)` spread overflowed the JS call stack
  for large encrypted payloads. Now chunked.
- The same overflow in the shared public helpers `hexToBase64` and `chunkArray`
  (they carried an independent copy of the bug).

## [0.9.2] — 2026-07-12

Coordinated dependency-security release across all 8 SDKs. Release record:
`docs/sdk-release-0.9.2-execution-2026-07-12.md` (monorepo).

### Changed

- Dev toolchain refresh, including the migration to vitest 4.

### Added

- `npm audit --omit=dev --audit-level=high` gate in CI.
- Tag-driven publish workflow using npm Trusted Publishing (OIDC); `NPM_TOKEN`
  dropped. The publish job runs in the `release` GitHub environment.

## [0.9.1] — 2026-07-12

**Superseded — do not pin.** This version was staged on 2026-06-29 and then
published to npm out of order on 2026-07-12, landing seconds after `0.9.2` and
briefly taking the `latest` dist-tag before it was corrected. Everything in it is
also in `0.9.2`.

### Fixed

- Clear, actionable error when a node advertises a recipient key that is not an
  ML-KEM key (previously an opaque failure deep in the transport).

## [0.9.0] — 2026-06-29

Coordinated `0.9.0` across all 8 SDKs, marking the post-quantum ML-KEM transport
milestone. Runbook: `docs/sdk-release-audit-2026-06-29.md` (monorepo).

### Added

- **ML-KEM768 CipherHash encrypted transport** (PQ Phase E).
- Multi-recipient stackable (NFT) transfer builder.
- Cross-platform canonical vector test: SHAKE256, bundle hash, wallet generation,
  and `mlkem768`.
- Buffer-conservation harness covering both deposit and withdraw.
- First CI workflow for this repo (ESLint + `tsc --noEmit` typecheck + vitest) —
  both gates had been local-only and bypassable until now.

### Fixed

- `generateBundleHash` on an empty secret now hashes like the rest of the SDK
  family instead of throwing.
- Restored the typecheck gate: 58 `tsc` errors → 0.
- Restored the ESLint gate with an ESLint 9 flat config.

### Removed

- Dead `QueryUserActivity` query.
- Dead jest devDependencies (the suite is vitest).

### Notes

- Local version `0.8.4` was staged on 2026-06-22 (the multi-recipient stackable
  transfer builder plus read/create/claim fixes) but never published; that work
  reaches consumers here.

## [0.8.3] — 2026-06-11

### Added

- `defaultRequestPolicy` client option — fresh-by-default reads for long-lived
  clients.

### Changed

- Refreshed a stale 1024-era self-test crypto vector to the canonical 2048 form
  (landed under the `0.8.3` tag on 2026-06-14, after the version bump).

## [0.8.2] — 2026-06-11

Published to npm; no corresponding git tag exists in this repository.

### Fixed

- **BREAKING for callers relying on the broken behaviour:** the urql context is
  now forwarded, so `requestPolicy` actually takes effect. Reads that were
  silently served from cache are now fresh as requested.

## [0.8.1] — 2026-06-09

### Fixed

- `QueryActiveSession` now selects `updatedAt` (cross-SDK parity).

## [0.8.0] — 2026-06-05

Published to npm; no corresponding git tag exists in this repository.

### Changed

- **BREAKING:** `generateSecret` now outputs the canonical 2048-hex secret
  (previously 1024). The 1024 output was a prefix of the 2048 one, so derived
  bundle hashes change for callers that relied on the old length.

## [0.7.8] — 2026-06-03

Published to npm; no corresponding git tag exists in this repository.

### Fixed

- Policy ContinuID signing (F-3): the R-atom is signed from the established
  source wallet instead of a freshly created one, so policy molecules pass
  ContinuID validation.
- `MutationProposeMolecule` is serialized, and the cache is invalidated on
  ContinuID position drift.

### Added

- `setSocketUri` (F-8a).
- DataBraid embedding-status observability.

## Earlier releases

`0.7.7` and earlier predate this project's conventional-commit discipline; their
commit messages do not support accurate reconstruction. See the git tag history
and the [npm version list](https://www.npmjs.com/package/@wishknish/knishio-client-ts?activeTab=versions).

[0.9.6]: https://github.com/WishKnish/KnishIO-Client-TS/releases/tag/0.9.6
[0.9.5]: https://github.com/WishKnish/KnishIO-Client-TS/releases/tag/0.9.5
[0.9.4]: https://github.com/WishKnish/KnishIO-Client-TS/releases/tag/0.9.4
[0.9.3]: https://github.com/WishKnish/KnishIO-Client-TS/releases/tag/0.9.3
[0.9.2]: https://github.com/WishKnish/KnishIO-Client-TS/releases/tag/0.9.2
[0.9.1]: https://www.npmjs.com/package/@wishknish/knishio-client-ts/v/0.9.1
[0.9.0]: https://github.com/WishKnish/KnishIO-Client-TS/releases/tag/0.9.0
[0.8.3]: https://github.com/WishKnish/KnishIO-Client-TS/releases/tag/0.8.3
[0.8.2]: https://www.npmjs.com/package/@wishknish/knishio-client-ts/v/0.8.2
[0.8.1]: https://github.com/WishKnish/KnishIO-Client-TS/releases/tag/0.8.1
[0.8.0]: https://www.npmjs.com/package/@wishknish/knishio-client-ts/v/0.8.0
[0.7.8]: https://www.npmjs.com/package/@wishknish/knishio-client-ts/v/0.7.8
