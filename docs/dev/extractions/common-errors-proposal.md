# Extraction Proposal: Common Errors (`common-errors` or enhanced `common-all/error`)

**Wave**: 2 (Dependency-Hunter) — Highest-volume candidate for shared extraction priority #3 + reduces future strict/@ts friction.

**Status**: DRAFT → **ARCHITECT REVIEWED + REFINED (2026-05-31)**: Enhance-in-place inside common-all (no new common-errors pkg). Introduce ErrorService for DI. See ADR 0001 appendix + Wave 2 Framework in monorepo-architect/SKILL.md. Priority #2 post-DI-burn.

## Problem Statement
Error creation/handling is the #1 duplicated pattern. 552+ `DendronError`/`IDendronError` references + factories + raw `new Error` + ErrorFactory across 113+ files create inconsistency, maintenance burden, and future type friction.

## Duplication Metrics
- **DendronError mentions**: 552 total (plugin-core 236 in 71 files, common-all 143 in 20 files, engine-server 173 in 22 files).
- **ErrorFactory usages**: 89.
- **Raw `new Error(`**: ~74 (mostly plugin-core).
- **Core**: `common-all/src/error.ts` (417 LOC: DendronError + ErrorFactory + helpers + DendronCompositeError); `errorTypes.ts` (64 LOC).

## Key Consumers
Virtually every layer: all commands, engines, stores, drivers, CLI, pods, telemetry, UI, tests.

## Current vs Target
Before: Scattered constructors + factories in every package.
After: Centralized `common-errors` (or `common-all/error` v2) + injectable ErrorService + richer typed factories. Dramatic reduction in boilerplate + consistent error shapes for logging/telemetry/UI.

## Impact
Hundreds of sites simplified. Enables better DI (ErrorService as token). Directly supports strict hardening and @ts cleanup.

## Next Steps
Prioritize after strict green. Coordinate with DI proposal (make ErrorService injectable). Update all trackers.

**Created by**: Dependency-Hunter (Wave 2). Highest ROI extraction.
