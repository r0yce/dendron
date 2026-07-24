# Maintainability Guide (Personal Fork)

**Updated:** 2026-07-24  
**AI pair:** [ai/references/spec.md](../../ai/references/spec.md) §2.9

---

## Shared modules (prefer these)

| Module | Package | Use for |
|--------|---------|---------|
| `genVSCodeHTMLIndex` | **common-all** | Pure webview HTML shell |
| `TaskNoteUtils` | **common-all** | Task open/done/board columns |
| `noteBodyUtils` / `taskNoteFactory` / `htmlEscape` | plugin-core | Rituals + HTML |
| `webviewNoteMeta` / `webviewMessages` / `webviewNoteActions` | plugin-core | Webview payload diet |
| `taskBoardShared` | plugin-core | Task Board UI |
| `WorkspaceModesService` | plugin-core | Vault focus / workmodes |
| `selectionProcessing` | lookup | selectionExtract / selection2link |
| `pickerCreateNew` / `pickerSort` / `pickerFilters` | lookup | Ranking + filters |
| `pickerVault` / `pickerVaultRank` / `vaultPickerConstants` | lookup | Vault recommendations (pure rank + selection-mode, Node-testable) |
| `pickerFilterResults` / `pickerCreateNewPolicy` / `pickerValue` | lookup | Pure post-query filter, Create New gates, value compose |
| `pickerPagination` / `notePickerEnhance` | lookup | Pure page slice; batch schema load + QuickInput enhance |
| `noteLookupSchemaCompletions` | lookup | Schema child candidates + append completions |
| `noteLookupEmptyQuery` / `noteLookupCreateNewItems` | lookup | Empty-qs roots; append Create New note rows |
| `schemaLookupHelpers` | lookup | Schema empty-qs, create-new row, multi-level gate |
| `lookupProviderAccept` / `lookupProviderHistory` / `lookupProviderWire` | lookup | Shared accept, history, provide() debounce wiring |
| `noteLookupButtons` / `noteLookupSelectionMode` / `noteLookupVault` / `noteLookupAcceptHelpers` | commands/ | NoteLookupCommand peels |
| `noteLookupAcceptItem` / `AcceptNew` / `Existing` / `Template` / `Execute` / `Cleanup` / `Gather` | commands/ | Full note lookup modularity |
| `schemaLookupAccept*` / `Gather` / `Execute` | commands/ | Full schema lookup modularity |
| `lookupCommandEnrichInputs` | commands/ | Shared History subscribe for note + schema lookup |
| `pickerSentinels` / `pickerDisplay` | lookup | Create New / More Results sentinels; open doc + hide picker |
| `lookupControllerModifiers` / `lookupControllerViewState` | lookup | Note-type/selection toggles + initial VM from buttons |
| `providerAcceptHooks` | lookup | Rename/move on-accept location hooks |
| `pickerQuickPick` / `pickerEditorContext` | lookup | QuickPick factory + open-editor vault/fname |
| `utils/md/*` | plugin-core | paths, anchors, markdownUtils, getReferenceAtPosition, findReferences |
| `registerHtmlSidePanels` / `setupBacklinks` / `setupGraphPanel` / `setupTipOfTheDay` | workspace/ | Side panels |
| `activatorHelpers` / `activatorReload` / `activatorLifecycle` / `activatorTreeView` / `activatorServer` | workspace/ | Activation, reload, lifecycle, tree view, engine server process |
| `extension/setupCommands` / `setupLanguageFeatures` | extension/ | Activation registration |

**Rule:** same 5+ lines twice → extract. Pure logic → no vscode imports when possible.

---

## Extraction waves

### Waves 1–5 — DONE
Helpers, HTML shell, lookup selection, md modules, picker filters, activator helpers, tests.

### Wave 6 — DONE

| Item | Result |
|------|--------|
| QuickPick factory peel | `pickerQuickPick.ts` (create/get value/selection) |
| Editor context peel | `pickerEditorContext.ts` (fname/vault from open editor) |
| Pure vault ranking | `pickerVaultRank.ts` + `vaultPickerConstants.ts` |
| Activator reload peel | `activatorReload.ts` (reload, postReload, updateEngineAPI, toggle context) |
| Tests | vault ranking cases in `maintainabilityHelpers.test.ts` + Node smoke |

### Wave 7 — DONE (this push)

