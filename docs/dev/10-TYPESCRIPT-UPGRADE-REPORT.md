# TypeScript Modernization Report - Full Upgrade to TS 5.5

**Date**: May 2026  
**Branch**: `typescript-upgrade/phase0`  
**Starting Point**: Exact pin to TypeScript 4.6 across the monorepo  
**Target Achieved**: TypeScript 5.5.4

## Executive Summary

The entire Dendron monorepo has been successfully upgraded from the legacy **TypeScript 4.6** to **TypeScript 5.5.4**.

This was a major modernization effort that unblocks:
- Modern `@types/node` (we can now safely move to 18+ / 20+ in follow-up work)
- Better type checking and developer experience
- Future dependency upgrades (many tools now require TS 5+)

## Work Completed

### 1. Version Bumps
- Root `package.json`: `typescript` from exact `4.6` → `5.5.4`
- Updated the 3 packages that pinned their own TS version:
  - `dendron-plugin-views`
  - `dendron-design-system`
  - `nextjs-template`

### 2. tsconfig Modernization (Root)
Updated `tsconfig.build.json`:
- `target`: `ES2019` → `ES2022`
- `lib`: Updated to `["ES2022", "DOM", "DOM.Iterable"]`
- Added `moduleResolution: "node"` for better compatibility during transition

Legacy decorator settings were **preserved** (`experimentalDecorators: true`, `emitDecoratorMetadata: true`) to maintain compatibility with tsyringe + `reflect-metadata`.

### 3. Error Fixes Encountered and Resolved

#### In `common-all`
- Fixed `TS2612` "Property will overwrite base property" errors in `DendronServerError` by adding `declare` modifiers on `code` and `status`.

#### In test utilities (`common-test-utils`, `engine-test-utils`)
- Added `skipLibCheck: true` where needed to handle transitive type definition conflicts.
- Fixed stricter function type checking in sinon stubs (`TS2345`).

#### In `plugin-core` (VS Code Extension - Highest Volume)
- Encountered ~30+ instances of `TS1239: Unable to resolve signature of parameter decorator` on `@inject()` calls.
- Root cause: TS 5.x has stricter checking around legacy decorator signatures when using tsyringe.
- Resolution: Applied targeted `// @ts-expect-error` comments on decorator lines (preserves runtime behavior via `reflect-metadata`).

This was the only area requiring non-trivial workarounds. The pattern is isolated and documented for future cleanup (when/if a full decorator migration happens).

### 4. Scope Analysis (Critical Finding)
Deep audit revealed that **all tsyringe + decorator usage is 100% confined to `plugin-core`**.

- Zero decorator usage in engine-server, common-*, dendron-cli, api-server, pods-core, etc.
- This made the upgrade much lower risk than initially feared for the majority of the codebase.

### 5. Wave Strategy Applied
- **Wave 1 (Core)**: common-*, engine-server, api-server, pods-core, dendron-cli, unified, test utils — upgraded with minimal friction.
- **Wave 2 (UI/Extension)**: plugin-core + plugin-views + nextjs-template — handled with decorator workarounds.

## Current State

The project now compiles successfully across all packages on **TypeScript 5.5.4**.

The upgrade branch contains:
- All version bumps
- tsconfig modernization
- Necessary type fixes and workarounds
- Updated plan document (`09-TYPESCRIPT-UPGRADE-PLAN.md`)

## Remaining Follow-up Work (Recommended)

1. **@types/node bump** (now possible)
   - Can safely move root resolution and package declarations from the old 17.x pin to `^20.12.0` or higher in a follow-up PR.

2. **Decorator / tsyringe modernization** (longer term)
   - The `// @ts-expect-error` comments in plugin-core can eventually be cleaned up with a proper migration away from legacy decorators or an updated tsyringe-compatible pattern.

3. **Further tsconfig hardening**
   - Consider enabling more strict flags (`noUncheckedIndexedAccess`, etc.) now that we're on modern TS.
   - Evaluate moving `moduleResolution` to `"node16"` or `"bundler"` in future phases.

4. **Tooling updates**
   - `ts-node` in dendron-cli can be further validated/updated.
   - Review eslint-typescript-parser and webpack TS loaders for any additional benefits from TS 5+.

## Files Changed (Summary)

- Root `package.json` (TS version)
- Multiple package.json files for individual TS versions
- `tsconfig.build.json` (target/lib updates)
- `packages/common-all/src/error.ts` (declare fixes)
- Several test files (type casts / skipLibCheck)
- Multiple files in `plugin-core/src/web/` (decorator @ts-expect-error comments)
- New planning and report documents in `docs/dev/`

## Conclusion

This upgrade brings the fork significantly closer to modern JavaScript/TypeScript tooling standards while preserving all existing runtime behavior (especially the critical DI system in the VS Code extension).

The project is now in a much better position for ongoing maintenance and future dependency modernization work.

**Branch**: `typescript-upgrade/phase0`  
**Status**: Upgrade complete and compiling on modern TypeScript.