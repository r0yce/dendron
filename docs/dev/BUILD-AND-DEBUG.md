# Build and Debug (Personal Fork — Local Extension Only)

This fork is for **your own VS Code use**. Packages are **not published to npm**, and nothing is merged upstream to `@dendronhq/dendron`. The monorepo exists to **build and run the extension on your machine**.

## What matters vs what you can ignore

| Care about | Safe to ignore (unless you need it) |
|------------|-------------------------------------|
| `yarn bootstrap:build:fast` | `build:patch:remote`, verdaccio, npm publish |
| Webpack watch + F5, or a local `.vsix` | Lerna version bumps, API Extractor for published typings |
| `yarn workspace @dendronhq/plugin-core compile` | Full `ci:test:cli` snapshot matrix (optional) |
| `yarn dendron health` on your vaults | Upstream release / PR stack workflows |

## Prerequisites

- Node.js 18+ (20+ recommended)
- Yarn 1.x
- VS Code or VS Code Insiders

## First-time setup

```bash
yarn
yarn bootstrap:init   # yarn install + full monorepo build (slower, once)
```

`bootstrap:init` runs `bootstrap:bootstrap` (`yarn install --frozen-lockfile` + `gen:meta`) then `bootstrap:build` (full graph via `bootstrap/scripts/buildAll.js`: libraries, `dendron-plugin-views` webpack, `plugin-core` compile, `dendron dev sync_assets --fast`).

Use this after a clean clone or when shared packages / webview assets / CLI wiring changed. For daily work, `yarn verify:local` (`bootstrap:build:fast`) is enough.

**Temporary dependency compromises** (pins/downgrades) exist so init passes; the goal is to remove them and stay on latest — tracked as [BL-001 in BACKLOG.md](./BACKLOG.md#bl-001--true-latest-dependencies-without-bootstrap-pins-p1).

## Day-to-day verify (local gate)

```bash
yarn verify:local
```

This runs the **fast bootstrap** (libraries + CLI + plugin-core typecheck). Use this before F5 or packaging.

When you change engine-server, unified, or CI-shaped builds:

```bash
yarn verify:full
```

## Run the extension (recommended — no VSIX)

The extension **runs from webpack output**, not from `tsc` alone.

### Option A — Open `packages/plugin-core`

1. Open `packages/plugin-core` in VS Code.
2. **Terminal → Run Task → `watch-webpack`** (or `webpack:dev:watch`).
3. **Run and Debug → `Run Dendron Extension (Desktop, No Precompile)`** (F5).

### Option B — Open monorepo root

1. Open the repository root.
2. Start `watch-webpack` in `packages/plugin-core`.
3. Use **Run Dendron Extension (Desktop, No Precompile) - [open monorepo root]** from root `.vscode/launch.json`.

### Clean Host (Insiders debugging)

**Run Dendron Extension (Clean Host, No Precompile)** in `packages/plugin-core/.vscode/launch.json` — launches with `--disable-extensions` so only Dendron is active. Use this when checking sqlite3, activation, or API issues on Insiders.

## Install a local `.vsix` (optional)

When you want an installed copy without F5 (same machine, no Marketplace):

```bash
yarn extension:package
```

This builds dependencies, production webpack + web bundle, then runs `vsce package` in `plugin-core`. Install the generated `.vsix`:

- VS Code: **Extensions → … → Install from VSIX…**
- Or: `code --install-extension packages/plugin-core/*.vsix`

You do **not** need `vsce publish` or npm credentials.

## Debug CLI / workspace health

After bootstrap:

```bash
yarn dendron health --verbose
yarn dendron health --checks sqlite,git,yml,node,telemetry --json
```

Checks include sqlite, engine, vscode, git, dendron.yml, deps-cve, **node**, and **telemetry** (privacy-first: default off; `--local` file mode is pass). `--verbose` prints ActivationTimer + PerfRingBuffer summary.

```bash
yarn dendron dev dump_perf              # ring buffer summary (JSON)
yarn dendron dev enable_telemetry --local
yarn dendron dev show_telemetry
```

Note: workspace health is `dendron health` (not `dendron doctor` — that name is still the notes doctor).

Root `.vscode/launch.json` includes **Debug Doctor** and **Debug Dendron-CLI** configs.

Doctor smoke (8 contracts, no VS Code):

```bash
yarn test:doctor:smoke
```

## Library builds (only when needed)

Most packages compile with full `tsc` into `lib/` (gitignored; built locally).

Fast path (normal):

```bash
yarn bootstrap:build:fast
```

Full monorepo (plugin-views, sync_assets, etc.):

```bash
yarn bootstrap:build    # same as bootstrap:init minus install
yarn bootstrap:init     # install + bootstrap:build
```

Hybrid tsup + api-extractor (optional experiments):

```bash
yarn bootstrap:build:modern-fast
```

Manual order if building piecemeal:

1. `common-all` → `common-di` → `unified` → `common-server`
2. `engine-server`, `pods-core`, `api-server`, `dendron-cli`
3. `plugin-core` — **webpack for runtime**, `compile` for types

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| `lerna` / `minimatch` errors | Bootstrap uses `yarn workspace`, not lerna. Run `yarn` after lockfile changes. |
| Extension F5 shows old code | Ensure `watch-webpack` is running; use **No Precompile** launch config. |
| `Cannot find module` from CLI | `yarn bootstrap:build:dendron-cli` |
| sqlite3 / activation fails on Insiders | Clean Host launch; check Extension Host log; `yarn dendron health --checks sqlite` |
| Missing types in IDE | `yarn workspace @dendronhq/<pkg> run build` for that package |

## Related docs

- [BACKLOG.md](./BACKLOG.md) — deferred work (latest-deps policy: BL-001)
- [00-GOALS-AND-ROADMAP.md](./00-GOALS-AND-ROADMAP.md) — vision (some publish/Lerna items are legacy upstream noise for this fork)
- [04-BUILD-AND-DEBUG-WORKFLOW.md](./04-BUILD-AND-DEBUG-WORKFLOW.md) — build paths and bootstrap scripts
- [packages/plugin-core.md](./packages/plugin-core.md)
- [packages/dendron-plugin-views.md](./packages/dendron-plugin-views.md)