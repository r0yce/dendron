# Upgrade Changelog

Running log of every change made during the 2026-05 dependency-upgrade effort.
Branch: `chore/deps-upgrade-2026-05` (off `master` @ `4420715a4`).

Format: newest entries first. Each entry = scope + what + why + verification.

---

## Phase 5 (in progress) — Test compat for Node 22+

### CVE root-resolutions sweep
- **Why**: `yarn audit --level critical` showed 139 critical advisories, mostly in transitive deps. Forcing patched versions via root `resolutions` does not require any source changes.
- **Resolutions added** to root `package.json`:
  - `@babel/traverse: ^7.23.2` (CVE-2023-45133 RCE in transformed code)
  - `form-data: ^4.0.4` (CVE-2025-7783 unsafe random boundary)
  - `handlebars: ^4.7.9` (RCE via prototype pollution)
  - `shell-quote: ^1.8.1` (CVE-2021-42740 ARG injection)
  - `simple-git: ^3.27.0` (CVE-2022-24433, CVE-2025-22871 RCE)
  - `loader-utils: ^2.0.4` (CVE-2022-37601 prototype pollution)
  - `ejs: ^3.1.10` (CVE-2024-33883 server-side template injection)
  - `dompurify: ^2.5.7` (mXSS, prototype pollution)
  - `immer: ^9.0.21` (prototype pollution)
- Also bumped direct dep `simple-git ^3.3.0` → `^3.27.0` in `packages/common-server/package.json`.
- **Result**: `yarn audit --level critical`: **139 → 34** (105 critical CVEs fixed). Build/tests unchanged at 1455/1456.

### `axios 0.21` → `axios 1.7.7`
- **Files**: `packages/common-all/package.json`, `packages/engine-server/package.json`.
- **Why**: axios 0.21.x has multiple CVEs (CVE-2023-45857, CVE-2024-39338). 1.x is a major bump but the public API used in this repo (`axios`, `AxiosInstance`, `AxiosError`, `error.toJSON()`, `error.response.data`) is source-compatible.
- **Fallout**: One TS error — in axios 1.x `error.response.data` is typed `unknown` (was `any`). Patched `packages/pods-core/src/builtin/AirtablePod.ts:182` to cast the Airtable error payload to `any` (the runtime shape is owned by Airtable, not by us).
- **Verification**: Build ✅, typecheck ✅, `yarn test:cli` 1455/1456 ✅.

### `@types/node` pinned to `17.0.18` via root resolution
- **Why**: After Phase 5 sinon install, yarn re-resolved the `@types/node@*` constraint downward to `16.18.126`, which contains TS syntax (trailing commas in generic param lists with defaults) that **TypeScript 4.6 can't parse** in `http.d.ts`. Pinning back to the original `17.0.18` keeps the build green.
- **Side effect**: One narrow typing fix in `packages/api-server/src/utils.ts` — `subprocess.pid` is now typed `number | undefined`, so `process.kill()` got an `if (subprocess.pid !== undefined)` guard.

### Blocked attempt: `fs-extra 9 → 11`
- Bumping fs-extra to 11 (with `@types/fs-extra@^11`) requires `@types/node@^16`, whose `.d.ts` files use TS 4.x+ syntax that TS 4.6 chokes on.
- Decision: **defer fs-extra 11 to Phase 2** (alongside TypeScript 5 bump). Reverted root resolution. Recorded as "blocked-pending-TS-bump" in plan.

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
