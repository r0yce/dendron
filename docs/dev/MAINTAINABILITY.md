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
| `pickerCreateNew` / `pickerSort` / `pickerVault` | lookup | Create New ranking + vault pick |
| `utils/md/*` | plugin-core | types, core, anchors, findReferences |
| `registerHtmlSidePanels` / `setupBacklinks` / `setupGraphPanel` / `setupTipOfTheDay` | workspace/ | Side panel registration |
| `extension/setupCommands` / `setupLanguageFeatures` | extension/ | Activation registration |
| `SmartReloadService` / `safeBulkRenamePlan` | plugin-core | Index / rename |

---

## Extraction waves

### Waves 1–3 — DONE
Helpers, HTML shell, lookup selection, md facade, side-panel register, picker free helpers.

### Wave 4 — DONE (this push)

| Item | Result |
|------|--------|
| Split `md/_impl` | `md/types`, `md/core`, `md/anchors`, `md/findReferences` + index facade |
| Peel vault picker | `pickerVault.ts` (recommendations + prompt); thin `PickerUtilsV2` wrappers |
| Workspace panel setup | `setupBacklinks.ts`, `setupGraphPanel.ts`, `setupTipOfTheDay.ts` |
| Extension registration | `extension/setupCommands.ts`, `extension/setupLanguageFeatures.ts` |
| Size | `_extension` ~964→**723**; `workspace` ~797→**610**; `lookup/utils` ~800→**628** |

### Wave 5 — optional next

| Priority | Opportunity |
|----------|-------------|
| P1 | Split `md/core.ts` further (getReferenceAtPosition vs path utils vs MarkdownUtils) |
| P2 | Peel remaining `PickerUtilsV2` filter/create-new static methods |
| P3 | Thin `workspaceActivator.ts` |
| P4 | More pure unit tests for pickerVault / anchors |

---

## Verify

```bash
yarn workspace @dendronhq/common-all build
yarn workspace @dendronhq/plugin-core compile
```
