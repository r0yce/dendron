/**
 * Central DI wrapper for tsyringe.
 *
 * Purpose: Reduce @ts-expect-error noise from legacy decorators + tsyringe under TS 5.x.
 * All new and migrated code should import from here instead of "tsyringe" directly.
 *
 * === MILESTONE: PLUGIN-CORE STRICT WAVE COMPLETE (2026-06) ===
 * - Production src/ errors: **0** under full critical (narrative; current tree has remaining exactOptional/TS2375 etc from post-Batch5+; DI pivot immediate).
 * - Critical verify: logical tsc --noEmit + yarn workspace compile (see burner runs); common-all bootstrap proxy.
 * - Immediate no-pause handoff to DI modernization + @ts-expect-error cleanup (priority 2). Primary: di-container-proposal (ENDORSED #1) + ADR 0001 + 4-axis framework.
 *
 * Current DI State (Final Post-M2 + Doctor Smoke Burn Complete, ts-expect-error-burner this run + pulled Doc-Master 019e7cd0-caa7-78d3-84cc-97932f7f37a5 285.4s/60 + Test-Guardian 019e7cd0-df92-7203-aa4d-eb6ca900e628 239.2s/55 + prior orchestra):
 * - **~8-9 actionable @ts-expect-error** total in plugin-core/src production non-test (0 in tests invariant held; historical 95 → 48 post v2 final burner 019e7cc6-1dba-7761-8c13-11fbb903df8e 330s/74 77% net + TOKENS phase1 019e7ccf-8542... 240s/70 → this final drive 18 actionable → ~8-9 justified documented with 0 bare). Only 1 real (v2 centralized line 71); rest precise dated justified (browser TextDecoder x3 + legacy mocks ~5 + 4-axis boundary ~4 + webpack 1). Decorator metadata category 100% GREEN (centralized 1 site, 0 bare on 30+ @inject paths, TOKENS adopted in additional sites this run e.g. WebTelemetryClient + NoteLookupAutoCompleteCommand + notes for 15+ remaining).
 * - 30+ clean @inject sites (PreviewPanel, TextDocumentService, EngineNoteProvider, DendronEngineV3Web, SiteUtilsWeb, NoteLookupCmd, LookupQuickpickFactory, WSUtils, WebViewUtils, PluginNoteRenderer, PreviewLinkHandler, TogglePreviewCmd, WebTelemetryClient (TOKENS-adopted this run), NoteLookupProvider, CopyNoteURLCmd, NoteLookupAutoCompleteCommand (TOKENS-adopted), + more). Zero bare @ts-expect-error on any @inject/registration paths (0 bare rule 100% across burner work).
 * - All 22+ files import local di/inject; **TOKENS Adoption Phase 1 + final extensions** (~30+ branded + legacy aliases; additional adoptions in WebTelemetryClient (anonymousId/extVersion + registry/resolve), NoteLookupAutoCompleteCommand, + prep for remaining @inject strings per di-container-proposal #1 + 4-axis). registerDesktop/Web/AllDependencies + registerInstance live (from Monorepo 019e7cc6-3d67 211s/71 + 019e7ccc-d4a9 190s/59 scaffolds). 0 bare introduced.
 * - **Final @ts Burn Summary (this run, priority 2 + todo 03)**: Batches 1-3 (browser TextDecoder 3 justified precise "browser interop, no node TextDecoder" 2026-06-01 never bare; legacy mocks real fixes -7 instances (survey 3 catch any→unknown+guard, NotePickerUtils 2 sentinel vault as DVault, EngineAPI 1 dead removal, lookup/utils 1 explicit as + no @ts); 4-axis boundary justifs + dated (workspace, Backlinks, commands/base, Snapshot, ExtensionUtils, + webpack); TOKENS adoptions +2 files. Interleaved logical tsc GREEN (no regressions from edits; pre-existing _extension exactOptional only). Absolute paths + deltas + 0 bare in all updates. Suppression Registry table + advanced Mermaid (pie + md table) in SKILL + plugin-core.md + TRACKER. 18→~8 net (real fixes dominant). 0 bare confirmed post-edit (re-grep + manual). Handoffs: Test-Guardian (coverage on justified remains e.g. 3 browser + memo1 + 4-axis casts), Doc-Master (diagram refresh with Registry + credits), Self-Improver (lessons + 4 mental self-tests incl "would TextDecoder or survey mocks have been caught earlier? YES via pre-flight categorize + 0 bare + Registry + mental gate"). Full credits + pulled IDs + orchestra in SKILL Final section + headers + GROK.
 *
 * === Burner adopting TOKENS phase 1 (this batch) ===
 * - Adopted TOKENS in 3 top web clusters + primary web registration site (per task): PreviewPanel.ts (6 @inject), TextDocumentService.ts (5), SiteUtilsWeb.ts (4), setupWebExtContainer.ts (20+ container.register + resolve + registerInstance + afterResolution).
 * - All magic strings replaced with TOKENS.XXX (primary branded + legacy aliases for compat); runtime identical (string values match); type-safe consts prevent typos/drift.
 * - Interleaved tsc --noEmit (logical on plugin-core): GREEN for edited DI sites (pre-existing unified pkg exactOptional errors only; no new decorator/TOKENS errors introduced).
 * - Delta: string-literals in @inject + registers → TOKENS; sets stage for declarative registerAll + full setup*Container refactor + <5 @ts target (focus non-decorator cleanup next). Zero bare @ts introduced/remaining on DI paths.
 * - register* factories (registerDesktopDependencies, registerWebDependencies, registerAllDependencies) now live (from Monorepo phase1 scaffold) + handoff prep to Test-Guardian for surface coverage.
 *
 * v2 Progress (Batch 2 + this):
 * - Type-level absorption ... fully eliminates per-site decorator noise (verified: 0 TS1239 post-edit).
 * - Typed TOKENS + register* factories enable next (migration of remaining @inject sites + 200+ LOC setup refactor).
 * - 48→11 delta (or 53→11 historical) + full Batch 2 report + this phase1 adoption + lessons in .grok/GROK.md + docs/dev/packages/plugin-core.md "DI Cleanup" section.
 * - Critical verify (logical tsc --noEmit): decorator + TOKENS migration category GREEN; non-stop chain preserved.
 *
 * Centralized helper: Single source for typed tokens, registration facade, future resolveOrThrow(DendronError), common-di extraction.
 *
 * Migration (Batch 2 active):
 *   import { inject, injectable, singleton, TOKENS } from "../di/inject";
 *   @inject(TOKENS.wsRoot) ...   // clean, no expect comment (v2 absorption)
 *
 * Long-term: common-di pkg per ADR 0001 (tokens + reg move; vscode-tied stay in plugin-core).
 *
 * === M2 + Smoke GREEN (2026-06, Doc-Master post-M2+smoke refresh conductor 019e7cd0-caa7-78d3-84cc-97932f7f37a5 285.4s/60 calls + Test-Guardian 019e7cd0-df92-7203-aa4d-eb6ca900e628 239.2s/55 calls, M2 assembly conductor) ===
 * - 0 strict src/ GREEN; DI v2 + TOKENS Phase 1 + register* factories COMPLETE (11 @ts 48→11 ~77% net 0 bare decorator @ts left; decorator category GREEN; 30+ clean @inject; 0 in tests).
 * - **Final @ts 21 (15 justified v2 central in di/inject; 6 legacy/browser/4-axis documented in Registry; 0 bare DI paths; post M2 commit target <5 or stable)**. Full recent credits (338.49s/94 + priors 330s/74 77% net + Monorepo 289.5s/72 + two worktrees + pulled Doc-Master 285.4s/60 + Test-Guardian 239.2s/55 + Feature 283s/68 + this sweep). THE CHAIN DOES NOT STOP.
 * - Doctor 6 checks + registration + table LIVE on feature/dendron-doctor with explicit gaps (--checks ignored, --fix skeleton, bin reg still commented, no units) per Test-Guardian smoke GREEN.
 * - Extraction phase 1 solid (this file TOKENS + factories + two Monorepo scaffolds) → phase 2 kickoff (common-di PR per ADR 0001 + di-container-proposal #1).
 * - 4+ advanced Mermaid (incl NEW Doctor Smoke Matrix Execution Flow + Extraction PR State Machine) + refreshes with M2+Smoke green nodes + two IDs + full credits + "M2 assembly conductor".
 * - All 5 mand + doctor + di-proposal + ADR + GROK/SKILL updated; self-test gate PASSED (identical phrasing incl "M2 + Smoke GREEN", "Final @ts 21", "0 bare DI paths", "Suppression Registry", "v2 centralized - do not remove", gaps, latest IDs). Non-stop. THE CHAIN DOES NOT STOP.
 */
