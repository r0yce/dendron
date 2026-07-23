# Development Backlog

Living list of **deferred** work for the personal fork. Items here are intentional — not forgotten bugs.

**How to use**

- Pick an item when you have capacity; link PRs/commits to the `BL-*` id.
- When an item ships, move a one-line summary to the changelog section at the bottom and mark the item **Done**.
- Agents: see also [ai/references/backlog.md](../../ai/references/backlog.md) for the same list in SME form.

**Related docs**

- [BUILD-AND-DEBUG.md](./BUILD-AND-DEBUG.md) — daily commands and verify gates
- [04-BUILD-AND-DEBUG-WORKFLOW.md](./04-BUILD-AND-DEBUG-WORKFLOW.md) — build paths in depth
- [ai/references/upgrade-plan.md](../../ai/references/upgrade-plan.md) — phased modernization history

---

## Active backlog

### BL-001 — True-latest dependencies without bootstrap pins (P1)

**Status:** **Mostly done** (wave 3 2026-07) — remaining: TypeScript 7, CRA/plugin-views bundler modernization  
**Goal:** Prefer **latest published versions** + **code/config migrations** over version downgrades or broad `resolutions` pins, while keeping `yarn bootstrap:init` / `yarn verify:local` green.

**Wave 3 progress (2026-07)**

| Area | Result |
|------|--------|
| `dendron-cli` yargs **18.0.0** | **Done** — dynamic `import()` + `hideBin`/`parseAsync` in `bin/dendron-cli.ts`; type-only `Argv` elsewhere |
| CLI engines | **Node `>=20.19.0`** (yargs 18 requirement); root + `.nvmrc` → 20 |
| Force-old resolutions | **Removed** `@babel/helper-compilation-targets@7.22.15`, `loader-utils@2`, `ansi-regex@5` (+ strip-ansi pin) |
| `common-assets` antd Less | **Done** — themes are pure Dendron CSS variables (no antd Less); **antd removed** as dep |
| `remark-footnotes` | **Removed** — footnotes via existing `remark-gfm` |
| Legacy `vsce` package | **Removed** root + plugin-core; use `@vscode/vsce` only |
| CLI privacy | First CLI run no longer auto-`enable`s Segment (`ENABLED_BY_CLI_DEFAULT` removed) |

**Still open**

| Area | Current | Latest path |
|------|---------|-------------|
| TypeScript | 6.0.3 monorepo | **7.x** (major; separate compile-fix wave) |
| `dendron-plugin-views` | CRA + `react-dev-utils` | Vite/rspack or webpack-5-native (BL-003) |
| Root `resolutions` | ~41 CVE/compat pins | Audit each; drop when transitive trees allow |
| `pinTrueLatest.js` | Can re-introduce fights | Run after TS 7 + views bundler |

**Policy (target state)**

1. Bump direct deps to latest; fix breakages in source, webpack, or scripts.
2. Use root `resolutions` only for **CVE overrides** or **documented exceptions**.
3. Do **not** downgrade unless: (a) the npm publish is broken, or (b) a **platform** migration is explicitly deferred.

**Acceptance criteria**

- [x] `yarn verify:local` green after wave 3 bumps
- [x] yargs / footnotes / antd Less / force-old babel+loader+ansi pins addressed
- [ ] `yarn bootstrap:init` on clean clone (smoke when convenient)
- [ ] TypeScript 7
- [ ] plugin-views bundler (BL-003)
- [ ] `pinTrueLatest` does not fight remaining resolutions

**Codetour:** [.tours/advanced/02-dependencies-latest-backlog.tour](../../.tours/advanced/02-dependencies-latest-backlog.tour)

---

### BL-002 — ESLint 10 + flat config for pre-commit (P2)

**Status:** **Done** (2026-07)  
**Goal:** Restore `husky` pre-commit without `--no-verify`.

Root `eslint.config.js` is ESLint 10 flat config (TypeScript parser + relaxed rules). Full Airbnb/React via FlatCompat is **deferred**: `eslint-plugin-react@7.37` only peers through ESLint 9.7 and crashes under 10 (`getFilename is not a function`). Legacy `.eslintrc.js` kept as reference.

---

### BL-003 — `dendron-plugin-views` bundler strategy (P2)

**Status:** Backlog  
**Goal:** Decide long-term: evolve CRA/webpack custom config vs. Vite/rspack for webviews.

Tied to BL-001 (babel, `react-dev-utils`, bundle size warnings).

---

## Done (archive)

_Move completed items here with date and PR/commit._

| Id | Done | Notes |
|----|------|-------|
| BL-002 | 2026-07 | `eslint.config.js` + `@eslint/eslintrc` / `@eslint/js`; pre-commit ESLint 10 works |
| BL-010 | 2026-07 | Privacy-first telemetry default OFF (`DISABLED_BY_FORK_DEFAULT`); see `docs/dev/TELEMETRY.md` |
| BL-011 | 2026-07 | Real `PerfRingBuffer` in common-all; wired to ActivationTimer, PerformanceTimer, `dendron health --verbose` |
| BL-012 | 2026-07 | Doctor: `node` + `telemetry` checks; ring snapshot in verbose/JSON |
| BL-013 | 2026-07 | Co-located src emit cleanup (~800 js/map/d.ts) + gitignore; Airtable stub purge |
| BL-014 | 2026-07 | Local-only telemetry sink (`enable_telemetry --local` → NDJSON); health understands local |
| BL-015 | 2026-07 | `dendron dev dump_perf` + DevShowAllPerfReports includes PerfRingBuffer |
| BL-001a | 2026-07 | yargs 18 (ESM dynamic import), drop force-old resolutions, antd-less themes, remark-gfm footnotes, @vscode/vsce only, Node ≥20.19 |