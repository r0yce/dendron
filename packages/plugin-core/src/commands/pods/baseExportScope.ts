/**
 * Scope → note list helpers for BaseExportPodCommand.
 */
import {
  DNodeProps,
  DVault,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import path from "path";
import * as vscode from "vscode";
import type { IDendronExtension } from "../../dendronExtensionInterface";
import { VSCodeUtils } from "../../vsCodeUtils";

export async function getPropsForNoteScope(
  extension: IDendronExtension,
): Promise<DNodeProps[] | undefined> {
  const fsPath = VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
  if (!fsPath) {
    vscode.window.showErrorMessage(
      "you must have a note open to execute this command",
    );
    return;
  }

  const { vaults, engine, wsRoot } = extension.getDWorkspace();
  const vault = VaultUtils.getVaultByFilePath({
    vaults,
    wsRoot,
    fsPath,
  });
  const fname = path.basename(fsPath, ".md");
  const maybeNote = (await engine.findNotes({ fname, vault }))[0];

  if (!maybeNote) {
    vscode.window.showErrorMessage("couldn't find the note somehow");
    return;
  }
  return [maybeNote];
}

export async function getPropsForWorkspaceScope(
  extension: IDendronExtension,
): Promise<DNodeProps[]> {
  return extension.getEngine().findNotes({ excludeStub: true });
}

export async function getPropsForVaultScope(
  extension: IDendronExtension,
  vault: DVault,
): Promise<DNodeProps[]> {
  return extension.getEngine().findNotes({ excludeStub: true, vault });
}

export async function getPropsForHierarchyScope(opts: {
  extension: IDendronExtension;
  hierarchy: string;
  vault: DVault;
}): Promise<NoteProps[]> {
  const notes = await opts.extension
    .getEngine()
    .findNotes({ excludeStub: true, vault: opts.vault });
  return notes.filter((value) => value.fname.startsWith(opts.hierarchy));
}

export async function applySelectionToNotePayload(
  noteProps: NoteProps[],
): Promise<NoteProps[] | undefined> {
  const activeRange = await VSCodeUtils.extractRangeFromActiveEditor();
  const { document, range } = activeRange || {};
  const selectedText = document ? document.getText(range).trim() : "";
  if (!selectedText) {
    vscode.window.showWarningMessage(
      "Please select the text in note to export",
    );
    return;
  }
  noteProps[0]!.body = selectedText;
  return noteProps;
}

export function noteFnameFromActiveEditor(): string | undefined {
  const editor = VSCodeUtils.getActiveTextEditor();
  if (!editor) return;
  return NoteUtils.uri2Fname(editor.document.uri);
}
