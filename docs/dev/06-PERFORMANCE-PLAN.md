# Performance Measurement & Improvement Plan

One of the explicit goals of this fork is to make Dendron *feel* fast and to be able to prove it with data.

This document defines how we will approach performance.

## Current Situation (May 2026)

Dendron was already quite fast for its era, but:

- No systematic timing instrumentation in the critical paths.
- Startup (especially first-time or after large changes) can feel slow on big vaults.
- The graph view, backlinks panel, and lookup can have noticeable lag on very large note counts (10k+).
- Native module (sqlite + Prisma) initialization cost is opaque.
- There are almost certainly low-hanging fruit in hot loops (note traversal, link resolution, markdown transforms).

We currently have almost zero visibility into where time is actually spent.

## Philosophy

1. **Measure first, optimize second.**
2. Make measurement cheap and always-on in dev (with opt-in in prod builds).
3. Focus on **perceived performance** for the user (time to usable UI, lookup latency, typing responsiveness) more than micro-benchmarks.
4. Keep the system understandable — no premature cleverness.

## Measurement Layers (Planned)

### Layer 1: Activation & Startup Timings (Highest Priority)

Instrument the major phases inside `_activate` and `WorkspaceActivator`:

- Time from `activate()` entry → telemetry ready
- Time to `DendronExtension.getOrCreate` complete
- Time to command registration complete
- Time for `WorkspaceActivator.activate()` (the big one)
  - Vault discovery
  - Engine creation + init
  - Full index
  - Tree view + webview creation
  - Language provider registration
- Time until `dendron:pluginActive` becomes true

**Output**: Structured logs + (later) a small performance panel or status bar item in dev mode.

### Layer 2: Engine Operations

Add timing around:

- `engine.init()`
- `engine.updateNote()`
- `engine.queryNotes()`
- Backlink / reference computation
- Schema application

### Layer 3: User-Facing Features

- Note lookup (time from keystroke to results)
- Graph view rendering + layout
- Preview panel (initial render + note ref expansion)
- Rename / refactoring operations

### Layer 4: Memory & Resource Usage

- Heap snapshots on demand
- Number of active file watchers
- Size of the in-memory note index (notes + links)
- Event listener leaks

## Tools & Infrastructure We Will Add

1. **Simple `PerformanceTimer` utility** (in `common-all` or `common-server`)
   - Hierarchical named timers
   - Automatic logging at key points
   - Optional export to JSON for analysis

2. **Dev-only performance HUD** (webview or output channel + status bar)
   - Toggle via `dendron:devMode`

3. **Automated perf test harness**
   - Already partially exists (`ci:test:plugin-perf`)
   - We will expand it with a standard large vault fixture + reproducible measurements

4. **Flame graphs / CPU profiles**
   - Document how to capture them inside the Extension Host (Chrome DevTools protocol)

5. **Baseline numbers**
   - We will capture "before" numbers on a standard test vault once instrumentation lands.
   - Then track regressions.

## First Concrete Steps (Immediate Next Work)

1. Create `packages/common-all/src/perf` (or similar) with a tiny zero-dependency timer.
2. Wire basic timing through the activation path in `_extension.ts` and `WorkspaceActivator`.
3. Log structured timing data to the "Dendron" output channel when `LOG_LEVEL=debug` or a special `DENDRON_PERF=1` env var.
4. Add a command `Dendron: Dev: Show Performance Report` that dumps the last activation timings.
5. Document the exact commands + vault used for reproducible baselines.

## Long-term Aspirations

- Continuous performance tracking in CI (on a standard vault size).
- Automatic regression alerts (if a PR makes activation 15% slower, it gets flagged).
- User-facing "Dendron Health" panel that shows vault size vs. perceived speed.
- Experiment with incremental indexing improvements, worker threads (where possible), or caching strategies.
- Consider moving hot paths (especially markdown transforms for preview) to a faster engine (tree-sitter, swc, etc.) in the future.

## Success Criteria

We will consider the performance work successful when:

- A new developer can open a 5,000+ note vault and have a usable Dendron UI in < 3 seconds on a modern machine (after first run).
- Lookup feels instant even at 20k+ notes.
- We have before/after numbers for every major optimization we ship.
- The system never gets slower without us noticing.

---

This document will be updated as we implement each layer.

The goal is not to turn Dendron into a benchmark-chasing tool. The goal is to keep it feeling magical as your second brain grows to tens of thousands of notes over many years.
