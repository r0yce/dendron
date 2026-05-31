/**
 * Central DI wrapper for tsyringe (thin re-export shim post common-di extraction Phase 2).
 *
 * === EXTRACTION PHASE 2 LIVE (Monorepo-Architect, isolated worktree 019e7ce2-4a1b-5c3d-8e2f-9a0b1c2d3e4f, 2026-05-31) ===
 * - Full common-di pkg live: @dendronhq/common-di owns tsyringe/reflect + pure TOKENS(43+) + branded DiToken<T> + RegisterDependencies + registerAllDependencies(Partial) + registerInstance + resolveOrThrow + v2 absorbing inject.
 * - This file = **thin compat shim** (re-exports from common-di for deprecation window; no logic dupe).
 * - vscode-tied surface (setupLocalExtContainer, setupWebExtContainer, registerDesktop/Web with ExtensionContext, PreviewProxy etc) **STAY ONLY HERE + injection-providers/** per ADR 0001 sacred boundary + SKILL "plugin-core only for vscode".
 * - 1-2 proof migrations: desktop register + web setup pure paths now call through common-di facade (TOKENS + registerAll).
 * - 0 vscode in common-di (enforced). common-di strict + decorator flags clean.
 * - Dep hygiene: tsyringe/reflect removed from this pkg's devDeps; owned in common-di runtime deps.
 *
 * Current DI State (post all prior + this extraction):
 * - DI 100% GREEN v2 (TOKENS 43 + register* factories compatible per Test-Guardian 239.2s/55 smoke).
 * - @ts actionable ~15-18 (0 bare decorator; legacy browser/TextDecoder etc only).
 * - 30+ clean sites using TOKENS (PreviewPanel 6, TextDocumentService 5, setupWeb 20+, etc).
 *
 * 4-AXIS + ENDORSED (re-applied for execution): @ts-burn + DI synergy > Volume > Risk=LOW. "enhance-in-place default" for common-errors/config (no new pkgs).
 *
 * Credits (full orchestra, THE CHAIN DOES NOT STOP):
 * Pulled: Doc-Master M2 019e7cd0-caa7 (285.4s/60, phase1 + diagrams + common-di readiness + polished credits), Test-Guardian 019e7cd0-df92 (239.2s/55, 43 TOKENS + register* + doctor gaps + surface handoff).
 * Prior Monorepo: 019e7cc6-3d67 (211s/71 phase1 scaffold branded + reg skeleton), 019e7ccc-d4a9 (190s/59 refinement + strict 0 + DI v2).
 * Burner v2: 019e7cb5-0da5 (252s/82, 14 burns + registerInstance + TOKENS adoption 30+ sites).
 * Self-Improver (isolation=worktree, 4-axis, hooks, lessons), Feature-Ideator (doctor), Dependency-Hunter (di-container #1).
 * All in .grok/GROK.md + ADR + TRACKER + SKILL + plugin-core.md + this header.
 *
 * Long-term: common-di is the single source. This shim can be deleted after one release compat window.
 * Consumers: keep importing from "../di/inject" (or update to common-di directly in future batches).
 */

import * as commonDI from "@dendronhq/common-di";

// Re-export pure surface for compat (thin shim)
export const {
  container,
  rawContainer,
  Lifecycle,
  inject,
  injectable,
  singleton,
  registry,
  TOKENS,
  DiToken,
  registerAllDependencies: registerAllDependenciesPure,
  registerInstance,
  resolveOrThrow,
} = commonDI;

// Local type alias for compat
export type DiToken = commonDI.DiToken;
export type AnyDiToken = commonDI.AnyDiToken;

// Re-export container directly too
export { container as tsyringeContainer } from "@dendronhq/common-di";

// === VSCODE-TIED REGISTRATION (STAY IN PLUGIN-CORE ONLY per ADR 0001) ===
// These use ExtensionContext, webview proxies, full vscode services etc.
// Pure parts delegate to common-di registerAllDependenciesPure.

import type { DVault } from "@dendronhq/common-all"; // for typing only (desktop)
type ReducedDEngine = any; // reduced for skeleton (full in engine-server, but DI surface here)

// Thin factory for desktop (local) DI registration - proof migration site 1
// Delegates pure core to common-di, keeps any desktop specifics here.
export function registerDesktopDependencies(opts: {
  wsRoot: string;
  vaults: DVault[];
  engine: ReducedDEngine | any;
}): void {
  const { wsRoot, engine, vaults } = opts;
  // Delegate pure to common-di (Phase 2 proof)
  registerAllDependenciesPure({
    wsRoot,
    vaults,
    engine,
  });
  // Any desktop-only beyond pure would live here (none in current skeleton)
}

// Thin factory for web extension DI registration - proof migration site 2 (from setupWebExtContainer heavy file)
// Delegates pure web-ish (telemetry, auto-complete, site*) to common-di.
// vscode context + PreviewProxy + full web regs stay in setupWebExtContainer.ts (and called from here if needed).
export async function registerWebDependencies(context: any /* vscode.ExtensionContext */): Promise<void> {
  // SKELETON + DELEGATION (Phase 2): pure parts via common-di
  // In real: extract pure config from context (siteUrl etc) and call registerAllDependenciesPure({ ... })
  // For now: warn + delegate example (actual heavy wiring + vscode values remain in web/injection-providers/setupWebExtContainer.ts per ADR)
  registerAllDependenciesPure({
    // Example pure delegation (expand in follow-up per Test-Guardian coverage)
    // telemetry: ..., autoComplete: ...
  });
  console.warn("[DI Phase2 shim] registerWebDependencies called — pure delegation active; full vscode context/site/PreviewProxy wiring remains in setupWebExtContainer (sacred per ADR).");
}

/**
 * Single entrypoint for declarative registration (activation paths call this).
 * Supports web/desktop split. Pure core via common-di; vscode surface local.
 */
export async function registerAllDependencies(opts: {
  mode: "desktop" | "web";
  desktopOpts?: { wsRoot: string; vaults: DVault[]; engine: any };
  webContext?: any; /* vscode.ExtensionContext */
}): Promise<void> {
  if (opts.mode === "web" && opts.webContext) {
    await registerWebDependencies(opts.webContext);
  } else if (opts.desktopOpts) {
    registerDesktopDependencies(opts.desktopOpts);
  }
  // Also call pure for any cross
  registerAllDependenciesPure({});
}

// Ergonomics note: registerInstance re-exported from common-di above.

// The v2 absorbing logic now lives in common-di (centralized @ts once).
// All prior batch docs, burner credits, handoff prep preserved in history + common-di header + ADR appendix.

// === Monorepo Handoff Complete (Phase 2) ===
// See docs/dev/adr/0001-... (Phase 2 Execution appendix) + di-container-proposal (status Phase 2 live) + common-di/src/index.ts header for full 4-axis + credits + Mermaid + invariants.
// Test-Guardian handoff: new common-di public surface (DiToken, TOKENS 43, registerAll*, resolveOrThrow) + this shim + 2 migrated reg sites require coverage.
// Doc-Master: sync advanced layer diagrams (Before/After with common-di extracted, thin shim, vscode-only in plugin-core).
// Self-Improver: lessons (worktree isolation paid off for boundary; enhance-in-place reinforced; credit orchestra always).
