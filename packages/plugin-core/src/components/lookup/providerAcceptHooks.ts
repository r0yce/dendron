/**
 * On-accept hooks for lookup providers (rename / move note location resolution).
 * Extracted from utils.ts for maintainability.
 */
import {
  DendronError,
  DNodeUtils,
  DNoteLoc,
  NoteProps,
  RenameNoteOpts,
  RespV2,
  VaultUtils,
} from "@dendronhq/common-all";
import { TextEditor, Uri, window } from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { OnAcceptHook } from "./LookupProviderV3Interface";
import { getVaultForOpenEditor } from "./pickerEditorContext";
import { isCreateNewNotePickedForSingle } from "./pickerFilters";

export type OldNewLocation = {
  oldLoc: DNoteLoc;
  newLoc: DNoteLoc & { note?: NoteProps };
};

export type NewLocation = {
  newLoc: DNoteLoc & { note?: NoteProps };
};

export class ProviderAcceptHooks {
  /**
   * Returns current location and new location for note (rename / move).
   */
  static oldNewLocationHook: OnAcceptHook = async ({
    quickpick,
    selectedItems,
  }): Promise<RespV2<OldNewLocation>> => {
    const oldVault = getVaultForOpenEditor();
    const newVault = quickpick.vault ? quickpick.vault : oldVault;
    const engine = ExtensionProvider.getEngine();

    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const oldUri: Uri = editor.document.uri;
    const oldFname = DNodeUtils.fname(oldUri.fsPath);

    const selectedItem = selectedItems[0]!;
    const fname = isCreateNewNotePickedForSingle(selectedItem)
      ? quickpick.value
      : selectedItem.fname;

    const newNote = (await engine.findNotesMeta({ fname, vault: newVault }))[0];
    const isStub = newNote?.stub;
    if (newNote && !isStub) {
      const vaultName = VaultUtils.getName(newVault);
      const errMsg = `${vaultName}/${quickpick.value} exists`;
      window.showErrorMessage(errMsg);
      return {
        error: new DendronError({ message: errMsg }),
      };
    }
    const data: RenameNoteOpts = {
      oldLoc: {
        fname: oldFname,
        vaultName: VaultUtils.getName(oldVault),
      },
      newLoc: {
        fname: quickpick.value,
        vaultName: VaultUtils.getName(newVault),
      },
    };
    return { data, error: null };
  };

  static NewLocationHook: OnAcceptHook = async ({
    quickpick,
  }): Promise<RespV2<NewLocation>> => {
    const activeEditorVault = getVaultForOpenEditor();
    const newVault = quickpick.vault ? quickpick.vault : activeEditorVault;

    const data = {
      newLoc: {
        fname: quickpick.value,
        vaultName: VaultUtils.getName(newVault),
      },
    };

    return { data, error: null };
  };
}
