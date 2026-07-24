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
| `pickerCreateNew` / `pickerSort` / `pickerVault` / `pickerFilters` | lookup | Ranking, vault pick, filters |
| `utils/md/*` | plugin-core | types, paths, anchors, markdownUtils, getReferenceAtPosition, findReferences |
| `registerHtmlSidePanels` / `setupBacklinks` / `setupGraphPanel` / `setupTipOfTheDay` | workspace/ | Side panels |
| `activatorHelpers` | workspace/ | trackTopLevelRepo, getOrPromptWSRoot, duplicate vault check |
| `extension/setupCommands` / `setupLanguageFeatures` | extension/ | Activation registration |
| `SmartReloadService` / `safeBulkRenamePlan` | plugin-core | Index / rename |

---

## Extraction waves

### Waves 1–4 — DONE
See git history `f92ad1059`…`b9e2664b6`.

### Wave 5 — DONE (this push)

| Item | Result |
|------|--------|
| Split `md/core.ts` | → `paths.ts`, `markdownUtils.ts`, `getReferenceAtPosition.ts` |
| Peel PickerUtils filters | → `pickerFilters.ts` (create-new detection, depth, stubs, …) |
| Thin workspaceActivator | → `activatorHelpers.ts` (repo analytics, ws root pick, vault name check) |
| Tests | `maintainabilityHelpers.test.ts` + node smoke for anchors/pickers |

| Hotspot | ~LOC after wave 5 |
|---------|-------------------|
| `utils/md/*` modules | paths 113, getRef ~250, markdownUtils ~137, anchors ~73, findRefs ~181 |
| `lookup/utils.ts` | **~560** (was ~800 before wave 4–5) |
| `workspaceActivator.ts` | **~665** (helpers peeled) |

### Wave 6 — optional next

| Priority | Opportunity |
|----------|-------------|
| P1 | Peel remaining `PickerUtilsV2` quickpick factory methods |
| P2 | Further thin `workspaceActivator` class methods into files |
| P3 | `workspaceActivator` reload/postReload helpers |
| P4 | More pure tests for `pickerVault` ranking |

---

## Verify

```bash
yarn workspace @dendronhq/common-all build
yarn workspace @dendronhq/plugin-core compile
node -e "require('./packages/plugin-core/out/src/utils/md/anchors.js')"
```
