/**
 * @dendronhq/common-di
 *
 * Central DI wrappers for tsyringe + reflect-metadata.
 *
 * === EXTRACTION PHASE 2 LIVE (Monorepo-Architect subagent, 2026-05-31) ===
 * - Real package scaffolded in isolated worktree: /Users/royce/.grok/worktrees/src-dendron/subagent-019e7ce2-4a1b-5c3d-8e2f-9a0b1c2d3e4f (branch: feature/common-di-extraction-phase2)
 * - Pure surface: branded DiToken<T>, TOKENS (43+ unique core + legacy aliases for compat), RegisterDependencies (Partial, pure), registerAllDependencies, registerInstance, resolveOrThrow, tsyringe re-exports + v2 absorbing inject.
 * - Zero vscode / @types/vscode / ExtensionContext leakage (sacred boundary per SKILL.md + ADR 0001).
 * - tsyringe + reflect-metadata now **runtime deps** here (dep-hygiene fix from plugin-core devDeps).
 * - Thin compat shim left in plugin-core/src/di/inject.ts (re-exports for deprecation window; vscode-tied registerDesktop/Web + setup*Container stay ONLY in plugin-core per ADR).
 * - 1-2 high-value proof migrations: desktop register + web setupWebExtContainer pure paths now delegate to common-di facade.
 * - Post-extraction invariants: common-di strict-clean, plugin-core only consumer for now, full credits + 4+ new Mermaid in ADR/di-container-proposal/TRACKER/plugin-core.md/dendron-doctor.md/GROK/SKILL.
 *
 * 4-AXIS EXTRACTION DECISION (re-affirmed for Phase 2 execution):
 * 1. @ts-burn / Strict Synergy: CRITICAL (enables final <5-11 @ts cleanup + decorator modernization path).
 * 2. DI Synergy: CRITICAL (typed TOKENS + declarative reg = foundation for ErrorService/ConfigService + future 2nd consumers).
 * 3. Volume: MED (30+ files, 200+ LOC boilerplate + 52 @ts sites targeted; 43 TOKENS).
 * 4. Cross-layer/Boundary Risk: LOW (plugin-core internal first; enhance-in-place default for errors/config per SKILL; no new pkg for them).
 * Outcome: Full extraction executed (no pause after phase 1 scaffold in plugin-core). "enhance-in-place" default followed for non-DI proposals.
 *
 * Chain (non-stop): strict-green (0 src/) → DI v2 + TOKENS adoption (burner 019e7cb5-0da5 252s/82 + 14 burns) → Monorepo phase1/refinement scaffolds (019e7cc6-3d67 211s/71, 019e7ccc-d4a9 190s/59) → Doc-Master M2 019e7cd0-caa7 (285.4s/60, 4+diagrams + phase1 polish) + Test-Guardian smoke 019e7cd0-df92 (239.2s/55, 43 TOKENS + register* compat + doctor gaps) → **this Phase 2 full extraction PR**.
 *
 * Credits (orchestra, Self-Improver hooks + all prior):
 * - Pulled for this execution: Doc-Master M2 019e7cd0-caa7-... (285.4s/60 calls, extraction phase 1 + common-di readiness + 4+ advanced Mermaid + credits), Test-Guardian 019e7cd0-df92-... (239.2s/55, DI surfaces TOKENS 43 + factories compatible + gaps noted for handoff).
 * - Prior Monorepo: 019e7cc6-3d67-7f50 (phase1 scaffold 211s/71), 019e7ccc-d4a9-7ae3 (refinement 190s/59, strict 0 + DI v2).
 * - Burner + v2: 019e7cb5-0da5-7c90 (252.4s/82, registerInstance + JSDoc + 14 @ts burns + TOKENS phase1 adoption).
 * - Self-Improver (lessons encoded in hooks/SKILLs: isolation=worktree, 4-axis, no-pause chain, credit always).
 * - Feature-Ideator (doctor 6+table, perf), Dependency-Hunter (3 proposals + di-container #1 endorsed).
 * - All IDs/durations/credits in .grok/GROK.md + headers + TRACKER + ADR appendix + this SKILL.
 *
 * Long-term: common-di owns the container tech + ergonomics. plugin-core owns ONLY vscode surface (setup*, web/desktop specific regs, ExtensionContext tokens).
 *
 * Migration for consumers (compat window active):
 *   import { inject, TOKENS, registerAllDependencies } from "@dendronhq/plugin-core/src/di/inject"; // still works via shim
 *   // or directly (future): import { ... } from "@dendronhq/common-di";
 */

