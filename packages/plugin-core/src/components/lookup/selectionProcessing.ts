import {
  asyncLoop,
  ConfigUtils,
  deleteTextRange,
  DendronConfig,
  DNoteAnchorPositioned,
  NoteChangeEntry,
  NoteProps,
  NoteUtils,
  VSRange,
} from "@dendronhq/common-all";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import { LinkUtils } from "@dendronhq/unified";
import _ from "lodash";
import * as vscode from "vscode";
import { Utils } from "vscode-uri";
import { DendronClientUtilsV2 } from "../../clientUtils";
import { ExtensionProvider } from "../../ExtensionProvider";
import {
  findReferences,
  getOneIndexedFrontmatterEndingLineNumber,
  hasAnchorsToUpdate,
} from "../../utils/md";
import { VSCodeUtils } from "../../vsCodeUtils";

/**
 * Selection → note transforms used by LookupControllerV3.
 * Kept pure-ish (uses ExtensionProvider) so the controller stays thinner.
 */

/**
 * Find backlinks that point to anchors inside `selection` and retarget them
 * to `destNote`. Used by selectionExtract so links survive extract-to-new-note.
 *
 * Anchors use note-relative line/column; selection is VS Code document coords
 * (contains check). Anchor headers may be `^block` or `#header` form in links.
 */
export async function updateBacklinksToAnchorsInSelection(opts: {
  selection: vscode.Selection | undefined;
  destNote: NoteProps;
  config: DendronConfig;
}): Promise<NoteChangeEntry[]> {
  const { selection, destNote, config } = opts;
  if (selection === undefined) {
    return [];
  }
  const wsUtils = ExtensionProvider.getWSUtils();
  const engine = ExtensionProvider.getEngine();
  const sourceNote = await wsUtils.getActiveNote();
  if (!sourceNote) {
    return [];
  }
  const { anchors: sourceAnchors } = sourceNote;
  if (!sourceAnchors) {
    return [];
  }

  const anchorsInSelection = _.toArray(sourceAnchors)
    .filter((anchor): anchor is DNoteAnchorPositioned => {
      return anchor !== undefined;
    })
    .filter((anchor) => {
      const anchorPosition: vscode.Position = new vscode.Position(
        anchor.line,
        anchor.column
      );
      return selection?.contains(anchorPosition);
    });

  const foundReferences = await findReferences(sourceNote.fname);
  const anchorNamesToUpdate = anchorsInSelection.map((anchor) => {
    return anchor.value;
  });
  const refsToUpdate = foundReferences.filter((ref) =>
    hasAnchorsToUpdate(ref, anchorNamesToUpdate)
  );
  let changes: NoteChangeEntry[] = [];

  await asyncLoop(refsToUpdate, async (ref) => {
    const { location } = ref;
    const fsPath = location.uri;
    const fname = NoteUtils.normalizeFname(Utils.basename(fsPath));

    const vault = wsUtils.getVaultFromUri(location.uri);
    const noteToUpdate = (
      await engine.findNotes({
        fname,
        vault,
      })
    )[0];

    if (noteToUpdate) {
      const linksToUpdate = LinkUtils.findLinksFromBody({
        note: noteToUpdate,
        config,
      })
        .filter((link) => {
          const fnameMatch =
            link.to?.fname?.toLocaleLowerCase() ===
            sourceNote.fname.toLowerCase();
          if (!fnameMatch) return false;

          if (!link.to?.anchorHeader) return false;
          const anchorHeader = link.to.anchorHeader.startsWith("^")
            ? link.to.anchorHeader.substring(1)
            : link.to.anchorHeader;
          return anchorNamesToUpdate.includes(anchorHeader);
        })
        .map((link) => LinkUtils.dlink2DNoteLink(link));
      const resp = await LinkUtils.updateLinksInNote({
        linksToUpdate,
        note: noteToUpdate,
        destNote,
        engine,
      });
      if (resp.data) {
        changes = changes.concat(resp.data);
      }
    }
  });
  return changes;
}

/**
 * Apply selectionType behavior onto a (usually new) note:
 * - selectionExtract: copy selection into note body; update backlinks; maybe leaveTrace ref
 * - selection2link: replace selection with wikilink to note
 */
export async function selectionToNoteProps(opts: {
  selectionType: string;
  note: NoteProps;
}): Promise<NoteProps> {
  const ext = ExtensionProvider.getExtension();
  const ws = ext.getDWorkspace();

  const extractRangeResp = await VSCodeUtils.extractRangeFromActiveEditor();
  const { document, range } = extractRangeResp || {};
  const { selectionType, note } = opts;
  const { selection, text } = VSCodeUtils.getSelection();

  switch (selectionType) {
    case "selectionExtract": {
      if (!_.isUndefined(document)) {
        const lookupConfig = ConfigUtils.getCommands(ws.config).lookup;
        const noteLookupConfig = lookupConfig.note;
        const leaveTrace = noteLookupConfig.leaveTrace || false;

        await updateBacklinksToAnchorsInSelection({
          selection,
          destNote: note,
          config: ws.config,
        });

        const body = note.body + "\n\n" + document.getText(range).trim();
        note.body = body;
        const { wsRoot, vaults } = ext.getDWorkspace();
        if (
          !WorkspaceUtils.isPathInWorkspace({
            wsRoot,
            vaults,
            fpath: document.uri.fsPath,
          })
        ) {
          return note;
        }
        if (leaveTrace) {
          const editor = VSCodeUtils.getActiveTextEditor();
          const link = NoteUtils.createWikiLink({
            note,
            useVaultPrefix: DendronClientUtilsV2.shouldUseVaultPrefix(
              ExtensionProvider.getEngine()
            ),
            alias: { mode: "title" },
          });
          // TODO: prefer engine.writeNote over editor.edit (race with engine)
          await editor?.edit((builder) => {
            if (!_.isUndefined(selection) && !selection.isEmpty) {
              builder.replace(selection, `!${link}`);
            }
          });
        } else {
          const activeNote = await ext.wsUtils.getNoteFromDocument(document);
          if (activeNote && range) {
            const activeNoteBody = activeNote?.body;
            const fmOffset =
              getOneIndexedFrontmatterEndingLineNumber(document.getText()) || 1;
            const vsRange: VSRange = {
              start: {
                line: range.start.line - fmOffset,
                character: range.start.character,
              },
              end: {
                line: range.end.line - fmOffset,
                character: range.end.character,
              },
            };
            const processed = deleteTextRange(activeNoteBody, vsRange);
            activeNote.body = processed;
            await ext.getEngine().writeNote(activeNote);
          }
        }
      }
      return note;
    }
    case "selection2link": {
      if (!_.isUndefined(document)) {
        const editor = VSCodeUtils.getActiveTextEditor();
        if (editor) {
          await editor.edit((builder) => {
            const link = note.fname;
            if (!_.isUndefined(selection) && !selection.isEmpty) {
              builder.replace(
                selection,
                `[[${text?.replace(/\n/g, "")}|${link}]]`
              );
            }
          });
        }
      }
      return note;
    }
    default: {
      return note;
    }
  }
}
