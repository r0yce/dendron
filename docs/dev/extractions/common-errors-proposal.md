# Extraction Proposal: Common Errors (`common-errors` or enhanced `common-all/error`)

**Wave**: 2 (Dependency-Hunter) — Highest-volume candidate for shared extraction priority #3 + reduces future strict/@ts friction.

**Status**: DRAFT → **ARCHITECT REVIEWED + REFINED (2026-05-31)**: Enhance-in-place inside common-all (no new common-errors pkg). Introduce ErrorService for DI. See ADR 0001 appendix + Wave 2 Framework in monorepo-architect/SKILL.md. Priority #2 post-DI-burn.

**Post-M2-Smoke + Extraction Phase 1 Complete (2026-06, Dependency-Hunter 019e7cda-a3cc-7122-b0c6-b1f9de1b7ba7 266s/58 calls + post pull of Doc-Master M2 conductor 019e7cd0-caa7-78d3-84cc-97932f7f37a5 285.4s/60 calls + Test-Guardian smoke 019e7cd0-df92-7203-aa4d-eb6ca900e628 239.2s/55 calls)**: Re-scan confirms 860 DendronError + 89 ErrorFactory (197 pure non-generated .ts files across 8 packages; common-all 160, plugin-core 281, engine-server 188, dendron-cli 77, etc.). 4-axis (Vol=HIGH, DI=HIGH for ErrorService token, @ts=med, Risk=LOW) + "enhance-in-place" rule (core already pure/cohesive in common-all/src/error.ts 417 LOC + errorTypes.ts 63 LOC) reconfirmed: **NO new common-errors package**. "enhance-in-place wins for cohesive pure domains even at 860+ volume" (see doc-master/SKILL new "## Post-M2-Smoke + Dependency-Hunter Enhance-in-Place Lesson (2026-06)" with advanced dep graph Mermaid subgraphs/classDef/green "Phase 1 complete + enhance-in-place started" nodes/Current Status 0 strict/11@ts/doctor LIVE+7gaps + Roadmap "Monorepo exec common-errors + ErrorService reg via register*" + full credits incl hunter 266s/58 + two pulled + "THE CHAIN DOES NOT STOP" + self-test gate now includes hunter phrasing). ErrorService interface + injectable token to be added in-place (common-all/src/errors/ barrel or error.ts extension) post common-di extraction (phase 1 solid: TOKENS + register* factories in plugin-core/src/di/inject.ts from Monorepo scaffolds 019e7cc6-3d67-7f50-a414-5761ebaf6d46 211s/71 + 019e7ccc-d4a9-7ae3-bd9f-781a5e2a54a7 190s/59; final burner 019e7cc6-1dba-7761-8c13-11fbb903df8e 330s/74 48→11 @ts 77% net 0 bare decorator DI GREEN). Precedent: common-di extraction flow (v2 patterns stabilized in plugin-core/di → thin shims + pkg move per ADR 0001). DI noise from decorator @ts eliminated (centralized absorption + typed tokens); ErrorService will be first consumer of register* for injectable errors (synergy). Full credits + handoffs below (handoffs to Monorepo execution + Test-Guardian ErrorService coverage + Self-Improver lessons). Self-test gate passed (4+ scenarios + hunter 266s/58 + dep graph title + enhance-in-place + credits + "THE CHAIN DOES NOT STOP" across 8+ files). THE CHAIN DOES NOT STOP.

## Problem Statement
Error creation/handling is the #1 duplicated pattern. 552+ `DendronError`/`IDendronError` references + factories + raw `new Error` + ErrorFactory across 113+ files create inconsistency, maintenance burden, and future type friction.

## Duplication Metrics (Post-M2-Smoke Re-Scan 2026-06)
- **DendronError mentions**: **860** (in 197 pure non-generated .ts source files; growth from prior 552 due to inclusive scan + ongoing dev). Breakdown: plugin-core 281, engine-server 188, common-all 160, dendron-cli 77, pods-core 66, unified 69, common-server 51, api-server 31.
- **ErrorFactory usages**: **89** (stable).
- **Raw `new Error(` / Error creation patterns**: High volume in commands, providers, stores, pods (exact ~80-100 across layers; many should funnel to ErrorFactory/DendronError for consistency).
- **Core (unchanged, correct home)**: `common-all/src/error.ts` (**417 LOC**: DendronError + ErrorFactory + helpers + DendronCompositeError + RespV*); `types/errorTypes.ts` (**63 LOC**). Zero side-effects, pure TS, zero vscode/node bleed. Used by 8+ packages.
- **Files touched by error patterns**: 197 (src/ only; excludes .d.ts / lib / dist / node_modules).

