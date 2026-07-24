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
| `providerAcceptHooks` | lookup | Rename/move on-accept location hooks |
| `pickerQuickPick` / `pickerEditorContext` | lookup | QuickPick factory + open-editor vault/fname |
| `utils/md/*` | plugin-core | paths, anchors, markdownUtils, getReferenceAtPosition, findReferences |
| `registerHtmlSidePanels` / `setupBacklinks` / `setupGraphPanel` / `setupTipOfTheDay` | workspace/ | Side panels |
| `activatorHelpers` / `activatorReload` / `activatorLifecycle` / `activatorTreeView` | workspace/ | Activation, reload, lifecycle analytics, tree view |
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

### Wave 8 — optional next

| Priority | Opportunity |
|----------|-------------|
| P1 | Further thin `utils.ts` (remaining PickerUtilsV2 wrappers only if still noisy) |
| P2 | More activator free-fn peels if any large helpers remain on the class |
| P3 | Optional: Node-only pure tests for selection-mode outside VS Code test host |

---

## Verify

```bash
yarn workspace @dendronhq/plugin-core compile
node -e "require('./packages/plugin-core/out/src/components/lookup/pickerVaultRank.js')"
```
