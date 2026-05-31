# Lerna 8 Tooling Spike — 1-Page Spec (Priority 4 Kickoff 2026-06)

**Branch**: `feature/lerna-8-spike` (created from feature/dendron-doctor post-polish; isolated throwaway recommended per Monorepo SKILL for risk)
**Owner**: Feature-Ideator (handoff Monorepo-Architect + Test-Guardian for spike execution)
**Status**: Kickoff immediate post-doctor-polish (strict green + DI 100% + M2+smoke 019e7cd0-caa7 285.4s/60 + 019e7cd0-df92 239.2s/55 + full orchestra). "Strict green + immediate kickoff" pattern. No pause.

## Problem / Opportunity
Lerna 3.x is ancient (current bootstrap slow, no modern caching, poor ESM/CJS interop, no native workspace:protocol support). Monorepo SKILL + Monorepo-Architect worktree notes flag high risk for plugin-core: custom webpack (native shims for better-sqlite3, vscode-uri, etc.), bootstrap scripts assume lerna@3 semantics, potential breakage in @dendronhq/plugin-core compile + native bindings. Upgrading without spike = production outage risk. Opportunity: faster CI/dev loops, modern features (lazy loading, better hoisting) for long-term maintainability.

## Proposed UX / Spike Plan
- Isolated throwaway: `git worktree add -b throwaway/lerna8 /tmp/dendron-lerna8-spike` (or feature/ as here)
- Pin lerna@8 in spike package.json + lerna.json (use npm/yarn workspaces compat)
- Run full `yarn bootstrap:build:common-all` + `yarn workspace @dendronhq/plugin-core compile` + webpack prod build
- Measure: wall time, peak mem, error count vs baseline; probe native (better-sqlite3 load in engine-server, sqlite in doctor)
- Rollback plan: easy (spike dir deleted, no main changes until success metrics met)
- Success criteria documented in spike notes.

## Mermaid: Lerna 8 Spike Execution Flow
```mermaid
flowchart TD
    A[Current main: Lerna 3 + custom bootstrap] --> B{Isolate?}
    B -->|yes| C[git worktree add throwaway/lerna8-spike<br/>or feature/lerna-8-spike]
    C --> D[Edit lerna.json + root package.json<br/>lerna: ^8.0.0 + workspaces config]
    D --> E[yarn install --force in spike]
    E --> F[Run bootstrap:build:common-all<br/>+ plugin-core compile + webpack]
    F --> G{Compare metrics vs baseline?}
    G -->|pass all| H[Success: update main + docs + Monorepo SKILL recipe]
    G -->|fail| I[Document breakage (shims? hoisting? native?)<br/>Delete worktree, no main impact]
    I --> J[Report to Monorepo + Test-Guardian matrix]
    H --> K[PR or ADR for Lerna 8 + ESLint flat follow-up]
```

## Architecture Impact (Minimal in Spike)
- Only spike checkout: lerna.json, yarn.lock (local), bootstrap scripts copy if needed for diff.
- No change to main until green.
- Touched in success: root package.json engines/lerna, .yarnrc, CI workflows, plugin-core webpack config (if shims change).
- New in common: "Lerna 8 Migration Recipe" in monorepo-architect/SKILL.md

## Risks (Per Monorepo SKILL + Prior Worktrees)
- plugin-core webpack + native shims (better-sqlite3, keytar, etc.) may require hoisting tweaks or node-loader changes in lerna8.
- Bootstrap custom (lerna bootstrap deprecated in 8; uses npm/yarn workspaces now) — may break dendron-cli / engine-server build ordering.
- @dendronhq/* inter-package resolution + tsconfig paths.
- Windows/mac matrix (native bindings).

## Success Metrics (for Test-Guardian / Monorepo)
- Spike bootstrap time ≤ 1.2x baseline (or better with lerna8 cache).
- `yarn workspace @dendronhq/plugin-core compile` identical error count (0 new from tooling).
- Native load smoke: doctor sqlite + engine-server sqlite in spike env == main.
- No changes needed to plugin-core/webpack.config.js or native shims.
- Full critical verify GREEN in spike (common-all + plugin-core).
- Documented "go / no-go + exact breakage" in spike/RESULTS.md

## Minimal Stub (in spike branch)
- This spec.
- spike/RESULTS.md (to be filled during run: timings, errors, shim diffs, decision).
- (Optional) throwaway script spike/run-spike.sh wrapping the commands + time + diff.

**Handoff**: Monorepo-Architect (execute spike in isolated worktree per its SKILL "isolated throwaway recommended"), Test-Guardian (add lerna8 matrix to smoke), Self-Improver (lessons from spike), Doc-Master (Mermaid in TRACKER). Credits: full orchestra incl. pulled M2+smoke + prior doctor 283s/68 + Feature-Ideator polish.

Zero ramp-up from monorepo SKILL + GROK priorities. Strict green + immediate kickoff upheld. THE CHAIN DOES NOT STOP.
