# Dendron Fork: Goals & Roadmap Index

> Personal long-term maintenance fork of Dendron (local VS Code extension only).  
> Upstream: maintenance-only / development ceased.  
> Updated: **2026-07-24**

## Product roadmap (current)

**→ [PRODUCT-ROADMAP.md](./PRODUCT-ROADMAP.md)** is the living source of truth for:

- Completed sprints 1–5
- Awesome wave (Task Board editor/sidebar, Hub Home, smart reload, graph/payload diet, …)
- Optional next ideas

## AI agent docs (start here for implementation)

| Doc | Role |
|-----|------|
| [ai/README.md](../../ai/README.md) | Entry + read order |
| [ai/references/context.md](../../ai/references/context.md) | Architecture, features, gotchas |
| [ai/references/spec.md](../../ai/references/spec.md) | Implementation playbooks & conventions |

## Engineering / archive docs

| Doc | Role |
|-----|------|
| [DEV-EXTENSION.md](./DEV-EXTENSION.md) | **F5 uses tsc `out/`** vs webpack `dist/` |
| [MAINTAINABILITY.md](./MAINTAINABILITY.md) | Shared libs, extraction priorities, comment policy |
| [BUILD-AND-DEBUG.md](./BUILD-AND-DEBUG.md) | Daily verify gates |
| [BACKLOG.md](./BACKLOG.md) | Deferred **engineering** items (deps, ESLint) |
| [06-PERFORMANCE-PLAN.md](./06-PERFORMANCE-PLAN.md) | Perf measurement philosophy |
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

Toolchain / hygiene: privacy-first telemetry, health CLI, PerfRingBuffer, TypeScript 7, Babel 8, yargs 18, co-located emit cleanup, ESLint 10, webpack 5, React 19. Product sprints 1–5 + awesome wave: see PRODUCT-ROADMAP.

## Immediate product focus

**Sprints 1–5 + awesome wave: COMPLETE.**  
Pick optional next items from PRODUCT-ROADMAP or user request; update that file when shipping.

---

*Older “THE CHAIN DOES NOT STOP / 100% ROADMAP COMPLETE” modernization slogans are superseded by PRODUCT-ROADMAP.md + ai/ references.*
