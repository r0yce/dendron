# Dendron Personal Fork — Product Roadmap

**Status:** Living source of truth (updated **2026-07-24**)  
**AI pair:** [ai/references/context.md](../../ai/references/context.md) · [ai/references/spec.md](../../ai/references/spec.md)

---

## Sprints

### Sprints 1–4 — **COMPLETE**

Fast/quiet, modern UI, rituals (review/capture/tasks/AI scaffold), daily polish (vault focus, workmodes, note history, safe bulk rename, branding).

### Sprint 5 — “Coherence & depth” — **COMPLETE**

| # | Item | Status |
|---|------|--------|
| S5.1 | Vault focus scopes **lookup** + **tree view** roots; tree refreshes on focus change | **Done** |
| S5.2 | **Process Inbox** triage (note / task / journal / dismiss) | **Done** |
| S5.3 | Unified history: preview navigations also push **NoteHistoryService** | **Done** |
| S5.4 | Review ritual marks `custom.lastReviewed` when opening from the list | **Done** |
| S5.5 | Unified webview theme layer (antd + content chrome) | **Done** |
| S5.6 | `unified/compat/unist` re-exports for visit/visitParents | **Done** |
| S5.7 | **Extract Tasks from Note** (offline bullets → task notes) | **Done** |
| S5.8 | **Workspace Health** dashboard report | **Done** |
| S5.9 | Random note + rituals respect vault focus | **Done** |
| S5.10 | Safe bulk rename pure planner + tests; `DEV-EXTENSION.md` + `dev-extension.sh` | **Done** |

Hub lists Process Inbox, Extract Tasks, Workspace Health.

### Awesome wave — **COMPLETE** (2026-07-24)

| Item | Status | Notes |
|------|--------|-------|
| Task Board **sidebar** kanban | **Done** | `dendron.task-board` HTML WebviewView |
| Task Board **editor** kanban | **Done** | `Dendron: Task Board` → `TaskBoardPanelFactory` |
| Dendron Home sidebar | **Done** | Live counts + actions + recent (`dendron.hub-home`) |
| Smart reload | **Done** | `SmartReloadService` + Reload Index prefers smart path |
| FileWatcher onDidChange | **Done** | External edits / git reindex (debounced) |
| Graph local-first + progressive Euler | **Done** | Defaults local; size-aware layout; deferred run |
| Graph vault focus | **Done** | `focusedVault` → vault filter toggles; default depth 2 |
| Webview payload diet | **Done** | Meta workspace sync, strip bodies, schema no full sync, lazy mermaid |
| Local AI Ollama defaults | **Done** | Model `llama3.2`, timeout, clearer errors; pure helpers |
| Pure tests | **Done** | `noteBodyUtils`, safe bulk rename planner |
| Webpack prod Sentry fix | **Done** | `sentryWebpackPlugin()` v5 API |

Key commits (main): `dd9f06473`, `ad5c776de`, `097a2b394`, `8a609b874` (+ sprint commits earlier).

---

## How to use the product (quick)

| Want | Do |
|------|-----|
| Command hub | **Dendron: Dendron Hub** / **Dendron Home** sidebar |
| Wide kanban | **Dendron: Task Board** (editor) |
| Narrow kanban | Activity bar → Task Board view |
| Scope vault | **Dendron: Vault Focus** |
| Reload index | **Dendron: Reload Index** (smart message when possible) |
| Local AI | Enable `dendron.localAI.*`; optional Ollama endpoint |

**Dev run:** compile plugin-core → F5. See [DEV-EXTENSION.md](./DEV-EXTENSION.md).

---

## Optional next (not scheduled)

- Drag-and-drop Task Board
- Streaming local AI + write-back
- Graph multi-pass hop layout
- More pure tests (inbox / health counters)
- Web extension webpack residual cleanup

Update this file when shipping user-facing work.

---

## Changelog

| Date | Note |
|------|------|
| 2026-07 | Sprints 1–4 complete; pushed to origin. |
| 2026-07-24 | **Sprint 5 complete:** vault-scoped lookup/tree, process inbox, unified history/theme, extract tasks, health dashboard, unist compat, dual-build docs. |
| 2026-07-24 | **Awesome wave complete:** editor+sidebar Task Board, Hub Home, smart reload, graph/payload/AI, FileWatcher change, webpack prod fix. AI context + full spec refreshed. |
