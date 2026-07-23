# Dendron Fork: Goals & Roadmap Index

> Personal long-term maintenance fork of Dendron (local VS Code extension only).  
> Upstream: maintenance-only / development ceased.

## Product roadmap (current)

**→ [PRODUCT-ROADMAP.md](./PRODUCT-ROADMAP.md)** is the living source of truth for:

- Lane strategy (one primary lane; thin parallel only when independent)
- Sprints (active = “Feels fast + quiet”)
- Performance, UI/UX, QoL, and flagship feature lanes

Do **not** invent competing sprint systems in modernization trackers.

## Engineering / archive docs

| Doc | Role |
|-----|------|
| [BUILD-AND-DEBUG.md](./BUILD-AND-DEBUG.md) | Daily verify gates |
| [BACKLOG.md](./BACKLOG.md) | Deferred **engineering** items (deps pins, ESLint notes) |
| [06-PERFORMANCE-PLAN.md](./06-PERFORMANCE-PLAN.md) | Perf measurement philosophy (aligned to PRODUCT-ROADMAP) |
| [01-ARCHITECTURE-OVERVIEW.md](./01-ARCHITECTURE-OVERVIEW.md) | Mental model |
| [MONOREPO-PACKAGES-MODERNIZATION-TRACKER.md](./MONOREPO-PACKAGES-MODERNIZATION-TRACKER.md) | **Archive** — package modernization history |
| [MILESTONE-2-REPORT.md](./MILESTONE-2-REPORT.md) | **Archive** — strict mode / DI wave |
| [11-FINAL-MODERNIZATION-REPORT.md](./11-FINAL-MODERNIZATION-REPORT.md) | **Archive** — toolchain |
| [TELEMETRY.md](./TELEMETRY.md) | Privacy-first telemetry |

## Vision (unchanged)

1. Keep Dendron working on modern VS Code for **personal daily use**.
2. Understand every subsystem deeply enough to maintain it alone.
3. Improve **perceived performance** with measurement.
4. Add high-value **personal** features (review, capture, tasks, optional local AI).
5. Keep documentation honest and up to date.

### Scope

- **Not** publishing `@dendronhq/*` to npm.
- **Not** merging upstream.
- Success: build → F5 or local `.vsix` → daily use.

## Platform completed (2026)

Toolchain / hygiene (not product lanes): privacy-first telemetry, health CLI, PerfRingBuffer, TypeScript 7, Babel 8, yargs 18, co-located emit cleanup, ESLint 10. See git history and archive docs above.

## Immediate product focus

**Sprint 1 — Feels fast + quiet** (see PRODUCT-ROADMAP.md):

- Quiet mode (default on)
- Perf status bar
- Then lazy activation + lookup speed

---

*Older “THE CHAIN DOES NOT STOP / 100% ROADMAP COMPLETE” product narrative is superseded by PRODUCT-ROADMAP.md.*
