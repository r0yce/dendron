/**
 * Pure-ish workspace activation helpers (no WorkspaceActivator class deps).
 */
import { DVault, GitEvents, VaultUtils } from "@dendronhq/common-all";
import { GitUtils } from "@dendronhq/common-server";
import { WorkspaceService } from "@dendronhq/engine-server";
import SparkMD5 from "spark-md5";
import * as vscode from "vscode";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";
import { VSCodeUtils } from "../vsCodeUtils";

export function trackTopLevelRepoFound(opts: { wsService: WorkspaceService }) {
  const { wsService } = opts;
  return wsService.getTopLevelRemoteUrl().then((remoteUrl) => {
    if (remoteUrl !== undefined) {
      const [protocol, provider, ...path] = GitUtils.parseGitUrl(remoteUrl);
      const payload = {
        protocol: (protocol || "").replace(":", ""),
        provider,
        path: SparkMD5.hash(`${path[0]}/${path[1]}.git`),
      };
      AnalyticsUtils.track(GitEvents.TopLevelRepoFound, payload);
      return payload;
    }
    return undefined;
  });
}

export async function getOrPromptWSRoot(workspaceFolders: string[]) {
  if (!workspaceFolders) {
    Logger.error({ msg: "No dendron.yml found in any workspace folder" });
    return undefined;
  }
  if (workspaceFolders.length === 1) {
    return workspaceFolders[0];
  } else {
    const selectedRoot = await VSCodeUtils.showQuickPick(
      workspaceFolders.map((folder): vscode.QuickPickItem => {
        return {
          label: folder,
        };
      }),
      {
        ignoreFocusOut: true,
        canPickMany: false,
        title: "Select Dendron workspace to load",
      }
    );
    if (!selectedRoot) {
      await vscode.window.showInformationMessage(
        "You skipped loading any Dendron workspace, Dendron is not active. You can run the 'Developer: Reload Window' command to reactivate Dendron."
      );
      Logger.info({
        msg: "User skipped loading a Dendron workspace",
        workspaceFolders,
      });
      return null;
    }
    return selectedRoot.label;
  }
}

export async function checkNoDuplicateVaultNames(
  vaults: DVault[]
): Promise<boolean> {
  const uniqueVaults = new Set<string>();
  const duplicates = new Set<string>();
  vaults.forEach((vault) => {
    const vaultName = VaultUtils.getName(vault);
    if (uniqueVaults.has(vaultName)) duplicates.add(vaultName);
    uniqueVaults.add(vaultName);
  });

  if (duplicates.size > 0) {
    const txt = "Fix it";
    const duplicateVaultNames = Array.from(duplicates).join(", ");
    await vscode.window
      .showErrorMessage(
        `Following vault names have duplicates: ${duplicateVaultNames} See https://dendron.so/notes/a6c03f9b-8959-4d67-8394-4d204ab69bfe.html#multiple-vaults-with-the-same-name to fix`,
        txt
      )
      .then((resp) => {
        if (resp === txt) {
          vscode.commands.executeCommand(
            "vscode.open",
            vscode.Uri.parse(
              "https://dendron.so/notes/a6c03f9b-8959-4d67-8394-4d204ab69bfe.html#multiple-vaults-with-the-same-name"
            )
          );
        }
      });
    return false;
  }
  return true;
}
