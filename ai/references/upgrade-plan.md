# Dendron Modernization Plan

> Branch: `chore/deps-upgrade-2026-05`
> Baseline: monorepo v0.124.0, lerna 3, yarn 1, TS 4.6, upstream is **maintenance-only**.
> Author note: the user requested "upgrade everything." This document captures the realistic scope, ordered into phases that can each ship as a green branch.

## Why this isn't a one-shot

A blind `yarn upgrade --latest` will brick the repo. The hard blockers:

1. **ESM cliff** — `unified` 10+, `remark` 13+, `rehype-*` 11+, `mdast-util-*` 4+ are all **ESM-only**. `engine-server` and `unified` packages are CommonJS. Bumping forces ESM migration (file extension changes, dynamic `import()`, Jest reconfig, TS module setting to `node16`/`nodenext`).
2. **`node-sass` is dead.** EOL since 2022; doesn't build on Node ≥18. Must move to `sass` (dart-sass). `dendron-plugin-views` and webview build are the affected callers.
3. **`sqlite3` ^5.1.2** doesn't ship prebuilt binaries for Node 22+. Either bump to ^5.1.7 (binaries available) or switch to `better-sqlite3`.
4. **VS Code engine target `^1.77.0`** caps Electron version. Newer Antd/React majors may not run cleanly in webviews on that Electron.
5. **Lerna 3 → 8** dropped `bootstrap`, changed publishing semantics, moved to nx-style task graph. All `bootstrap/scripts/*.js` callers need updating.
6. **Husky 4 syntax** in root `package.json` (`"husky": { "hooks": {...} }`) is silently ignored by Husky 8/9.
7. **Jest 26 → 29** changes test environment defaults and removes implicit globals. Plugin-views is on 26, root is on 28 — already inconsistent.
8. **AWS Amplify v5 → v6** is a complete API rewrite (`@aws-amplify/core`).
9. **Antd 4 → 5** removed `less` for `cssinjs`, dropped `Form.Item` legacy APIs, changed locale shape.
10. **Next.js 12 → 15** introduces app-router and removes `next export` (now `output: 'export'` in config).

## Current state (snapshot)

| Concern | Current | Latest | Risk if bumped |
|---|---|---|---|
| `typescript` (root) | `4.6` | `5.6+` | Medium — TS 5 stricter checks |
| `eslint` | `^7.32.0` | `9.x` | High — flat config required |
| `prettier` | `^2.0.4` | `3.x` | Low — trailing-comma default flipped |
| `jest` (root) | `^28.1.0` | `29.x` | Low–Medium |
| `jest` (plugin-views) | `26.6.0` | `29.x` | Medium |
| `husky` | `^4.2.5` | `9.x` | Low (re-init hooks) |
| `lerna` | `^3.19.0` | `8.x` | High (workflow rewrite) |
| `webpack` (plugin-views) | `4.44.2` | `5.x` | High |
| `webpack` (root dep) | `^5.74.0` | `5.x latest` | Low |
| `react` | `^17.0.2` | `19.x` (18 stable) | High |
| `antd` | `^4.21.4` / `^4.15.5` | `5.x` | High |
| `next` | `^12.3.0` | `15.x` | High |
| `unified` | `^9.x` | `11.x` | **ESM cliff** |
| `remark` / `rehype-*` | `^8`–`^12` | `15` / `13+` | **ESM cliff** |
| `sqlite3` | `^5.1.2` | `5.1.7` | Low for patch bump |
| `node-sass` | `^7.0.0` | n/a (EOL) | **Must replace with `sass`** |
| `axios` | `^0.21.1` | `1.7.x` | Medium (response shape unchanged, but 1.x is stricter) |
| `lodash` | `^4.17.15` | `4.17.21` | None — bump for CVE |
| `verdaccio` | `^5.1.3` | `6.x` | Medium |
| `vsce` | `^2.10.0` | `@vscode/vsce 3.x` | Low (package renamed) |
| `husky-hooks shape` | v4 syntax | v9 (`prepare` script + `.husky/`) | Mechanical |
| `engines.node` | `>=0.14` root, mixed in packages | Node 20 LTS | Mechanical |

## Phases

Each phase is a self-contained PR. Verify with `yarn install` + `yarn lerna:typecheck` + `yarn test:cli` at minimum; `yarn ci:test:plugin` for any change touching plugin-core, plugin-views, or engine-server.

### Phase 0 + critical Phase 1 — DONE (commit `ff96ff2cc`)
*Result: monorepo installs, builds, and typechecks cleanly on Node 20/26.*

- [x] `.nvmrc` pins Node 20 LTS.
- [x] `engines.node` normalized to `>=18.0.0` in all 14 package manifests and root.
- [x] `shell/_verify_node_version.sh` `MIN_VERSION` → `18.0.0`.
- [x] Replaced `node-sass@^7.0.0` → `sass@^1.77.8` in `dendron-plugin-views` (node-sass is EOL, fails to compile against Node 18+/Python 3.12+ due to missing `distutils`).
- [x] Bumped `sqlite3@^5.1.2` → `^5.1.7` in `engine-server` (prebuilt binaries for Node 18/20/22+).
- [x] Added `NODE_OPTIONS=--openssl-legacy-provider` to `dendron-plugin-views` webpack 4 build scripts (workaround until webpack 4 → 5 in Phase 1).
- [x] Added root `resolutions` for CVE-prone transitives: `lodash@^4.17.21`, `semver@^7.5.4`, `minimatch@^3.1.2`, `json5@^2.2.3`, `tough-cookie@^4.1.3`.
- [x] `yarn install` ✅ / `yarn bootstrap:build` ✅ (68s) / `yarn lerna:typecheck` ✅ (7s, 13 packages).
- [x] `yarn test:cli`: **1431 / 1456 pass**. 25 fails are pre-existing Node 22+ incompat in old `sinon` (`Cannot assign to read only property 'performance'`) — see Phase 5.

