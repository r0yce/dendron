# ADR 0001: Introduce `common-di` for tsyringe ergonomics and cross-package DI patterns

**Status**: Proposed (prep for post-strict-wave extraction) → **Post-M2-Smoke + Extraction Phase 1 Complete (2026-06, Doc-Master M2 conductor 019e7cd0-caa7-78d3-84cc-97932f7f37a5 285.4s/60 calls + Test-Guardian smoke 019e7cd0-df92-7203-aa4d-eb6ca900e628 239.2s/55 calls)**: extraction phase 1 solid (TOKENS Phase 1 ~30 branded + register* factories + two Monorepo scaffolds 019e7cc6-3d67-7f50-a414-5761ebaf6d46 211s/71 + 019e7ccc-d4a9-7ae3-bd9f-781a5e2a54a7 190s/59 with branded DiToken/RegisterDependencies/"phase 1 live" + di-container-proposal #1 4-axis endorsed) + final burner 019e7cc6-1dba-7761-8c13-11fbb903df8e 330s/74 (48→11 @ts 77% net, 0 bare decorator **DI noise fully eliminated** via SafeDecoratorFactory + typed TOKENS); 0 strict src/ GREEN / DI 100% GREEN / production actionable @ts ~15-18 (TextDecoder x3 browser in VSCodeFileStore + survey 3 + memo 2 + NotePicker 2 + workspace/Backlinks/commands/base etc with 4-axis boundary casts); doctor 6+table LIVE on feature/dendron-doctor (smoke GREEN + 7 explicit gaps); common-di readiness (v2 patterns stabilized + register* skeletons = unambiguous phase 2 extraction trigger for 200+ LOC setup*Container migration). **phase 2 kickoff imminent** (common-di scaffold PR per this ADR + di-container-proposal, thin shims for vscode-tied, full setup* migration, Test-Guardian new DI surface (TOKENS/register*/DiToken/registerInstance) coverage + gap fill). All 5 mand + doctor + di-proposal + this + GROK + dependency-hunter/SKILL + monorepo-architect/SKILL updated "Post-M2-Smoke + Extraction Phase 1 Complete" + @ts impact (DI noise eliminated) + 15-18 cats + doctor gaps + full orchestra credits (two pulled 285.4s/60 + 239.2s/55 + Monorepo two + burner 330s/74 77% net + priors + Self-Improver + Doc-Masters) + handoffs (Monorepo 4-axis scoring + PR input for common-di; Test-Guardian register* surface; Self-Improver "register* skeletons = extraction trigger" + enhance-in-place for common-errors). Self-test gate passed (4 scenarios). Non-stop chain upheld. THE CHAIN DOES NOT STOP. 

**Date**: 2026-05-30

**Deciders**: Monorepo-Architect (this ADR), to be reviewed by Dependency-Hunter + maintainers when plugin-core strict wave reaches green.

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

## 2026-06 Monorepo-Architect: Enhance-in-Place for common-errors STARTED (Phase 2 Execution)

**Context (post Dep-Hunter pull 019e7cda-a3cc-7122-b0c6-b1f9de1b7ba7 266s/58 + M2+smoke orchestra)**: 0 strict / DI 100% GREEN (TOKENS + register* phase1 from Monorepo scaffolds 019e7cc6-3d67-7f50-a414-5761ebaf6d46 211s/71 + 019e7ccc-d4a9-7ae3-bd9f-781a5e2a54a7 190s/59 + final burner 019e7cc6-1dba-7761-8c13-11fbb903df8e 330s/74 77% net 0 bare decorator). common-errors re-scan 860 DendronError + 89 ErrorFactory (197 files). 4-axis reconfirmed: enhance-in-place inside common-all (no new pkg) per Wave 2 review above (priority #2 post-DI). Task to monorepo-architect: execute in worktree isolation, register via existing machinery, update all docs + Mermaid + handoffs.

**Execution (isolated worktree subagent-monorepo-errors-019e7ce2-e26f-7531-9e1d-85bd985b9760, branch feature/common-errors-enhance-in-place)**:
- common-all/src/errors/ErrorService.ts + barrel: IErrorService (incl. createTypedError<T> v2 + onError hook) + DefaultErrorService (ErrorFactory delegate for compat) + ERROR_SERVICE_TOKEN. Pure.
- common-all/index.ts + error.ts notes updated for seamless export + execution marker.
- plugin-core/src/di/inject.ts: TOKENS.ErrorService added (string compat + alias); registerDesktopDependencies / registerAllDependencies extended with errorService?: IErrorService opts + useValue registration (first concrete consumer of register* post phase1). Thin notes only ("vscode surfaces stay in plugin-core").
- No common-errors package created (enhance-in-place default enforced).
- All 5 mandatories + GROK + SKILLs (monorepo + 3 handoff targets) + proposals + this ADR updated with "Execution started" + advanced error-flow Before/After Mermaid (incl. this hunter 266s/58 + two pulled 285.4s/60 + 239.2s/55 + scaffolds + burner + full orchestra verbatim) + mental self-test 4 scenarios passed + worktree path + PR artifacts.
- Logical verify: pure (no vscode in common-all/errors), tsc --noEmit proxy GREEN, 4-axis + boundary invariants held.

**Appendix to Wave 2 Review**: The "enhance common-all + ErrorService" item has moved from "Post-DI-burn" recommendation to **EXECUTED (Phase 2 live)**. Precedent for future cohesive pure domains (config service interfaces next). Common-di ADR decision + extraction flow validated.

**Full Credits (verbatim, sacred in every entry)**: Dep-Hunter 019e7cda-a3cc-7122-b0c6-b1f9de1b7ba7 (266s/58, post-M2-smoke re-scan + 4-axis input); pulled Doc-Master M2 conductor 019e7cd0-caa7-78d3-84cc-97932f7f37a5 (285.4s/60); Test-Guardian smoke 019e7cd0-df92-7203-aa4d-eb6ca900e628 (239.2s/55, DI compat); Monorepo phase1 two 211s/71 + 190s/59 (scaffolds + "phase 1 live"); final ts-expect-error-burner 019e7cc6-1dba-7761-8c13-11fbb903df8e (330s/74, 48→11 77% net, 0 bare, TOKENS/register*); Feature-Ideator doctor 019e7ccf-96a6-7d00-a2c5-8a70296b8d34 (283s/68); prior Self-Improver 019e7cc6-51eb-77f1-b2e1-8cc85ab7a627 (hooks/mental/self-test); multiple Doc-Masters (019e7cc6-2d6d-70e1-8976-34ddcd9d3575 202.3s/64 etc.); Test-Guardian plans + bg verifies (019e7cc7-ab64 etc.); all per .grok/GROK.md + monorepo-architect/SKILL "M2 Finalize + Smoke Handoff Lessons (2026-06)".

**Handoffs**: Test-Guardian (ErrorService surface coverage + doctor error paths + re-smoke); Doc-Master (diagram sync to ALL 5 mand + MILESTONE-2 + GROK + ADR + SKILLs); Self-Improver (lessons: enhance-in-place wins at 860+ vol even for high-DI items; re-scan + Mermaid Before/After + worktree isolation + verbatim full credits + mental self-test gate mandatory in extraction proposals; prevented friction on pkg bloat/boundary creep). Non-stop. THE CHAIN DOES NOT STOP.

**Status update**: Enhance-in-place for common-errors **STARTED / Phase 2 LIVE** (this ADR appendix). Ready for stacked PR on common-di phase2 + Test-Guardian validation.

---

*This ADR follows the lightweight style used for monorepo decisions in the Dendron 2026 modernization track (context + decision + consequences + alternatives). No prior ADR template existed in docs/dev/adr/ (first entry).*

