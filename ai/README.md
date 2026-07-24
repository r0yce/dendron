# AI agent entrypoint

Read these **in order** before implementing features or fixes:

| # | Doc | Purpose |
|---|-----|---------|
| 1 | **[references/context.md](./references/context.md)** | What this fork is, architecture, packages, dual-build, gotchas |
| 2 | **[references/spec.md](./references/spec.md)** | How to implement: conventions, patterns, file map, test gates |
| 3 | **[../docs/dev/PRODUCT-ROADMAP.md](../docs/dev/PRODUCT-ROADMAP.md)** | Product status (sprints + awesome wave) |
| 4 | **[../docs/dev/DEV-EXTENSION.md](../docs/dev/DEV-EXTENSION.md)** | F5 vs webpack — **critical** for local extension work |
| 5 | **[../docs/dev/BACKLOG.md](../docs/dev/BACKLOG.md)** | Deferred engineering (deps, ESLint, bundler) |

Supporting:

- [references/backlog.md](./references/backlog.md) — short agent mirror of BL-*
- [references/upgrade-plan.md](./references/upgrade-plan.md) / [upgrade-changelog.md](./references/upgrade-changelog.md) — historical modernization notes (partially superseded)

**Owner intent:** personal Dendron fork for **local VS Code only**. Prefer compile-green + F5 over full monorepo CI. Do not push unless asked. Do not publish to npm or merge upstream.
