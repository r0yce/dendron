# Monorepo Packages — Complete Reference

This is the definitive map of every package in the Dendron monorepo, why it exists, what it owns, who depends on it, and its current health.

Use this as your table of contents when exploring the codebase.

---

## Workspace Packages (Defined in Root package.json)

These are the packages declared in the yarn workspaces array.

### 1. `@dendronhq/plugin-core` (The Star)

**Location**: `packages/plugin-core`

**What it is**: The actual VS Code extension. This is 80% of what a normal user experiences as "Dendron".

**Key responsibilities**:
- Extension activation / deactivation
- All command registration (`dendron.*`)
- All custom views (tree view, backlinks, calendar, graph, lookup, etc.)
- All webviews (React apps in iframes)
- Language server features: DefinitionProvider, ReferenceProvider, Hover, Completion, Rename, CodeActions, Folding, etc.
- Workspace initialization and lifecycle
- Note lookup (the famous `Ctrl+L` / `Cmd+L` experience)
- Preview, publishing hooks, etc.
- Native module loading hacks for sqlite3

**Build output**: `out/` (tsc) + `dist/` (webpack for some paths)

**Entry points**:
- `main`: `out/src/extension.js`
- `browser`: `dist/web/extension.js` (web extension)

**Critical files**:
- `src/extension.ts` + `src/_extension.ts` (activation)
- `src/workspace.ts` + `src/workspacev2.ts`
- `src/commands/index.ts` (the giant ALL_COMMANDS list)
- `src/injection-providers/setupLocalExtContainer.ts`

**Dependencies**: Almost everything else in the monorepo.

**Current state (2026)**: Still on old `@types/node`, old vsce, old test runners. VSCode engine bump in progress on this fork.

---

### 2. `@dendronhq/common-all`

**Location**: `packages/common-all`

**What it is**: The universal type system and constants. The "header files" of Dendron.

**Key exports**:
- All the `NoteProps`, `DVault`, `DWorkspace`, `Schema` types
- `DENDRON_COMMANDS`, event enums, `CONSTANTS`
- Utility functions that are truly cross-cutting and have no side effects
- Error classes, status enums, etc.

**Who imports it**: Literally every other package. It is the root of the dependency graph.

**Philosophy**: If two packages need to agree on the shape of data, the type lives here.

**Size**: Large (129 source files in src/).

**Health**: Very stable. Changes here are high-risk and require touching many packages.

---

### 3. `@dendronhq/common-server`

**Location**: `packages/common-server`

**What it is**: Runtime and server-side cross-cutting concerns.

**Key things it owns**:
- Logging (`createLogger`, pino wrappers) — recently upgraded to pino 9 on this fork
- Error reporting + Sentry initialization
- Segment analytics client (`SegmentClient`)
- File system helpers that work the same on desktop + some server contexts
- `MetadataService`, `HistoryService`
- Git utilities (via simple-git or isomorphic-git in places)
- `getOS()`, duration helpers, etc.

**Important recent work (deps-upgrade-2026-05)**:
- pino 6 → 9
- @sentry/node bump within 7.x line
- execa alignment

**Note**: Some of this code still assumes "prod" means "the official Dendron build". For a personal fork you will want to audit all telemetry paths.

---

### 4. `@dendronhq/engine-server`

**Location**: `packages/engine-server`

**What it is**: The heart and soul. The actual knowledge engine.

**This is where the magic happens**:
- `DendronEngineV2` (and experimental V3)
- Note parsing, frontmatter extraction, schema application
- Full vault indexing + incremental updates
- Link resolution, backlink calculation
- `NoteStore`, `SchemaStore`
- SQLite usage (via Prisma) for some persistent indexes / caches
- Vault remote handling, git sync primitives
- `WorkspaceService` — reading/writing `dendron.yml`, creating new workspaces
- `HistoryService`, seed management

**Critical to performance**: The indexing hot path lives here. If notes feel slow to load or lookups lag, this is the first place to profile.

**Native code**: Uses `node-sqlite3` and Prisma client.

**Dependencies**: `common-all`, `common-server`, `unified`

---

### 5. `@dendronhq/unified`

**Location**: `packages/unified`

**What it is**: The Dendron markdown dialect processor.

