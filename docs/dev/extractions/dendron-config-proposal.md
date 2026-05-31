# Extraction Proposal: Dendron Config Management (`common-config` or injectable ConfigService)

**Wave**: 2 (Dependency-Hunter) — Cross-layer duplication + strong synergy with DI modernization.

**Status**: DRAFT → **ARCHITECT REVIEWED + REFINED (2026-05-31)**: IConfigService interfaces + DI token registration first (strong synergy); pkg decision deferred (boundary risk). See ADR 0001 appendix + Wave 2 Framework in monorepo-architect/SKILL.md. Priority #3.

## Problem Statement
dendron.yml loading, defaults, overrides, legacy migration, and accessors are split between common-all (ConfigUtils) and common-server (DConfig + FS side effects) with globals and pod duplication. 200+ references.

## Duplication Metrics
- 200+ mentions.
- Core: `common-server/src/DConfig.ts` (340 LOC), `common-all/src/utils/index.ts` (ConfigUtils portion ~350-450 LOC), pods genConfig (~150 LOC).

## Consumers
Activation, every engine start, doctor, seed, migrations, previews, lookups, pods, CLI, tests (heavy).

## Impact
Single source of truth + injectable ConfigService (synergizes with DI container proposal). Reduces globals and split ownership.

## Next Steps
Post-green. Make ConfigService a DI token (ties to di-container proposal). Centralize.

**Created by**: Dependency-Hunter (Wave 2).
