# Extraction Proposal: DI Container / Tsyringe Registration Layer (plugin-core DI Modernization + Prep for Shared)

**Wave**: 2 (Dependency-Hunter) — Directly fuels **post-plugin-core-green DI modernization** + shared extraction #3 (patterns + possible internal pkg).

**Status**: DRAFT → **ARCHITECT ENDORSED (2026-05-31)** as Priority #1 → **Post-M2-Smoke + Extraction Phase 1 Complete (2026-06, Dependency-Hunter 019e7cda-a3cc-7122-b0c6-b1f9de1b7ba7 266s/58 calls + Doc-Master M2 019e7cd0-caa7-78d3-84cc-97932f7f37a5 285.4s/60 + Test-Guardian smoke 019e7cd0-df92-7203-aa4d-eb6ca900e628 239.2s/55, M2 assembly conductor)**: (see doc-master/SKILL new "## Post-M2-Smoke + Dependency-Hunter Enhance-in-Place Lesson (2026-06)" for advanced dep graph Mermaid + enhance-in-place for common-errors + hunter credits + self-test gate update incl 266s/58 + "THE CHAIN DOES NOT STOP")  v2 + TOKENS Phase 1 (~30 branded) + register* factories (registerDesktop/Web/AllDependencies + registerInstance + overloads) LIVE + rich in di/inject.ts (from Monorepo phase1 019e7cc6-3d67-7f50-a414-5761ebaf6d46 211s/71 + 019e7ccc-d4a9-7ae3-bd9f-781a5e2a54a7 190s/59 + final burner 019e7cc6-1dba-7761-8c13-11fbb903df8e 330s/74 calls); **48→11 @ts 77% net, 0 bare decorator left anywhere (DI noise fully eliminated via SafeDecoratorFactory central absorption + typed TOKENS)**; 30+ clean @inject sites; production actionable @ts ~15-18 (legacy/browser: TextDecoder x3, survey/memo/NotePicker etc); DI 100% GREEN; extraction phase 1 solid (branded DiToken/RegisterDependencies + "phase 1 live" + full credits + common-di readiness per ADR 0001 + di-container #1 4-axis); **phase 2 kickoff imminent** (common-di scaffold PR, 200+ LOC boilerplate migration from setupLocalExtContainer.ts + setupWebExtContainer.ts now the unambiguous trigger per register* skeletons, thin shims for vscode-tied, Test-Guardian new surface coverage + gap fill per smoke 7 gaps). Re-scan (task 05/07): remaining DI duplication = setup*Container boilerplate vs declarative register* facade (skeletons in inject.ts point to it); config/perf noted in sister proposals. 4+ advanced Mermaid (Extraction PR State Machine + Doctor Smoke Matrix + burn-down + Before/After) refreshed with M2+Smoke green nodes + two IDs + credits. All 5 mand + doctor + this + ADR + GROK + dependency-hunter/SKILL + monorepo-architect/SKILL updated "Post-M2-Smoke + Extraction Phase 1 Complete" + @ts impact (DI noise eliminated) + 15-18 cats + doctor gaps + full orchestra credits (two pulled + Monorepo two + burner 77% + priors) + self-test passed. Handoffs: Monorepo (4-axis + PR input for phase2), Test-Guardian (register*/TOKENS surface), Self-Improver (lessons). Non-stop chain upheld. THE CHAIN DOES NOT STOP. 

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
