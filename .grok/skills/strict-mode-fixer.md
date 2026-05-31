# Strict Mode Fixer (Autonomous Batch)

## Description
Batch-reduce TypeScript strict errors package-by-package with verification and documentation updates.

## Workflow
1. Run verification command
2. Parse errors by file/type
3. Fix in logical batches (never >15-20 at once)
4. Re-verify with critical command
5. Update MONOREPO-PACKAGES-MODERNIZATION-TRACKER.md + package doc with Mermaid error-flow diagram
6. If pattern repeats → propose new skill or root tsconfig improvement

## Lessons Learned (Autonomous Sprint 2026-05-31)
- Enabling `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` in a **shared leaf package** (common-all) changes **exported function return types** (e.g. `DNodeUtils.domainName`, `basename` now infer `string | undefined` from `[0]` / destructuring).
- Consumers (plugin-core, even internal) break on import even if they locally disable the flags (types flow from .d.ts / source).
- **Pattern**: For pure utils that are semantically total, add explicit `: string` return type + non-null `!` (or `?? fallback`) on index accesses. Audit all call sites with `grep` before/after.
- Also surfaced: Zod schemaForType + exactOptional requires `?: T | undefined` on matching TS interfaces for optionals.
- Error cascade from error.ts alignment was the largest initial batch (exactOptional on IDendronError impls).
- Always re-run full `yarn bootstrap:build:common-all && yarn workspace @dendronhq/plugin-core compile` after shared type changes.