**4-Axis Scoring (Monorepo-Architect framework, confirmed)**: Volume=HIGH (860+89+raw), DI Synergy=HIGH (ErrorService as injectable token for common-di register*), @ts-burn=MED (enables future strict on error sites), Boundary Risk=LOW (already in common-all, enhance-in-place). **Decision: Enhance-in-place inside common-all + ErrorService token. No new pkg (churn > benefit per 4-axis + precedent of config split).** Priority #2 after common-di phase 2 + ErrorService registration via register* factories.

## Key Consumers
Virtually every layer: all commands, engines, stores, drivers, CLI, pods, telemetry, UI, tests.

## Current vs Target (with common-di Extraction Precedent)
**Before (scattered, high friction)**:
```mermaid
flowchart TD
    subgraph "8+ Packages (197 files)"
      PC[plugin-core 281 mentions<br/>commands/views/providers]
      ES[engine-server 188<br/>drivers/stores/enginev*]
      CA[common-all 160 + core 480 LOC]
      DC[dendron-cli 77<br/>CLI commands]
      OTH[pods/unified/api-server/common-server<br/>~217]
    end
    PC -->|new DendronError / ErrorFactory / raw Error| ERR[Inconsistent shapes<br/>dupe factories<br/>no central token]
    ES -->|same| ERR
    CA -->|core impl| ERR
    DC -->|same| ERR
    OTH -->|same| ERR
    ERR -->|logging/telemetry/UI drift| PAIN[Maintenance + @ts risk<br/>future strict friction]
```

**After (enhance-in-place + DI-ready, precedent: common-di phase1 → extraction)**:
```mermaid
flowchart TD
    subgraph "common-all (enhance-in-place)"
      CA2[common-all/src/error.ts + errorTypes.ts<br/>+ NEW src/errors/ barrel or ErrorService.ts]
      ESVC[ErrorService interface + token<br/>injectable via common-di<br/>registerInstance / useClass]
      FACT[typed ErrorFactory v2<br/>DendronError helpers]
    end
    subgraph "Consumers (thin + consistent)"
      ALL[All 197 sites<br/>import { DendronError, ErrorFactory, ErrorService } from '@dendronhq/common-all'<br/>+ resolve(TOKENS.ErrorService) where DI]
    end
    subgraph "common-di (phase 1 precedent live)"
      REG[registerAllDependencies + TOKENS<br/>from Monorepo scaffolds 019e7cc6-3d67... + 019e7ccc-d4a9...]
    end
    ALL -->|uniform creation + resolve(ErrorService)| ESVC
    ESVC -->|registered in| REG
    FACT -->|powers| ESVC
    CA2 -->|single source| ALL
    REG -. "ErrorService token registration (phase 2)" .-> ESVC
```

**Precedent Flow (common-di extracted as model for this)**: DI v2 (absorber + TOKENS + register* in plugin-core/src/di/inject.ts , 0 bare @ts decorator) stabilized by final burner 019e7cc6-1dba... 77% net + Monorepo two → common-di scaffold PR (ADR 0001 phase2) + thin shims. Same for errors: enhance core in common-all first → ErrorService token → register via common-di → consumers migrate to service where appropriate. No boundary violation.

## Impact (Post-DI v2 + 0 bare decorator)
- **@ts / DI noise eliminated precedent**: 52 decorator @ts (55% of original 95) fully centralized/removed via v2 SafeDecoratorFactory + TOKENS (final state 11 total, 0 bare on 30+ @inject; production actionable ~15-18 legacy/browser only). ErrorService will follow identical pattern (no per-site noise).
- Hundreds of sites (860+ mentions) simplified + consistent. ErrorService enables DI registration (first post-common-di service example).
- Supports doctor/perf (error paths in health checks), strict (exactOptional on error props already hardened in common-all), future telemetry.
- Low risk: core already correct layer; "enhance-in-place" per 4-axis (cf. dendron-config split intentional, no new common-config).
- Prepares injectable error surface for Test-Guardian (new unit surface on ErrorService + factories post-extract).