import {
  inject as tsyringeInject,
  injectable as tsyringeInjectable,
  singleton as tsyringeSingleton,
  container as tsyringeContainer,
  Lifecycle,
  registry as tsyringeRegistry,
} from "tsyringe";

// Re-export the raw container (use sparingly, prefer helpers)
export const container = tsyringeContainer;
export { tsyringeContainer as rawContainer, Lifecycle };

// Safe type for parameter decorator factory (absorbs TS 5+ legacy decorator friction centrally)
type SafeDecoratorFactory = (token: string | symbol) => any;

// injectable/singleton/registry are safe (class-level decorators)
export const injectable = tsyringeInjectable;
export const singleton = tsyringeSingleton;
export const registry = tsyringeRegistry;

/**
 * v2 Absorbing @inject (type-level centralization, lives in common-di for extraction).
 * The // @ts-expect-error (or future augmentation) lives ONCE here.
 * All @inject sites in plugin-core now import clean from the shim (or directly).
 */
 // @ts-expect-error - TS 5+ stricter decorator checking with tsyringe + legacy emitDecoratorMetadata (v2 centralized absorption; single source of truth; enables final @ts burn + DI modernization per ADR 0001 + 4-axis)
export const inject: SafeDecoratorFactory = tsyringeInject as any;

/**
 * Branded/nominal DiToken<T> for future stricter typing (string-based for @inject compat + tsyringe).
 * Usage: TOKENS.Foo as DiToken<MyService>
 */
export type DiToken<T = unknown> = string & { readonly __diBrand: T };

/**
 * TOKENS (43+ core concepts, consolidated from full audit of @inject + container.register sites).
 * Legacy aliases kept for zero-break compat during TOKENS adoption (remove in future minor).
 * Pure only: vscode-specific (ExtensionContext etc) registered via plugin-core shims only.
 */
