/**
 * Resolve qs/vault/anchor for GotoNoteCommand from selection / engine / prompts.
 */
import { ConfigUtils, NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { findNonNoteFile } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { window } from "vscode";
import { VaultSelectionMode } from "../components/lookup/types";
import { PickerUtilsV2 } from "../components/lookup/utils";
import type { IDendronExtension } from "../dendronExtensionInterface";
import { EditorUtils } from "../utils/EditorUtils";
import { VSCodeUtils } from "../vsCodeUtils";
import type { IWSUtilsV2 } from "../WSUtilsV2Interface";
import { GoToNoteCommandOpts, TargetKind } from "./GoToNoteInterface";

type FoundLinkSelection = NonNullable<
  Awaited<ReturnType<typeof EditorUtils.getLinkFromSelectionWithWorkspace>>
>;

export async function getQsFromLink(opts: {
  cmdOpts: GoToNoteCommandOpts;
  link: FoundLinkSelection;
  extension: IDendronExtension;
  wsUtils: IWSUtilsV2;
}): Promise<GoToNoteCommandOpts> {
  const { link, extension, wsUtils } = opts;
  let cmdOpts = opts.cmdOpts;
  if (link.value) {
    cmdOpts.qs = link.value;
  } else {
    const note = await wsUtils.getActiveNote();
    if (note) {
      cmdOpts.qs = note.fname;
      cmdOpts.vault = note.vault;
    } else {
      const { wsRoot, vaults } = extension.getEngine();
      cmdOpts.qs = path.relative(
        wsRoot,
        VSCodeUtils.getActiveTextEditorOrThrow().document.fileName,
      );
      cmdOpts.vault = VaultUtils.getVaultByFilePath({
        wsRoot,
        vaults,
        fsPath: cmdOpts.qs,
      });
    }
  }
  return cmdOpts;
}

export async function maybeSetOptsFromExistingNote(
  cmdOpts: GoToNoteCommandOpts,
  extension: IDendronExtension,
): Promise<GoToNoteCommandOpts | null> {
  const engine = extension.getEngine();
  const notes = (await engine.findNotesMeta({ fname: cmdOpts.qs })).filter(
    (note) => !note.id.startsWith(NoteUtils.FAKE_ID_PREFIX),
  );
  if (notes.length === 1) {
    cmdOpts.vault = notes[0]!.vault;
  } else if (notes.length > 1) {
    const resp = await PickerUtilsV2.promptVault(notes.map((ent) => ent.vault));
    if (_.isUndefined(resp)) return null;
    cmdOpts.vault = resp;
  }
  return cmdOpts;
}

export async function maybeSetOptsFromNonNote(
  cmdOpts: GoToNoteCommandOpts,
  extension: IDendronExtension,
): Promise<GoToNoteCommandOpts> {
  const { vaults, wsRoot } = extension.getEngine();
  const nonNote = await findNonNoteFile({
    fpath: cmdOpts.qs!,
    wsRoot,
    vaults,
  });
  if (nonNote) {
    cmdOpts.qs = nonNote.fullPath;
    cmdOpts.kind = TargetKind.NON_NOTE;
  }
  return cmdOpts;
}

export async function setOptsFromNewNote(opts: {
  cmdOpts: GoToNoteCommandOpts;
  extension: IDendronExtension;
  wsUtils: IWSUtilsV2;
}): Promise<GoToNoteCommandOpts | null> {
  const { extension, wsUtils } = opts;
  let cmdOpts = opts.cmdOpts;
  const { config } = extension.getDWorkspace();
  const confirmVaultSetting =
    ConfigUtils.getLookup(config).note.confirmVaultOnCreate;

  const selectionMode =
    confirmVaultSetting !== true
      ? VaultSelectionMode.smart
      : VaultSelectionMode.alwaysPrompt;

  const currentVault = PickerUtilsV2.getVaultForOpenEditor();
  const selectedVault = await PickerUtilsV2.getOrPromptVaultForNewNote({
    vault: currentVault,
    fname: cmdOpts.qs!,
    vaultSelectionMode: selectionMode,
  });

  if (_.isUndefined(selectedVault)) {
    return null;
  }
  cmdOpts.vault = selectedVault;
  cmdOpts.originNote = await wsUtils.getActiveNote();
  return cmdOpts;
}

/**
 * Fill missing qs/vault/anchor on GotoNote opts from selection or prompts.
 * Returns null if the user cancelled or selection is invalid.
 */
export async function processGotoNoteInputs(opts: {
  cmdOpts: GoToNoteCommandOpts;
  extension: IDendronExtension;
  wsUtils: IWSUtilsV2;
}): Promise<GoToNoteCommandOpts | null> {
  let cmdOpts = opts.cmdOpts;
  const { extension, wsUtils } = opts;

  if (cmdOpts.qs && cmdOpts.vault) return cmdOpts;

  if (cmdOpts.qs && !cmdOpts.vault) {
    cmdOpts.vault = PickerUtilsV2.getVaultForOpenEditor();
    return cmdOpts;
  }

  const link = await EditorUtils.getLinkFromSelectionWithWorkspace();
  if (!link) {
    window.showErrorMessage("selection is not a valid link");
    return null;
  }

  if (!cmdOpts.qs) {
    cmdOpts = await getQsFromLink({
      cmdOpts,
      link,
      extension,
      wsUtils,
    });
  }
  if (!cmdOpts.vault && link.vaultName) {
    cmdOpts.vault = VaultUtils.getVaultByNameOrThrow({
      vaults: extension.getDWorkspace().vaults,
      vname: link.vaultName,
    });
  }
  if (!cmdOpts.anchor && link.anchorHeader) {
    cmdOpts.anchor = link.anchorHeader;
  }

  if (cmdOpts.vault === undefined) {
    const existingNote = await maybeSetOptsFromExistingNote(cmdOpts, extension);
    if (existingNote === null) return null;
    cmdOpts = existingNote;
  }
  if (cmdOpts.vault === undefined) {
    cmdOpts = await maybeSetOptsFromNonNote(cmdOpts, extension);
  }
  if (cmdOpts.vault === undefined && cmdOpts.kind !== TargetKind.NON_NOTE) {
    const newNote = await setOptsFromNewNote({
      cmdOpts,
      extension,
      wsUtils,
    });
    if (newNote === null) return null;
    cmdOpts = newNote;
  }

  return cmdOpts;
}
