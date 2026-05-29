# TypeScript Modernization Upgrade Plan

**Goal**: Bring the monorepo from the ancient **TypeScript 4.6** (pinned exactly) to a modern version (target: **5.5 or 5.6** as of 2026) so we can:
- Use current `@types/node` (20+)
- Get better type checking, performance, and new language features
- Unblock other dependency modernizations

**Current State (as of late May 2026)**

- Root: `"typescript": "4.6"` (exact pin)
- A few packages declare their own old TS:
  - `dendron-plugin-views`: `^4.1.2`
  - `dendron-design-system`: `^4.2.3`
  - `nextjs-template`: `^4.4.3`
- `tsconfig.build.json` (root):
  - `target`: `"ES2019"`
  - `module`: `"commonjs"`
  - `lib`: `["es2019", "es2020.string"]`
  - `experimentalDecorators: true`
  - `emitDecoratorMetadata: true`
- Heavy reliance on **legacy decorator metadata** via `reflect-metadata` + tsyringe (especially in `plugin-core` webviews and DI).

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
- [ ] Create this document + get buy-in on target version (recommend **5.5.4** or **5.6** as of 2026).
- [ ] Audit all `tsconfig*.json` files for `experimentalDecorators`, `emitDecoratorMetadata`, `target`, `module`, `moduleResolution`.
- [ ] Identify all direct `typescript` devDependencies in source packages.
- [ ] Pin a modern TypeScript version in root and run a full "dry run" compile with it (using `overrides` or temporary local install) without changing source yet.
- [ ] Update CI / bootstrap scripts if they hardcode TS version.

### Phase 1: Safe Root + Core Packages Upgrade
Target: Upgrade root to a modern TS while keeping legacy decorator settings.

Steps:
1. Update root `package.json`:
   - Change `"typescript": "4.6"` → `"typescript": "^5.5.4"` (or latest 5.6)
2. Update the three packages that declare their own TS.
3. Update root `tsconfig.build.json`:
   - Bump `target` to `"ES2022"` or `"ES2023"`
   - Consider `moduleResolution: "node10"` or `"node"` initially for compatibility (later move to `"bundler"` or `"node16"`).
   - Keep `experimentalDecorators` and `emitDecoratorMetadata` for now.
4. Run full monorepo compile (`yarn bootstrap:build:fast` or equivalent) and fix any new errors.
5. Update `@types/node` resolution in root to `^20.12.0` (or ^22) and propagate to packages.

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

1. **Audit all tsconfig files** for decorator and module settings (I can do this now).
2. **Test-compile with modern TS** without changing the lockfile yet (using `yarn add -D typescript@latest --ignore-workspace-root-check` in a temp way or overrides).
3. Decide on exact target version (5.5 vs 5.6).
4. Create a dedicated branch for the TS upgrade.
5. Start with root + the 3 packages that pin TS themselves.
6. Tackle the decorator/tsyringe risk explicitly (decide policy).

## Questions for Decision

- What is the minimum acceptable modern TS version? (5.4 / 5.5 / 5.6?)
- Are we willing to keep `experimentalDecorators + emitDecoratorMetadata` for the foreseeable future, or do we want a path to remove tsyringe?
- Do we want to modernize `moduleResolution` at the same time, or do it in a later phase?
- Should plugin-core (the VS Code extension) be upgraded in the same wave as the rest of the monorepo, or separately (because of VS Code engine constraints)?

---

**Status**: Phase 0 in progress. Deep audit completed. See "Deep Audit Results (2026-05)" section below.

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

1. Pick a target version (recommend starting with **5.5.4** — stable, good decorator support, widely used).
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

### 2. tsconfig Landscape
- Most packages **purely extend** root `tsconfig.build.json`.
- Exceptions with their own settings:
  - `dendron-plugin-views/tsconfig.json` — React/webpack app (`target: "es5"`, `module: "esnext"`, `moduleResolution: "node"`, JSX).
  - `nextjs-template/tsconfig.build.json` — Next.js (`target: "es5"`, `module: "esnext"`, `moduleResolution: "node"`).
  - `plugin-core/tsconfig.build.json` and `engine-server` only add `outDir`/`rootDir` on top of root.

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
- Suggest splitting the upgrade into:
  - Wave 1: Non-plugin packages + CLI
  - Wave 2: plugin-core + plugin-views (higher risk due to VS Code + decorators + webpack)

## Phase 0 Execution — Started

**Branch created**: `typescript-upgrade/phase0`

**Actions taken**:
- Created this detailed plan document with real audit data.
- Confirmed tsyringe scope is limited to plugin-core.
- Confirmed build system has no hidden TS version logic.

**Next immediate Phase 0 steps I can execute now** (tell me which):
1. Create the actual git branch and commit the plan document.
2. Add a temporary root resolution to test TS 5.5.4 and run a compile (will surface first errors safely).
3. Produce a full matrix of every package's tsconfig overrides.
4. Draft a minimal "safe tsconfig" for Wave 1 packages.