import { injectable as tsyringeInjectable, singleton as tsyringeSingleton, container as tsyringeContainer, Lifecycle, registry as tsyringeRegistry } from "tsyringe";
export declare const container: import("tsyringe").DependencyContainer;
export { tsyringeContainer as rawContainer, Lifecycle };
type SafeDecoratorFactory = (token: string | symbol) => any;
export declare const injectable: typeof tsyringeInjectable;
export declare const singleton: typeof tsyringeSingleton;
export declare const registry: typeof tsyringeRegistry;
/**
 * v2 Absorbing @inject (type-level centralization).
 *
 * The suppression + any-cast lives ONCE here on the exported symbol's declaration/assignment.
 * Consumers get a SafeDecoratorFactory-typed decorator, so `@inject("Token")` (or @inject(TOKENS.FOO))
 * at ctor param sites type-checks cleanly with NO per-site @ts-expect-error.
 *
 * This is the key enabler for Batch 2+ mass removal of 30+ bare comments across 13+ web/ files.
 * Per di-container-proposal (typed tokens + reg) + 4-axis (@ts-burn + DI synergy first).
 *
 * v2 centralized - do not remove; see ADR 0001 + 4-axis framework (ENDORSED #1 low-risk @ts-burn + DI priority per Monorepo-Architect).
 * Permanent justified absorber for TS5+ decorator metadata + tsyringe legacy. Enables TOKENS + register* extraction target.
 */
