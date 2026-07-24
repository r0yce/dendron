# Maintainability Guide (Personal Fork)

**Updated:** 2026-07-24  
**AI pair:** [ai/references/spec.md](../../ai/references/spec.md) §2.9

---

## Shared modules (prefer these)

| Module | Package | Use for |
|--------|---------|---------|
| `genVSCodeHTMLIndex` / `WebViewThemeMap` | **common-all** | Pure webview HTML shell (desktop + web) |
| `TaskNoteUtils` (+ open/board helpers) | **common-all** | Task detection, complete/open, board columns |
| `noteBodyUtils` | plugin-core | Inbox/open bullets, slugify, AI parse |
| `taskNoteFactory` | plugin-core | Create tasks with workspace task config |
| `htmlEscape` | plugin-core | HTML webview escaping |
| `webviewNoteMeta` / `webviewMessages` / `webviewNoteActions` | plugin-core | Payload diet + open-note from webview |
| `taskBoardShared` | plugin-core | Task Board sidebar + editor |
| `WorkspaceModesService` | plugin-core | Vault focus / workmodes / lookup focus filter |
| `selectionProcessing` | plugin-core lookup | selectionExtract / selection2link / backlink retarget |
| `pickerCreateNew` / `pickerSort` | plugin-core lookup | Create New bubble-up + similarity sort |
| `registerHtmlSidePanels` | plugin-core workspace | Calendar / Task Board / Hub Home / Sample register |
| `SmartReloadService` / `safeBulkRenamePlan` | plugin-core | Index reconcile / rename plan |

**Rule:** same 5+ lines twice → extract. Prefer **common-all** when pure; **plugin-core/utils** when host-only pure.

---

## Extraction waves

### Wave 1 — DONE
Task/inbox helpers, htmlEscape, webview meta, module headers

### Wave 2 — DONE
`createTaskNoteFromTitle`, `buildActiveEditorMsg`, `filterQuickPickItemsByFocus`

### Wave 3 — DONE (this push)

| Item | Result |
|------|--------|
| Pure webview HTML shell | `common-all/webviewHtmlIndex.ts`; common-server + web WebViewUtils delegate |
| LookupControllerV3 selection | → `selectionProcessing.ts` (~200 LOC peeled; controller ~720) |
| `utils/md.ts` | Facade → `utils/md/_impl.ts` (stable imports; peel files next) |
| Lookup free helpers | `pickerCreateNew.ts`, `pickerSort.ts` re-exported from `utils.ts` |
| Side panel registration | `workspace/registerSidePanels.ts` |

### Wave 4 — NEXT (optional)

| Priority | Opportunity |
|----------|-------------|
| P1 | Split `md/_impl.ts` into `findReferences.ts` / `anchors.ts` / `MarkdownUtils.ts` |
| P2 | Peel more of `PickerUtilsV2` (vault picker methods) |
| P3 | Move backlink/graph setup out of `workspace.ts` |
| P4 | Peel `_extension.ts` command registration modules |

---

## Comment policy

Module headers for contracts (vault focus, dual-build, payload diet, smart reload, web HTML shell). Inline only for non-obvious algorithms.

## Verify

```bash
yarn workspace @dendronhq/common-all build
yarn workspace @dendronhq/common-server compile
yarn workspace @dendronhq/plugin-core compile
```
