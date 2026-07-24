# Maintainability Guide (Personal Fork)

**Updated:** 2026-07-24  
**AI pair:** [ai/references/spec.md](../../ai/references/spec.md) § modularization

Large monorepos stay maintainable when **shared pure logic** lives in one place and **host UI** stays thin.

---

## Shared modules (prefer these)

| Module | Package | Use for |
|--------|---------|---------|
| `TaskNoteUtils` (+ `isOpenTaskNote`, `getBoardColumn`, …) | **common-all** | Task detection, complete/open, board columns |
| `noteBodyUtils` | plugin-core | Open bullets, inbox parse/mark, slugify, AI parse/scaffold |
| `htmlEscape` | plugin-core | HTML webview string escaping |
| `webviewNoteMeta` / `toWebviewNoteMeta` | plugin-core | Strip bodies on host → webview messages |
| `webviewNoteActions` / `gotoNoteByVaultName` | plugin-core | HTML webview open-note messages |
| `taskBoardShared` | plugin-core | Task Board load + HTML + messages (sidebar + editor) |
| `WorkspaceModesService` | plugin-core | Vault focus / workmodes |
| `SmartReloadService` | plugin-core | Incremental index reconcile |
| `safeBulkRenamePlan` | plugin-core | Pure rename planning |

**Rule:** if the same 5+ lines of business logic appear twice, extract. Prefer **common-all** when browser/engine/CLI all need it; prefer **plugin-core/utils** when VS Code is irrelevant but only extension host uses it.

---

## Extraction priorities (remaining)

| Priority | Opportunity | Destination | Notes |
|----------|-------------|-------------|-------|
| P1 | Ritual dashboard stats (Hub Home / Health) | `plugin-core/utils/workspaceStats.ts` | Optional next — open tasks + inbox count already share helpers |
| P2 | Webview panel factory boilerplate | `plugin-core/views/createHtmlPanel.ts` | create/reveal/dispose pattern from TaskBoardPanelFactory |
| P3 | Graph host message payload builder | plugin-core utils | NoteGraph + GraphPanel + Calendar still similar |
| P4 | Split mega-files (`_extension.ts`, `constants.ts`, lookup) | incremental | Don't big-bang; peel one subsystem |
| P5 | common-di / ErrorService | historical proposals in `docs/dev/extractions/` | Only if DI wave resumes |

Do **not** create a new package for every helper — enhance-in-place in common-all / plugin-core utils first.

---

## Comment policy

Add a short **module header** when:

- Invariants aren't obvious (e.g. smart reload vs full init)
- Cross-surface contracts exist (vault focus must filter lists)
- Payload diet / dual-build constraints apply

Add **inline comments** for non-obvious algorithms only — not for `i++`.

---

## File size signals

| LOC | Guidance |
|-----|----------|
| &lt; 300 | Fine |
| 300–600 | Watch for a second concern to extract |
| &gt; 800 | Plan a split (`_extension.ts`, lookup, engine V3) |

---

## Verify after extraction

```bash
yarn workspace @dendronhq/common-all build
yarn workspace @dendronhq/plugin-core compile
# pure helpers:
node -e "require('./packages/plugin-core/out/src/utils/noteBodyUtils.js')"
```

Update [ai/references/context.md](../../ai/references/context.md) “Key services” if you add a long-lived shared module.
