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
| `surveyBase` / `surveyInitialSteps` / `surveyLapsedSteps` | plugin-core | Survey UI bases + step classes; `survey` orchestrates |
| `completionHelpers` / `completionNoteProvider` / `completionBlockProvider` | features/ | Pure regex/range; note+tag completions; block-anchor completions |
| `windowDecorationTypes` / `windowDecorationMappers` | features/ | Decoration type registry; engine→VSCode map |
| `keybindingConflictHelpers` | plugin-core | Pure conflict filter + keybinding JSON block gen |
| `startupGates` / `startupConfigMessages` / `startupUserPrompts` | utils/ | Pure startup gates; config toasters; survey/compat prompts |
| `extensionServerProcess` / `extensionTelemetry` | utils/ | Engine server spawn; install + workspace-init analytics |
| `podControlDescriptions` | pods/ | Pure export-scope / pod-type quick-pick copy |
| `vsCodeInstallStatus` / `vsCodeRangeHelpers` / `vsCodeUserConfigDir` | utils/ | Pure install gates, range math, user config paths |
| `backlinksTreeHelpers` | features/ | Pure backlinks tree sort/description/snippet |
| `workspaceWatcherRename` | plugin-core | Will/did rename note handlers |
| `workspaceWatcherSave` / `workspaceWatcherSaveHelpers` | plugin-core | Will/did save note + pure FM/history helpers |
| `workspaceActivateWatchers` / `workspaceSetupViews` | plugin-core | Watcher activation; sidebar view registration |
| `previewHistory` | views/ | Pure preview nav history stack |
| `podControlQuickPickItems` | pods/ | Pure pod quick-pick item builders |

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
| `NoteLookupCommand.ts` | **~293** (was ~394 after wave 13; ~802 peak) |
| `SchemaLookupCommand.ts` | **~148** (was ~243) |
| Lookup command stack | fully modular gather → enrich → accept → execute |

### Wave 15 — DONE (this push)

| Item | Result |
|------|--------|
| Doctor peels | `doctorActions` (reload policy + plugin enums), `doctorPreviews` (all webview previews) |
| MoveHeader peels | `moveHeaderHelpers` (proc, anchors, append, dest prep, body slice) |
| Schema hierarchy peels | `hierarchySchemaModels` (Hierarchy + multi-select pure), `hierarchySchemaCreator` |

| Hotspot | ~LOC after wave 15 |
|---------|-------------------|
| `Doctor.ts` | **~541** (was ~723) |
| `MoveHeader.ts` | **~632** (was ~695) |
| `CreateSchemaFromHierarchyCommand.ts` | **~410** (was ~593) |

### Remaining large modules (next waves)

Still >400 LOC and not fully modular shells:

| File | ~LOC | Notes |
|------|------|-------|
| `Doctor.ts` | ~541 | execute switch still fat — next peel target |
| `MoveHeader.ts` | ~632 | link/ref update path still fat |
| `VaultAdd` / `AddExistingVault` | ~510–550 | remote/self-contained gather |
| `RefactorHierarchyV2` | ~547 | |
| `_extension.ts` / `constants.ts` | large | activation + contributions (data-heavy) |

### Wave 16 — DONE (this push)

| Item | Result |
|------|--------|
| Doctor execute peel | `doctorExecute.ts` — full action switch; `Doctor.ts` ~280 shell |

| Hotspot | ~LOC after wave 16 |
|---------|-------------------|
| `Doctor.ts` | **~280** (was ~723 start; ~541 after wave 15) |
| `doctorExecute.ts` | ~336 |

### Wave 17 — DONE (this push)

| Item | Result |
|------|--------|
| MoveHeader peels | `moveHeaderValidate`, `moveHeaderLinks` (find/update links + refs); shell ~400 |
| Vault shared helpers | `vaultWorkspaceHelpers` — transitive deps warn, add vault/workspace (VaultAdd + AddExisting) |

| Hotspot | ~LOC after wave 17 |
|---------|-------------------|
| `MoveHeader.ts` | **~400** (was ~695 / ~632) |
| `VaultAddCommand.ts` | **~437** (was ~510) |
| `AddExistingVaultCommand.ts` | **~480** (was ~550) |

### Wave 18 — DONE (this push)

| Item | Result |
|------|--------|
| Shared remote vault | `vaultRemoteHandlers` — standard + self-contained clone/register |
| Refactor hierarchy ops | `refactorHierarchyOps` — capture filter, rename ops, overwrite detect, error md |
| Move note ops | `moveNoteOps` — desired moves, sequential rename, multi-move preview md |

| Hotspot | ~LOC after wave 18 |
|---------|-------------------|
| `VaultAddCommand.ts` | **~316** (was ~437) |
| `AddExistingVaultCommand.ts` | **~359** (was ~480) |
| `MoveNoteCommand.ts` | **~396** (was ~484) |
| `RefactorHierarchyV2.ts` | **~508** (was ~547; still >400 — prompts/UI remain) |

### Wave 19 — DONE (this push)

