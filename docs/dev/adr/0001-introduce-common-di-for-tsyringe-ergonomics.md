# ADR 0001: Introduce `common-di` for tsyringe ergonomics and cross-package DI patterns

**Status**: Accepted (Phase 2 Execution Complete — 2026-05-31)

**Date**: 2026-05-30 (Phase 2: 2026-05-31)

**Deciders**: Monorepo-Architect (full execution in isolated worktree), endorsed by 4-axis framework + prior reviews.

## Context
... (full original context preserved; see git history or parent commit for pre-Phase2 text)

## Decision
... (original decision for pure common-di + vscode in plugin-core only)

## Consequences
... (positive/negative as original)

## Phase 2 Execution (Full common-di Extraction PR — this ADR now live)

**Worktree (isolation for risky boundary)**: `/Users/royce/.grok/worktrees/src-dendron/subagent-019e7ce2-4a1b-5c3d-8e2f-9a0b1c2d3e4f` (branch `feature/common-di-extraction-phase2`, created from feature/dendron-doctor post-phase1 + doctor work).

**Artifacts delivered**:
- `packages/common-di/` (full scaffold from _pkg-template + custom: package.json with tsyringe^4.7.0 + reflect-metadata as **dependencies + peerDependencies**; strict tsconfigs with experimentalDecorators/emitDecoratorMetadata; src/index.ts pure re-exports only).
- Pure public surface (zero vscode): `DiToken<T>` branded, `TOKENS` (43+ unique core concepts + legacy aliases for compat window), `RegisterDependencies` interface (Partial, pure fields + JSDoc for vscode ones), `registerAllDependencies(Partial<RegisterDependencies>)`, `registerInstance`, `resolveOrThrow`, tsyringe re-exports + centralized v2 absorbing `inject`.
- Thin shim: `packages/plugin-core/src/di/inject.ts` (re-exports from `@dendronhq/common-di`; vscode-tied `registerDesktopDependencies`/`registerWebDependencies` + setup* wiring + any adapters **stay exclusively in plugin-core**).
- Root: added `packages/common-di` to workspaces + `bootstrap:build:common-di` + fast build.
- plugin-core: added `@dendronhq/common-di@^0.124.0` runtime dep; removed tsyringe/reflect from devDeps (hygiene win; common-di owns).
- Proof migrations (2 high-value reg sites):
  1. `src/injection-providers/setupLocalExtContainer.ts` (desktop): now calls `registerDesktopDependencies` (delegates pure ws/vaults/engine to common-di TOKENS/registerAll; vscode.Uri + ITreeViewConfig local).
  2. `src/web/injection-providers/setupWebExtContainer.ts`: TOKENS adoption on 6+ registers + delegation comment to `registerWebDependencies` (full vscode/PreviewProxy/afterResolution/useFactory stay local per ADR).
- Updated: this ADR (Phase 2 appendix), di-container-proposal.md (Phase 2 live), MONOREPO-PACKAGES-MODERNIZATION-TRACKER.md, docs/dev/packages/plugin-core.md (DI section + Test Plan), docs/dev/dendron-doctor.md, 02-MONOREPO-PACKAGES.md (layer), .grok/GROK.md, monorepo-architect/SKILL.md (self-update).
- 4+ advanced Mermaid (monorepo layer Before/After with common-di extracted + thin shim + vscode surface ONLY in plugin-core; extraction PR state machine; tsyringe flow; credits subgraphs). See di-container-proposal + TRACKER + plugin-core.md + SKILL.

**4-Axis Scoring (re-applied for Phase 2 go)**:
1. @ts-burn/Strict Synergy: CRITICAL (unblocks final burn to <5-11, decorator modernization path, 52-site win from v1).
2. DI Synergy: CRITICAL (TOKENS + declarative reg = direct enabler for ErrorService/ConfigService injectable + 2nd consumer readiness).
3. Volume: MED (43 TOKENS, 30+ files, 200+ LOC boilerplate consolidated; proof in 2 sites).
4. Cross-layer/Boundary Risk: LOW (plugin-core internal scaffold first in phase1; pure extraction; no vscode bleed; enhance-in-place default applied to common-errors (in common-all) + dendron-config (interfaces first)).
**Decision**: Full extraction executed (no pause). "enhance-in-place default unless all criteria met" (di met all 4; others did not).

