# Dendron Personal Fork — "go-to-work"

> **You are looking at a personal, long-term-maintained fork of Dendron.**
> Original upstream: https://github.com/dendronhq/dendron (maintenance mode only, active development ceased).

This fork exists because Dendron was (and still is) one of the best local-first hierarchical note-taking systems ever created for developers — and I refuse to let it die or become unusable on modern tooling.

## Current Branch

- `go-to-work` — the active development and documentation branch for this personal fork.
- Base: `chore/deps-upgrade-2026-05` (partial dependency + CVE work performed with earlier assistance).

## Immediate Goals

1. Get the VS Code extension **reliably working again** on latest stable + Insiders (2025–2026 era).
2. **Document literally everything** at a depth that lets a single motivated person maintain and evolve it indefinitely.
3. Establish performance measurement and make targeted improvements.
4. Modernize the development experience (debugging, builds, testing).
5. Add personal "epic" features over time.

## Quick Start for Development (Once Fully Bootstrapped)

```bash
# 1. Install dependencies (this can take a while the first time)
yarn

# 2. Build the core packages needed for the extension
yarn bootstrap:build:fast

# 3. Compile the extension itself
cd packages/plugin-core
yarn compile

# 4. Open this folder in VS Code Insiders
#    - Recommended: File → Open Workspace from File... → dendron-plugin.code-workspace
#    - Or just open the whole monorepo root

# 5. Press F5 (or use the "Run Dendron Extension (Desktop)" launch config)
#    A new Extension Development Host window should appear with Dendron loaded.
```

See the full modernized debugging story in `docs/dev/04-build-and-debug-workflow.md` (to be written as we stabilize).

## Documentation (The Most Important Part of This Fork)

Everything lives under **`docs/dev/`**:

- `00-GOALS-AND-ROADMAP.md` — Why this fork exists and the long-term vision
- `01-ARCHITECTURE-OVERVIEW.md` — The complete mental model (read this first)
- `02-MONOREPO-PACKAGES.md` — Every package, its purpose, dependencies, and health
- More coming: activation lifecycle, build system, engine deep dive, performance, upgrade history, etc.

These documents are **not** aspirational. They are written to the same standard as the code — they will be updated with every significant change.

## What Has Been Done So Far (on this branch)

- Created `go-to-work` branch
- Performed initial deep exploration and diagnosis
- Bumped declared `engines.vscode` to `^1.90.0` + `@types/vscode@1.90.0` (real type errors are minimal — great news)
- Completely overhauled `.vscode/launch.json` and `tasks.json` so you can actually debug the extension like a normal human
- Added recommended extensions file
- Created the first three deep documentation files (hundreds of lines of architectural knowledge capture)
- Identified that the main runtime breakage on Insiders is **very likely native sqlite3 + Node version in the extension host**, not TypeScript API removals

## The Hard Parts We Know About

- **sqlite3 native bindings** + Prisma — historically the #1 cause of "extension won't even activate"
- Old build tooling (vsce, vscode-test, ts-loader 8, ancient @types/node in plugin-core)
- A massive, clever, but heavy DI + command registration system
- Telemetry that still phones home to upstream Segment/Sentry by default
- The monorepo bootstrap scripts are custom and old
- No one has been running the full test suite on Node 22+ / VSCode 1.90+ for a long time
- **Archived CI/CD**: The original `.github/` (15+ workflows + issue automation) lives in `github-archive/`. See `github-archive/README.md` for complete documentation of every file. This prevents Actions from firing on pushes while preserving history.

## How to Help Yourself Learn This Codebase

1. Read the three docs in `docs/dev/` right now.
2. Open `packages/plugin-core/src/_extension.ts` and `packages/plugin-core/src/extension.ts` while reading the lifecycle doc.
3. Pick one command (e.g. `GotoNoteCommand`) and trace it all the way to the engine.
4. Use the new launch configs. Set breakpoints. Step through activation.
5. Ask me (Grok) extremely specific questions — I have been building the map for you.

## License & Original Attribution

This remains under the original Apache 2.0 license of Dendron.

All new documentation and changes in this fork are also provided under Apache 2.0 (or more permissive where noted).

Huge respect to the original Dendron team (Kevin, etc.) for building something this thoughtful and powerful.

---

**Let's get this thing rock solid, fast, documented to the bone, and then make it even better than it was.**

Current status: Foundation + diagnosis complete. Next: full build modernization + sqlite3 battle + more docs.

Welcome to the `go-to-work` era.
