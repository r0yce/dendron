/**
 * Pure / fs-light helpers for RefactorHierarchyCommandV2 rename planning.
 */
import {
  DNodeProps,
  DNodeUtils,
  DVault,
  NoteUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { Uri } from "vscode";
import { VSCodeUtils } from "../vsCodeUtils";

export type RefactorRenameOperation = {
  oldUri: Uri;
  newUri: Uri;
  vault: DVault;
};

/**
 * Filter scoped notes by match regex; drop virtual stubs not on disk.
 */
export function filterCapturedNotesForRefactor(opts: {
  scopedItems: DNodeProps[];
  matchRE: RegExp;
  wsRoot: string;
}): DNodeProps[] {
  const { scopedItems, matchRE, wsRoot } = opts;
  const capturedNotes = scopedItems.filter((item) => {
    const result = matchRE.exec(item.fname);
    return result && !DNodeUtils.isRoot(item);
  });

  return capturedNotes.filter((note) => {
    if (note.stub) {
      const notePath = NoteUtils.getFullPath({ wsRoot, note });
      return fs.existsSync(notePath);
    }
    return true;
  });
}

/**
 * Build old→new Uri rename operations from captured notes.
 */
export function getRefactorRenameOperations(opts: {
  capturedNotes: DNodeProps[];
  matchRE: RegExp;
  replace: string;
  wsRoot: string;
}): RefactorRenameOperation[] {
  const { capturedNotes, matchRE, replace, wsRoot } = opts;
  return capturedNotes.map((note) => {
    const vault = note.vault;
    const vpath = vault2Path({ wsRoot, vault });
    const rootUri = Uri.file(vpath);
    const source = note.fname;
    const dest = note.fname.replace(matchRE, replace);
    return {
      oldUri: VSCodeUtils.joinPath(rootUri, source + ".md"),
      newUri: VSCodeUtils.joinPath(rootUri, dest + ".md"),
      vault,
    };
  });
}

/** True if any destination path already exists on disk. */
export function findExistingRefactorTargets(
  operations: RefactorRenameOperation[],
): RefactorRenameOperation[] {
  return _.filter(operations, (op) => fs.pathExistsSync(op.newUri.fsPath));
}

/** Markdown error preview body for overwrite conflicts. */
export function buildRefactorOverwriteErrorMarkdown(
  operations: RefactorRenameOperation[],
): string {
  return [
    "# Error - Refactoring would overwrite files",
    "",
    "### The following files would be overwritten",
  ]
    .concat("\n||||\n|-|-|-|")
    .concat(
      operations.map(({ oldUri, newUri }) => {
        return `| ${path.basename(oldUri.fsPath)} |-->| ${path.basename(
          newUri.fsPath,
        )} |`;
      }),
    )
    .join("\n");
}