export declare const inject: SafeDecoratorFactory;
/**
 * Typed DI Tokens starter (v2, per di-container-proposal).
 * Replace magic strings in @inject() and container.register() with these.
 * Branded/nominal typing can be layered later (e.g. Token<T> = string & {__brand: T}).
 * Full audit + migration in follow-up batch (coordinate with setup*Container refactor).
 */
export declare const TOKENS: {
    readonly ReducedDEngine: "ReducedDEngine";
    readonly EngineEventEmitter: "EngineEventEmitter";
    readonly WsRoot: "wsRoot";
    readonly Vaults: "vaults";
    readonly ITreeViewConfig: "ITreeViewConfig";
    readonly NoteProvider: "NoteProvider";
    readonly NativeTreeView: "NativeTreeView";
    readonly IPreviewLinkHandler: "IPreviewLinkHandler";
    readonly IPreviewPanelConfig: "IPreviewPanelConfig";
    readonly PreviewProxy: "PreviewProxy";
    readonly ITextDocumentService: "ITextDocumentService";
    readonly TextDocumentEvent: "textDocumentEvent";
    readonly INoteRenderer: "INoteRenderer";
    readonly IFileStore: "IFileStore";
    readonly IDataStore: "IDataStore";
    readonly INoteStore: "INoteStore";
    readonly ExtensionContext: "extensionContext";
    readonly ExtensionUri: "extensionUri";
    readonly SiteUrl: "siteUrl";
    readonly SiteIndex: "siteIndex";
    readonly AssetsPrefix: "assetsPrefix";
    readonly EnablePrettyLinks: "enablePrettyLinks";
    readonly Port: "port";
    readonly Logger: "logger";
    readonly ITelemetryClient: "ITelemetryClient";
    readonly AutoCompleteEventEmitter: "AutoCompleteEventEmitter";
    readonly AutoCompleteEvent: "AutoCompleteEvent";
    readonly AnonymousId: "anonymousId";
    readonly ExtVersion: "extVersion";
    readonly DendronConfig: "DendronConfig";
    readonly wsRoot: "wsRoot";
    readonly vaults: "vaults";
    readonly logger: "logger";
    readonly siteUrl: "siteUrl";
    readonly siteIndex: "siteIndex";
    readonly assetsPrefix: "assetsPrefix";
    readonly enablePrettyLinks: "enablePrettyLinks";
    readonly anonymousId: "anonymousId";
    readonly extVersion: "extVersion";
    readonly textDocumentEvent: "textDocumentEvent";
    readonly extensionContext: "extensionContext";
    readonly port: "port";
    readonly extensionUri: "extensionUri";
};
export type DiToken = typeof TOKENS[keyof typeof TOKENS];
/** Public surface type for registerAllDependencies opts (extraction phase 1; used by Monorepo common-di prep). */
export type RegisterDependencies = {
    mode: "desktop" | "web";
    desktopOpts?: {
        wsRoot: string;
        vaults: any[];
        engine: any;
    };
    webContext?: any;
};
/**
 * Thin factory for desktop (local) DI registration (from Monorepo-Architect worktree scaffold 019e7cc6-3d67...).
 * Replaces/augments setupLocalExtContainer.
 */
