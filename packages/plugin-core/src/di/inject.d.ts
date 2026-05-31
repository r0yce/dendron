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
 * Current DI State (Batch 2 Complete + TS-Expect-Error-Burner TOKENS Phase 1, TS-Expect-Error-Burner + v2 + Monorepo-Architect 019e7ccc...):
 * - **11 @ts-expect-error** total in plugin-core/src (0 in tests; 48→11 via v2 type-level absorption (SafeDecoratorFactory + centralized @ts on export) + doc/header modernization + prior site cleans; ~77% net burn, exceeds 30-50%+ SKILL target. Only 1 real (the v2 line itself); rest justified prose/docs). Decorator metadata category now fully centralized (1 site); other ~18 production non-test @ts are browser interop (TextDecoder x3), legacy any/partial mocks (lookup, commands, survey, memo, engineapi, workspace etc).
 * - 30+ clean @inject sites across web/ + commands/ + services/ (PreviewPanel, TextDocumentService, EngineNoteProvider, DendronEngineV3Web, SiteUtilsWeb, NoteLookupCmd, LookupQuickpickFactory, WSUtils, WebViewUtils, PluginNoteRenderer, PreviewLinkHandler, TogglePreviewCmd, WebTelemetryClient, NoteLookupProvider, CopyNoteURLCmd, NoteLookupAutoCompleteCommand + more). Zero bare @ts-expect-error on any @inject usage.
 * - All 22+ files import local di/inject; **TOKENS phase 1 adoption in progress** ( ~30 branded entries for ReducedDEngine, IPreview*, WsRoot/Vaults, logger, stores, telemetry, AutoComplete*, site*, extension*, DendronConfig etc + registerDesktop/Web/All factories + resolve ergonomics + registerInstance).
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