### Phase 1 (remaining) — Native + EOL replacements
- Replace `node-sass` → `sass` in `dendron-plugin-views`; rewire `sass-loader` config (already `^10`, supports both).
- Bump `sqlite3` `^5.1.2` → `^5.1.7` in `engine-server` (binary availability for Node 18+/20+).
- Bump `webpack` 4.44.2 → 5.x in `dendron-plugin-views`; update loaders (`css-loader`, `file-loader` → `asset/resource`, `terser-webpack-plugin`, `mini-css-extract-plugin`, etc.).
- Bump `babel-loader` 8.1.0 → 9.x.
- Drop `node-gyp` ancient transitives via `resolutions`.
- Verify webview builds and the plugin packages.

### Phase 2 — Tooling majors
- Husky 4 → 9: replace root `husky` block with a `prepare` script and `.husky/pre-commit`, `.husky/pre-push` files.
- Prettier 2 → 3: regenerate snapshots; expect lots of formatting diffs (commit separately).
- ESLint 7 → 9 with flat config: this is invasive across every package. Consider 7 → 8 as an intermediate step first.
- Jest 28 → 29 root; unify `dendron-plugin-views` from Jest 26 → 29.
- TypeScript 4.6 → 5.x: enable `useUnknownInCatchVariables: false` if catch-clause regressions appear; fix `Iterable` / decorator metadata gaps.
- Lerna 3 → 8: rewrite `bootstrap/scripts/*` that called `lerna bootstrap`. Yarn workspaces already do the linking; the only real lerna usage left is `lerna exec`, `lerna run`, `lerna publish`.
- `vsce` → `@vscode/vsce` (package renamed).

### Phase 3 — Markdown pipeline (ESM cliff)
- Decide: stay CJS (target `unified` 9 / `remark` 12 — current state — and accept no new features) **or** migrate `engine-server` and `unified` packages to ESM.
- If migrating:
  - Set package `"type": "module"` for `unified` package first (smaller surface).
  - Convert imports; switch TS to `module: "nodenext"`, `moduleResolution: "nodenext"`.
  - Update consumers (engine-server, pods-core, plugin-core) to use dynamic `import()` while still CJS.
  - Bump `unified`, `remark`, `remark-*`, `rehype-*`, `mdast-util-*`, `hast-util-*` together (they share peer ranges).
- Replace deprecated:
  - `remark-footnotes` 2 → GFM (footnotes are in `remark-gfm` now).
  - `remark-math` 3 → `remark-math` 6.
  - `rehype-katex` 5 → `rehype-katex` 7.
  - `remark-wiki-link` `0.0.4` (very old) — evaluate alternatives or fork into vendor/.

### Phase 4 — Runtime majors
- React 17 → 18 (root concurrency, `createRoot`). Touches `common-frontend`, `dendron-plugin-views`, `dendron-viz`, `nextjs-template`, `dendron-design-system`.
- Antd 4 → 5: replace less imports, adopt cssinjs, fix `Form`, `Menu`, `Tabs` API breaks.
- Next.js 12 → 14 (intermediate) → 15: replace `next export` with `output: 'export'`; migrate `_document`, `_app` shape if needed; revisit Playwright tests.
- AWS Amplify v5 → v6 in `common-frontend`: API rewrite, separate `@aws-amplify/auth`, `@aws-amplify/api` packages.
- VS Code engine bump (if needed for Antd 5 runtime in webview Electron).

### Phase 5 — Misc / hygiene
- **`sinon` upgrade** — current pin breaks on Node 22+ (`performance` is now read-only). Causes the 25 failing tests in `template.spec.ts`, `MarkdownPod.spec.ts`, `MarkdownExportPodV2.spec.ts`, `segmentClient.spec.ts`. Bump `sinon` to ≥15 and re-run snapshots.
- `verdaccio` ^5 → ^6 + `verdaccio-auth-memory`, `verdaccio-memory` peers.
- `axios` 0.21 → 1.x (audit response interceptors).
- `chokidar` 3 → 4.
- `fs-extra` 9 → 11.
- `execa` 4 → 8 (ESM in 6+, may force interop work).
- `pino` 6 → 9 (in `common-server`).
- `@sentry/node` 6 → 8 (in `common-server`).
- `googleapis`, `@notionhq/client`, `@octokit/graphql`, `airtable` in `pods-core` — re-audit per-integration.
- `electron` test host alignment (`@vscode/test-electron` recent).

## Verification matrix (run at the end of every phase)

| Check | Command |
|---|---|
| Install | `yarn install --frozen-lockfile` |
| Typecheck all | `yarn lerna:typecheck` |
| Lint | `yarn lint` |
| Non-plugin tests | `yarn test:cli` |
| Plugin tests | `yarn ci:test:plugin` |
| Plugin web | `yarn ci:test:plugin-web` |
| Next.js | `yarn ci:test:template` |
| Local publish | `yarn build:patch:local:ci` |

## Recommended order of attack

1. **Phase 0** lands first — minimal, mechanical, low-risk. (This branch.)
2. **Phase 1** unblocks every dev on Node 20+.
3. **Phase 2** is the largest mechanical diff (prettier 3 will touch ~every file). Stage prettier as a single auto-format commit, then tooling bumps separately.
4. **Phase 3** is the strategic call. If the project stays maintenance-only, *skip it*. Stay on `unified@9` indefinitely.
5. **Phase 4** is opt-in based on whether the publish site (Next.js) and webviews need new framework features.
6. **Phase 5** is opportunistic cleanup.
