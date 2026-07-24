# Dendron Personal Fork — AI Implementation Spec

> **Operational contract for agents implementing features, fixes, and refactors.**  
> Read [context.md](./context.md) first for architecture and status.  
> Updated: **2026-07-24**

---

## 0. Mission & constraints

| Rule | Detail |
|------|--------|
| Primary product | Local VS Code extension for personal PKM |
| Out of scope unless asked | npm publish, upstream PRs, full marketplace packaging |
| Quality bar | `plugin-core` compile green; prefer pure unit tests for new logic |
| Git | Commit when user asks; **push only when user asks** |
| Autonomy | Prefer multi-file completeness over partial stubs |
| Docs | Update this pair + PRODUCT-ROADMAP when product surface changes |

---

## 1. Agent read order (mandatory)

1. `ai/references/context.md` — orientation  
2. **This file** — how to implement  
3. `docs/dev/PRODUCT-ROADMAP.md` — what is already done  
4. `docs/dev/DEV-EXTENSION.md` — F5 vs webpack  
5. Target package docs under `docs/dev/packages/` if touching a known subsystem  
6. Existing similar command/service — copy patterns before inventing new ones  

---

## 2. Implementation playbooks

### 2.1 New VS Code command

1. Add entry to `DENDRON_COMMANDS` in `packages/plugin-core/src/constants.ts`  
2. Implement `packages/plugin-core/src/commands/YourCommand.ts` extending `BasicCommand`  
3. Export from `packages/plugin-core/src/commands/index.ts` (auto-registration path)  
4. Add `package.json` contributes: `commands` + `commandPalette` when clauses  
5. Optional: Hub entry in `DendronHubCommand.ts`  
6. `yarn workspace @dendronhq/plugin-core compile`  
7. F5 / Reload — confirm palette title appears  

**Patterns to copy:**

| Kind | Example |
|------|---------|
| Ritual with vault focus | `ProcessInboxCommand`, `ReviewRitualCommand` |
| Pure planner + thin command | `safeBulkRenamePlan` + `SafeBulkRenameCommand` |
| Open editor webview | `TaskBoardCommand` → `TaskBoardPanelFactory` |
| Opt-in settings | `LocalAIAssistCommand` + package.json `configuration` |

### 2.2 New sidebar webview (HTML — preferred for simple UI)

1. Add `DendronTreeViewKey` + `TREE_VIEWS` in `packages/common-all/src/constants/views.ts`  
2. Rebuild `common-all`  
3. `package.json` → `contributes.views` under dendron container  
4. `constants.ts` `DENDRON_VIEWS` via `treeViewConfig2VSCodeEntry`  
5. Class implementing `vscode.WebviewViewProvider`  
6. Register in `workspace.ts` `setupViews` with `registerWebviewViewProvider` + `retainContextWhenHidden`  
7. Use VS Code CSS variables; `enableScripts: true`; `postMessage` for actions  
8. Respect `WorkspaceModesService.filterNotesByFocus` when listing notes  

**Copy:** `TaskBoardWebview.ts`, `HubHomeWebview.ts`, shared logic in `taskBoardShared.ts`.

### 2.3 Editor webview panel (full-width)

1. Factory with static `_panel?: WebviewPanel`  
2. `vscode.window.createWebviewPanel(id, title, ViewColumn.One, { enableScripts, retainContextWhenHidden })`  
3. Reveal existing panel if open  
4. Share HTML/message handlers with sidebar when possible  

**Copy:** `TaskBoardPanelFactory.ts`.

### 2.4 React webview change (preview / graph / calendar)

1. Edit `packages/dendron-plugin-views/src/...`  
2. Host message plumbing in `plugin-core` (`GraphPanel`, `NoteGraphViewFactory`, `PreviewPanel`, …)  
3. Types/enums in `common-all` if protocol changes  
4. Rebuild views: `yarn workspace @dendronhq/dendron-plugin-views run build:dev`  
5. Recompile plugin-core if host changed  
6. **Payload diet:** prefer `NotePropsMeta` / empty `body`; never full-vault `sync: true` on every focus  

### 2.5 Engine / index change

