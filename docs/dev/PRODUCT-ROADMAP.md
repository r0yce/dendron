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

```text
Primary lane (this sprint)  ──►  ship vertical slice
Support track (optional)    ──►  docs / CLI / pure CSS only
```

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
- Lazy / deferred activation  
- Lookup warm + virtualization  
- Incremental index / smarter reload  
- Preview cache, graph progressive layout  
- Webview bundle split  
- Perf status bar + CI baselines  

### Lane U — UI / UX
- Dendron hub command  
- Welcome / empty state (fork branding)  
- Preview chrome (history, sticky title)  
- Backlinks redesign  
- Graph local-first defaults  
- Calendar → journal flow  
- Settings UI search  

### Lane Q — Quality of life
- Quiet mode (**in progress**)  
- Vault focus, safe bulk rename  
- Note history stack  
- CLI: search / stats / backup  
- Personal VSIX identity  

### Lane F — Flagship features
- Daily/weekly review ritual  
- Capture inbox  
- Tasks board lite  
- Local AI assist (opt-in)  
- Spaces / workmodes  

---

## Sprints

### Sprint 1 — “Feels fast + quiet” (**COMPLETE**)

| # | Item | Lane | Status |
|---|------|------|--------|
| S1.1 | **Quiet mode** setting (default on): skip surveys, lapsed-user modals, feature showcase spam | Q | **Done** |
| S1.2 | **Perf status bar** after activation (total ms + note count when available) | P | **Done** |
| S1.3 | Wire activation report into status bar + ring | P | **Done** |
| S1.4 | Defer non-critical interactive toasts (gated by quiet) | P/Q | **Done** |
| S1.5 | Lazy activation: defer language providers, tree init, secondary webviews, initializer | P | **Done** |
| S1.6 | Lookup: query `limit`, batched schema enhance, fuse warm after activate | P | **Done** |

**Next sprint:** Sprint 2 — Feels modern (hub, welcome, preview polish, backlinks, webview split).

### Sprint 2 — “Feels modern”
- Dendron hub + welcome rework  
- Preview history + polish  
- Backlinks context snippets  
- Webview split (preview vs graph)  

### Sprint 3 — “Can’t live without”
- Review ritual  
- Capture inbox  
- Task board lite  
- Local AI scaffold (opt-in)  

---

## Done recently (platform, not product lanes)

- Privacy-first telemetry + local NDJSON  
- PerfRingBuffer + `dendron health` / `dump_perf`  
- TypeScript 7, Babel 8, yargs 18, modern deps  
- ESLint 10 flat config  

---

## How to pick work

1. Read **Sprint ACTIVE** table above.  
2. Implement one row → verify (`yarn verify:local` + F5 smoke).  
3. Check off Status; add short note under “Changelog” below.  
4. Only then open the next row or next sprint.

---

## Changelog

| Date | Note |
|------|------|
| 2026-07 | Product roadmap established; Sprint 1 **complete**: quiet mode, perf status bar, lazy activation (critical vs deferred language features, non-blocking tree/views), lookup limit + schema batch enhance + fuse warm. Next: Sprint 2. |