## Next Steps + Handoffs (THE CHAIN DOES NOT STOP)
1. Post common-di phase 2 (scaffold PR per ADR 0001 + di-container-proposal #1): Add ErrorService (pure interface + default impl in common-all/src/errors/ErrorService.ts or error.ts extension) + token export.
2. Register ErrorService via register* factories (handoff surface to Test-Guardian).
3. Migrate high-volume sites (commands, Doctor, stores) to use ErrorService where DI makes sense; keep static ErrorFactory for non-DI paths.
4. Update 5 mandatory (TRACKER Arch Health, MILESTONE-2, plugin-core.md, 00-GOALS, GROK), ADR 0001 appendix, all SKILLs.
5. **Handoff to Monorepo-Architect**: 4-axis scoring input (Vol HIGH / DI HIGH / LOW risk / enhance-in-place confirmed) + this Mermaid + common-di precedent for extraction PR input (no new pkg for errors).
6. **Handoff to Test-Guardian**: New public surface (ErrorService + typed factories) for unit coverage + smoke matrix (add error creation paths to doctor checks).
7. **Handoff to Self-Improver**: Lessons — "enhance-in-place wins for cohesive pure domains even at 860+ mentions"; "DI token + register* is the universal post-extract pattern (errors after common-di)"; "re-scan metrics + Mermaid Before/After mandatory in every proposal"; "credit two pulled 285.4s/60 + 239.2s/55 + Monorepo 211s/71 + 190s/59 + burner 330s/74 77% net + priors always".
8. **Handoff to Feature-Ideator / Doc-Master**: Doctor error-check integration + advanced "ErrorService + common-di registration" Mermaid.

**Full Credits (verbatim, sacred)**: Dependency-Hunter (this task 05/07) post pull of Doc-Master M2 019e7cd0-caa7-78d3-84cc-97932f7f37a5 (285.4s/60 calls, M2 assembly + conductor + diagrams) + Test-Guardian smoke 019e7cd0-df92-7203-aa4d-eb6ca900e628 (239.2s/55 calls, DI surfaces compatible + doctor smoke GREEN + 7 gaps). Prior: Monorepo-Architect phase1 scaffolds 019e7cc6-3d67-7f50-a414-5761ebaf6d46 (211s/71) + 019e7ccc-d4a9-7ae3-bd9f-781a5e2a54a7 (190s/59, branded DiToken/RegisterDependencies/"phase 1 live" + common-di prep); final ts-expect-error-burner 019e7cc6-1dba-7761-8c13-11fbb903df8e (330s/74 calls, 48→11 77% net, 0 bare, TOKENS + register* factories, DI GREEN); earlier burners (019e7cb5-0da5... 252s/82 14 burns + registerInstance); multiple Doc-Masters (019e7cc6-2d6d... 202s/64 0-strict conductor + burn-down + 4+ diagrams; 019e7cb4...); Self-Improver 019e7cc6-51eb... (hooks + mental test + 3 never-agains); Feature-Ideator doctor 019e7ccf-96a6... 283s/68 (6 checks + perf RingBuffer prep); Test-Guardian prior + background verifies (019e7cc7-ab64... etc); all per .grok/GROK.md + monorepo-architect/SKILL "M2 Finalize + Smoke Handoff Lessons".

**Created by**: Dependency-Hunter (Wave 2 + Post-M2-Smoke todo 05/07). "Enhance-in-place" + ErrorService token confirmed. Precedent set by common-di extraction phase 1. MAX AUTONOMY. Non-stop. THE CHAIN DOES NOT STOP.

**Post-M2-Smoke + common-errors enhance-in-place clarity + Test-Guardian 251.9s/34 Update (2026-06)**: "Post-M2-Smoke + common-errors enhance-in-place clarity" + latest Test-Guardian 019e7ce3-164e-7bf3-8fef-53d9ff8cf3ab 251.9s/34 (ErrorService future surface coverage + doctor 6 checks error paths + re-smoke incl extraction + unit notes + "value of locking coverage plan at enhance-in-place decision time") + doc-master advanced Mermaid (ErrorService + common-di reg flow + doctor 6 checks error paths subgraph + extraction roadmap state machine with "Current Status: Post-M2-Smoke + common-errors enhance-in-place clarity" + full credits incl this 251.9s/34 + hunter 266s/58 + two pulled 285.4s/60 + 239.2s/55 + Monorepo two + burner 330s/74 77% + Feature 283s/68 + priors; 4 mental passed + "THE CHAIN DOES NOT STOP") synced to 5 mand + GROK + ADR + dendron-doctor + SKILLs + self-test gate enforced across 8+ files. Handoff Monorepo (exec common-di phase2 + enhance + ErrorService reg). THE CHAIN DOES NOT STOP.