| Item | Result |
|------|--------|
| Provider accept hooks peel | `providerAcceptHooks.ts` (`ProviderAcceptHooks`, `OldNewLocation` / `NewLocation`; re-exported from `utils.ts`) |
| Vault selection-mode pure helper | `resolveVaultSelectionMode` in `pickerVaultRank.ts`; wired from `pickerVault.getOrPromptVaultForNewNote` |
| Activator lifecycle peel | `activatorLifecycle.ts` (`analyzeWorkspace`, `getAndCleanPreviousWSVersion`) |
| Activator tree view peel | `activatorTreeView.ts` (`initTreeView`, tree label/create commands) |
| Tests | `resolveVaultSelectionMode` cases (auto / smart FULL+CONTEXT / prompt / alwaysPrompt / string mode) in `maintainabilityHelpers.test.ts` |

| Hotspot | ~LOC after wave 7 |
|---------|-------------------|
| `lookup/utils.ts` | **~369** (was ~834 at start; ~447 after wave 6) |
| `workspaceActivator.ts` | **~429** (was ~738; ~551 after wave 6) |
| `providerAcceptHooks.ts` | ~89 |
| `pickerVaultRank.ts` | ~159 (rank + selection-mode pure) |
| `activatorLifecycle.ts` / `activatorTreeView.ts` | ~67 / ~83 |

### Wave 8 — DONE (this push)

| Item | Result |
|------|--------|
| Pure filter peel | `pickerFilterResults.ts` (`filterPickerResults` + query-ending-dot sort) |
| Sentinels peel | `pickerSentinels.ts` (`createNoActiveItem`, `createMoreResults`) |
| Display peel | `pickerDisplay.ts` (`node2Uri`, `showDocAndHidePicker`) |
| Vault picker types | `VaultPickerItem` + `isDVaultArray` owned by `pickerVault.ts` |
| Activator server peel | `activatorServer.ts` (`verifyOrStartServerProcess`) |
| Facade | `lookup/utils.ts` is re-exports + `PickerUtilsV2` thin wrappers only |
| Tests | pure `filterPickerResults` cases in `maintainabilityHelpers.test.ts` |

| Hotspot | ~LOC after wave 8 |
|---------|-------------------|
| `lookup/utils.ts` | **~159** (was ~834 at start; ~369 after wave 7) |
| `workspaceActivator.ts` | **~369** orchestration shell |
| `pickerFilterResults.ts` | ~135 pure |
| `pickerSentinels` / `pickerDisplay` | ~36 / ~58 |
| `activatorServer.ts` | ~51 |

### Wave 9 — DONE (this push)

| Item | Result |
|------|--------|
| Create New policy (pure) | `pickerCreateNewPolicy.ts` — `shouldAddCreateNewOption`, `shouldRejectLookupItem`, `countExactFnameMatches`; wired into `NoteLookupProvider` |
| Picker value compose (pure) | `pickerValue.ts` — `getPickerValue`; used by `NotePickerUtils` + controller modifiers |
| Controller modifiers peel | `lookupControllerModifiers.ts` — journal/scratch/task + selection/copy toggles |
| Controller view state peel | `lookupControllerViewState.ts` — `initializeViewStateFromButtons` |
| Node smoke | `scripts/smoke-lookup-pure.js` (vault mode + filter + policy + value) |
| Dual-build comments | headers on `lookup/utils.ts` + `workspaceActivator.ts` |
| Tests | create-new policy + picker value cases in `maintainabilityHelpers.test.ts` |

| Hotspot | ~LOC after wave 9 |
|---------|-------------------|
| `LookupControllerV3.ts` | **~474** (was ~721) |
| `NoteLookupProvider.ts` | **~524** (was ~547; policy extracted) |
| `lookupControllerModifiers.ts` | ~200 |
| `lookupControllerViewState.ts` | ~79 |
| `pickerCreateNewPolicy.ts` / `pickerValue.ts` | ~74 / ~21 pure |

### Wave 10 — DONE (this push)

| Item | Result |
|------|--------|
| Schema completions peel | `noteLookupSchemaCompletions.ts` — pure candidates + `appendSchemaCompletions`; wired from `NoteLookupProvider` |
| Pagination pure helper | `pickerPagination.sliceForPaginationLimit` used by `NotePickerUtils.fetchPickerResults` |
| Enhance batch peel | `notePickerEnhance.enhanceNotesForQuickInput` shared by fetch + schema completions |
| Catch cleanup | `onUpdatePickerItems` preserves error cause (eslint preserve-caught-error) |
| Smoke in verify | root `yarn smoke:lookup-pure`; also chained from `verify:full` |
| Tests | pagination + schema candidate cases in `maintainabilityHelpers.test.ts` |

