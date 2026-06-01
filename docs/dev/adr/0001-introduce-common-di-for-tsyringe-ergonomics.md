# ADR 0001: Introduce `common-di` for tsyringe ergonomics and cross-package DI patterns

**Status**: Proposed (prep for post-strict-wave extraction) → **Post-M2-Smoke + Extraction Phase 1 Complete (2026-06, Dependency-Hunter 019e7cda-a3cc-7122-b0c6-b1f9de1b7ba7 266s/58 calls + Doc-Master M2 conductor 019e7cd0-caa7-78d3-84cc-97932f7f37a5 285.4s/60 calls + Test-Guardian smoke 019e7cd0-df92-7203-aa4d-eb6ca900e628 239.2s/55 calls)**: (see doc-master/SKILL "## Post-M2-Smoke + Dependency-Hunter Enhance-in-Place Lesson (2026-06)" + advanced dep graph Mermaid for common-errors enhance-in-place + full hunter 266s/58 credits + self-test gate + "THE CHAIN DOES NOT STOP")  extraction phase 1 solid (TOKENS Phase 1 ~30 branded + register* factories + two Monorepo scaffolds 019e7cc6-3d67-7f50-a414-5761ebaf6d46 211s/71 + 019e7ccc-d4a9-7ae3-bd9f-781a5e2a54a7 190s/59 with branded DiToken/RegisterDependencies/"phase 1 live" + di-container-proposal #1 4-axis endorsed) + final burner 019e7cc6-1dba-7761-8c13-11fbb903df8e 330s/74 (48→11 @ts 77% net, 0 bare decorator **DI noise fully eliminated** via SafeDecoratorFactory + typed TOKENS); 0 strict src/ GREEN / DI 100% GREEN / production actionable @ts ~15-18 (TextDecoder x3 browser in VSCodeFileStore + survey 3 + memo 2 + NotePicker 2 + workspace/Backlinks/commands/base etc with 4-axis boundary casts); doctor 6+table LIVE on feature/dendron-doctor (smoke GREEN + 7 explicit gaps); common-di readiness (v2 patterns stabilized + register* skeletons = unambiguous phase 2 extraction trigger for 200+ LOC setup*Container migration). **phase 2 kickoff imminent** (common-di scaffold PR per this ADR + di-container-proposal, thin shims for vscode-tied, full setup* migration, Test-Guardian new DI surface (TOKENS/register*/DiToken/registerInstance) coverage + gap fill). All 5 mand + doctor + di-proposal + this + GROK + dependency-hunter/SKILL + monorepo-architect/SKILL updated "Post-M2-Smoke + Extraction Phase 1 Complete" + @ts impact (DI noise eliminated) + 15-18 cats + doctor gaps + full orchestra credits (two pulled 285.4s/60 + 239.2s/55 + Monorepo two + burner 330s/74 77% net + priors + Self-Improver + Doc-Masters) + handoffs (Monorepo 4-axis scoring + PR input for common-di; Test-Guardian register* surface; Self-Improver "register* skeletons = extraction trigger" + enhance-in-place for common-errors). Self-test gate passed (4 scenarios). Non-stop chain upheld. THE CHAIN DOES NOT STOP. 

**Date**: 2026-05-30

**Deciders**: Monorepo-Architect (this ADR), to be reviewed by Dependency-Hunter + maintainers when plugin-core strict wave reaches green.

**Build Modernization 2026-05-31/06 Focused Clean-Build Phase (First 3 Clean Hybrid 0) Decision Note (2026-06 extension)**: Per "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (first 3 clean hybrid 0)", the first 3 packages (common-server/unified/engine-server) achieved clean hybrid 0 strict (global tsc 0 + unified "API Extractor completed successfully") via 8+ parallel Strict remark micro agents + main target-first ProcOptsV5 fix. **Current Status: 0/0/0; first 3 solid per 'Double down' mandate; now root wiring**. Advanced Mermaid diagrams (burn-down waterfall 13/66/71 → 0/0/0 with agent subgraphs + state machine "trio solid clean hybrid → root bootstrap/turbo wiring + measurements + expansion decision" + Before/After ProcOptsV5 + hybrid flow) live in spike .grok/reports/build-modernization-spike-2026-05-31.md (all with full 8+ IDs + verbatim phrases + "THE CHAIN DOES NOT STOP"). Full credits + mental 5 + 18:20 pivot + 312/5min/4-hooks/4-axis references in spike + synced to TRACKER/00-GOALS/plugin-core/MILESTONE-2/GROK + dendron-doctor. This phase uses the same 4-axis boundary discipline (minimal 4-axis ONLY at true common-all boundaries with full dated TODOs) as the DI/container work. Root wiring + expansion decision now justified. All future artifacts MUST quote the full 8+ IDs (019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772 + wave 019e81fe-eefb-73a2-ad2c-5fa4efebcad7 200s/15 + ... + 019e81fa-d11d-7901-80db-26ef921b3f30 150.9s/36 + Test-Guardians 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772 + priors Doc-Master 019e7cd0-caa7-78d3-84cc-97932f7f37a5 285.4s/60 + Test-Guardian 019e7cd0-df92-7203-aa4d-eb6ca900e628 239.2s/55 + burner 019e7cc6-1dba-7761-8c13-11fbb903df8e 330s/74 77% net + Monorepo two 211s/71 + 190s/59 + Feature 283s/68 + debug bg 019e7d53-338e-7443-a206-e239e70b0cf7 300s+2h+ + Self + 4+ hooks incl on_build_modernization_clean_win + 1235 "THE CHAIN DOES NOT STOP") + "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (first 3 clean hybrid 0)" + "THE CHAIN DOES NOT STOP". MAX AUTONOMY. **THE CHAIN DOES NOT STOP.**

## Context

- All tsyringe + `reflect-metadata` usage (legacy decorators, `@inject`, `@injectable`, `container.register`/`resolve`) is **100% confined to `plugin-core`** (19 src files, heavy in `web/` subdir for browser extension, lighter on desktop for tree views + 1 command + setups). Confirmed via full-repo grep (see analysis in task notes).
- A first-step wrapper already exists locally: `packages/plugin-core/src/di/inject.ts` (re-exports with centralized import; migration of 22+ files complete per MONOREPO-PACKAGES-MODERNIZATION-TRACKER.md). However, it does **not** eliminate the ~30-50 `@ts-expect-error` sites on decorator signatures (TS 5.x stricter rules on legacy `emitDecoratorMetadata`).
- Container setup logic is duplicated across:
  - `src/injection-providers/setupLocalExtContainer.ts` (desktop)
  - `src/web/injection-providers/setupWebExtContainer.ts` (web extension, much heavier, includes `vscode.ExtensionContext`)
  - `src/web/test/helpers/setupTestEngineContainer.ts` + integ test usages
- `tsyringe` + `reflect-metadata` appear only in `plugin-core/package.json` **devDependencies** (not runtime `dependencies`), yet are imported in production `src/` paths that are webpacked into the published extension. This is fragile dep hygiene.
- Broader monorepo goals (from 00-GOALS-AND-ROADMAP.md + MILESTONE-2-REPORT.md): after plugin-core strict green + @ts-expect-error burn-down, next is "Shared code extraction (DI patterns, error factories → common-di / common-errors)".
- Existing boundaries (docs/dev/02-MONOREPO-PACKAGES.md + per-package docs):
  - `common-all`, `common-server`, `common-frontend`, `common-test-utils`: pure or server-only, **zero** vscode coupling, **zero** tsyringe.
  - `plugin-core`: sole consumer of vscode APIs + the DI system (desktop + web extension hosts).
  - New packages follow `_pkg-template` + are added to root workspaces + lerna.
- Lerna 3 + yarn workspaces current; custom bootstrap/ scripts orchestrate builds. (See Lerna 8 spike notes below.)
- Alternative patterns already in use: `ExtensionProvider` (static service locator for `IDendronExtension`), manual `new Cmd(ext)` for 100+ commands (not container-resolved on desktop path).

The current local wrapper is a tactical patch. Extracting a proper `common-di` package will:
- Own the tsyringe dep (proper runtime declaration).
- Provide **vscode-agnostic** helpers, typed tokens, registration utilities, and (if feasible) decorator ergonomics to slash boilerplate.
- Leave vscode-tied wiring (ExtensionContext registration, webview tokens, etc.) in plugin-core adapters.
- Prepare for potential future full DI modernization or replacement (modern decorators, or lighter patterns) without touching every consumer.

This ADR is written in prep mode so extraction work can begin **the same day** plugin-core compile hits zero errors on the strict wave.

## Decision

We will introduce a new internal package:

**`@dendronhq/common-di`**

- **Scope (pure, no `vscode` types in public API)**:
  - Re-exports + thin typed wrappers around tsyringe primitives (`inject`, `injectable`, `singleton`, `container`, `Lifecycle`, `registry`).
  - Central place for the `// @ts-expect-error` (or future `// @ts-ignore` / d.ts augmentation) so consumer sites become clean `import { inject } from "@dendronhq/common-di"`.
  - Helper functions/factories for common registration patterns (e.g. `registerWorkspaceCore(container, { wsRoot, vaults, engine })`, `createTypedContainer()`, safe `resolveOrThrow` with DendronError integration).
  - Token constants for cross-cutting pure concepts (if any emerge; avoid leaking vscode tokens here).
  - Owns `"tsyringe": "^4.7.0"` and `"reflect-metadata": "^0.1.13"` as **runtime dependencies** (moved from plugin-core devDeps).
  - `package.json`, tsconfig.build following `_pkg-template` + modern baseline (strict flags where possible).
  - Published as part of the monorepo (internal, public access for now to match siblings).

- **What stays in `plugin-core`** (and must **not** leak into common-di):
  - `setupLocalExtContainer` / `setupWebExtContainer` and all `container.register` calls involving `vscode.*` (ExtensionContext, Uri, Event<TextDocument>, webview configs, PreviewProxy, ITelemetryClient registrations that are vscode-specific, etc.).
  - All `@inject("extensionContext")` / web-specific tokens and the classes that depend on them (PreviewPanel, web commands, TextDocumentService web impl, etc.).
  - The side-effect `import "reflect-metadata"` at the absolute top of activation paths (and any web equivalents).
  - Desktop command instantiation (`new Cmd(ext)`) and `ALL_COMMANDS` registry (they do not use tsyringe).
  - `ExtensionProvider` static locator (coexists; future unification is out of scope for this ADR).
  - All test container setup that pulls vscode mocks.
  - The webpack externals / require-hacks / bundling strategy for the extension (DI lib will be bundled or externalized consistently via the existing plugin-core webpack config).

- **Migration path** (post-green):
  1. Scaffold `common-di` via template + add to root package.json workspaces + lerna.json.
  2. Move the wrapper logic + dep declarations.
  3. Update plugin-core to `depend` on `common-di@^0.124.0` (exact monorepo version).
  4. Bulk replace imports + remove local `src/di/` (keep thin re-export shim for one release if needed for tests).
  5. Clean as many `@ts-expect-error` as the new ergonomics allow.
  6. Update docs (02-MONOREPO-PACKAGES.md, plugin-core.md, ARCHITECTURE-OVERVIEW.md, this ADR status).
  7. Verify: full bootstrap build, plugin-core compile + both desktop/web extension launch, relevant integ tests.

- **Non-goals for v1**:
  - Replacing tsyringe entirely.
  - Unifying with ExtensionProvider.
  - Touching error factories (that is sibling work for a potential `common-errors`).
  - Changes to lerna/bootstrap or publishing flows.

## Consequences

**Positive**:
- Single source of truth for DI tech choice + its TS 5+ workarounds.
- Dep hygiene win: tsyringe/ reflect-metadata declared exactly once as real runtime dep.
- Reduces future copy-paste when (if) other packages ever adopt limited DI (unlikely today, but possible for CLI doctor or engine extensions).
- Makes the "DI modernization" milestone concrete and measurable (burn-down of decorator errors).
- Aligns with "extract when patterns duplicate + cross-cut" philosophy (see updated SKILL.md decision tree).

**Negative / Risks**:
- Adds one more package to the critical path (every bootstrap:build:fast etc. will build it; negligible cost).
- Slight import path churn for ~22 files + tests in plugin-core.
- If common-di ever grows vscode leakage by accident, it would pollute pure layers (mitigated by strict review + no vscode in its tsconfig types).
- Web extension bundling (webpack.webext.js) must still resolve the new package correctly.
- Maintenance burden of the wrapper: if we later drop tsyringe, common-di becomes the migration shim layer.

**Neutral**:
- Runtime behavior unchanged (re-exports + helpers are transparent).
- No impact on non-plugin packages today.

## Alternatives Considered

1. **Keep everything local in plugin-core forever** — Rejected. Violates the "shared extraction" priority in MILESTONE-2 and duplicates the exact pattern the modernization track exists to eliminate.
2. **Inline helpers in common-all** — Rejected. common-all is the "types + pure utils" layer; DI is a runtime mechanism with its own dep (tsyringe). Mixing would bloat common-all and its consumers (cli, engine-server, pods, nextjs etc. do not need DI).
3. **Move to common-server** — Rejected. common-server is for logging/telemetry/Sentry/fs/git (server-ish). DI is orthogonal and lighter; some DI usage is purely client/web.
4. **Adopt a different DI lib now (inversify, tsyringe modern, or no-DI)** — Out of scope for this prep ADR. The wrapper gives us breathing room to evaluate later without blocking strict wave.
5. **Use TS 5+ native decorators + emit-less registration** — Promising long-term (see 09-TYPESCRIPT-UPGRADE-PLAN.md), but requires larger refactor of every `@injectable` class + container wiring. common-di can host that experiment later.

---

**100% ROADMAP COMPLETE Update (2026-06, Doc-Master final conductor post 214.2s/65 Lerna+p6-9 + 177s/41 + 133.8s/36 + 312.77s/47 + 289.5s/72 + M2 5663398c9 + PR#1 + doctor launch + extraction)**: ADR 0001 + di-container-proposal #1 (4-axis endorsed) fully realized in phase1+2 (TOKENS/register* live, common-di prep, PR#1 for enhance + common-di phase2 ready). Status: **ACCEPTED + 100% DELIVERED** (common-di boundary + enhance-in-place for errors per "enhance-in-place default"). Current: 0 strict / DI GREEN 21@ts (0 bare) / doctor LIVE 0 gaps / Lerna A+B c8f6d46da + p6-9 kickoffs (73a361ece/6c14a3e6e/61c74a038) / extraction PR#1 landed. Full "100% ROADMAP COMPLETE" table + final advanced Mermaid (waterfall + 100% state machine green COMPLETE + credits incl 214.2s/65 + c8f6d46da + all + "THE CHAIN DOES NOT STOP") in TRACKER/5 mand/GROK/dendron-doctor. Self-test gate PASSED (re-grep "100% ROADMAP COMPLETE" + 214.2s/65 + c8f6d46da + p6-9 commits + THE CHAIN DOES NOT STOP + IDs). Mental 3+ passed. Final 100% Conductor Lesson (2026-06) to SKILLs + handoff Self .grok/ peak. 100% complete. THE CHAIN DOES NOT STOP.

## Links

- Analysis driving this ADR: Monorepo-Architect task run 2026-05-30 (full greps on tsyringe/Container/@inject/register in plugin-core/src; boundary reads of lerna.json + docs/dev/*).
- Existing wrapper: `packages/plugin-core/src/di/inject.ts`
- Setup duplication: `packages/plugin-core/src/injection-providers/setupLocalExtContainer.ts` + `packages/plugin-core/src/web/injection-providers/setupWebExtContainer.ts`
- Tracking: `docs/dev/MONOREPO-PACKAGES-MODERNIZATION-TRACKER.md`, `docs/dev/packages/plugin-core.md`, `docs/dev/MILESTONE-2-REPORT.md`
- Future sibling: potential `common-errors` for error factories (DendronError usage sites are widespread but currently live in common-all/src/error.ts).

**Next action**: When plugin-core strict wave reports 0 production errors, unblock Dependency-Hunter + implement per this ADR + the di-container-proposal.md (see 2026-05-31 Monorepo-Architect review appended below). Update status to Accepted + link PR.

---

## 2026-05-31 Monorepo-Architect Wave 2 Review + Prioritization

**Context**: Dependency-Hunter (Wave 2) delivered 3 extraction proposals into `docs/dev/extractions/` (di-container-proposal.md, common-errors-proposal.md, dendron-config-proposal.md) while strict wave at ~329 errors / 52 @ts-expect-error (all DI decorator sites, 0 in tests).

**Review for Architectural Fit** (per monorepo-architect/SKILL.md principles: common-all = pure/light, common-server = node/FS, plugin-core = vscode-heavy, new common-* only on 3+ benefit + cohesion + no boundary violation):

- **di-container-proposal.md** (typed tokens + declarative registration):
  - **Fit**: Excellent. 100% plugin-core confined (correct — tsyringe + decorators + vscode tokens have no place in common-*). Directly targets 52 @ts-expect-error (55% of total) via ergonomic `Tokens` const/branded + `registerAllDependencies()` facade (~100 LOC consolidation vs 241 boilerplate). No new package risk in v1; patterns explicitly prep for the `common-di` decided in this ADR.
  - **DI Synergy**: Critical — this *is* the enabler for ts-expect-error-burner (see its SKILL.md: "Primary roadmap: Follow di-container-proposal.md").
  - **@ts-burn**: Highest immediate (52 sites).
  - **Boundary Risk**: Lowest (internal to plugin-core/src/di first; vscode leakage prevented by construction).
  - **ENDORSED + REFINED**: Proceed with typed tokens (e.g. `export const TOKENS = { Engine: 'ReducedDEngine' as const, ... } as const; type TokenKey = keyof typeof TOKENS;`) + declarative register in `di/inject.ts` v2 and refactored setup*.ts. Implement *before or interleaved carefully after* strict green. This unlocks clean common-di extraction per ADR decision (move wrapper + deps when patterns stabilized). Update 52 sites in burner batches with full critical verify each time.

- **common-errors-proposal.md** (common-errors pkg or enhanced common-all/error + ErrorService):
  - **Fit**: High volume (552 DendronError + 89 ErrorFactory across 113 files) but **new pkg not justified**. Core (417 LOC types/factories) already lives correctly in `common-all/src/error.ts` + `errorTypes.ts` (pure TS, zero deps, used by common-all/engine-server/plugin-core). Creating `common-errors` would trigger massive import churn for marginal cohesion gain.
  - **Refined Rec**: Enhance *in-place* inside common-all (e.g. `src/errors/` barrel or documented subsystem). Introduce `ErrorService` interface (pure, in common-all) for DI registration once container modernized. High DI synergy.
  - **Boundary**: Perfect (stays in common-all). Volume high but "enhance-in-place" wins over new common-*.
  - **Priority**: After DI burn (so ErrorService token can be registered declaratively).

- **dendron-config-proposal.md** (common-config or injectable ConfigService):
  - **Fit**: Medium. Split (ConfigUtils pure ~in common-all; DConfig 340LOC + FS/globals in common-server) is *intentional* per layer principles. 200+ refs but new `common-config` risks either duplicating logic or leaking node FS/os into browser-safe layers.
  - **Refined Rec**: Define `IConfigService` (or `DendronConfigService`) interface in common-all (or common-server), provide impls per layer (node in common-server, reduced/web in plugin-core). Make it a DI token. Register via the new declarative container. Strong DI synergy noted. Defer any dedicated pkg until after common-di + 1-2 services prove the pattern (post-DI-burn).
  - **Boundary Risk**: Medium-High if pkg created now (avoid).
  - **Priority**: Lowest of the three.

**Wave 2 Extraction Decision Framework** (codified in monorepo-architect/SKILL.md):
Prioritize along 4 axes (not just volume):
1. **@ts-burn / Strict Synergy** (immediate unblock of active work, esp. 52 DI sites)
2. **DI Synergy** (enables typed tokens/services/registration; fuels burner + future clean extractions)
3. **Volume** (dupe count, files, boilerplate)
4. **Cross-layer / Boundary Risk** (common-* pollution, churn vs benefit, vscode/node bleed)

**Scoring & Priority Order (post-strict-green or safe-interleave)**:
1. **di-container (ENDORSED)** — @ts-burn=CRITICAL, DI=CRITICAL, Volume=med, Risk=LOW → **Immediate next for momentum**. Use as ts-expect-error-burner primary roadmap.
2. **common-errors (refined: enhance common-all + ErrorService)** — Volume=HIGH, DI=HIGH, @ts=med, Risk=LOW → Post-DI-burn.
3. **dendron-config (refined: interfaces + DI token first)** — DI=HIGH, Volume=med, @ts=low, Risk=MED → After patterns stabilize.

**Refined Next Steps Chain (Non-Stop Momentum, Strict Green Invariant)**:
strict green (current wave-1, 329→0 prod errors) → **DI burn using di-container-proposal** (typed tokens + registerAll; launch ts-expect-error-burner + Self-Improver hooks; target 52→<20; update trackers) → extraction implementation (scaffold common-di per this ADR using proven patterns; enhance common-all/errors + ErrorService; ConfigService interfaces + registration; feed to Test-Guardian for DI surface; Doc-Master full Mermaid) → tooling/features/Milestone 2 complete.

No new common-* pkgs created in Wave 2 (enhance-in-place + interfaces preferred). ADR-0001 common-di decision remains the long-term home for the DI facade (v1 implementation starts in plugin-core per proposal).

**Links**: `docs/dev/extractions/di-container-proposal.md` (primary for burner), common-errors-proposal.md, dendron-config-proposal.md; updated SKILL.md + TRACKER + GROK.md + plugin-core.md.

---

*This ADR follows the lightweight style used for monorepo decisions in the Dendron 2026 modernization track (context + decision + consequences + alternatives). No prior ADR template existed in docs/dev/adr/ (first entry).*

**Post-M2-Smoke + common-errors enhance-in-place clarity Update (2026-06, Test-Guardian 019e7ce3-164e-7bf3-8fef-53d9ff8cf3ab 251.9s/34 + Hunter 266s/58)**: "Post-M2-Smoke + common-errors enhance-in-place clarity" locked (ErrorService future surface + doctor 6 checks error paths + re-smoke incl extraction roadmap + unit notes + "value of locking coverage plan at enhance-in-place decision time"). See doc-master/SKILL new lesson + advanced Mermaid (ErrorService + common-di reg flow + doctor 6 checks error paths subgraph + extraction roadmap state machine with "Current Status: Post-M2-Smoke + common-errors enhance-in-place clarity" + full credits incl 251.9s/34 + 266s/58 + two pulled 285.4s/60 + 239.2s/55 + Monorepo two + burner 330s/74 77% + Feature 283s/68 + priors; 4 mental passed + "THE CHAIN DOES NOT STOP"). Synced to 5 mand + GROK + proposals + SKILLs + self-test gate enforced. Handoff Monorepo exec (common-di phase2 + enhance-in-place + ErrorService reg via register*). THE CHAIN DOES NOT STOP.

---

**Verifier Post-Lerna A+B 214.2s/65 + p6-9 Stubs + Extraction PR #1 + M2 5663398c9 + Doctor Launch Overall GREEN (2026-06, appended per Verifier task)**: Proxies + self-test gates (incl 214.2s/65 + 177s/41 + 133.8s/36 + 289.5s/72 + "THE CHAIN DOES NOT STOP" + 0 strict/21@ts + doctor MVP usable) PASSED. Branch hygiene GREEN. Updated 5 mand + this ADR + GROK + new verifier-post-lerna-p6-9-100.md with "post 214.2s/65 + 177s/41 + overall GREEN" + full credits (Verifier + 214.2s/65 + 177s/41 + priors) + "THE CHAIN DOES NOT STOP". Gate PASSED + mental 3+. **VERIFICATION GATE PASSED + OVERALL GREEN**. Handoff Doc-Master/Self for 100%. MAX AUTONOMY. THE CHAIN DOES NOT STOP.

*Verifier 2026-05-31.*