| Item | Result |
|------|--------|
| Merge note ops | `mergeNoteOps` — append body, backlinks, delete |
| Refactor prompts/scope | `refactorHierarchyPrompts`, `refactorHierarchyScope` |
| Goto note inputs | `gotoNoteProcessInputs` |
| Export scope | `pods/baseExportScope` |
| Schema user queries | `schemaHierarchyUserQueries` |
| Move header metrics | `moveHeaderMetrics` |

**Milestone: zero `commands/**` files ≥ 400 LOC** (largest ~397).

| Hotspot | ~LOC after wave 19 |
|---------|-------------------|
| CreateNoteWithTrait | ~397 |
| MoveNote | ~394 |
| BaseExportPod | ~390 |
| ConvertLink | ~386 |
| RefactorHierarchy | ~371 |
| MergeNote | ~356 |
| MoveHeader | ~340 |
| GotoNote | ~273 |

### Wave 20 — DONE (this push) — non-command peels

| Item | Result |
|------|--------|
| Survey | `surveyBase`, `surveyInitialSteps`, `surveyLapsedSteps`; shell ~241 (was ~674) |
| Completion | pure `completionHelpers` + `completionNoteProvider` + `completionBlockProvider`; shell ~50 (was ~644) |
| Window decorations | `windowDecorationTypes` + `windowDecorationMappers`; shell ~366 (was ~551) |
| Keybindings | pure `keybindingConflictHelpers`; shell ~346 (was ~382) |
| Smoke | padWithZero / match-at-char / range compute / keybinding conflict filters |

| Hotspot | ~LOC after wave 20 |
|---------|-------------------|
| `survey.ts` | **~241** (was ~674) |
| `completionProvider.ts` | **~50** (was ~644) |
| `windowDecorations.ts` | **~366** (was ~551) |
| `KeybindingUtils.ts` | **~346** (was ~382) |
| `completionNoteProvider.ts` | ~330 |
| `completionBlockProvider.ts` | ~195 |

### Wave 21 — DONE (this push)

| Item | Result |
|------|--------|
| StartupUtils | pure `startupGates` + `startupConfigMessages` + `startupUserPrompts`; shell **~183** (was ~568) |
| ExtensionUtils | `extensionServerProcess` + `extensionTelemetry`; shell **~126** (was ~564) |
| PodControls | pure `podControlDescriptions`; shell **~564** (was ~616) |
| Smoke | manual-upgrade gate, inactive survey decision, pod description strings |

| Hotspot | ~LOC after wave 21 |
|---------|-------------------|
| `StartupUtils.ts` | **~183** |
| `ExtensionUtils.ts` | **~126** |
| `extensionTelemetry.ts` | ~358 |
| `PodControls.ts` | **~564** |
| `startupConfigMessages.ts` | ~219 |

### Wave 22 — DONE (this push)

| Item | Result |
|------|--------|
| vsCodeUtils | pure `vsCodeInstallStatus`, `vsCodeRangeHelpers`, `vsCodeUserConfigDir`; shell **~528** (was ~613) |
| BacklinksTreeDataProvider | pure `backlinksTreeHelpers` (sort/desc/snippet/context lines); **~602** (was ~634) |
| WorkspaceWatcher | `workspaceWatcherRename` will/did rename; **~527** (was ~615) |
| Smoke | install status, range pad/merge, config dir, backlink strings |

| Hotspot | ~LOC after wave 22 |
|---------|-------------------|
| `vsCodeUtils.ts` | **~528** |
| `BacklinksTreeDataProvider.ts` | **~602** |
| `WorkspaceWatcher.ts` | **~527** |
| `workspace.ts` | still ~610 (class shell; next wave) |

### Wave 23 — DONE (this push)

| Item | Result |
|------|--------|
| workspace.ts | `workspaceSetupViews` + `workspaceActivateWatchers`; **~536** (was ~610) |
| WorkspaceWatcher | save → `workspaceWatcherSave` + pure helpers; **~370** (was ~527) |
| PreviewPanel | pure `previewHistory`; **~561** (was ~572) |
| PodControls | pure `podControlQuickPickItems`; **~536** (was ~562) |
| Smoke | preview history, FM updated plan, persistent history, pod QP items |

| Hotspot | ~LOC after wave 23 |
|---------|-------------------|
| `workspace.ts` | **~536** |
| `WorkspaceWatcher.ts` | **~370** |
| `PreviewPanel.ts` | **~561** |
| `PodControls.ts` | **~536** |

### Wave 24 — optional (remaining non-command)

| Priority | Opportunity |
|----------|-------------|
| P1 | Further `workspace.ts` statics; Backlinks provider core |
| P2 | PreviewPanel message/rewrite peels; more PodControls prompts |
| P3 | `_extension.ts` bootstrap thin; `constants.ts` data split |
| P4 | Remaining command shells 300–399 if desired |

---

## Verify

```bash
yarn workspace @dendronhq/plugin-core compile
yarn smoke:lookup-pure
```