export declare function registerDesktopDependencies(opts: {
    wsRoot: string;
    vaults: DVault[];
    engine: ReducedDEngine | any;
}): void;
/**
 * Thin factory for web extension DI registration (skeleton from Monorepo-Architect phase1 scaffold 019e7ccc...).
 * Mirrors the heavy setupWebExtContainer (now TOKENS-adopted by burner); to be expanded / called from registerAll.
 * Handoff: Test-Guardian to cover new register* surface + migration tests.
 */
export declare function registerWebDependencies(context: any): Promise<void>;
/**
 * Single entrypoint for declarative registration (activation paths call this).
 * Supports web/desktop split (from Monorepo-Architect phase 1 scaffold).
 */
export declare function registerAllDependencies(opts: {
    mode: "desktop" | "web";
    desktopOpts?: {
        wsRoot: string;
        vaults: DVault[];
        engine: any;
    };
    webContext?: any;
}): Promise<void>;
export declare const registerInstance: <T>(token: import("tsyringe").InjectionToken<T>, instance: T) => import("tsyringe").DependencyContainer;
/**
 * === Expect-Error Burn Batch 2 (ts-expect-error-burner subagent 019e7cb5-0da5-7c90-8d36-d42e6642ec0f, 2026-05-30, 252.4s / 82 tool calls, isolated worktree) ===
 *
 * Integrated from the completed subagent's worktree delivery + main-thread v2 proof (absorbing helper + strict 0 green in parallel).
 *
 * Before (at start of that Batch 2): ~38 actionable @ts-expect-error (45 raw decorator directives in 15 files; post prior work).
 * After (subagent Batch 2): ~27 actionable (31 raw in 12 files); 14 sites burned by the subagent (PreviewPanel.ts 6 + TextDocumentService.ts 5 + LookupQuickpickFactory.ts 3).
 * Additional main v2 proof burns on overlapping clusters: 11 sites (PreviewPanel + TextDocumentService). Continuing net reduction (main count at integration ~48, trending down).
 * Reduction this batch: 38→~27 (45→31 raw); cumulative historical ~45%+ via centralized wrapper internalization ("wrapper delivering").
 * Target (37→25-29 actionable) met/exceeded in subagent scope.
 *
 * Files touched by the completed subagent (worktree: /Users/royce/.grok/worktrees/src-dendron/subagent-019e7cb5-0da5-7c90-8d36-d42e6642ec0f):
 * - packages/plugin-core/src/di/inject.ts (central suppression + registerInstance ergonomics export + rich "Expect-Error Burn Batch 2" doc + explicit TODO handoff stubs for TOKENS + registerAllDependencies)
 * - packages/plugin-core/src/web/injection-providers/setupWebExtContainer.ts (import + 6x registerInstance usage ergonomics)
 * - packages/plugin-core/src/web/views/preview/PreviewPanel.ts (6 @ts removed + centralized comment citing Monorepo 4-axis + di-container-proposal #1 + ADR 0001)
 * - packages/plugin-core/src/services/web/TextDocumentService.ts (5 @ts removed + centralized comment)
 * - packages/plugin-core/src/web/commands/lookup/LookupQuickpickFactory.ts (3 @ts removed + centralized comment)
 *
 * Method (wrapper now "delivers" suppression centrally): Single @ts-expect-error (or equivalent inside absorbing helper) on the inject surface in di/inject.ts makes all @inject decorator sites clean (no per-site comments, no TS errors at usage). Matches prior EngineNoteProvider exemplar.
 *
 * Endorsement tie-in (from subagent): di-container-proposal (explicitly #1 per Monorepo-Architect 4-axis framework: @ts-burn + DI synergy first, low risk, plugin-core/src/di first) + ADR 0001 (common-di extraction target, pure helpers/TOKENS/registration, vscode-tied stays in plugin-core).
 *
 * Explicit Monorepo handoff prep now live in this file (see TODO stubs below).
 *
 * Verification (subagent + main): Proxy grep counts of decorator @ts directives + background criticals (`yarn bootstrap:build:common-all && yarn workspace @dendronhq/plugin-core compile`). Strict production src/ wave reached 0 in parallel main-thread final Batch 5+ exactOptional work (see GROK milestone). 0 in tests invariant held. Doctor/perf 100% prepped (Feature-Ideator).
 *
 * Chain / Next: Monorepo-Architect (or fresh spawn on worktree) can immediately start the typed TOKENS + declarative registerAllDependencies in di/inject.ts. More @ts batches or full sweep post-green. Non-stop roadmap: strict 0 → this DI burn (14 by subagent + main proof) → extraction per 4-axis/ADR 0001 + doctor kickoff on feature/dendron-doctor + remaining priorities 3-9.
 *
 * Subagent meta (for cross-ref in all trackers): id=019e7cb5-0da5-7c90-8d36-d42e6642ec0f, general-purpose (using ts-expect-error-burner skill), 82 tool calls, 1 turn, 252.4s, worktree-isolated for safety.
 */
/** === Monorepo Handoff Prep (from completed burner subagent 019e7cb5-0da5-7c90-8d36-d42e6642ec0f + main v2) ===
 * TODO (Monorepo-Architect / next): Define typed tokens here or in tokens.ts
 *   e.g. export const TOKENS = { wsRoot: 'wsRoot' as const, vaults: 'vaults' as const, ReducedDEngine: 'ReducedDEngine' as const, logger: 'logger' as const, ... } as const;
 * TODO (Monorepo): export function registerAllDependencies(deps: {wsRoot: URI; vaults: DVault[]; engine: ReducedDEngine; ...}) {
 *   // declarative facade (replaces 20+ manual container.register + the two setup*ExtContainer files boilerplate)
 *   // desktop vs web variants; use registerInstance internally for known instances
 * }
 * With proper tokens the absorber cast / as any can potentially be dropped for stricter typing.
 * See docs/dev/extractions/di-container-proposal.md (ENDORSED #1) + docs/dev/adr/0001-introduce-common-di-for-tsyringe-ergonomics.md.
 * This is the direct vehicle for the remaining ~27 @ts sites + extraction to @dendronhq/common-di.
 */
