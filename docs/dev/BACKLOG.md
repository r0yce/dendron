# Development Backlog

Living list of **deferred engineering** work for the personal fork. Items here are intentional — not forgotten bugs.

> **Product sprints & lanes** live in **[PRODUCT-ROADMAP.md](./PRODUCT-ROADMAP.md)** (source of truth).  
> This file is for **tooling / deps / deferred tech** — not competing product roadmaps.

**How to use**

- Pick an item when you have capacity; link PRs/commits to the `BL-*` id.
- When an item ships, move a one-line summary to the changelog section at the bottom and mark the item **Done**.

**Related docs**

- [PRODUCT-ROADMAP.md](./PRODUCT-ROADMAP.md) — product lanes & sprints
- [BUILD-AND-DEBUG.md](./BUILD-AND-DEBUG.md) — daily commands and verify gates
- [04-BUILD-AND-DEBUG-WORKFLOW.md](./04-BUILD-AND-DEBUG-WORKFLOW.md) — build paths in depth

---

## Active backlog

### BL-001 — True-latest dependencies without bootstrap pins (P1)

**Status:** **Done for core platform** (wave 4 2026-07 fully-latest) — residual: CRA shell shrink, some majors deferred  
**Goal:** Prefer **latest published versions** + **code/config migrations** over version downgrades or broad `resolutions` pins, while keeping `yarn verify:local` green.

**Wave 4 fully-latest (2026-07)**

| Area | Result |
|------|--------|
| **TypeScript 7.0.2** | **Done** — monorepo on TS 7 CLI; `moduleResolution: bundler`; TS2883 portable-type fixes; `require('typescript')` API is gone in 7 (only version) — webpack modules.js parses tsconfig JSON instead |
| **Babel 8** | **Done** — `@babel/*` 8.x; dropped `babel-preset-react-app`; explicit presets; no `loose`/`bugfixes` opts |
| **plugin-views** | webpack **5.109**, `css-minimizer-webpack-plugin` 8, no openssl-legacy flag, `build:dev` green |
| **React 19.2.8**, **antd 6.5.1**, **@types/node 26.1.1**, **@types/vscode 1.125**, axios 1.18.1, sentry 10.67, prisma 7.9, etc. | Bumped |
| Prior wave 3 | yargs 18, privacy CLI, theme CSS, vsce → @vscode/vsce |

**Still open (optional / higher-risk majors)**

| Area | Notes |
|------|--------|
| `react-dev-utils` | Still used by CRA-ejected scripts; keeps some older transitive trees |
| `execa` 10 | ESM-major; stay on 9 until CLI/scripts audit |
| `@vscode/test-electron` 3 | Test harness major |
| Root `resolutions` CVE pins | Keep until `yarn audit` + clean trees justify drops |
| Full Vite/rspack for views | BL-003 stretch — webpack 5 path is current |

**Acceptance criteria**

- [x] `yarn verify:local` green on TypeScript 7.0.2
- [x] `yarn workspace @dendronhq/dendron-plugin-views run build:dev` green (Babel 8 + webpack 5.109)
- [x] yargs 18 / footnotes / antd-less themes / force-old pins
- [ ] `yarn bootstrap:init` on clean clone (optional smoke)
- [ ] `pinTrueLatest` full run without re-pinning removed CRA deps

**Codetour:** [.tours/advanced/02-dependencies-latest-backlog.tour](../../.tours/advanced/02-dependencies-latest-backlog.tour)

---

### BL-002 — ESLint 10 + flat config for pre-commit (P2)

**Status:** **Done** (2026-07)  
**Goal:** Restore `husky` pre-commit without `--no-verify`.

Root `eslint.config.js` is ESLint 10 flat config (TypeScript parser + relaxed rules). Full Airbnb/React via FlatCompat is **deferred**: `eslint-plugin-react@7.37` only peers through ESLint 9.7 and crashes under 10 (`getFilename is not a function`). Legacy `.eslintrc.js` kept as reference.

---

### BL-003 — `dendron-plugin-views` bundler strategy (P2)

**Status:** **Partial** (webpack-5-native path advanced 2026-07)  
**Goal:** Decide long-term: evolve CRA/webpack custom config vs. Vite/rspack for webviews.

**Done:** Babel 8 explicit presets, css-minimizer 8, no openssl-legacy, webpack 5.109, stable `index.bundle.js` contract.  
**Left:** shrink/remove `react-dev-utils`, WDS 5 start.js API, optional Vite/rspack spike.

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
| BL-001b | 2026-07 | TypeScript 7.0.2 + Babel 8 + webpack 5.109 plugin-views; broad latest deps (react 19.2.8, node types 26, axios 1.18, sentry 10.67, prisma 7.9, …) |