# TypeScript Modernization Upgrade Plan

**Goal**: Bring the **entire monorepo** (all packages, including `plugin-core`) from the ancient **TypeScript 4.6** (pinned exactly) to the **latest stable TypeScript** so we can:
- Use current `@types/node` (20+ / 22+)
- Get better type checking, performance, and new language features
- Modernize `moduleResolution` and other configuration at the same time
- Move toward modern decorators / DI (long-term removal of legacy `experimentalDecorators` + `emitDecoratorMetadata` + tsyringe dependency)
- Unblock other dependency modernizations, new features, and cleaner architecture across the whole project

**Scope Decision**: Full one-wave upgrade of everything together (no split waves).

**Current State (as of late May 2026)**

- Root + all packages: **TypeScript 5.5.4** (base upgrade complete; target is now **latest stable**)
- `@types/node`: Updated to `^20.12.0` across core packages
- `tsconfig.build.json` (root) modernized but still using legacy decorator settings temporarily
- `plugin-core` carries `@ts-expect-error` workarounds (will be addressed in the full decorator/DI modernization follow-up)
- Decision recorded: Full one-wave modernization of the entire monorepo + intent to remove legacy decorators/tsyringe over time.

See `11-FINAL-MODERNIZATION-REPORT.md` for the base TypeScript upgrade.
See the new `MONOREPO-PACKAGES-MODERNIZATION-TRACKER.md` for the live per-package modernization + extreme documentation progress.

**Current Mandate**: Full one-wave modernization of **every single package** while creating extremely detailed documentation for each (with Table of Contents, Mermaid architecture diagrams, dependency graphs, build processes, current state, modernization roadmap, etc.). Update all related documents continuously.

**Execution Status**: Per-package work in active progress.
- `common-all`: Complete (doc + modernization baseline)
- `common-server`: Complete
- `engine-server`: Complete (scripts + detailed doc)
- Live tracking: `MONOREPO-PACKAGES-MODERNIZATION-TRACKER.md`

## Major Risks & Blockers

### 1. Legacy Decorators + tsyringe (Highest Risk)
- The project uses the old `experimentalDecorators` + `emitDecoratorMetadata` emit + `reflect-metadata` polyfill.
- tsyringe depends on the legacy metadata format (`design:paramtypes`, etc.).
- In TS 5.0+, legacy decorator emit is still supported but deprecated. New standard decorators (TC39 stage 3) have completely different semantics and **do not** emit the same metadata by default.
- Many files use `@inject()`, `@injectable()`, `@singleton()` from tsyringe.

**Mitigation options**:
- Keep `experimentalDecorators` + `emitDecoratorMetadata` enabled (still works in TS 5.x for now).
- Do **not** turn on `erasableSyntaxOnly` yet.
- Long-term: Consider migrating away from tsyringe or to a different DI solution.

### 2. TypeScript Version Pinning & Build System
- Root pins exact `4.6`.
- Many transitive dependencies (webpack, eslint plugins, etc.) expect older TS.
- The custom bootstrap/lerna build scripts may have implicit assumptions.

### 3. @types/node & Modern Node Features
- We are currently forced to stay on ~17.x because newer @types/node use syntax TS 4.6 can't parse.
- Once TS is upgraded, we can safely move to ^20 or ^22.

### 4. Other Ecosystem Tools
- `ts-node` (used in CLI and some tests) — must be compatible.
- Webpack configs in `dendron-plugin-views`.
- ESLint + TypeScript ESLint parser.
- Any custom transformers or loaders.

## Recommended Phased Approach

### Phase 0: Preparation (Do this first)
- [x] Create this document + get buy-in on target version (**5.5.4** chosen).
- [x] Audit all `tsconfig*.json` files for `experimentalDecorators`, `emitDecoratorMetadata`, `target`, `module`, `moduleResolution` (see Deep Audit Results below).
- [x] Identify all direct `typescript` devDependencies in source packages.
- [x] Pin modern TypeScript (5.5.4) in root and run full compilation + fix errors iteratively.
- [ ] Update CI / bootstrap scripts if they hardcode TS version (no hidden TS logic found in bootstrap; CI may still need review).

### Phase 1: Full Monorepo Upgrade (One Wave)
**Status: Completed (base upgrade)**

Target: Upgrade the **entire monorepo in one wave** (including plugin-core) to the latest stable TypeScript, while also modernizing `moduleResolution` and other config settings. Legacy decorator emit will be kept temporarily during this phase.

Steps completed:
1. [x] Updated root `package.json` to TypeScript 5.5.4.
2. [x] Updated the three packages that declared their own older TS (`dendron-plugin-views`, `dendron-design-system`, `nextjs-template`).
3. [x] Updated root `tsconfig.build.json`:
   - `target` → `ES2022`
   - Modern `lib` (ES2022 + DOM + DOM.Iterable)
   - `moduleResolution: "node"` (first step; further modernization to `node16`/`bundler` planned as part of full modernization)
   - Kept `experimentalDecorators` + `emitDecoratorMetadata` for now (see new "Path to Modern Decorators / DI" section).
