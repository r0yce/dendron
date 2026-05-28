# Build System & Debug Workflow (go-to-work Fork)

This document explains exactly how Dendron turns source code into a running VS Code extension, and how to work on it effectively in 2026 on modern Node + VS Code Insiders.

## Core Reality Check

Dendron's build system was designed in 2020-2022. It is:

- A custom monorepo orchestration layer on top of yarn workspaces + lerna v3.
- Heavy use of shell scripts in `bootstrap/scripts/`.
- Multiple parallel build paths (tsc for dev, webpack for web + some prod paths).
- Extremely sensitive to the exact version of Node, Yarn, and native module prebuilts.

In this fork we are deliberately modernizing the **development experience** while keeping the old machinery running long enough to understand and eventually replace pieces.

---

## The Two Main Build Modes

### 1. Development / "Just compile" (what you use 95% of the time)

Command:
```bash
cd packages/plugin-core
yarn compile          # or: yarn watch
```

What it does:
- Runs `tsc -p tsconfig.build.json`
- Outputs to `packages/plugin-core/out/`
- The extension's `main` entry in package.json points here: `./out/src/extension.js`

This is fast (5-15 seconds for plugin-core on a decent machine after the first build).

You use this for normal development + the "Run Extension" launch config.

### 2. Full / "bootstrap" builds

Root-level commands:

| Script                        | What it builds                                      | When to use |
|-------------------------------|-----------------------------------------------------|-------------|
| `yarn bootstrap:build:fast`   | Common packages + engine + plugin-core (subset)    | Daily driver after clean checkout |
| `yarn bootstrap:build`        | Almost everything (via bootstrap/scripts/buildAll.js) | When you change shared packages heavily |
| `yarn bootstrap:bootstrap`    | `yarn install` + `gen:meta`                        | After changing package.json / resolutions |

These scripts use `lerna run build --scope ...` under the hood.

Each package's `build` script is usually just `tsc -p tsconfig.build.json`.

---

## The Bootstrap Scripts (The "Secret" Layer)

Located in `bootstrap/scripts/`:

- `buildAll.js` — the big one called by `bootstrap:build`
- `buildAllForTest.js`
- `buildNightly.sh`, `buildPatch.sh` — the old release machinery (we mostly ignore these in the fork)
- `genMeta.js` — generates some runtime metadata
- `chmod-cli.js` — makes the CLI executable

These scripts are the reason Dendron feels like it has its own private build system on top of lerna/yarn.

**Important**: Many of them hard-code package names and ordering. If you add a new package, you must touch these.

---

## Native Modules & The Sqlite3 Nightmare

This is historically the #1 reason "Dendron stopped working after a VS Code update".

Key files in `packages/plugin-core/`:

- `package.json` → `"binary"` section tells `node-pre-gyp` where to download prebuilts from (TryGhost/node-sqlite3 fork at v5.1.2).
- `sqlite3-binding.js` — webpack override that forces a specific `node_sqlite3.node` location.
- `webpack.common.js` (and prod/dev variants) — copy the `.node` file into the output during bundling.
- `download-sqlite-binary` script → `node-pre-gyp install`

On modern Node (22/24/26) + Apple Silicon, the important prebuilt path looks like:

```
lib/binding/napi-v6-darwin-unknown-arm64/node_sqlite3.node
```

As of May 2026 on this fork, `yarn download-sqlite-binary` successfully fetched the binary for Node 26 on darwin-arm64. This is a good sign.

The remaining risk is whether the `require()` paths inside the engine (via Prisma + direct sqlite3) resolve correctly when the extension host loads the code.

---

## Webpack Paths (Desktop vs Web Extension)

There are four webpack configs in plugin-core:

- `webpack.common.js`
- `webpack.dev.js`
- `webpack.prod.js`
- `webpack.webext.js` ← used for the browser/web extension (`vscode.dev`, github.dev, etc.)

