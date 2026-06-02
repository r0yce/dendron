# Build and Debug (Dendron Fork)

This guide is the practical entry point for building the monorepo and running the VS Code extension locally.

## Prerequisites

- Node.js 18+ (22+ works; repo tested on modern Node)
- Yarn 1.x
- VS Code or VS Code Insiders

## First-time setup

```bash
yarn
yarn bootstrap:init   # install + full build (slower)
```

For day-to-day work after dependencies are installed:

```bash
yarn bootstrap:build:fast
```

Verification gate (extension TypeScript):

```bash
yarn workspace @dendronhq/plugin-core compile
```

## Modern hybrid builds (library packages)

Several packages use **tsup** for JavaScript and **tsc + api-extractor** (with temp-dts fallback) for types:

```bash
yarn bootstrap:build:modern-fast
```

Per-package:

```bash
yarn workspace @dendronhq/common-all run build:modern
```

## Debug the VS Code extension (recommended)

The extension is built with **Webpack**, not plain `tsc` output.

### Option A — Open `packages/plugin-core` as workspace root

1. Open `packages/plugin-core` in VS Code.
2. **Terminal → Run Task → `watch-webpack`** (runs `webpack:dev:watch`).
3. **Run and Debug → `Run Dendron Extension (Desktop, No Precompile)`** (F5).

### Option B — Open monorepo root

1. Open the repository root.
2. Start `watch-webpack` from `packages/plugin-core` (same task name in that folder’s tasks).
3. Use **Run Dendron Extension (Desktop, No Precompile) - [open monorepo root]**.

### Clean Host testing

Use **Run Dendron Extension (Clean Host, No Precompile)** in `packages/plugin-core/.vscode/launch.json` to launch with `--disable-extensions`.

## Debug CLI / doctor

After `yarn bootstrap:build:dendron-cli`:

```bash
yarn dendron health --verbose
yarn dendron health --checks sqlite,git,yml --json
```

Launch configs in root `.vscode/launch.json`:

- **Debug Dendron-CLI (ts-node bin + doctor health)**
- **Debug Doctor (health checks + perf)**

## Package build order (manual)

If you need to build incrementally:

1. `@dendronhq/common-all`
2. `@dendronhq/common-server`, `@dendronhq/unified`
3. `@dendronhq/engine-server`, `@dendronhq/pods-core`
4. `@dendronhq/api-server`, `@dendronhq/dendron-cli`, `@dendronhq/engine-test-utils`
5. `@dendronhq/plugin-core` (webpack for runtime; `compile` for typecheck)

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| `lerna` / `minimatch` errors | Root bootstrap uses `yarn workspace` (not lerna). Run `yarn install` after lockfile changes. |
| Missing `@dendronhq/engine-server` types | `yarn workspace @dendronhq/engine-server run build:modern` |
| Extension F5 shows old code | Ensure `watch-webpack` is running; use No Precompile launch config |
| OOM during `common-all` build | `tsup` uses `dts: false`; types come from `build:types` only |

## Related docs

- [00-GOALS-AND-ROADMAP.md](./00-GOALS-AND-ROADMAP.md)
- [MONOREPO-PACKAGES-MODERNIZATION-TRACKER.md](./MONOREPO-PACKAGES-MODERNIZATION-TRACKER.md)
- [packages/plugin-core.md](./packages/plugin-core.md)
- [.grok/reports/build-modernization-spike-2026-05-31.md](../../.grok/reports/build-modernization-spike-2026-05-31.md)