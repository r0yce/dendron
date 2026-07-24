/**
 * Reverse-link queries for ReferenceProvider / Backlinks panel.
 */
import {
  DLink,
  isNotUndefined,
  NoteProps,
  NoteUtils,
} from "@dendronhq/common-all";
import fs from "fs";
import _ from "lodash";
import * as vscode from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import {
  getFrontmatterEndingOffsetPosition,
  getOneIndexedFrontmatterEndingLineNumber,
} from "./anchors";
import { FoundRefT } from "./types";

export const noteLinks2Locations = (note: NoteProps) => {
  const refs: {
    location: vscode.Location;
    matchText: string;
    link: DLink;
  }[] = [];
  const linksMatch = note.links.filter((l) => l.type !== "backlink");
  const fsPath = NoteUtils.getFullPath({
    note,
    wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
  });
  const fileContent = fs.readFileSync(fsPath).toString();
  const fmOffset = getFrontmatterEndingOffsetPosition(fileContent) ?? 0;
  linksMatch.forEach((link) => {
    const startOffset = link.position?.start.offset || 0;
    const lines = fileContent.slice(0, fmOffset + startOffset).split("\n");
    const lineNum = lines.length;

    refs.push({
      location: new vscode.Location(
        vscode.Uri.file(fsPath),
        new vscode.Range(
          new vscode.Position(lineNum, 0),
          new vscode.Position(lineNum + 1, 0)
        )
      ),
      matchText: lines.slice(-1)[0] || "",
      link,
    });
  });
  return refs;
};

export async function findReferencesById(opts: {
  id: string;
  isLinkCandidateEnabled?: boolean | undefined;
}) {
  const { id, isLinkCandidateEnabled } = opts;
  const refs: FoundRefT[] = [];

  const engine = ExtensionProvider.getEngine();

  const note = (await engine.getNoteMeta(id)).data;

  if (!note) {
    return;
  }

  let notesWithRefs;
  if (isLinkCandidateEnabled) {
    const engineNotes = await engine.findNotesMeta({ excludeStub: true });
    notesWithRefs = NoteUtils.getNotesWithLinkTo({
      note,
      notes: engineNotes,
    });
  } else {
    const notesRefIds = _.uniq(
      note.links
        .filter((link) => link.type === "backlink")
        .map((link) => link.from.id)
        .filter(isNotUndefined)
    );

    notesWithRefs = (await engine.bulkGetNotesMeta(notesRefIds)).data;
  }

  _.forEach(notesWithRefs, (noteWithRef) => {
    const linksMatch = noteWithRef.links.filter(
      (l) => l.to?.fname?.toLowerCase() === note.fname.toLowerCase()
    );
    const fsPath = NoteUtils.getFullPath({
      note: noteWithRef,
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
    });

    if (!fs.existsSync(fsPath)) {
      return;
    }
    const fileContent = fs.readFileSync(fsPath).toString();
    const fmOffset = getFrontmatterEndingOffsetPosition(fileContent) ?? 0;

    linksMatch.forEach((link) => {
      const endOffset = link.position?.end.offset;

      let lines;
      if (endOffset) {
        lines = fileContent.slice(0, fmOffset + endOffset + 1).split("\n");
      } else {
        const fmLine =
          getOneIndexedFrontmatterEndingLineNumber(fileContent) || 0;
        const allLines = fileContent.split("\n");
        const index = link.position?.end.line ?? allLines.length;
        lines = allLines.slice(0, index + fmLine);
      }
      const lineNum = lines.length;
      let range: vscode.Range;
      switch (link.type) {
        case "frontmatterTag":
          // -2 in lineNum so that it targets the end of the frontmatter
          range = new vscode.Range(
            new vscode.Position(
              lineNum - 2,
              (link.position?.start.column || 1) - 1
            ),
            new vscode.Position(
              lineNum - 2,
              (link.position?.end.column || 1) - 1
            )
          );
          break;
        default:
          range = new vscode.Range(
            new vscode.Position(
              lineNum - 1,
              (link.position?.start.column || 1) - 1
            ),
            new vscode.Position(
              lineNum - 1,
              (link.position?.end.column || 1) - 1
            )
          );
      }
      const location = new vscode.Location(vscode.Uri.file(fsPath), range);
      const foundRef: FoundRefT = {
        location,
        matchText: lines.slice(-1)[0] || "",
        note: noteWithRef,
      };
      if (link.type === "linkCandidate") {
        foundRef.isCandidate = true;
      } else if (link.type === "frontmatterTag") {
        foundRef.isFrontmatterTag = true;
      }

      refs.push(foundRef);
    });
  });

  return refs;
}

/**
 *  ^find-references
 * @param fname
 * @param excludePaths
 * @returns
 */
export const findReferences = async (fname: string): Promise<FoundRefT[]> => {
  const engine = ExtensionProvider.getEngine();
  // clean for anchor
  const notes = await engine.findNotesMeta({ fname });

  const all = Promise.all(
    notes.map((noteProps) => findReferencesById({ id: noteProps.id }))
  );

  return all.then((results) => {
    const arrays = _.compact(results);
    return _.concat(...arrays);
  });
};

