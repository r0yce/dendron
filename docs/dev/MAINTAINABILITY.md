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
| `pickerFilterResults` | lookup | Pure post-query filter/rank (`filterPickerResults`) |
| `pickerSentinels` / `pickerDisplay` | lookup | Create New / More Results sentinels; open doc + hide picker |
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

### Wave 9 — optional next

| Priority | Opportunity |
|----------|-------------|
| P1 | Further split `NoteLookupProvider` / `LookupControllerV3` if still noisy |
| P2 | Optional pure Node smoke script in CI for `pickerFilterResults` + vault rank |
| P3 | Comment pass on remaining dual-build / activation contracts |

---

## Verify

```bash
yarn workspace @dendronhq/plugin-core compile
node -e "require('./packages/plugin-core/out/src/components/lookup/pickerFilterResults.js'); require('./packages/plugin-core/out/src/components/lookup/pickerVaultRank.js')"
```