| Need | Approach |
|------|----------|
| Single note update | `engine.writeNote(note, { metaOnly: true })` after links refresh |
| External file change | `FileWatcher` (already wired create/change/delete) |
| User “reload everything” | `SmartReloadService.reconcile()` first; full `engine.init()` fallback |
| New engine API | Prefer `DendronEngineV3`; surface via client only if remote path needs it |

Do **not** invent a parallel index without going through existing writeNote change entries (Fuse + metadata).

### 2.6 Vault focus integration checklist

Any feature that lists notes should:

```ts
let notes = await engine.findNotesMeta({ excludeStub: true });
notes = WorkspaceModesService.filterNotesByFocus(notes);
```

Write targets: `WorkspaceModesService.resolveWriteVault()` when creating notes.

Graph: host posts `focusedVault` on `onGraphLoad`; webview toggles `vaults.*` filters (`DendronGraphPanel`).

Subscribe: `WorkspaceModesService.onFocusChange(() => …)` for live refresh.

### 2.7 Local AI / offline helpers

- Keep **opt-in** (`dendron.localAI.enabled` default false)  
- Empty endpoint → offline scaffold only  
- Endpoint set → OpenAI-compatible POST with timeout + clear Ollama errors  
- Put parsing/scaffolding in `noteBodyUtils.ts` for tests  
- Do not call cloud SaaS by default  

### 2.8 Bugfix workflow