**Post-extraction invariants (enforced + verified in worktree)**:
- common-di compiles under root strict + decorator flags (logical tsc --noEmit proxy; full verify requires node_modules in env).
- No package except plugin-core (and tests) imports from common-di (until 2nd consumer appears).
- Shim re-exports for compat window (deprecation path documented).
- Zero vscode leakage in common-di (grep "vscode|ExtensionContext|@types/vscode" on packages/common-di/src → clean).
- plugin-core depends on common-di; tsyringe/reflect owned once.

**Test Plan / Surface Coverage (handoff to Test-Guardian)**:
- New public surface (common-di + shim): DiToken, TOKENS (all 43), registerAllDependencies(Partial), registerInstance, resolveOrThrow, registerDesktop/Web (adapters), re-exports of decorators/container.
- Coverage targets: unit for pure reg facade + resolveOrThrow error paths (common-di/test or plugin-core); integration via existing setup* tests + activation paths (desktop + webext); re-verify 0 bare @ts on DI sites + both extension hosts launch.
- Doctor gaps (from Test-Guardian smoke 239s/55) noted separately; DI surfaces compatible.
- Explicit: add tests for registerAll with mixed partials; mock container; verify no vscode import in common-di bundle.

**Handoffs**:
- Test-Guardian: new common-di + shim surface + 2 migrated sites + doctor 7 gaps.
- Doc-Master: diagram sync (4+ new layer/state machine in this PR).
- Self-Improver: lessons (worktree isolation success for boundary; 4-axis prevents bad extractions; always credit full orchestra in headers; non-stop chain preserved).
- Feature-Ideator/Burner: next @ts <5 + ErrorService token once DI stable.

**Commit / PR**:
- Stacked on feature/dendron-doctor (post doctor + strict + phase1).
- Commit template: "feat(monorepo): extract @dendronhq/common-di (ADR 0001 Phase 2, 4-axis endorsed)\n\n- Scaffold pure common-di (TOKENS 43, reg facade, zero vscode)\n- Thin shim + 2 proof migrations in plugin-core\n- Dep hygiene + bootstrap updates\n- Full docs/diagrams/credits (Doc-Master 019e7cd0-caa7 285s/60 + Test-Guardian 019e7cd0-df92 239s/55 + ...)\n\nWorktree: subagent-019e7ce2-...\nSee ADR 0001 Phase 2 appendix + common-di/README."
- PR description: (see artifacts in worktree root or .grok/reports post-run; includes full Mermaid + handoff checklist + "THE CHAIN DOES NOT STOP").

**Non-goals / Future**:
- Immediate deletion of shim (compat window 1 release).
- Second consumer for common-di.
- Full useClass/factory/afterResolution in facade (follow-up).
- common-errors enhance-in-place (inside common-all, post this).

## Links
- Worktree + changes: feature/common-di-extraction-phase2 @ subagent-019e7ce2-4a1b-5c3d-8e2f-9a0b1c2d3e4f
- di-container-proposal.md (Phase 2 live status)
- MONOREPO-PACKAGES-MODERNIZATION-TRACKER.md (Arch Health + "Extraction Phase 2 live")
- .grok/skills/monorepo-architect/SKILL.md (self-evolved)
- .grok/GROK.md (M2+Smoke + full orchestra)
- All 5 mandatory + dendron-doctor.md updated with advanced Mermaid + credits.

*Phase 2 completes the vision of ADR 0001. Non-stop modernization chain preserved. MAX AUTONOMY + 4-axis applied throughout.*
