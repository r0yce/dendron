# Maintainability Guide (Personal Fork)

**Updated:** 2026-07-24  
**AI pair:** [ai/references/spec.md](../../ai/references/spec.md) §2.9

Large monorepos stay maintainable when **shared pure logic** lives in one place and **host UI** stays thin.

---

## Shared modules (prefer these)

| Module | Package | Use for |
|--------|---------|---------|
| `TaskNoteUtils` (+ `isOpenTaskNote`, `getBoardColumn`, …) | **common-all** | Task detection, complete/open, board columns |
| `noteBodyUtils` | plugin-core | Open bullets, inbox parse/mark, slugify, AI parse/scaffold |
| `taskNoteFactory` / `createTaskNoteFromTitle` | plugin-core | Create tasks with **workspace** task config |
| `htmlEscape` | plugin-core | HTML webview string escaping |
| `webviewNoteMeta` / `toWebviewNoteMeta` | plugin-core | Strip bodies on host → webview messages |
| `webviewMessages` / `buildActiveEditorMsg` | plugin-core | Standard ON_DID_CHANGE_ACTIVE_TEXT_EDITOR payload |
| `webviewNoteActions` / `gotoNoteByVaultName` | plugin-core | HTML webview open-note messages |
| `taskBoardShared` | plugin-core | Task Board load + HTML + messages (sidebar + editor) |
| `WorkspaceModesService` (+ `filterQuickPickItemsByFocus`) | plugin-core | Vault focus / workmodes / lookup focus filter |
| `SmartReloadService` | plugin-core | Incremental index reconcile |
| `safeBulkRenamePlan` | plugin-core | Pure rename planning |

**Rule:** if the same 5+ lines of business logic appear twice, extract. Prefer **common-all** when browser/engine/CLI all need it; prefer **plugin-core/utils** when VS Code is irrelevant but only extension host uses it.

---

## Extraction waves

### Wave 1 — DONE
- Task/inbox pure helpers, htmlEscape, toWebviewNoteMeta adoption, module headers

### Wave 2 — DONE (this push)
- `createTaskNoteFromTitle` (Process Inbox + Extract Tasks use workspace task config)
- `buildActiveEditorMsg` (Graph panel, Note graph, Calendar, Schema graph)
- `filterQuickPickItemsByFocus` (lookup CREATE_NEW safe)
- Module headers: LookupControllerV3, md.ts, web WebViewUtils fork note

### Wave 3 — NEXT
| Priority | Opportunity | Notes |
|----------|-------------|-------|
| P1 | Pure webview HTML shell in **common-all** | De-fork desktop `WebViewCommonUtils` vs web private `genVSCodeHTMLIndex` without importing node into webworker |
| P2 | Split `LookupControllerV3` selection/backlink blocks | `selectionProcessing.ts`, `anchorBacklinkUpdates.ts` |
| P3 | Split `utils/md.ts` | `findReferences.ts`, `anchors.ts`, `MarkdownUtils.ts` + re-export |
| P4 | Split `components/lookup/utils.ts` (PickerUtilsV2) | vault / create-new / sort modules |
| P5 | Peel `_extension.ts` / `workspace.ts` registration | `extension/register*.ts` |

Do **not** create a new package for every helper — enhance-in-place first.

---

## Comment policy

Add a short **module header** when:

- Invariants aren't obvious (e.g. smart reload vs full init)
- Cross-surface contracts exist (vault focus must filter lists)
- Payload diet / dual-build / web-vs-desktop forks apply

Add **inline comments** for non-obvious algorithms only — not for `i++`.

---

## File size signals

| LOC | Guidance |
|-----|----------|
| &lt; 300 | Fine |
| 300–600 | Watch for a second concern to extract |
| &gt; 800 | Plan a split (`_extension.ts`, lookup, engine V3, `md.ts`) |

---

## Verify after extraction

```bash
yarn workspace @dendronhq/common-all build
yarn workspace @dendronhq/plugin-core compile
```

Update [ai/references/context.md](../../ai/references/context.md) “Key services” if you add a long-lived shared module.
