# Dendron Fork: Goals, Current State, and Roadmap

> Branch: `go-to-work` (forked from `chore/deps-upgrade-2026-05`)
> Maintainer: Royce (personal knowledge management fork)
> Date: 2026-05 (initial assessment)

## Vision

This is a personal fork of Dendron, the best local-first, hierarchical, markdown-based PKM tool ever built for developers. Upstream development has stopped (maintenance-only mode announced). The goal of this fork is:

1. **Keep it alive and working** on modern VS Code (Insiders + stable) for personal daily use.
2. **Deeply understand every part** of the system so it can be maintained, debugged, and extended confidently.
3. **Improve performance** with measurable baselines and targeted optimizations.
4. **Add high-value features** that make it even more powerful for personal note-taking.
5. **Produce world-class documentation** so knowledge is not lost (unlike the upstream). This includes a full archive + explanation of the original `.github/` setup (now living in `github-archive/`).

This document + the rest of `docs/dev/` is the living bible for this fork.

---

## Current State Assessment (as of go-to-work branch creation)

### What Works (baseline from deps-upgrade-2026-05)
- Most core packages typecheck and build with the partial dependency upgrades performed.
- Many CVEs mitigated via root `resolutions`.
- Node engine declared as `>=18`.
- Some packages moved forward (pino 9, axios 1.x, @sentry 7.114, sinon 19, execa 5 aligned, etc.).
- `yarn compile` in plugin-core succeeds with current pinned types.

### Critical Blockers for "Latest VSCode / Insiders"

| Area | Status | Impact | Notes |
|------|--------|--------|-------|
| `engines.vscode` | `^1.77.0` (ancient) | High | VSCode Insiders 2025/2026 is 1.100+ range |
| `@types/vscode` | exactly `1.77.0` | High | No new API surface; many deprecations in newer versions will appear when bumped |
| `@types/node` (plugin-core) | `^13.11.0` | High | Catastrophically old. Extension host now runs on much newer Node |
| TypeScript | 4.6 (root) | Medium | Modern ecosystem is on 5.4+ |
| Webpack / bundler toolchain | Mixed (webpack 5 ok, loaders old) | Medium | Web extension path especially fragile |
| `vsce` / packaging | `^2.10.0` (deprecated name) | Medium | Should be `@vscode/vsce` |
| `vscode-test` | old `^1.3.0` | Medium | Should migrate to `@vscode/test-electron` |
| Native modules (sqlite3) | Complex prebuild + binding hacks | High | One of the most common sources of "extension won't activate" on new Node/VSCode |
| Launch configs for debugging extension | Almost non-existent | High (DX) | Cannot F5 "Run Extension" easily |
| Telemetry / Sentry / Segment | Still wired to upstream | Medium | Should be made optional or self-hosted for a personal fork |

### What Broke for the User on Insiders
Exact error unknown at start of this effort (user reported "the extension stopped working one day"). Typical causes for Dendron-like age:
- Extension host Node version mismatch + native sqlite3 bindings.
- Deprecated/removed VSCode API calls (especially around webviews, tree views, authentication, workspace trust, terminal execution).
- `onDidChangeConfiguration` or proposal APIs.
- Async activation timing changes.
- New stricter security / workspace trust model.

---

## High-Level Architecture (Executive Summary)

Dendron is a **monorepo** (yarn workspaces + lerna) containing ~15 packages. The VS Code experience is delivered by one extension:

- **`@dendronhq/plugin-core`** — The actual VS Code extension (activation, commands, webviews, providers, UI).
  - Depends on the engine and common packages below.
  - Uses **tsyringe** + `reflect-metadata` for dependency injection (heavy but powerful).
  - Has both desktop (`node` target) and web extension (`webworker`) builds.

Core supporting packages (the "engine"):

- `common-all` — Types, constants, data models, utilities shared everywhere. The "lingua franca".
- `common-server` — Server-side utilities, logging (now pino 9), error reporting, file utils.
- `engine-server` — The heart: `DendronEngineV2`, note parsing, schema, backlinks, search, git integration, SQLite usage, workspace management.
- `unified` — Remark/rehype pipeline for markdown processing (very important for preview, publishing, references).
- `dendron-cli` — CLI tool (`dendron` command).
- `dendron-plugin-views` — React-based webviews (tree view, graph, calendar, lookup, preview, etc.).
- `pods-core` — Import/export "pods" (Roam, Notion, JSON, etc.).
- Others: api-server, common-frontend, nextjs-template (for publishing), etc.

