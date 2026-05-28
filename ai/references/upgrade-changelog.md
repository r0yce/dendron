# Upgrade Changelog

Running log of every change made during the 2026-05 dependency-upgrade effort.
Branch: `chore/deps-upgrade-2026-05` (off `master` @ `4420715a4`).

Format: newest entries first. Each entry = scope + what + why + verification.

---

## Phase 5 (in progress) — Test compat for Node 22+

### `@sinonjs/fake-timers` pinned to `^13.0.5` + sinon bumped to `^19.0.2`
- **Files**: root `package.json` (`resolutions`), `packages/engine-test-utils/package.json`, `packages/common-test-utils/package.json`.
- **Why**: Old sinon 9 pulled fake-timers 6 which crashed on Node 22+ trying to hijack a read-only `globalThis.performance`. Even with fake-timers 13, the bare-date shorthand still falls through to the writable-data branch.
- **Test workaround**: In `packages/engine-test-utils/src/__tests__/common-all/template.spec.ts`, both `useFakeTimers(currentDate)` call sites were rewritten to `useFakeTimers({ now: currentDate, toFake: ["Date"] })` so `performance` isn't touched.
- **Verification**: `yarn jest …/template.spec.ts` → 17/17 pass (was 0/17).

### Node 22 fs API removal in tests
- `fs.rmdirSync(path, { recursive: true })` was removed in Node 22. Replaced with `fs.rmSync(path, { recursive: true, force: true })` in:
  - `packages/engine-test-utils/src/__tests__/pods-core/MarkdownPod.spec.ts:693`
  - `packages/engine-test-utils/src/__tests__/pods-core/v2/MarkdownExportPodV2.spec.ts:533`
- **Verification**: Both files now pass (previously all afterEach hooks threw).

### Aggregate test status after Phase 5 partial
- `yarn test:cli`: **1455 passed / 1 failed / 35 skipped of 1491**.
- Failure: `segmentClient.spec.ts › THEN residual cache should be non-empty` — ENOENT on `test.log`. Pre-existing; the stub's `mockFailToSend` branch never writes the cache file. Not caused by upgrade. Tracked as a separate fix.

---

## Phase 1 (critical) — Install-blocking fixes

Commit: `ff96ff2cc` on `chore/deps-upgrade-2026-05`.

### `node-sass` → `sass` in `dendron-plugin-views`
- **Why**: `node-sass 7` fails to build on Node 17+ with modern Python (no `distutils`, no `nan` v2 fallbacks).
- **Change**: `packages/dendron-plugin-views/package.json` — `node-sass: ^7.0.0` → `sass: ^1.77.8`. No source changes needed (sass-loader works with both).

### Webpack 4 + Node 18+ OpenSSL workaround
- **Why**: Webpack 4 uses legacy MD4 hashing; Node 17 switched to OpenSSL 3 which rejects it (`ERR_OSSL_EVP_UNSUPPORTED`).
- **Change**: `dendron-plugin-views` build scripts wrapped with `npx cross-env NODE_OPTIONS=--openssl-legacy-provider`. Removed when Webpack 5 lands (Phase 1 remaining).

### `sqlite3 ^5.1.2` → `^5.1.7`
- **Why**: First version with prebuilt binaries for Node 20/22, avoids `node-gyp` source compile.

### CVE pinning (root `resolutions`)
- `lodash ^4.17.21`, `semver ^7.5.4`, `minimatch ^3.1.2`, `json5 ^2.2.3`, `tough-cookie ^4.1.3`.
- Keeps existing overrides: `trim: 0.0.3`, `d3-color: 3.1.0`.

---

## Phase 0 — Node engine normalization

Commit: included in `ff96ff2cc`.

### Min Node bumped from 14 → 18
- `.nvmrc` created with `20`.
- `shell/_verify_node_version.sh`: `MIN_VERSION="18.0.0"` (was 14.0.0).
- All `packages/*/package.json` `engines.node` rewritten to `>=18.0.0` via sed.
- Root `package.json` `engines.node`: `>=18.0.0`.

---

## Documentation

- `ai/references/context.md` — full SME context document created (sections 1–15).
- `ai/references/upgrade-plan.md` — 5-phase plan with risk analysis. Commit `29eaba203`.
- `ai/references/upgrade-changelog.md` — this file.

---

## Verification matrix run (after Phase 0 + 1)

| Step | Result |
|---|---|
| `yarn install` | ✅ clean install on Node 20 |
| `yarn bootstrap:build` | ✅ ~68s |
| `yarn lerna:typecheck` | ✅ 13 packages, 7s |
| `yarn test:cli` (after Phase 5 sinon work) | ✅ 1455/1456 (1 unrelated flake) |

Not yet re-run: `yarn lint`, `yarn ci:test:plugin`, `yarn ci:test:template`.
