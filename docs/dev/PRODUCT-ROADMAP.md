# Dendron Personal Fork — Product Roadmap

**Status:** Living source of truth (2026-07)  
**Replaces:** ad-hoc sprint noise in older modernization trackers, “100% ROADMAP COMPLETE” narrative in `00-GOALS-AND-ROADMAP.md` product sections, and feature kickoff stubs that were documentation-only.

Modernization/build history remains useful archive in:

- `docs/dev/MONOREPO-PACKAGES-MODERNIZATION-TRACKER.md` (package modernization **archive**)
- `docs/dev/MILESTONE-2-REPORT.md` (strict/DI **archive**)
- `docs/dev/11-FINAL-MODERNIZATION-REPORT.md` (toolchain **archive**)

**Product work is driven from this file.**

---

## Strategy: one primary lane, thin parallel only when independent

| Approach | When |
|----------|------|
| **One primary lane** | Default. Shared files (`_extension.ts`, activator, lookup, engine) thrash under parallel edits. |
| **Thin parallel** | Only for **non-overlapping surfaces**: docs, CLI-only health, pure webview CSS, independent feature scaffolds. |
| **Avoid full multi-lane parallel** | Perf activation + UI hub + AI all touch activation/commands DI — merge hell. |

**Rule:** Pick **one Sprint focus**. Optionally run a **support track** that does not edit the same hot files. Finish a vertical slice (code + verify + short doc note) before switching lanes.

---

## North star (personal fork)

1. **Feels fast** on real vaults  
2. **Feels quiet** (no upstream-era nags)  
3. **Feels modern** (cohesive UI)  
4. **Ritual features** (review, capture, tasks)  
5. **Optional local AI** later  

Success: you open VS Code and Dendron is the PKM you want every day.

---

## Lanes

### Lane P — Performance
- Lazy / deferred activation, lookup warm, webview split, perf status bar  

### Lane U — UI / UX
- Hub, welcome, preview history, backlinks snippets  

### Lane Q — Quality of life
- Quiet mode, vault focus, note history, safe bulk rename, personal VSIX identity  

### Lane F — Flagship
- Review ritual, capture inbox, task board, local AI, workmodes/spaces  

---

## Sprints

### Sprint 1 — “Feels fast + quiet” (**COMPLETE**)
Quiet mode, perf status bar, lazy activation, lookup limits.

### Sprint 2 — “Feels modern” (**COMPLETE**)
Hub (`Cmd+Shift+H`), welcome, preview history, backlinks snippets, webview split.

### Sprint 3 — “Can’t live without” (**COMPLETE**)
Review ritual, capture inbox (`Cmd+Alt+C`), task board, local AI opt-in.

### Sprint 4 — “Daily driver polish” (**COMPLETE**)

| # | Item | Lane | Status |
|---|------|------|--------|
| S4.1 | **Vault Focus** (`dendron.vaultFocus`) — status bar + workspace state; capture/review/board/bulk-rename respect focus | Q | **Done** |
| S4.2 | **Workmodes / Spaces** (`dendron.workmode`) — save/apply/delete named vault-focus presets | F/Q | **Done** |
| S4.3 | **Note history stack** (`dendron.noteHistoryBack` / `Forward`, `Cmd+Alt+-` / `=`) — navigate recently opened Dendron notes | Q | **Done** |
| S4.4 | **Safe Bulk Rename** (`dendron.safeBulkRename`) — regex dry-run markdown preview, conflict skip, confirm then apply | Q | **Done** |
| S4.5 | **Personal VSIX identity** — `displayName: Dendron Personal`, privacy-first description | Q | **Done** |

Hub lists vault focus, workmodes, and safe bulk rename.

**Next:** ad-hoc polish only (no Sprint 5 scheduled).

---

## Done recently (platform)

- Privacy-first telemetry, perf ring, TS7/Babel8, ESLint 10  
- Webview recovery (React 19, zod/cjs, process, ideSlice, preview dark mode)  

---

## Changelog

| Date | Note |
|------|------|
| 2026-07 | Sprints 1–3 complete. |
| 2026-07 | **Sprint 4 complete:** vault focus + status bar, workmodes, note history, safe bulk rename, personal VSIX branding. |
