# Dendron Architecture Overview

This document gives you a complete mental model of how Dendron works as a system. Read this before diving into any specific package.

## The Big Picture

Dendron is a **local-first, hierarchical, markdown-centric personal knowledge management (PKM) system** that lives primarily inside VS Code.

It treats your notes like code:
- Hierarchical namespacing (like Java packages or filesystem paths)
- Refactoring that updates all references
- Rich linking, backlinks, and graph views
- Schemas that act like types for your notes
- Everything is plain files + git

**Core invariant**: The source of truth is always the `.md` files on disk. The engine just indexes them.

---

## Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension Host                    │
│  (plugin-core + webviews + providers + commands)            │
├─────────────────────────────────────────────────────────────┤
│                    Dendron Engine (engine-server)            │
│  - Note indexing, parsing, schema validation                 │
│  - Backlink / reference resolution                           │
│  - Vault + workspace management                              │
│  - Git integration, file watchers                            │
├─────────────────────────────────────────────────────────────┤
│                    Shared Primitives (common-*)              │
│  - Types, constants, utilities (common-all)                  │
│  - Logging, error reporting, file helpers (common-server)    │
├─────────────────────────────────────────────────────────────┤
│                    Markdown Pipeline (unified + plugins)     │
│  - remark/rehype ecosystem for parsing + transforming MD     │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                                  │
│  - SQLite (via prisma + node-sqlite3) for some indexes       │
│  - Plain filesystem for notes + dendron.yml + schemas        │
└─────────────────────────────────────────────────────────────┘
```

---

## The Key Packages (What Each One Owns)

See [02-monorepo-packages.md](./02-monorepo-packages.md) for the exhaustive per-package breakdown. Here is the 30-second version:

| Package | Role | Criticality |
|---------|------|-------------|
| `plugin-core` | The VS Code extension. Activation, 100+ commands, all tree views, webviews (React), language providers (go-to-def, hover, completions, diagnostics), workspace trust handling, startup flows. | The user-facing product |
| `engine-server` | The brain. `DendronEngineV2`, note store, schema engine, link utils, vault utils, git, SQLite usage, workspace initialization. | Highest after plugin-core |
| `common-all` | The universal type system + constants. Every other package imports from here. If you change a type here, you touch the world. | Foundation |
| `common-server` | Cross-cutting server/runtime concerns: pino logging, Sentry, Segment client, file system wrappers, error classification. | Important for observability |
| `unified` | All markdown processing (note refs `![[foo]]`, block refs, publishing transforms, preview rendering, etc.). Heavy use of remark/rehype. | Core to "Dendron-flavored markdown" |
| `dendron-plugin-views` | The React app(s) that run inside webviews (graph, calendar, lookup, note preview, tip-of-the-day, etc.). | UI/UX layer |
| `dendron-cli` | The `dendron` CLI binary. Many commands delegate to engine. | Power users + CI |
| `pods-core` | Pluggable import/export (Notion, Roam Research, JSON, Airtable, etc.). | Optional but beloved |
| `api-server` | HTTP server used by some publishing / remote features. | Niche |
| `nextjs-template` | The beautiful static site generator for publishing your vault as a website. | Publishing killer feature |

---

## The Extension Lifecycle (Most Important Flow to Understand)

See the dedicated deep-dive: [03-extension-activation-lifecycle.md](./03-extension-activation-lifecycle.md)

Extremely condensed version:

1. VS Code loads `plugin-core` because `"activationEvents": ["*"]`
2. `activate(context)` in `src/extension.ts` immediately delegates to `_extension.ts`
3. `_activate()` does:
   - Telemetry/Sentry/Segment unlock + opt-in check
   - `DendronExtension.getOrCreate()` → creates the **singleton** + sets up the **tsyringe DI container**
   - Registers every command (the `ALL_COMMANDS` list is massive)
   - Creates `WorkspaceActivator` and calls `activate()`
4. `WorkspaceActivator.activate()` is where the real work happens:
   - Reads `dendron.yml`
   - Initializes vaults
   - Creates the engine (`DendronEngineV2` or the new V3 experimental path)
   - Triggers full index (parses every note + schema)
   - Sets up file watchers
   - Wires up tree views (backlinks, tree, calendar, etc.)
   - Registers language providers
5. Only after this does `dendron:pluginActive` context key become true and most UI lights up.

**Key singleton**: `getExtension()` / `getDWorkspace()` / `getEngine()` — you will see these everywhere.

---

## Dependency Injection (tsyringe)

Dendron uses **tsyringe** (a lightweight constructor-injection DI library) + `reflect-metadata`.

- `setupLocalExtContainer()` in plugin-core wires most things.
- Many classes are decorated with `@injectable()` and constructor params use `@inject(Token)`.
- This makes testing dramatically easier (you can swap real engine for mocks).
- It also makes the graph of dependencies explicit (once you learn to read it).

**Rule of thumb**: If something feels like "magic global", it's probably registered in the container.

---

## How Notes Actually Work (Mental Model)

- **Note** = one `.md` file + frontmatter + body.
- **Hierarchical key** (fname): `projects.dendron.fork` → file at `projects/dendron/fork.md` (or `projects/dendron/fork/index.md` depending on config).
- **Vault** = a root folder that can contain many notes. You can have multiple vaults (private, work, shared, etc.).
- **Workspace** = the collection of vaults + `dendron.yml` + (optional) `dendron.code-workspace`.
- **Schema** = a YAML file (`.schema.yml`) that defines allowed hierarchies + templates + children patterns. Acts like a type system + code generator for notes.
- **Note Reference** (`![[other.note#^block-ref]]`): Dendron's killer feature for transclusion.
- **Backlinks / References**: Computed by the engine by walking all notes looking for wikilinks / note refs / headers.

The engine maintains several indexes in memory (and some persisted in SQLite):
- `notes` map (by fname and by id)
- `schemas`
- `vaults`
- Link caches, etc.

When you edit a file, watchers + incremental update logic tries to keep the index fresh without full reparse (this is a major performance area).

---

## Markdown Flavor & The Unified Pipeline

Dendron does **not** use VS Code's built-in markdown preview for its own features (it has a custom one for note refs, etc.).

All special Dendron syntax goes through a custom remark/rehype pipeline defined in the `unified` package:

- `[[wikilinks]]`
- `![[note references]]`
- `#tag` handling
- Block anchors (`^my-block`)
- Frontmatter extraction
- etc.

This same pipeline powers:
- The in-editor preview webview
- Publishing (nextjs-template consumes the transformed AST or HTML)
- Various export pods
- The graph view

Understanding the unified package is mandatory if you ever want to add new markdown syntax or fix rendering bugs.

---

## Native Code & Pain Points (sqlite3, etc.)

Dendron vendors a specific version of `node-sqlite3` with prebuilt binaries for multiple platforms + N-API versions.

There are several hack files:
- `sqlite3-binding.js`
- `webpack-require-hack.js`
- `prisma-shim`

These exist because:
1. Webpack (used for web extension + some prod builds) has trouble with native modules.
2. The extension needs to work in both desktop + certain web contexts.
3. Prisma client is generated and has its own requirements.

**This area is the #1 source of "it worked yesterday, today it won't even activate"** after Node or VSCode upgrades.

When you see errors about `node_sqlite3.node` not being found, or "cannot find module 'sqlite3'", start here.

---

## Telemetry & Error Reporting (Important for a Personal Fork)

Even in a personal fork, this code is still very active:

- `SegmentClient` (analytics)
- Sentry initialization (only in prod stage, only if not opted out)
- Anonymous ID stored in `~/.dendron/<uuid>` and also in VS Code globalState

For a personal fork you will almost certainly want to:
- Make telemetry completely optional or fully disabled by default
- Remove the Sentry DSN or make it configurable
- Document exactly where every tracking call lives

See `common-server/src/analytics.ts` and related files.

---

## Testing Strategy (High Level)

- **Unit tests**: Jest, co-located or in `src/test`
- **Integration tests**: Heavy use of `engine-test-utils` + real temporary vaults on disk. The `runTestInteg.js` launches a special instance of VS Code + loads the extension.
- **Perf tests**: `perf-test` script, uses the same harness.
- **Web tests**: Playwright + vscode-test-web for the browser extension path.

The integration test setup is non-trivial (it actually starts VS Code). This is why many people find contributing to Dendron intimidating.

---

## Build & Packaging Paths

There are multiple ways code gets turned into runnable artifacts:

1. **Daily dev**: `yarn compile` (just tsc → `out/`)
2. **Watch mode**: `yarn watch`
3. **Web extension**: `compile-web` / `package-web` (webpack → `dist/web/`)
4. **Production desktop bundle** (less used): `build:prod` → webpack + var substitution
5. **Publishing**: `vscode:prepublish` runs web packaging; then `vsce publish` or `ovsx publish`

The published `.vsix` contains both the desktop `out/` (or dist) + the web bundle.

---

## Next Documents to Read

- [02-monorepo-packages.md](./02-monorepo-packages.md) — every package, its responsibilities, its dependencies, its build scripts
- [03-extension-activation-lifecycle.md](./03-extension-activation-lifecycle.md) — the single most important flow, line-by-line
- [04-build-and-debug-workflow.md](./04-build-and-debug-workflow.md) — how to actually work on this thing day-to-day (once we finish modernizing it)
- [UPGRADE-PLAYBOOK.md](./UPGRADE-PLAYBOOK.md) — the exact process we followed to move VSCode engine, types, Node, native modules, etc.

---

## One-Sentence Summary for Your Brain

**Dendron = (hierarchical markdown files on disk) + (a very sophisticated in-memory index + query engine) + (a giant, lovingly-crafted VS Code extension that makes the whole thing feel magical).**

Everything else is details and (sometimes painful) implementation tradeoffs made between 2020–2023 when it was under active development.

Now that you understand the shape, let's go deeper.