**Core technology**: [unified](https://unifiedjs.com/) + remark + rehype + custom plugins.

**What it does**:
- Parses Dendron-specific syntax (`[[wikilinks]]`, `![[note refs]]`, `^block-anchors`, hashtags, etc.)
- Transforms the AST for preview, publishing, and export
- Extracts note references and embeds
- Handles math (katex), diagrams (mermaid via special handling), etc.
- Frontmatter + body separation

**Why it matters**: Almost every "Dendron is better than plain Markdown" feature flows through here.

If you want to add a new syntax extension (e.g. custom callouts, new embed types), this is the package.

---

### 6. `@dendronhq/dendron-plugin-views`

**Location**: `packages/dendron-plugin-views`

**What it is**: The React frontend for all webviews.

**Key views** (each is a mini React app):
- Note Graph (2D/3D force graph)
- Calendar
- Backlinks panel (sometimes)
- Lookup view (the fancy one)
- Tip of the Day / Feature Showcase
- Configure UI (newer settings surface)
- Preview panel (the rich one with note refs expanded)

**Tech**: React + TypeScript + SCSS + (some older patterns).

**Build**: Own webpack / build pipeline, outputs to `build/`.

**Communication with extension**: PostMessage protocol + the `WebViewPanelFactory` pattern in plugin-core.

---

### 7. `@dendronhq/dendron-cli`

**Location**: `packages/dendron-cli`

**What it is**: The standalone `dendron` command-line tool.

**Major commands** (partial):
- `dendron build` (site publishing)
- `dendron dev` (various generators + utils)
- `dendron export`
- `dendron import`
- `dendron note` (create, delete, etc from CLI)
- `dendron workspace` (init, add vault, etc.)
- `dendron doctor`

Many commands are thin wrappers around engine-server + pods.

**Binary entry**: `bin/dendron-cli.js` (after build).

---

### 8. `@dendronhq/pods-core`

**Location**: `packages/pods-core`

**What it is**: The pluggable import/export system ("Pods").

**Supported pods** (historical):
- JSON
- Markdown
- Roam Research JSON
- Notion
- Airtable
- Google Docs (via some path)
- Obsidian (community)
- etc.

**Design**: Each pod implements a small interface. The engine doesn't know about them; they consume the engine's data.

Very useful for migration into or out of Dendron.

---

### 9. `@dendronhq/api-server`

**Location**: `packages/api-server`

**What it is**: A small Express-based HTTP API server.

**Used by**:
- Some remote vault features
- Older publishing flows
- Possibly the "Dendron in the browser" experiments

**Status**: Niche. Many personal users never touch it.

---

### 10. `@dendronhq/common-frontend`

**Location**: `packages/common-frontend`

**What it is**: Shared React components + hooks used by `dendron-plugin-views` and the nextjs-template publishing UI.

**Contains**: Theme, some common UI primitives, possibly the old "Dendron UI" component library.

**Note**: There is also a `dendron-design-system` package (not in main workspaces) that seems experimental / storybook-based.

---

### 11. `@dendronhq/common-test-utils` + `@dendronhq/engine-test-utils`

These are **test infrastructure** packages.

- `common-test-utils`: fixtures, note builders, assertion helpers
- `engine-test-utils`: The heavy integration test harness. Creates real temp vaults on disk, runs the engine, can spin up VS Code instances for extension tests.

The integration tests are some of the most valuable (and slowest + flakiest) parts of the suite.

---

### 12. `@dendronhq/nextjs-template`

**Location**: `packages/nextjs-template`

**What it is**: A full Next.js 12/13-era static site generator that turns your Dendron vault into a beautiful, searchable, published website.

**Features**:
- Full-text search (client or server)
- Note graph embedded
- Beautiful typography
- SEO
- Incremental static regeneration or full export

This was one of Dendron's killer differentiators vs Obsidian/Roam for "I want to publish my second brain publicly or to my team".

**Tech debt**: Next.js version is old by 2026 standards. Worth modernizing if you publish a lot.

---

### Other / Special Packages

- `packages/generator-dendron`: Yeoman generator for scaffolding new vaults / plugins? (less used now)
- `packages/dendron-viz`: Older visualization experiments
- `packages/_pkg-template`: Template for creating new internal packages
- `packages/dendron-design-system`: Storybook + design system experiments (incomplete?)

---

## Non-Workspace Directories Worth Knowing

- `bootstrap/` — The custom monorepo orchestration scripts (buildAll.js, genMeta.js, the entire patch/release machinery). This is Dendron-specific DevOps.
- `shell/` — The old setup scripts (`setup.sh` etc.) that tried to force Node 16. Largely obsolete after the deps-upgrade work.
- `dev/` — Various development utilities.
- `ai/` — (new in this fork) Place for AI-assisted analysis, context, and our new `docs/dev/` work.

---

## Dependency Graph (Simplified)

```
plugin-core
  ├── engine-server
  │     ├── unified
  │     ├── common-server
  │     └── common-all
  ├── dendron-plugin-views
  ├── common-frontend
  └── (pods, cli, etc.)

dendron-cli
  └── engine-server + pods-core

nextjs-template
  └── (consumes published notes + some common-frontend)
```

`common-all` is imported by **everything**.

---

## How to Explore Effectively

When you want to understand a feature:

1. Start in `plugin-core/src/commands/` — find the command class.
2. See what engine methods it calls.
3. Jump to `engine-server/src/` for the real implementation.
4. Check `common-all` for the types involved.
5. If markdown is involved, look in `unified/src/`.

For UI: `dendron-plugin-views/src/` + the webview factories in plugin-core.

---

## Next Steps After This Document

- Read the activation lifecycle document next.
- Then pick one package and read its `README.md` + `package.json` + main entry point.
- Run `yarn bootstrap:build:fast` (once we have it working again) and explore the generated `lib/` and `out/` directories.

This monorepo is large, but it is **not** disorganized. Once you internalize the layers above, navigation becomes natural.
