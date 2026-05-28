# Dendron Fork: Goals, Current State, and Roadmap

> Branch: `go-to-work` (forked from `chore/deps-upgrade-2026-05`)
> Maintainer: Royce (personal knowledge management fork)
> Date: 2026-05 (initial assessment)

## Vision

This is a personal fork of Dendron, the best local-first, hierarchical, markdown-based PKM tool ever built for developers. Upstream development has stopped (maintenance-only mode announced). The goal of this fork is:

1. **Keep it alive and working** on modern VS Code (Insiders + stable) for personal daily use.
2. **Deeply understand every part** of the system so it can be maintained, debugged, and extended confidently.
3. **Improve performance** with measurable baselines and targeted optimizations.
4. **Add high-value features** that make it even more powerful for personal note-taking.
5. **Produce world-class documentation** so knowledge is not lost (unlike the upstream).

This document + the rest of `docs/dev/` is the living bible for this fork.

---

## Current State Assessment (as of go-to-work branch creation)

### What Works (baseline from deps-upgrade-2026-05)
- Most core packages typecheck and build with the partial dependency upgrades performed.
- Many CVEs mitigated via root `resolutions`.
- Node engine declared as `>=18`.
- Some packages moved forward (pino 9, axios 1.x, @sentry 7.114, sinon 19, execa 5 aligned, etc.).
- `yarn compile` in plugin-core succeeds with current pinned types.

### Critical Blockers for "Latest VSCode / Insiders"

| Area | Status | Impact | Notes |
|------|--------|--------|-------|
| `engines.vscode` | `^1.77.0` (ancient) | High | VSCode Insiders 2025/2026 is 1.100+ range |
| `@types/vscode` | exactly `1.77.0` | High | No new API surface; many deprecations in newer versions will appear when bumped |
| `@types/node` (plugin-core) | `^13.11.0` | High | Catastrophically old. Extension host now runs on much newer Node |
| TypeScript | 4.6 (root) | Medium | Modern ecosystem is on 5.4+ |
| Webpack / bundler toolchain | Mixed (webpack 5 ok, loaders old) | Medium | Web extension path especially fragile |
| `vsce` / packaging | `^2.10.0` (deprecated name) | Medium | Should be `@vscode/vsce` |
| `vscode-test` | old `^1.3.0` | Medium | Should migrate to `@vscode/test-electron` |
| Native modules (sqlite3) | Complex prebuild + binding hacks | High | One of the most common sources of "extension won't activate" on new Node/VSCode |
| Launch configs for debugging extension | Almost non-existent | High (DX) | Cannot F5 "Run Extension" easily |
| Telemetry / Sentry / Segment | Still wired to upstream | Medium | Should be made optional or self-hosted for a personal fork |

### What Broke for the User on Insiders
Exact error unknown at start of this effort (user reported "the extension stopped working one day"). Typical causes for Dendron-like age:
- Extension host Node version mismatch + native sqlite3 bindings.
- Deprecated/removed VSCode API calls (especially around webviews, tree views, authentication, workspace trust, terminal execution).
- `onDidChangeConfiguration` or proposal APIs.
- Async activation timing changes.
- New stricter security / workspace trust model.

---

## High-Level Architecture (Executive Summary)

Dendron is a **monorepo** (yarn workspaces + lerna) containing ~15 packages. The VS Code experience is delivered by one extension:

- **`@dendronhq/plugin-core`** — The actual VS Code extension (activation, commands, webviews, providers, UI).
  - Depends on the engine and common packages below.
  - Uses **tsyringe** + `reflect-metadata` for dependency injection (heavy but powerful).
  - Has both desktop (`node` target) and web extension (`webworker`) builds.

Core supporting packages (the "engine"):

- `common-all` — Types, constants, data models, utilities shared everywhere. The "lingua franca".
- `common-server` — Server-side utilities, logging (now pino 9), error reporting, file utils.
- `engine-server` — The heart: `DendronEngineV2`, note parsing, schema, backlinks, search, git integration, SQLite usage, workspace management.
- `unified` — Remark/rehype pipeline for markdown processing (very important for preview, publishing, references).
- `dendron-cli` — CLI tool (`dendron` command).
- `dendron-plugin-views` — React-based webviews (tree view, graph, calendar, lookup, preview, etc.).
- `pods-core` — Import/export "pods" (Roam, Notion, JSON, etc.).
- Others: api-server, common-frontend, nextjs-template (for publishing), etc.

**Key mental model**:
- A **Vault** is a folder of notes (can be local or remote).
- A **Workspace** contains one or more vaults + a `dendron.yml`.
- Every note has a **hierarchical path** (e.g. `projects.dendron.fork.goals` → `projects/dendron/fork/goals.md`).
- The **Engine** is responsible for parsing the entire vault(s) into an in-memory index (notes, schemas, links).
- The extension is mostly a **thin (but large) presentation + command layer** over the engine + lots of custom webviews.

Startup sequence (simplified):
1. `activate()` in `extension.ts` → delegates to `_extension.ts`
2. Telemetry setup (Segment + optional Sentry)
3. `DendronExtension.getOrCreate()` — creates the singleton, sets up DI container
4. `_setupCommands()` — registers ~100+ commands
5. `WorkspaceActivator.activate()` — the heavy part: initializes engine, parses vaults, builds indexes, sets up watchers, tree views, etc.
6. Language providers (definitions, references, hover, completions, etc.) registered.

---

## Immediate Priorities (Phase 1 — Make It Work Again)

1. **Modernize VSCode targeting + types** (this branch)
   - Bump `engines.vscode` + `@types/vscode`
   - Fix all resulting TypeScript errors
   - Update `@types/node`

2. **Make local development delightful**
   - Rich `.vscode/launch.json` configs for "Run Extension", "Debug Tests", "Debug Web Extension"
   - Update tasks.json
   - Document exact F5 + hot reload workflow

3. **Fix activation/runtime on current Insiders**
   - Especially sqlite3 native loading
   - Any removed APIs
   - Workspace trust / security model changes

4. **Documentation Sprint (parallel)**
   - Every major package gets its own deep-dive doc
   - Full extension lifecycle documented with sequence diagrams (textual)
   - All command registration and DI wiring explained
   - Build/publish paths explained

5. **Performance foundation**
   - Identify hot paths (engine indexing, note lookup, graph, preview)
   - Add basic timing + flame graph capability
   - Create `perf/` harness

---

## Long-term Ambitions (Phase 2+)

- Remove or make optional all upstream telemetry.
- Modernize build (esbuild? rspack? faster tsc?)
- Better tree-sitter / native markdown parsing?
- Plugin architecture for community forks.
- Excellent publishing story (the nextjs-template is powerful).
- Mobile / Obsidian import/export bridges.
- Your own killer features (ask what would make it "epic" for you personally).

---

## How to Use This Documentation

- Start with `01-architecture.md` (next)
- Then `02-monorepo-packages.md`
- `03-extension-activation-lifecycle.md`
- Package-specific deep dives
- `BUILD-AND-DEBUG.md`
- `UPGRADE-PLAYBOOK.md` (how we did the VSCode + deps upgrades)

Every change made on this fork will be accompanied by updates to these docs + commit messages that explain **why** at a deep level.

This is not "just get it working". This is turning Dendron into *your* maintainable, understandable, improvable tool.

Let's get to work.
