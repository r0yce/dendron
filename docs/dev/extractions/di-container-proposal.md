# Extraction Proposal: DI Container / Tsyringe Registration Layer (plugin-core DI Modernization + Prep for Shared)

**Wave**: 2 (Dependency-Hunter) — Directly fuels **post-plugin-core-green DI modernization** + shared extraction #3 (patterns + possible internal pkg).

**Status**: DRAFT → **ARCHITECT ENDORSED (2026-05-31)** as Priority #1 → **M2 + Smoke GREEN (2026-06, post-M2 + Test-Guardian smoke 019e7cd0-df92-7203-aa4d-eb6ca900e628 239.2s/55 calls + Doc-Master refresh 019e7cd0-caa7-78d3-84cc-97932f7f37a5 285.4s/60 calls, M2 assembly conductor)**: v2 + TOKENS Phase 1 + register* factories LIVE in di/inject (from Monorepo phase1 019e7cc6-3d67... + final burner 019e7cc6-1dba...; 48→11 @ts 77% net, 0 bare, DI GREEN); extraction phase 1 solid (two worktree scaffolds + branded DiToken/RegisterDependencies/"phase 1 live" + full credits) → **phase 2 kickoff imminent** (common-di scaffold PR per ADR 0001, thin shims, 200+ LOC migration from setup*, Test-Guardian new surface coverage + gap fill). 4+ advanced Mermaid (incl NEW Extraction PR State Machine phase1 scaffolds→common-di→thin shims→Test-Guardian + Doctor Smoke Matrix) refreshed with M2+Smoke green nodes + two IDs. All 5 mand + doctor + this + ADR + GROK/SKILL updated "M2 + Smoke GREEN" + 15-18@ts cats + doctor gaps + extraction phase2 + full credits two IDs + M2 assembly conductor; self-test gate passed. Doctor polish next (Feature-Ideator). Handoff Monorepo (diagram input) / Test-Guardian (coverage). Non-stop chain upheld. 

## Problem Statement
All DI (tsyringe + reflect-metadata + manual container registration) is isolated to plugin-core but implemented with heavy boilerplate: 20+ explicit `container.register(...)` calls (many with tokens as magic strings), per-provider files, and **52 @ts-expect-error** annotations purely for legacy decorator + TS 5.x incompatibility on every `@inject`. Current `di/inject.ts` wrapper is a good first step but doesn't address registration or eliminate the noise at usage sites.

## Duplication Metrics (Scanned)
- **DI / tsyringe / @inject / Container refs**: 110+ across **34 files** (100% confined to plugin-core/src).
- **@ts-expect-error DI-specific**: **52 occurrences** (18 files) — ~55% of the **total 95 @ts-expect-error** in plugin-core/src.
  - Heaviest: PreviewPanel.ts (6), TextDocumentService.ts (5), SiteUtilsWeb.ts (4), DendronEngineV3Web.ts (4), EngineNoteProvider.ts (4), NoteLookupCmd.ts (4), LookupQuickpickFactory.ts (3), WSUtils.ts (3), WebViewUtils.ts (3), PluginNoteRenderer.ts (3), etc.
  - Comment pattern: `// @ts-expect-error - TS 5+ stricter decorator checking with tsyringe + legacy emitDecoratorMetadata`
- **Registration boilerplate LOC**:
  - `web/injection-providers/setupWebExtContainer.ts`: **216 LOC** (20+ register calls, conditional telemetry, resolves inside registers).
  - `injection-providers/setupLocalExtContainer.ts`: **25 LOC**.
  - `di/inject.ts`: **35 LOC** (thin re-export + comments).
- **Usage**: 30+ classes with `@inject` ctors.

## Key Consumers
Activation/bootstrap (`_extension.ts`, `workspaceActivator.ts`, `web/extension.ts`), 15+ commands/views/services (PreviewPanel, EngineNoteProvider, lookup commands/providers, TextDocumentService, telemetry, tree views, etc.), tests.

## Current Architecture (Before)
```mermaid
flowchart TD
    subgraph "plugin-core/src"
      ACT[_extension.ts + workspaceActivator]
      WEB[web/extension.ts]
      REG[setup*Container 241 LOC total<br/>20+ manual .register calls]
      WRAP[di/inject.ts 35LOC<br/>thin re-export]
      USERS[18+ files with @inject + 52 @ts-expect-error]
      PROV[web/injection-providers/*.ts<br/>ad-hoc providers]
    end

    ACT -->|calls| REG
    WEB -->|calls| REG
    REG -->|container.register("Token", ...)| CONTAINER[tsyringe raw container]
    USERS -->|@inject("Token")<br/>// @ts-expect-error ...| WRAP
    WRAP -->|re-exports| CONTAINER
```

## Proposed Target Architecture (After — Post-Green Cleanup)
```mermaid
flowchart TD
    subgraph "plugin-core/src/di (modernized)"
      WRAP2[di/inject.ts v2<br/>+ @registry support + typed tokens + no-@ts]
      REG2[declarative registration<br/>registerAll() or @registry decorators<br/>~100 LOC]
      TOKENS[tokens.ts<br/>const enum / branded strings]
      ERR_CLEAN[52 @ts-expect-error removed]
    end

    subgraph "plugin-core consumers"
      USERS2[all DI classes<br/>clean @inject("Token")<br/>no expect comments]
    end

    ACT2[activation] -->|one call| REG2
    USERS2 -->|clean imports from| WRAP2
    REG2 -->|populates| CONTAINER2[container]
    WRAP2 -->|exports typed| CONTAINER2

    subgraph "future extraction"
      DI_PKG["@dendronhq/common-di (optional)<br/>or keep internal"]
    end
    REG2 -. "if patterns generalize" .-> DI_PKG
```

## Impact
- **@ts-expect-error reduction**: **52 sites eliminated** (55% of current 95 total in plugin-core/src) — directly hits MILESTONE-2 target.
- **LOC / boilerplate savings**: 100-150+ LOC from consolidated registration + removal of per-site comments + magic strings.
- **DI modernization goal**: Fulfills the "decorator/DI modernization" follow-up. Makes DI pleasant.
- **Prep for shared extraction**: Patterns (typed tokens, registration facade, wrapper) ready for `common-di` or internal.
- **Risks / Mitigations**: Decorator flags remain a known constraint; start with tokens + batch register; update tests.

## Recommended Next Steps (Immediate Post-Green or Interleaved with Burner)
1. Expand `di/inject.ts` with `register*` helpers + `Tokens` const / branded types.
2. Refactor setup*Container into declarative `registerAllDependencies(...)`.
3. Remove the 52 @ts-expect-error comments one-by-one or in batches; verify tsc.
4. Add `tokens.ts`; migrate string literals.
5. Update plugin-core.md, MILESTONE-2-REPORT, TRACKER with burn-down (95 → ~43).
6. Feed patterns to ts-expect-error-burner + Monorepo-Architect for common-di decision.
7. Synergize with sister proposals (ErrorService, ConfigService as injectable tokens).

**Created by**: Dependency-Hunter subagent (Wave 2). Directly actionable for current DI + @ts-expect-error cleanup wave.