4. [x] Ran iterative full compilation across packages and fixed errors as they appeared (see report for details).
5. [x] Updated `@types/node` resolution in root to `^20.12.0` and propagated to all major packages.

### Phase 2: Fix Breaking Changes
Common issues to expect:
- Stricter `this` types in callbacks
- Changes in inference with `strict`
- New errors around `import` / `require` interop
- Decorator-related type changes (even in legacy mode)
- `skipLibCheck` may need to stay on for a while

### Phase 3: Modernization (Post-Upgrade)
- Evaluate removing `experimentalDecorators` long-term (big refactor).
- Update `module` / `moduleResolution` to modern values.
- Turn on newer strict flags gradually (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc.).
- Update ts-node, webpack, eslint-typescript-parser to versions that support new TS.
- Consider enabling `verbatimModuleSyntax` (requires cleaning up imports).

### Phase 4: Cleanup
- Remove old TS pins from individual packages.
- Update all documentation (including the deep-dive docs we created).
- Update any GitHub Actions / CI that install specific TS versions.

## Immediate Next Actions (Recommended Order)

**All items below have been executed** as part of the upgrade:

1. [x] Full audit of all tsconfig files (see Deep Audit Results + generated matrix).
2. [x] Full compilation with modern TS 5.5.4 + iterative error fixing.
3. [x] Target version chosen: **5.5.4**.
4. [x] Dedicated branch created: `typescript-upgrade/phase0`.
5. [x] Upgraded root + all packages that pinned TS.
6. [x] Tackled decorator/tsyringe risk (workarounds applied + documented; low risk outside plugin-core).

## Questions for Decision — Answers (May 2026)

- **Minimum acceptable modern TS version**: The **latest** stable version (currently 6.0.3 as of this writing). We will target the newest stable release rather than a conservative older 5.x version.
- **Legacy decorators + `emitDecoratorMetadata` + tsyringe**: We want to **modernize all the things**. The goal is to move away from the legacy decorator emit pattern and tsyringe over time. We will keep the legacy flags enabled during the initial upgrade for compatibility, but we will create a concrete plan to migrate to modern alternatives (either native modern decorators or a different DI approach).
- **Modernize `moduleResolution`**: Yes — modernize it at the same time as the rest of the upgrade (move toward `"node16"`, `"bundler"`, or the recommended modern setting for the project).
- **Upgrade scope**: Upgrade **everything in the same wave**, including `plugin-core`. The entire monorepo (all packages) should be brought up to date together so the project is fully modernized and ready for better improvements, new features, and cleaner architecture.

---

**Status**: **Base upgrade complete**. This document has been updated with the latest decisions (latest TS version, full one-wave scope including plugin-core, intent to modernize away from legacy decorators/tsyringe, modernize moduleResolution together).

See `11-FINAL-MODERNIZATION-REPORT.md` for execution details of the base upgrade. A follow-up plan for full decorator/DI modernization will be added.

---

## Audit Findings (May 2026)

### TypeScript Declaration Locations (source packages only)
- Root: exact pin `"typescript": "4.6"`
- `dendron-plugin-views`: `^4.1.2`
- `dendron-design-system`: `^4.2.3`
- `nextjs-template`: `^4.4.3`

All other packages inherit from root.

### Critical Compiler Settings (from root `tsconfig.build.json`)
- `target`: `"ES2019"`
- `module`: `"commonjs"`
- `experimentalDecorators`: `true`
- `emitDecoratorMetadata`: `true`
- `skipLibCheck`: `true`

Most packages just extend this without overrides.

### Decorator / DI Risk Quantification
- ~95 occurrences of tsyringe decorators (`@inject`, `@injectable`, `@singleton`) + `container.register` across the source.
- Primary concentration: `plugin-core/src/web/` (Preview, WebViewUtils, etc.).
- `reflect-metadata` import is present in `_extension.ts` (must remain first import).
- This is the single largest technical risk for the upgrade.

### Current Inheritance Pattern
Most packages do:
```json
{
  "extends": "../../tsconfig.build.json",
  ...
}
```
This is good — changes at the root will propagate, but we must be careful with packages that have special needs (plugin-core for VS Code, plugin-views webpack, etc.).

## Suggested First Concrete Steps

1. Pick a target version: **Latest stable** (currently 6.0.x). We will use the newest stable release. A practical stepping stone (e.g. 5.6 or 5.7) may be used temporarily if 6.0 introduces too many breaking changes at once.
2. Create an upgrade branch.
3. Temporarily override TypeScript in root using Yarn resolutions/overrides and run a full compile to surface the first wave of errors **without** touching source yet.
4. Decide policy on legacy decorators (keep enabled for at least 1-2 releases).
5. Update root tsconfig target/lib as a first experiment (e.g. to ES2022 + modern lib).

