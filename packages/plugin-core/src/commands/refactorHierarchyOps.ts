/**
 * Pure / fs-light helpers for RefactorHierarchyCommandV2 rename planning.
 * (No vscode imports — Node-smokeable.)
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

export type RefactorRenamePaths = {
  oldPath: string;
  newPath: string;
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
 * Build old→new absolute fs paths from captured notes.
 */
export function getRefactorRenamePathOps(opts: {
  capturedNotes: DNodeProps[];
  matchRE: RegExp;
  replace: string;
  wsRoot: string;
}): RefactorRenamePaths[] {
  const { capturedNotes, matchRE, replace, wsRoot } = opts;
  return capturedNotes.map((note) => {
    const vault = note.vault;
    const vpath = vault2Path({ wsRoot, vault });
    const source = note.fname;
    const dest = note.fname.replace(matchRE, replace);
    return {
      oldPath: path.join(vpath, source + ".md"),
      newPath: path.join(vpath, dest + ".md"),
      vault,
    };
  });
}

/** True if any destination path already exists on disk. */
export function findExistingRefactorTargets<
  T extends { newPath?: string; newUri?: { fsPath: string } },
>(operations: T[]): T[] {
  return _.filter(operations, (op) => {
    const p = op.newPath ?? op.newUri?.fsPath;
    return p ? fs.pathExistsSync(p) : false;
  });
}

/** Markdown error preview body for overwrite conflicts. */
export function buildRefactorOverwriteErrorMarkdown(
  operations: {
    oldUri?: { fsPath: string };
    oldPath?: string;
    newUri?: { fsPath: string };
    newPath?: string;
  }[],
): string {
  return [
    "# Error - Refactoring would overwrite files",
    "",
    "### The following files would be overwritten",
  ]
    .concat("\n||||\n|-|-|-|")
    .concat(
      operations.map((op) => {
        const oldP = op.oldPath ?? op.oldUri!.fsPath;
        const newP = op.newPath ?? op.newUri!.fsPath;
        return `| ${path.basename(oldP)} |-->| ${path.basename(newP)} |`;
      }),
    )
    .join("\n");
}
