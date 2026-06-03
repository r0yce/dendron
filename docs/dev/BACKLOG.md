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

**Status:** Backlog  
**Goal:** Prefer **latest published versions** + **code/config migrations** over version downgrades or broad `resolutions` pins, while keeping `yarn bootstrap:init` green.

**Why this exists**

`yarn bootstrap:init` (`yarn bootstrap:bootstrap && yarn bootstrap:build`) was fixed with a mix of upgrades and **temporary compromises**. We should revisit each compromise and replace it with a proper migration so `pinTrueLatest` / latest bumps do not require re-learning the same failures.

**Policy (target state)**

1. Bump direct deps to latest; fix breakages in source, webpack, or scripts.
2. Use root `resolutions` only for **CVE overrides** or **documented exceptions** (comment + `BL-*` link). No duplicate keys (e.g. two `ansi-regex` entries).
3. Do **not** downgrade unless: (a) the npm publish is broken, or (b) a **platform** migration is explicitly deferred (e.g. CJS → ESM).

**Known temporary compromises (replace, don’t cement)**

| Area | Current workaround | Latest path |
|------|-------------------|-------------|
| `dendron-cli` | `yargs@17.7.2` (CJS) | Migrate CLI entry to **ESM** (or dynamic `import()`), then `yargs@18+` |
| `common-assets` | `antd@4` devDep for Less `default.less` / `dark.less` | antd 6 theme build without legacy Less entry files |
| `unified` | `remark-footnotes@4.0.1` | **Do not** use `5.0.0` until npm ships a real entry file; or replace plugin |
| `dendron-plugin-views` | Root `resolutions`: `ansi-regex@5`, `loader-utils@2` | Drop CRA `react-dev-utils` post-build path or replace with webpack-5-native reporting |
| `dendron-plugin-views` | Custom `@babel/preset-*` instead of `babel-preset-react-app` | Finish babel 7.29 alignment or move bundler (Vite/rspack) |
| `package.json` `resolutions` | `@babel/helper-compilation-targets@7.22.15` | Remove after babel-preset / bundler migration |
| `bootstrap/scripts` | `execaCommandSync` + `stdio: inherit` | Already on execa 9 — keep pattern for other scripts |

**Acceptance criteria**

- [ ] `yarn bootstrap:init` exits 0 on a clean clone after `yarn` (no manual steps).
- [ ] `bootstrap/scripts/pinTrueLatest.js` (or successor) does not fight documented resolutions.
- [ ] Table above: each row either **Done** or still listed with a one-line reason.
- [ ] [ai/references/context.md](../../ai/references/context.md) and build codetour updated when pins are removed.

**Suggested work order**

1. `yargs` 18 + ESM CLI (unblocks other CLI deps).
2. Remove `ansi-regex` / `loader-utils` resolutions (plugin-views CRA cleanup).
3. `common-assets` antd 6 theme pipeline.
4. Audit `resolutions` block; delete stale CVE duplicates and conflicting pins.

**Codetour:** [.tours/advanced/02-dependencies-latest-backlog.tour](../../.tours/advanced/02-dependencies-latest-backlog.tour)

---

### BL-002 — ESLint 10 + flat config for pre-commit (P2)

**Status:** Backlog  
**Goal:** Restore `husky` pre-commit without `--no-verify`.

Pre-commit currently fails when ESLint 10 expects `eslint.config.js`. Add flat config or pin ESLint 9 until migrated.

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
| — | — | — |