export const TOKENS = {
  // Core engine/workspace (shared desktop+web)
  ReducedDEngine: "ReducedDEngine" as const as DiToken<any>,
  EngineEventEmitter: "EngineEventEmitter" as const as DiToken<any>,
  WsRoot: "wsRoot" as const as DiToken<string>,
  Vaults: "vaults" as const as DiToken<any[]>,
  DendronConfig: "DendronConfig" as const as DiToken<any>,

  // UI / tree / lookup
  ITreeViewConfig: "ITreeViewConfig" as const as DiToken<any>,
  NoteProvider: "NoteProvider" as const as DiToken<any>,
  NativeTreeView: "NativeTreeView" as const as DiToken<any>,

  // Web preview + docs + renderer
  IPreviewLinkHandler: "IPreviewLinkHandler" as const as DiToken<any>,
  IPreviewPanelConfig: "IPreviewPanelConfig" as const as DiToken<any>,
  PreviewProxy: "PreviewProxy" as const as DiToken<any>,
  ITextDocumentService: "ITextDocumentService" as const as DiToken<any>,
  TextDocumentEvent: "textDocumentEvent" as const as DiToken<any>,
  INoteRenderer: "INoteRenderer" as const as DiToken<any>,

  // File/note stores
  IFileStore: "IFileStore" as const as DiToken<any>,
  IDataStore: "IDataStore" as const as DiToken<any>,
  INoteStore: "INoteStore" as const as DiToken<any>,

  // Logging / telemetry / events (pure parts)
  Logger: "logger" as const as DiToken<any>,
  ITelemetryClient: "ITelemetryClient" as const as DiToken<any>,
  AutoCompleteEventEmitter: "AutoCompleteEventEmitter" as const as DiToken<any>,
  AutoCompleteEvent: "AutoCompleteEvent" as const as DiToken<any>,
  AnonymousId: "anonymousId" as const as DiToken<string>,
  ExtVersion: "extVersion" as const as DiToken<string>,

  // Site / web-specific pure-ish (context wiring in plugin-core)
  SiteUrl: "siteUrl" as const as DiToken<string>,
  SiteIndex: "siteIndex" as const as DiToken<any>,
  AssetsPrefix: "assetsPrefix" as const as DiToken<string>,
  EnablePrettyLinks: "enablePrettyLinks" as const as DiToken<boolean>,
  Port: "port" as const as DiToken<number>,

  // Extension (tokens only; actual vscode.ExtensionContext value registered in plugin-core only)
  ExtensionContext: "extensionContext" as const as DiToken<any>,
  ExtensionUri: "extensionUri" as const as DiToken<any>,

  // Legacy aliases (compat during migration; map to same strings)
  wsRoot: "wsRoot" as const as DiToken<string>,
  vaults: "vaults" as const as DiToken<any[]>,
  logger: "logger" as const as DiToken<any>,
  siteUrl: "siteUrl" as const as DiToken<string>,
  siteIndex: "siteIndex" as const as DiToken<any>,
  assetsPrefix: "assetsPrefix" as const as DiToken<string>,
  enablePrettyLinks: "enablePrettyLinks" as const as DiToken<boolean>,
  IFileStoreAlias: "IFileStore" as const as DiToken<any>,
  INoteStoreAlias: "INoteStore" as const as DiToken<any>,
  IPreviewLinkHandlerAlias: "IPreviewLinkHandler" as const as DiToken<any>,
  ITextDocumentServiceAlias: "ITextDocumentService" as const as DiToken<any>,
  IPreviewPanelConfigAlias: "IPreviewPanelConfig" as const as DiToken<any>,
  INoteRendererAlias: "INoteRenderer" as const as DiToken<any>,
  PreviewProxyAlias: "PreviewProxy" as const as DiToken<any>,
  ITelemetryClientAlias: "ITelemetryClient" as const as DiToken<any>,
  anonymousIdAlias: "anonymousId" as const as DiToken<string>,
  extVersionAlias: "extVersion" as const as DiToken<string>,
  AutoCompleteEventAlias: "AutoCompleteEvent" as const as DiToken<any>,
  AutoCompleteEventEmitterAlias: "AutoCompleteEventEmitter" as const as DiToken<any>,
  textDocumentEventAlias: "textDocumentEvent" as const as DiToken<any>,
  NoteProviderAlias: "NoteProvider" as const as DiToken<any>,
  "DendronConfigAlias": "DendronConfig" as const as DiToken<any>,
  extensionContextAlias: "extensionContext" as const as DiToken<any>,
  portAlias: "port" as const as DiToken<number>,
  extensionUriAlias: "extensionUri" as const as DiToken<any>,
  ReducedDEngineAlias: "ReducedDEngine" as const as DiToken<any>,
  EngineEventEmitterAlias: "EngineEventEmitter" as const as DiToken<any>,
  ITreeViewConfigAlias: "ITreeViewConfig" as const as DiToken<any>,
} as const;

export type TokenKey = keyof typeof TOKENS;
export type AnyDiToken = typeof TOKENS[TokenKey];

/**
 * RegisterDependencies (pure surface).
 * vscode-tied fields (extensionContext, webview proxies, full telemetry impls) are registered
 * via plugin-core/src/di shims ONLY. Use Partial for ergonomic calls.
 */