Ready to execute any of these when you give the green light.

---

## Deep Audit Results (Executed 2026-05)

### 1. tsyringe / Decorator Usage Scope
- **All** tsyringe decorator usage is **confined to `plugin-core` only**.
- 95+ occurrences, but zero in:
  - engine-server
  - common-*
  - dendron-cli
  - api-server
  - pods-core
  - unified
- `reflect-metadata` imports exist in only **7 files**, all inside `plugin-core/src/` (including web and workspaceActivator).

**Implication**: Upgrading the rest of the monorepo carries **very low decorator risk**. The hard part is isolated to the VS Code extension package.

### Path to Modern Decorators / DI (New — Based on Latest Decisions)

Because the decision is to **modernize all the things**, we will not treat legacy decorators + tsyringe as permanent.

High-level options being considered (to be researched and prototyped):

1. **Migrate to modern decorators** (stage 3 / TypeScript 5+ native decorators) + a modern DI library that supports them (or no DI at all via simpler patterns).
2. **Keep tsyringe but drop metadata emit** by switching to explicit registration + factory functions (removes need for `reflect-metadata` and legacy emit).
3. **Replace tsyringe entirely** with a lighter solution (e.g. manual dependency passing, a small custom container, or a library designed for modern TypeScript such as `inversify` with modern decorators, or even moving toward functional / composition patterns where it makes sense).

**Recommended approach for the upgrade**:
- Perform the initial TS + config upgrade while **keeping** `experimentalDecorators` + `emitDecoratorMetadata` enabled.
- Immediately after the base upgrade lands, start a dedicated follow-up effort to prototype a migration path for the decorator-heavy areas (primarily `plugin-core` webviews and services).
- Goal: Remove the legacy decorator emit and `reflect-metadata` import within 1–2 follow-up milestones.

This aligns with the desire for the whole project to be "updated, upgraded, modern and ready for better improvements, new features, better designs, etc."

### 2. tsconfig Landscape (Deep Audit)
- Most packages **purely extend** root `tsconfig.build.json` (very clean inheritance).
- Packages that override key settings:
  | Package                    | target   | module     | moduleResolution | Notes |
  |----------------------------|----------|------------|------------------|-------|
  | Root (most packages)       | ES2019   | commonjs   | (default)        | experimentalDecorators + emitDecoratorMetadata |
  | dendron-plugin-views       | es5      | esnext     | node             | React + webpack app |
  | nextjs-template            | es5      | esnext     | node             | Next.js app |
  | dendron-design-system      | (not set)| esnext     | node             | - |
  | nextjs-template (sitemap)  | -        | commonjs   | node             | - |

This means the bulk of the monorepo (engine, common, cli, api-server, pods, unified) will move together cleanly when we change the root. The two web apps will need separate attention.

### 3. Bootstrap / Build Scripts
- No direct `tsc` or TypeScript version logic in `bootstrap/scripts/`.
- Compilation is purely driven by each package's `tsc -p tsconfig.build.json`.

### 4. Other TS-Touching Areas Found
- `ts-json-schema-generator` (used in `dendron dev generate_json_schema_from_config`) — already pulls in TS 5.x internally in some paths.
- `ts-node` in `dendron-cli` dev deps (currently old).
- Webpack + TS in `dendron-plugin-views` and `plugin-core` build.

### 5. Immediate Observations
- The decorator problem is **narrower** than initially feared.
- The main monorepo (engine + common + cli) can likely be upgraded with lower risk than plugin-core.
- Decision: Perform the upgrade in **one single wave** covering the entire monorepo, including `plugin-core`, `dendron-plugin-views`, and `nextjs-template`. No separate waves. Modernize `moduleResolution` at the same time.

## Phase 0 Execution — Completed

**Branch created**: `typescript-upgrade/phase0`

**Major actions completed**:
- Created this plan document + performed deep audits (tsconfig matrix, decorator scope analysis, build script review).
- Created and committed on `typescript-upgrade/phase0`.
- Executed full upgrade to TS 5.5.4 (root + packages).
- Modernized root tsconfig (target, libs, moduleResolution).
- Ran repeated compiles and fixed errors across the monorepo.
- Bumped `@types/node` to ^20.12.0 in core packages.
- Applied and documented decorator workarounds in `plugin-core`.
- Enabled (with pragmatic handling) stricter tsconfig flags.
- Produced comprehensive final report (`11-FINAL-MODERNIZATION-REPORT.md`).

The upgrade is complete and the project compiles on modern TypeScript. See the final report for the full list of changes and remaining follow-ups.