For normal personal desktop use you almost never need webpack. The `tsc` output in `out/` is sufficient.

Webpack becomes relevant when:
- You run `build:prod`
- You publish (`vscode:prepublish` runs `package-web`)
- You want to test the web extension path

---

## Debugging the Extension (Modernized in This Fork)

We added high-quality launch configs in `.vscode/launch.json`:

- **Run Dendron Extension (Desktop)** — the one you want 99% of the time. It has a `preLaunchTask` that runs `compile:plugin-core`.
- **Run Dendron Extension (Desktop, No Precompile)**
- Debug integration tests
- Attach to a running Extension Host (advanced)
- Jest debugging for engine tests

**Recommended daily workflow**:

1. Open the repo root or `dendron-plugin.code-workspace` in VS Code Insiders.
2. Make changes.
3. Press F5 (or use the command palette "Debug: Select and Start Debugging").
4. A new window ("Extension Development Host") opens with your modified Dendron loaded.
5. Set breakpoints in `out/` (or configure source maps — they are there).

The `compile:watch:plugin-core` task exists if you prefer a persistent watch process instead of the preLaunch compile.

---

## The Husky / Pre-commit Situation (Fork Decision)

See the commit that removed the husky configuration.

In short:
- Husky v4 + the custom stash dance was too brittle on Node 26.
- We removed the automatic hook.
- The actual checks (`node hooks/pre-commit.js`) still exist and can be run manually.
- We accept slightly higher risk of bad commits in exchange for being able to actually work without constant ` --no-verify`.

If you want back some enforcement later, we can add a lightweight lefthook or simple shell pre-commit.

---

## Current Known Issues on Node 26 (as of this writing)

- Root `package.json` must remain strict JSON (no comments, no trailing commas).
- `yarn add` inside workspaces often blows up due to the complex nohoist + resolutions setup.
- Old `@types/node@^13` in plugin-core (we have not bumped it yet in the installed tree).
- `vsce` and `vscode-test` are deprecated names/paths.
- Many peer dependency warnings (normal for this age of monorepo).
- The old `shell/setup.sh` tells you to use Node 16 — ignore it.

---

## Recommended Commands for Daily Work (go-to-work Fork)

```bash
# After fresh clone / branch switch
yarn                              # hope it works; may need --network-timeout 600000

# Fastest way to get the extension runnable
yarn bootstrap:build:fast
cd packages/plugin-core
yarn compile

# Or just compile the extension directly after the shared packages are built
yarn workspace @dendronhq/plugin-core compile

# Download / update sqlite native binary (important after Node upgrades)
yarn workspace @dendronhq/plugin-core download-sqlite-binary

# Watch mode for the extension (run in a separate terminal)
yarn workspace @dendronhq/plugin-core watch

# Generate the JSON schema for dendron.yml (used at runtime)
yarn gen:data
```

Then press F5.

---

## Future Modernization Ideas (Documented Here for Later)

- Replace lerna + custom bootstrap scripts with Turborepo or Nx (huge DX win).
- Move from Yarn 1 classic to Yarn Berry (PnP or nodeLinker) or pnpm.
- Replace ts-loader + webpack for the desktop path with esbuild or swc.
- Drop the old vsce + vscode-test in favor of modern `@vscode/vsce` + `@vscode/test-electron`.
- Make the sqlite situation use better-sqlite3 or a pure WASM alternative (long term dream).

These are tracked for Phase 2+ after we have a reliably working baseline.

---

## Next Documents in This Series

- Performance measurement plan (how we will add timing + profiling)
- Engine deep dive (DendronEngineV2 internals)
- Webview communication protocol
- Publishing pipeline (nextjs-template)

---

**Current status (May 2026)**: We can compile the extension. Sqlite binary downloads. The old husky hooks are gone. The next milestone is a successful F5 launch inside VS Code Insiders with a real vault, followed by performance instrumentation.