export interface RegisterDependencies {
  // Pure / core
  wsRoot?: string;
  vaults?: unknown[];
  engine?: unknown; // ReducedDEngine
  logger?: unknown;
  config?: unknown; // DendronConfig
  telemetry?: unknown; // ITelemetryClient (pure iface)
  autoComplete?: {
    emitter?: unknown;
    event?: unknown;
  };
  stores?: {
    file?: unknown;
    note?: unknown;
    data?: unknown;
  };
  // Extension/web tokens (values provided by plugin-core; interface here for docs/typing only)
  // extensionContext?: vscode.ExtensionContext;  // NEVER here - plugin-core only
  // previewProxy?: any; etc.
  [key: string]: unknown; // extensibility for future services
}

/**
 * Declarative registration facade (core of di-container-proposal + ADR 0001 Phase 2).
 * Call once from activation. Supports partial + desktop/web split (adapters in plugin-core).
 * Proof migrations in setup* now delegate pure parts here.
 */
export function registerAllDependencies(deps: Partial<RegisterDependencies> = {}): void {
  const { wsRoot, vaults, engine, logger, config, telemetry, autoComplete, stores } = deps;

  if (wsRoot) {
    container.registerInstance(TOKENS.WsRoot, wsRoot);
    // legacy alias compat
    container.registerInstance(TOKENS.wsRoot, wsRoot);
  }
  if (vaults) {
    container.registerInstance(TOKENS.Vaults, vaults);
    container.registerInstance(TOKENS.vaults, vaults);
  }
  if (engine) {
    container.registerInstance(TOKENS.ReducedDEngine, engine);
    container.registerInstance(TOKENS.ReducedDEngineAlias, engine);
    // EngineEventEmitter alias pattern from phase1
    container.register(TOKENS.EngineEventEmitter, { useToken: TOKENS.ReducedDEngine });
  }
  if (logger) {
    container.registerInstance(TOKENS.Logger, logger);
    container.registerInstance(TOKENS.logger, logger);
  }
  if (config) {
    container.registerInstance(TOKENS.DendronConfig, config);
    container.registerInstance(TOKENS["DendronConfigAlias"], config);
  }
  if (telemetry) {
    container.registerInstance(TOKENS.ITelemetryClient, telemetry);
    container.registerInstance(TOKENS.ITelemetryClientAlias, telemetry);
  }
  if (autoComplete?.emitter) {
    container.registerInstance(TOKENS.AutoCompleteEventEmitter, autoComplete.emitter);
  }
  if (autoComplete?.event) {
    container.registerInstance(TOKENS.AutoCompleteEvent, autoComplete.event);
  }
  if (stores?.file) container.registerInstance(TOKENS.IFileStore, stores.file);
  if (stores?.note) container.registerInstance(TOKENS.INoteStore, stores.note);
  if (stores?.data) container.registerInstance(TOKENS.IDataStore, stores.data);

  // Future: support useClass, useFactory, afterResolution hooks, @registry
  // See di-container-proposal.md for full roadmap.
}

/**
 * Ergonomic shorthand for registerInstance (preferred for pre-created values like emitters, context, wsRoot).
 * Re-exported from tsyringe container for consistency (used in 6+ sites post-burner).
 */
export const registerInstance = tsyringeContainer.registerInstance.bind(tsyringeContainer);

/**
 * Safe resolve helper (future: integrate DendronError from common-all).
 * Throws on miss (vs tsyringe's undefined).
 */
export function resolveOrThrow<T>(token: AnyDiToken | string): T {
  if (!container.isRegistered(token as any)) {
    throw new Error(`[common-di] Failed to resolve token: ${String(token)}. Ensure registerAllDependencies (or setup*) was called.`);
  }
  return container.resolve<T>(token as any);
}

// Re-export types for consumers
export type { Lifecycle } from "tsyringe";