| Hotspot | ~LOC after wave 10 |
|---------|-------------------|
| `NoteLookupProvider.ts` | **~471** (was ~524 after wave 9) |
| `NotePickerUtils.ts` | **~266** (was ~284) |
| `noteLookupSchemaCompletions.ts` | ~132 |
| `notePickerEnhance.ts` / `pickerPagination.ts` | ~66 / ~28 |

### Wave 11 — DONE (this push)

| Item | Result |
|------|--------|
| Shared accept flow | `lookupProviderAccept` + `lookupProviderHistory` — vault next-picker, hooks, cancel/done/error |
| Note empty qs | `noteLookupEmptyQuery.fetchEmptyNoteQueryItems` |
| Note Create New rows | `noteLookupCreateNewItems.appendCreateNewNoteItems` |
| Schema helpers | `schemaLookupHelpers` — roots, create-new row, multi-level gate |
| Schema provider peel | `SchemaLookupProvider` uses shared accept + helpers; catch preserves cause |
| Tests / smoke | multi-level + create-new schema cases; smoke script extended |

| Hotspot | ~LOC after wave 11 |
|---------|-------------------|
| `NoteLookupProvider.ts` | **~387** (was ~471 after wave 10) |
| `SchemaLookupProvider.ts` | **~243** (was ~286) |
| `lookupProviderAccept` / `History` | shared accept path |
| `schemaLookupHelpers` | pure multi-level + create-new (Node-smokeable) |

### Wave 12 — DONE (this push)

| Item | Result |
|------|--------|
| Shared provide wire | `lookupProviderWire.wireLookupProvide` — note (flush/trailing) + schema (cancel/leading) |
| NoteLookupCommand peels | buttons, selectionMode, vault resolve, accept helpers (selected items, titles, fname) |
| SchemaPickerUtils | uses `sliceForPaginationLimit` + `enhanceNotesForQuickInput` |
| Dual-build comments | `_extension.ts` + `NoteLookupCommand` headers |
| Tests / smoke | selection mode, multi-select, journal fname, title override |

| Hotspot | ~LOC after wave 12 |
|---------|-------------------|
| `NoteLookupCommand.ts` | **~706** (was ~802) |
| `NoteLookupProvider.ts` | **~356** (was ~387) |
| `SchemaLookupProvider.ts` | **~224** (was ~243) |
| `SchemaPickerUtils.ts` | **~85** |
| `lookupProviderWire.ts` | ~94 |

### Wave 13 — DONE (this push)

| Item | Result |
|------|--------|
| Accept modularity | `noteLookupAcceptExisting` / `AcceptNew` / `AcceptTemplate` / `AcceptItem` / `PrepareStub` / types |
| Execute / cleanup | `noteLookupExecute`, `noteLookupCleanup` |
| Shared enrich | `lookupCommandEnrichInputs` for note + schema commands |
| Command shells | `NoteLookupCommand` ~394 (was ~707); thin public wrappers preserve API |
| Schema command | uses shared enrich helper |

| Hotspot | ~LOC after wave 13 |
|---------|-------------------|
| `NoteLookupCommand.ts` | **~394** (was ~802 start of wave 12 era) |
| `SchemaLookupCommand.ts` | **~243** |
| Accept modules | existing / new / template / item / execute |

### Wave 14 — DONE (this push)

| Item | Result |
|------|--------|
| Note gather peel | `noteLookupGatherInputs` (+ `resolveVaultButtonPressed`) |
| Schema full modularity | `schemaLookupGatherInputs`, `schemaLookupAcceptExisting/New/Item`, `schemaLookupExecute` |
| Command shells | `NoteLookupCommand` ~290; `SchemaLookupCommand` ~150 thin wrappers |

| Hotspot | ~LOC after wave 14 |
|---------|-------------------|
| `NoteLookupCommand.ts` | **~290** (was ~394 after wave 13; ~802 peak) |
| `SchemaLookupCommand.ts` | **~150** (was ~243) |
| Lookup command stack | fully modular gather → enrich → accept → execute |

### Wave 15 — optional next

| Priority | Opportunity |
|----------|-------------|
| P1 | Start modularizing other large commands (`Doctor`, `MoveHeader`, vault) |
| P2 | Extract shared `lookupCommandState` getters if controller/provider setters still noisy |
| P3 | Product pause — lookup modularity is largely complete |

---

## Verify

```bash
yarn workspace @dendronhq/plugin-core compile
yarn smoke:lookup-pure
```
