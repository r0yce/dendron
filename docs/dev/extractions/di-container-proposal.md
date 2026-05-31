# Extraction Proposal: DI Container / Tsyringe Registration Layer (plugin-core DI Modernization + Prep for Shared)

**Wave**: 2 (Dependency-Hunter) — Directly fuels **post-plugin-core-green DI modernization** + shared extraction #3 (patterns + possible internal pkg).

**Status**: ARCHITECT ENDORSED (2026-05-31) + **PHASE 2 LIVE (Full Extraction Executed)**. See ADR 0001 Phase 2 appendix for execution details, 4-axis, worktree, credits, invariants.

## ... (original problem/impact/metrics preserved in git history)

## Execution Summary (Phase 2 — Monorepo-Architect in isolated worktree)

- common-di pkg scaffolded with full pure surface (DiToken, 43 TOKENS, registerAllDependencies etc).
- Thin shim + 2 proof reg migrations (setupLocal + setupWebExtContainer partial).
- All 5+ mandatory docs + diagrams + GROK + SKILL updated.
- Credits: Doc-Master M2 019e7cd0-caa7 (285.4s/60), Test-Guardian 019e7cd0-df92 (239.2s/55), prior Monorepo 019e7cc6-3d67 (211s/71) + 019e7ccc-d4a9 (190s/59), burner 019e7cb5 (252s/82) + orchestra.

## Updated Target Architecture (After Phase 2 Extraction)
```mermaid
flowchart TD
    subgraph "packages/common-di (NEW, pure, zero vscode)"
      CDI[common-di/src/index.ts<br/>DiToken&lt;T&gt; branded + TOKENS(43+)<br/>registerAllDependencies(Partial)<br/>registerInstance + resolveOrThrow<br/>tsyringe re-exports + v2 absorbing inject]
      CDIPKG["@dendronhq/common-di (runtime tsyringe + reflect)"]
    end

    subgraph "plugin-core/src/di (thin shim only)"
      SHIM[di/inject.ts<br/>re-exports from common-di<br/>+ vscode-tied registerDesktop/Web + adapters]
      SETUP[setupLocalExtContainer + setupWebExtContainer<br/>(vscode surface ONLY here)]
    end

    subgraph "plugin-core consumers (clean)"
      USERS[30+ files @inject(TOKENS.XXX)<br/>0 bare @ts on decorators]
    end

    ACT[activation _extension + web/extension] -->|one call| SETUP
    SETUP -->|delegates pure| SHIM
    SHIM -->|reexports + delegates| CDI
    USERS -->|clean imports| SHIM
    CDI -->|owns| CDIPKG
```

## Before (Phase 1 Scaffold in plugin-core only)
```mermaid
flowchart TD
    subgraph "plugin-core/src (pre-extraction)"
      WRAP[di/inject.ts v1+phase1<br/>branded TOKENS + reg skeleton (local)]
      REG[setup* 241LOC boilerplate]
    end
    ...
```

**Post-extraction invariants + Test-Guardian handoff surface**: see ADR 0001.

**THE CHAIN DOES NOT STOP**.
