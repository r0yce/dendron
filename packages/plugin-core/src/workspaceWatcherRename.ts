/**
 * File rename handlers for WorkspaceWatcher (will/did rename note).
 */
import {
  ContextualUIEvents,
  DNodeUtils,
  ErrorUtils,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { file2Note, vault2Path } from "@dendronhq/common-server";
import * as Sentry from "@sentry/node";
import path from "path";
import { FileRenameEvent, FileWillRenameEvent } from "vscode";
import { IDendronExtension } from "./dendronExtensionInterface";
import { AnalyticsUtils } from "./utils/analytics";

/**
 * Before rename: update references from old location → new (metaOnly).
 */
export function onWillRenameFilesForWorkspace(
  args: FileWillRenameEvent,
  extension: IDendronExtension,
): void {
  // No-op if we're not in a Dendron Workspace
  if (!extension.isActive()) {
    return;
  }
  try {
    const files = args.files[0];
    if (!files) return;
    const { vaults, wsRoot } = extension.getDWorkspace();
    const { oldUri, newUri } = files;

    // No-op if we are not dealing with a Dendron note.
    if (!NoteUtils.isNote(oldUri)) {
      return;
    }

    const oldVault = VaultUtils.getVaultByFilePath({
      vaults,
      wsRoot,
      fsPath: oldUri.fsPath,
    });
    const oldFname = DNodeUtils.fname(oldUri.fsPath);

    const newVault = VaultUtils.getVaultByFilePath({
      vaults,
      wsRoot,
      fsPath: newUri.fsPath,
    });
    const newFname = DNodeUtils.fname(newUri.fsPath);
    const opts = {
      oldLoc: {
        fname: oldFname,
        vaultName: VaultUtils.getName(oldVault),
      },
      newLoc: {
        fname: newFname,
        vaultName: VaultUtils.getName(newVault),
      },
      metaOnly: true,
    };
    AnalyticsUtils.track(ContextualUIEvents.ContextualUIRename);
    const engine = extension.getEngine();
    const updateNoteReferences = engine.renameNote(opts);
    args.waitUntil(updateNoteReferences);
  } catch (error: any) {
    Sentry.captureException(error);
    throw error;
  }
}

/**
 * After rename: refresh title from new fname and write note.
 */
export async function onDidRenameFilesForWorkspace(
  args: FileRenameEvent,
  extension: IDendronExtension,
): Promise<void> {
  // No-op if we're not in a Dendron Workspace
  if (!extension.isActive()) {
    return;
  }
  try {
    const files = args.files[0];
    if (!files) return;
    const { newUri } = files;
    const fname = DNodeUtils.fname(newUri.fsPath);
    const engine = extension.getEngine();
    const { vaults, wsRoot } = extension.getDWorkspace();

    // No-op if we are not dealing with a Dendron note.
    if (!NoteUtils.isNote(newUri)) {
      return;
    }

    const newVault = VaultUtils.getVaultByFilePath({
      vaults,
      wsRoot,
      fsPath: newUri.fsPath,
    });
    const vpath = vault2Path({ wsRoot, vault: newVault });
    const newLocPath = path.join(vpath, fname + ".md");
    const resp = file2Note(newLocPath, newVault);
    if (ErrorUtils.isErrorResp(resp)) {
      throw resp.error;
    }
    let newNote: NoteProps = resp.data as NoteProps;
    const noteHydrated = await engine.getNote(newNote.id);
    if (noteHydrated.data) {
      newNote = NoteUtils.hydrate({
        noteRaw: newNote,
        noteHydrated: noteHydrated.data as NoteProps,
      }) as NoteProps;
    }
    newNote.title = NoteUtils.genTitle(fname);
    await engine.writeNote(newNote);
  } catch (error: any) {
    Sentry.captureException(error);
    throw error;
  }
}