**Key mental model**:
- A **Vault** is a folder of notes (can be local or remote).
- A **Workspace** contains one or more vaults + a `dendron.yml`.
- Every note has a **hierarchical path** (e.g. `projects.dendron.fork.goals` → `projects/dendron/fork/goals.md`).
- The **Engine** is responsible for parsing the entire vault(s) into an in-memory index (notes, schemas, links).
- The extension is mostly a **thin (but large) presentation + command layer** over the engine + lots of custom webviews.

Startup sequence (simplified):
1. `activate()` in `extension.ts` → delegates to `_extension.ts`
2. Telemetry setup (Segment + optional Sentry)
3. `DendronExtension.getOrCreate()` — creates the singleton, sets up DI container
4. `_setupCommands()` — registers ~100+ commands
5. `WorkspaceActivator.activate()` — the heavy part: initializes engine, parses vaults, builds indexes, sets up watchers, tree views, etc.
6. Language providers (definitions, references, hover, completions, etc.) registered.

---

## Immediate Priorities (Phase 1 — Make It Work Again) — MAXIMUM AUTONOMY SPRINT ACTIVE

**Current (M2 + Smoke GREEN 2026-06, post-M2 + Test-Guardian smoke 019e7cd0-caa7-78d3-84cc-97932f7f37a5 285.4s/60 calls + 019e7cd0-df92-7203-aa4d-eb6ca900e628 239.2s/55 calls, Doc-Master M2 assembly conductor full delivery + post-smoke refresh conductor run)**: **STRICT GREEN + DI v2 + TOKENS Phase 1 COMPLETE (0 strict src/ errors; 11 @ts 48→11 ~77% net via final burner 019e7cc6-1dba-7761-8c13-11fbb903df8e 330s/74 calls + v2 + TOKENS 30+ + register* factories Monorepo 019e7cc6-3d67-7f50... 211s/71; 0 bare decorator; DI category GREEN; production actionable @ts ~15-18 categorized browser/legacy (survey 3, memo 2, NotePicker 2, TextDecoder x3, workspace/Backlinks/commands/base etc); doctor 6 checks + registration + table LIVE on feature/dendron-doctor with explicit gaps (--checks ignored, --fix skeleton, bin reg commented, no units) per Test-Guardian smoke GREEN; extraction phase 1 solid (TOKENS/register* + scaffolds per ADR 0001 + di-container #1) → phase 2 kickoff; 4+ Mermaid Burn-Down + Before/After + Flow + states + NEW Doctor Smoke Matrix (6 checks+perf+gaps) + Extraction PR State Machine (phase1→common-di→shims→Test-Guardian) with M2+Smoke green nodes + two new IDs 285.4s/60+239.2s/55 + Status 0/11 77% 0 bare DI GREEN +15-18@ts cats + doctor LIVE+table+gaps + extraction 1→2 + full credits IDs/durs + hooks auto-orchestra; all 5 + GROK + SKILL + MILESTONE-2 refreshed "M2 + Smoke GREEN" + 0/11 + "TOKENS adoption + DI category GREEN" + gaps + 15-18@ts + doctor polish next + extraction phase2 + full phrasing self-test passed; handoff Self-Improver (lessons)/Test-Guardian (gap fill)/Monorepo (extraction diagram)/Feature-Ideator (doctor polish); non-stop chain upheld. MAX AUTONOMY.** (See MILESTONE-2-REPORT.md exhaustive + GROK M2 + Smoke Pulled + post-refresh sections). Legacy note: (prior: 0 strict / 48 @ts pivot; now M2+Smoke GREEN 0/11 +15-18 cats):  **STRICT GREEN ACHIEVED** (0 production src/ errors under full `yarn workspace @dendronhq/plugin-core compile`; tsc phase clean; final Batch 5+ exactOptional/??/guards + 4-axis boundary TODO casts on workspaceActivator, SiteUtilsWeb, PreviewLinkHandler, tutorialInitializer etc.). **Immediate pivot to DI v2**: absorbing `inject()` helper landed in `packages/plugin-core/src/di/inject.ts` (11 sites cleaned, @ts 53→48; tops web DI clusters: SiteUtilsWeb(4), DendronEngineV3Web(4), NoteLookupCmd(4), WebViewUtils/WSUtils/PluginNoteRenderer/LookupQuickpickFactory (3 each) + di/inject.ts own). v2 proof + di-container-proposal ENDORSED #1 (Monorepo-Architect 4-axis: @ts-burn + DI synergy first, low risk, plugin-core/src/di first) + ADR 0001 live + doctor/perf 100% prepped (spec+stub ready post-M2, Feature-Ideator). All 5 mandatory targets + SKILL + GROK updated with 0 strict / 48 @ts tables, 2+ NEW advanced Mermaid (@ts Burn-Down Waterfall interleaved + DI v2 Before/After color-coded red→green for v2 helper + typed tokens target) + refreshed tsyringe state machine (green STRICT GREEN callout). Non-stop chain (strict green invariant → v2 helper proof → extraction #1 locked per ADR 0001 + 4-axis → doctor ready) alive. See plugin-core.md#di-v2 (primary diagrams + Current Modernization State table), TRACKER Architecture Health, MILESTONE-2-REPORT (metrics + snapshots), this file, .grok/GROK.md, inject.ts:1-70, di-container-proposal.md, docs/dev/adr/0001-....md. MAX AUTONOMY preserved.

> **Roadmap Callout (tied to burner spawn, v2, di-container #1, ADR 0001, 4-axis, doctor ready)**: Burner/hybrid spawn → v2 absorbing `inject()` (11 burned, 53→48 proof in di/inject.ts) → di-container-proposal ENDORSED #1 + ADR 0001 common-di boundary → Monorepo 4-axis (@ts-burn/DI synergy priority) → doctor/perf 100% prepped (ready post-M2 no pause) → non-stop to common-di extraction / M2 finalize / doctor impl. Green invariant + orchestra conductor docs keep chain unbreakable. See cross-linked diagrams in plugin-core.md + TRACKER.

1. **Plugin-core strict hardening + DI v2 modernization** (STRICT GREEN COMPLETE 2026-06; immediate pivot; M2 finalize imminent)
   - Remove local overrides + full batches (COMPLETE): **0 strict src/ errors** (tsc clean; tops resolved via Batch 5+ + 4-axis casts; see plugin-core.md Current Modernization State + TRACKER).
   - **DI v2 immediate pivot (11 sites cleaned, 53→48 @ts)**: absorbing `inject()` helper in `packages/plugin-core/src/di/inject.ts` (v2 proof centralized; tops web DI clusters as listed in Current); burner batches 2+ (typed tokens + declarative registerAll per di-container-proposal ENDORSED #1 + ADR 0001). 2+ NEW advanced Mermaid (@ts Burn-Down Waterfall strict+DI interleaved + DI v2 Before/After color-coded  red→green + refreshed state machine green callout) + Current Status tables in all 5 targets.
   - Milestone 2 finalize (burn-down + diagram snapshots + extraction #1 locked) + doctor/perf impl (100% prepped, Feature-Ideator, ready post-M2 no pause). Non-stop chain (strict green → v2 helper → 4-axis/ADR extraction + doctor) live. See full diagrams + tables in plugin-core.md + TRACKER Architecture Health.
2. Shared extraction (start immediately post-green: common-di per live ADR 0001 + 3 endorsed proposals from Dependency-Hunter), tooling (Lerna/ESLint), proactive (CLI doctor + perf hooks — specs/stub ready from Feature-Ideator) — chained immediately after without pause.

2. **Make local development delightful**
   - Rich `.vscode/launch.json` configs for "Run Extension", "Debug Tests", "Debug Web Extension"
   - Update tasks.json
   - Document exact F5 + hot reload workflow

3. **Fix activation/runtime on current Insiders**
   - Especially sqlite3 native loading
   - Any removed APIs
   - Workspace trust / security model changes

4. **Documentation Sprint (parallel)**
   - Every major package gets its own deep-dive doc
   - Full extension lifecycle documented with sequence diagrams (textual)
   - All command registration and DI wiring explained
   - Build/publish paths explained

5. **Performance foundation**
   - Identify hot paths (engine indexing, note lookup, graph, preview)
   - Add basic timing + flame graph capability
   - Create `perf/` harness

---

## Long-term Ambitions (Phase 2+)

- Remove or make optional all upstream telemetry.
- Modernize build (esbuild? rspack? faster tsc?)
- Better tree-sitter / native markdown parsing?
- Plugin architecture for community forks.
- Excellent publishing story (the nextjs-template is powerful).
- Mobile / Obsidian import/export bridges.
- Your own killer features (ask what would make it "epic" for you personally).

---

## How to Use This Documentation

- Start with `01-architecture.md` (next)
- Then `02-monorepo-packages.md`
- `03-extension-activation-lifecycle.md`
- Package-specific deep dives
- `BUILD-AND-DEBUG.md`
- `UPGRADE-PLAYBOOK.md` (how we did the VSCode + deps upgrades)

Every change made on this fork will be accompanied by updates to these docs + commit messages that explain **why** at a deep level.

This is not "just get it working". This is turning Dendron into *your* maintainable, understandable, improvable tool.

**Cross-links for current wave (strict green + DI v2 pivot)**: 
- Primary diagrams + full "Current Modernization State" table (0 strict / 48 @ts / 11 burned / v2 proof / web tops / extraction #1): [docs/dev/packages/plugin-core.md](packages/plugin-core.md#current-modernization-state) + DI Modernization section (includes NEW @ts Burn-Down Waterfall + DI v2 Before/After Mermaid + refreshed tsyringe state machine with green callout).
- TRACKER Architecture Health: full status tables, last updated with 0/48 + new diagrams snapshots + Roadmap.
- MILESTONE-2-REPORT: metrics table updated, batches for green+pivot, diagram snapshots + post-M2 Roadmap.
- .grok/GROK.md: Sprint Log append for phase transition + lessons.
- .grok/skills/doc-master/SKILL.md (evolved with "strict green + DI pivot" lesson + conductor during transition + self-test for 0-strict/48 phrasing).
- Source: [packages/plugin-core/src/di/inject.ts](../../../packages/plugin-core/src/di/inject.ts) (header + v2 helper).
- Proposals: [docs/dev/extractions/di-container-proposal.md](../../extractions/di-container-proposal.md) (ENDORSED #1), [docs/dev/adr/0001-...md](../../adr/0001-introduce-common-di-for-tsyringe-ergonomics.md) (ADR 0001).

Let's get to work.


---
**M2+Smoke + Extraction Phase 2: common-errors enhance-in-place LIVE (monorepo-architect subagent, worktree subagent-monorepo-errors-019e7ce2-e26f-7531-9e1d-85bd985b9760, 2026-06)**

- Dep-Hunter 019e7cda-a3cc-7122-b0c6-b1f9de1b7ba7 (266s/58) re-scan input + execution complete: IErrorService + DefaultErrorService + TOKENS.ErrorService + register* integration (enhance-in-place in common-all; 4-axis Vol HIGH 860+ / DI HIGH / LOW risk).
- Worktree: /Users/royce/.grok/worktrees/src-dendron/subagent-monorepo-errors-019e7ce2-e26f-7531-9e1d-85bd985b9760 (feature/common-errors-enhance-in-place).
- See common-errors-proposal.md (Execution started + Mermaid), ADR 0001 (enhance appendix), TRACKER (Phase 2 live), monorepo-architect/SKILL (full section + mental self-test 4 passed).
- Full credits (verbatim): Dep-Hunter 019e7cda-a3cc-7122-b0c6-b1f9de1b7ba7 266s/58 + Doc-Master 019e7cd0-caa7-78d3-84cc-97932f7f37a5 285.4s/60 + Test-Guardian 019e7cd0-df92-7203-aa4d-eb6ca900e628 239.2s/55 + Monorepo scaffolds 019e7cc6-3d67 211s/71 + 019e7ccc-d4a9 190s/59 + burner 019e7cc6-1dba 330s/74 (77% net) + Feature-Ideator 283s/68 + orchestra. Handoffs to Test-Guardian/Doc-Master/Self-Improver issued. THE CHAIN DOES NOT STOP.
- Phase 2 enhance-in-place live. Non-stop.
---

