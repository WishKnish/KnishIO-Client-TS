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

[0.9.3]: https://github.com/WishKnish/KnishIO-Client-TS/releases/tag/0.9.3
[0.9.2]: https://github.com/WishKnish/KnishIO-Client-TS/releases/tag/0.9.2
[0.9.1]: https://www.npmjs.com/package/@wishknish/knishio-client-ts/v/0.9.1
[0.9.0]: https://github.com/WishKnish/KnishIO-Client-TS/releases/tag/0.9.0
[0.8.3]: https://github.com/WishKnish/KnishIO-Client-TS/releases/tag/0.8.3
[0.8.2]: https://www.npmjs.com/package/@wishknish/knishio-client-ts/v/0.8.2
[0.8.1]: https://github.com/WishKnish/KnishIO-Client-TS/releases/tag/0.8.1
[0.8.0]: https://www.npmjs.com/package/@wishknish/knishio-client-ts/v/0.8.0
[0.7.8]: https://www.npmjs.com/package/@wishknish/knishio-client-ts/v/0.7.8
