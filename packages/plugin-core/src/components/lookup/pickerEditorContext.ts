/**
 * Resolve fname / vault from the active editor for lookup.
 */
import { DVault, VaultUtils } from "@dendronhq/common-all";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import path from "path";
import { ExtensionProvider } from "../../ExtensionProvider";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../vsCodeUtils";

export function getFnameForOpenEditor(): string | undefined {
  const activeEditor = VSCodeUtils.getActiveTextEditor();
  if (activeEditor) {
    return path.basename(activeEditor.document.fileName, ".md");
  }
  return;
}

/**
 * Defaults to first vault if current note is not part of a vault.
 */
export function getVaultForOpenEditor(fsPath?: string): DVault {
  const ctx = "getVaultForOpenEditor";
  const { vaults, wsRoot } = ExtensionProvider.getDWorkspace();

  let vault: DVault;
  const activeDocument = VSCodeUtils.getActiveTextEditor()?.document;
  const fpath = fsPath || activeDocument?.uri.fsPath;
  if (
    fpath &&
    WorkspaceUtils.isPathInWorkspace({
      wsRoot,
      vaults,
      fpath,
    })
  ) {
    Logger.info({ ctx, activeDocument: fpath });
    vault = VaultUtils.getVaultByFilePath({
      vaults,
      wsRoot,
      fsPath: fpath,
    });
  } else {
    Logger.info({ ctx, msg: "no active doc" });
    vault = vaults[0]!;
  }
  Logger.info({ ctx, msg: "exit", vault });
  return vault;
}
