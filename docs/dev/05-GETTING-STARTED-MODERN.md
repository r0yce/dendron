# Getting Started — Modern Development on the go-to-work Fork (2026)

This is the practical "how do I actually work on this right now?" guide.

## Prerequisites

- **Node**: 22 LTS or 24+ recommended (we are successfully using 26 as of May 2026).
  - The old `.nvmrc` says 20. We are intentionally moving past it.
- **Yarn**: 1.22.x (classic). The monorepo is not ready for Yarn Berry or pnpm yet.
- **VS Code Insiders** (strongly recommended) + the stable version for comparison.
- Git, a decent amount of disk space (the repo + node_modules is large).

## First-Time Setup (Current Known Good Path)

```bash
# 1. Clone and switch to the active branch
git clone <your-fork-url>
cd dendron
git checkout go-to-work

# 2. Install dependencies (this can take 5-20+ minutes first time)
yarn install --network-timeout 600000

# 3. Build the core packages needed for the extension
yarn bootstrap:build:fast

# 4. Make sure the sqlite native binary is present for your Node version
yarn workspace @dendronhq/plugin-core download-sqlite-binary

# 5. (Optional but recommended) Generate runtime schema
yarn gen:data
```

At this point you should be able to:

- Run `yarn workspace @dendronhq/plugin-core compile`
- Press F5 in VS Code using the "Run Dendron Extension (Desktop)" configuration

## Daily Development Loop

```bash
# Make changes to TypeScript

# Either let the F5 launch config compile for you (recommended)
# or manually:
yarn workspace @dendronhq/plugin-core compile

# For faster iteration, run this in a dedicated terminal:
yarn workspace @dendronhq/plugin-core watch
```

Then use the excellent launch configs we added in `.vscode/launch.json`.

## Common Commands Reference

| Goal                                         | Command |
|----------------------------------------------|---------|
| Fast build of shared packages + plugin       | `yarn bootstrap:build:fast` |
| Compile only the extension                   | `yarn workspace @dendronhq/plugin-core compile` |
| Watch the extension                          | `yarn workspace @dendronhq/plugin-core watch` |
| Update sqlite native binary                  | `yarn workspace @dendronhq/plugin-core download-sqlite-binary` |
| Full (slower) bootstrap                      | `yarn bootstrap:build` |
| Regenerate dendron.yml JSON schema           | `yarn gen:data` |
| Run non-plugin tests                         | `yarn test:cli` |
| Manual pre-commit style checks               | `node hooks/pre-commit.js` |
| Package a .vsix (modern tools)               | `yarn workspace @dendronhq/plugin-core package:vsix:modern` |

## If Things Go Wrong

### "Yarn cannot parse package.json"
You accidentally put comments or trailing commas in a top-level `package.json`. Yarn 1 is strict JSON only.

### Noisy "npm warn Unknown env config ..." during builds
You will see many lines like:
`npm warn Unknown env config "version-git-message"`

**Harmless.** These come from your global `~/.npmrc` having newer npm `version-*` keys that Yarn 1 doesn't recognize. They do not break anything.

### "Cannot find module 'node_sqlite3.node'" or similar at runtime
Run `yarn workspace @dendronhq/plugin-core download-sqlite-binary` again.
Check that `packages/plugin-core/lib/binding/.../node_sqlite3.node` exists for your platform + N-API version.

### `yarn add` or `yarn install` explodes with invariant / hoisting errors
This monorepo's nohoist + resolutions setup is fragile.
Common workarounds:
- `yarn install --frozen-lockfile` (if lockfile is good)
- Delete `node_modules` + `yarn.lock` in a specific package (dangerous)
- For now, edit package.json manually and run full `yarn install` at root.

### Extension activates but many things are broken
This is usually a sign that the engine did not fully initialize.
Check the "Dendron" output channel + the Developer Tools console in the Extension Development Host window.
Look for errors during `WorkspaceActivator.activate`.

### You want to test on a completely clean state
```bash
git clean -fdx
yarn install --network-timeout 600000
yarn bootstrap:build:fast
```

## VS Code Workspace Files

The repo ships several:

- `dendron-main.code-workspace` — the full monorepo (what the original team used)
- `dendron-plugin.code-workspace` — focused on just `packages/plugin-core` (recommended for extension work)

## Telemetry Note

By default the extension still tries to phone home to Segment + Sentry when `getStage() === "prod"`.

For personal development you will almost certainly want to either:
- Set environment variables to disable it, or
- Later, patch the analytics code to be a no-op in this fork.

See `common-server` analytics + error reporting files.

## What's Next After You Can F5?

1. Open a real vault (or create a test one with the welcome flow).
2. Use the new performance timing work we will add (see upcoming perf doc).
3. Start reading the deep architecture docs while the code is running in front of you.
4. Pick a small area (a command, a webview, the lookup) and trace it end-to-end.

---

**You are now in a much better position than most people who have tried to revive old Dendron forks.**

The combination of:
- Working compile on modern Node
- Sqlite binaries fetching
- Modernized debug launch configs
- Extremely detailed documentation

...puts you in a strong place to maintain this for years.

Welcome to the working version of your personal knowledge OS.
