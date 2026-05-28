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

## How to Make F5 Actually Work (The #1 Gotcha)

F5 doing "nothing" is extremely common in this monorepo. It almost always comes down to **which folder VS Code thinks is the workspace root**.

### Correct Way (Recommended)

1. In VS Code: **File → Open Workspace from File...**
2. Choose `dendron-plugin.code-workspace` (this lives in the repo root).
3. Open the **Debug** view (Ctrl+Shift+D or the bug icon on the left).
4. In the dropdown at the top of the Debug view, select:
   - **"Run Dendron Extension (Desktop)"**
5. Press **F5**.

This should:
- Run the `compile-plugin-core` task
- Launch a new VS Code window titled "Extension Development Host"
- Load your local version of Dendron

### Alternative: Opening the Full Monorepo Root

If you prefer having access to everything:
- Open the repository **root folder** (the folder containing `package.json`, `yarn.lock`, etc.).
- In the Debug dropdown you will see the configs that have "- [open monorepo root]" in the name.
- Use those + F5.

### What NOT to Do

- Do **not** just open the `packages/plugin-core` folder directly via "Open Folder".
- The old generic "Run Extension" configs are still present but the modern ones above are much better.

If F5 still does nothing after following the steps above:
- Make sure you selected a configuration in the Debug dropdown **before** pressing F5.
- Check the "Problems" panel and the integrated Terminal for preLaunchTask errors.
- Try the "No Precompile" variant first (it skips the compile step).

### Cleaning up noisy console output in the Extension Development Host

When the dev host opens, you will often see errors from other extensions (themes with bad JSON, Continue.dev, Mermaid, etc.). These are **not** caused by Dendron.

Quick ways to get a cleaner console:

- In the Extension Development Host window: Command Palette → **Preferences: Color Theme** → pick "Dark Modern" or "Light Modern".
- Add this to your launch config `args` if you want a very quiet host:
  ```json
  "--disable-extensions"   // disables ALL other extensions
  ```
  (We have a "No Precompile" variant you can duplicate and modify.)

The most common one you'll see right now is:
`Error loading color theme: SyntaxError: Expected double-quoted property name in JSON...`

This means one of your custom color themes has invalid JSON (comments or trailing commas). Switching themes in the dev host stops the spam.

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