1. Reproduce path: F5? webpack? which view?  
2. Confirm dual-build (stale `out/` is #1 false alarm)  
3. Minimal fix in owning package  
4. Compile critical packages  
5. If webview React: rebuild plugin-views  
6. Add pure test if logic is non-UI  

---

## 2.9 Maintainability / shared libraries

See also [docs/dev/MAINTAINABILITY.md](../../docs/dev/MAINTAINABILITY.md).

**Before copy-pasting:**

| Need | Use |
|------|-----|
| Webview HTML shell | `genVSCodeHTMLIndex` from `@dendronhq/common-all` |
| Task open/done/column | `TaskNoteUtils.isOpenTaskNote` / `getBoardColumn` |
| Create task note | `createTaskNoteFromTitle` (workspace task config) |
| Inbox/open bullets | `noteBodyUtils` |
| HTML escape in webviews | `htmlEscape.escapeHtml` / `escapeAttr` |
| Strip body for postMessage | `toWebviewNoteMeta` / `buildActiveEditorMsg` |
| Open note from webview | `gotoNoteByVaultName` |
| Vault scope | `WorkspaceModesService.filterNotesByFocus` |
| Lookup focus + create-new | `filterQuickPickItemsByFocus` |
| Lookup selection extract | `selectionProcessing.selectionToNoteProps` |
| Create New ranking | `shouldBubbleUpCreateNew` / `sortBySimilarity` |
| Vault pick for new notes | `pickerVault` / `PickerUtilsV2.getVaultRecommendations` |
| Vault rank + selection mode (pure) | `rankVaultSuggestions` / `resolveVaultSelectionMode` in `pickerVaultRank` |
| Lookup result filter (pure) | `filterPickerResults` in `pickerFilterResults` |
| Create New policy / picker value (pure) | `pickerCreateNewPolicy`, `pickerValue` |
| Pagination / enhance notes | `pickerPagination`, `notePickerEnhance` |
| Schema lookup completions | `noteLookupSchemaCompletions` |
| Note empty qs / create-new rows | `noteLookupEmptyQuery`, `noteLookupCreateNewItems` |
| Schema lookup helpers | `schemaLookupHelpers` |
| Shared provider accept/history/wire | `lookupProviderAccept`, `lookupProviderHistory`, `lookupProviderWire` |
| NoteLookupCommand peels | `noteLookupButtons`, `noteLookupSelectionMode`, `noteLookupVault`, `noteLookupAcceptHelpers` |
| NoteLookup accept/execute | `noteLookupAcceptItem` (+ Existing/New/Template), `noteLookupExecute`, `noteLookupCleanup` |
| Lookup enrich (History) | `lookupCommandEnrichInputs` (note + schema) |
| Lookup controller modifiers | `lookupControllerModifiers`, `lookupControllerViewState` |
| Lookup sentinels / open note | `pickerSentinels`, `pickerDisplay` |
| Lookup accept hooks (rename/move) | `providerAcceptHooks.ProviderAcceptHooks` |
| Pure Node smoke | `yarn smoke:lookup-pure` → `scripts/smoke-lookup-pure.js` (after plugin-core compile) |
| HTML side panels register | `registerHtmlSidePanels` |
| Backlinks / graph panel setup | `workspace/setupBacklinks`, `setupGraphPanel` |
| Command / language registration | `extension/setupCommands`, `setupLanguageFeatures` |
| Markdown refs / anchors | `utils/md` (`paths`, `anchors`, `getReferenceAtPosition`, `findReferences`, `markdownUtils`) |
| Lookup item filters | `pickerFilters` (also on `PickerUtilsV2` wrappers) |
| QuickPick factory | `pickerQuickPick` / `PickerUtilsV2.createDendronQuickPick` |
| Activation helpers | `workspace/activatorHelpers` |
| Reload / engine port | `workspace/activatorReload` |
| Lifecycle / tree / server | `activatorLifecycle`, `activatorTreeView`, `activatorServer` |

**Extract when:** same logic appears in ≥2 commands/views. Prefer pure functions + thin commands.

**Comment when:** dual-build, payload diet, vault-focus contracts, or smart-vs-full reload invariants.

## 3. Code conventions

| Topic | Spec |
|-------|------|
| Language | TypeScript strict; respect `exactOptionalPropertyTypes` |
| Optional props | Conditional spread `{ ...(x ? { x } : {}) }` — not `x: undefined` |
| Logging | `Logger.info/error({ ctx, msg })` — only known payload fields |
| Errors | Prefer Dendron error types from common-all when crossing packages |
| Imports | `@dendronhq/common-all` etc.; avoid deep relative cross-package hacks |
| Pure logic | Extract to `services/*Plan.ts` or `utils/*Utils.ts` |
| Commands | `BasicCommand`, `static requireActiveWorkspace = true` when needed |
| Commits | Conventional: `feat(scope):`, `fix(scope):`, `docs:` |
| Pre-commit | ESLint flat config may block; use `--no-verify` only if compile-green and user accepts |

---

## 4. File ownership map (fork features)

```
packages/plugin-core/src/
  commands/          # User-facing commands
  services/          # WorkspaceModes, SmartReload, NoteHistory, planners
  views/             # WebviewViewProviders, panel factories, HTML shared
  utils/             # noteBodyUtils, webviewNoteMeta, quietMode, dev perf
  components/views/  # Classic React-hosted panels (preview, note graph)
  workspace.ts       # View registration
  constants.ts       # DENDRON_COMMANDS, views contribution helpers
  fileWatcher.ts     # Disk create/change/delete → engine

packages/common-all/src/
  constants/views.ts # DendronTreeViewKey, TREE_VIEWS, editor keys
  types/             # Message contracts, NoteProps

packages/dendron-plugin-views/src/
  components/        # Graph, preview, calendar, configure
  hooks/             # useGraphElements, useMermaid, …
  utils/graph.ts     # Graph defaults (local-first)

packages/api-server/src/modules/workspace/
  index.ts           # workspace/sync → findNotesMeta (bodies stripped)
```

---

## 5. Message & webview protocol

### Extension → React webview

- `DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR` — `{ note, activeNote, sync?, syncChangedNote? }`  
  - Prefer **meta-only notes** (`toWebviewNoteMeta` / empty body)  
  - Graph/calendar: `syncChangedNote: true` OK for single-note fetch; avoid `sync: true`  
- Graph: `GraphViewMessageEnum.onGraphLoad` — styles, depth, edge toggles, **`focusedVault`**

### HTML webview ↔ extension

Ad-hoc `{ type: 'open' | 'setStatus' | 'refresh' | 'command' | 'openNote', ... }`  
Keep stable; document new types in the view class header.

---

## 6. Testing matrix

| Level | When | How |
|-------|------|-----|
| **Pure unit** | Any new pure helper | `src/test/suite-integ/*.test.ts` mocha **or** node require of `out/` |
| **Compile** | Every change | `yarn workspace @dendronhq/plugin-core compile` (+ common-all if needed) |
| **Webpack prod** | Packaging | `cd packages/plugin-core && yarn webpack:prod` |
| **Doctor smoke** | Health CLI | `yarn test:doctor:smoke` (Node 20 preferred) |
| **Plugin integ** | Rare / deep | `TEST_TO_RUN=Name yarn test` in plugin-core (slow) |

**Gold pattern:** pure planner tests like `safeBulkRenamePlan.test.ts`, `noteBodyUtils.test.ts`.

Do **not** block on full `yarn ci:test:plugin` unless user requests (10–30+ min).

---

## 7. Verification checklist (before “done”)

- [ ] `common-all` built if shared types/views changed  
- [ ] `plugin-core` compile clean  
- [ ] New commands visible after reload (not only webpack)  
- [ ] Vault focus respected if feature lists notes  
- [ ] No full note bodies in webview postMessage for graph/calendar-like UIs  
- [ ] Theme: VS Code CSS tokens for HTML/React chrome  
- [ ] Docs: context/spec/roadmap updated if user-facing surface changed  
- [ ] No secrets committed; no unexpected `dist/` artifacts  

---

## 8. Feature templates

### 8.1 “Ritual” command (inbox / review style)

```
gatherInputs → engine.findNotesMeta → filterNotesByFocus
  → QuickPick or markdown preview
  → writeNote / open note
  → showInformationMessage summary
```

### 8.2 Kanban / dashboard HTML

```
load rows (meta + focus)
renderHtml(layout: sidebar | editor)
onMessage: open | mutate | refresh
register WebviewView + optional PanelFactory
command opens PanelFactory
```

### 8.3 Graph behavior change

```
defaults: dendron-plugin-views/src/utils/graph.ts
layout perf: components/graph.tsx getEulerConfig + deferred run
host opts: GraphPanel / NoteGraphViewFactory onRequestGraphOpts
focus: WorkspaceModesService → onGraphLoad.focusedVault → DendronGraphPanel vault filters
```

---

## 9. Anti-patterns (do not)

- Adding features only in webpack `dist/` without updating `out/` compile path  
- Full `engine.init()` on every small disk change  
- `sync: true` on schema/note graph focus thrash  
- Cloud AI without explicit user opt-in  
- New monorepo package without clear boundary need  
- Editing `docs/dendron-docs` vault notes for fork engineering (use `docs/dev` + `ai/`)  
- Assuming Node 26 doctor smoke is authoritative  

---

## 10. Suggested next features (not started)

Use roadmap + user priority; do not invent sprints without PRODUCT-ROADMAP update.

Ideas consistent with fork:

- Drag-and-drop Task Board columns  
- Hub Home editor panel variant  
- Persist graph local/full preference in MetadataService  
- Richer Ollama streaming + write-back  
- Expand pure tests for Process Inbox / health counters  
- Webext webpack residual node-builtin graph  

---

## 11. Definition of Ready / Done

**Ready for agent work:** user request + this spec + context; repo on `main`; ability to compile plugin-core.

**Done:**

1. Behavior matches request  
2. Critical compile green  
3. No regression to dual-build story  
4. Focus/filter consistency if note lists involved  
5. Brief summary to user (what/where/how to try)  
6. Docs updated when surface area changed  

---

## 12. Cross-links

| Doc | Role |
|-----|------|
| [context.md](./context.md) | Architecture & status |
| [backlog.md](./backlog.md) | BL-* engineering |
| [../../docs/dev/PRODUCT-ROADMAP.md](../../docs/dev/PRODUCT-ROADMAP.md) | Product completeness |
| [../../docs/dev/DEV-EXTENSION.md](../../docs/dev/DEV-EXTENSION.md) | F5 |
| [../../docs/dev/BUILD-AND-DEBUG.md](../../docs/dev/BUILD-AND-DEBUG.md) | Gates |
| [../../docs/dev/packages/plugin-core.md](../../docs/dev/packages/plugin-core.md) | Package notes (may lag; prefer this pair) |
