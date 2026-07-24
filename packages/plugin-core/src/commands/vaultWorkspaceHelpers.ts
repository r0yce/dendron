/**
 * Shared vault add helpers (VaultAdd + AddExistingVault).
 */
import {
  ConfigUtils,
  CONSTANTS,
  DendronConfig,
  DVault,
  DWorkspace,
  SelfContainedVault,
  WorkspaceEvents,
} from "@dendronhq/common-all";
import { DConfig, GitUtils, pathForVaultRoot } from "@dendronhq/common-server";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";
import { PluginFileUtils } from "../utils/files";
import { MessageSeverity, VSCodeUtils } from "../vsCodeUtils";

/** If a self contained vault contains transitive dependencies, warn the user. */
export async function checkAndWarnTransitiveDeps(opts: {
  vault: SelfContainedVault;
  wsRoot: string;
  logCtx?: string;
}): Promise<void> {
  const vaultRootPath = pathForVaultRoot(opts);
  try {
    if (
      await fs.pathExists(
        path.join(vaultRootPath, CONSTANTS.DENDRON_CONFIG_FILE)
      )
    ) {
      const vaultConfig = DConfig.getRaw(vaultRootPath) as DendronConfig;
      if (ConfigUtils.getVaults(vaultConfig)?.length > 1) {
        await AnalyticsUtils.trackForNextRun(
          WorkspaceEvents.TransitiveDepsWarningShow
        );
        const openDocsOption = "Open documentation & continue";
        const select = await VSCodeUtils.showMessage(
          MessageSeverity.WARN,
          "The vault you added depends on other vaults, which is not supported.",
          {
            modal: true,
            detail:
              "You may be unable to access these transitive vaults. The vault itself should continue to work. Please see for [details]()",
          },
          {
            title: "Continue",
            isCloseAffordance: true,
          },
          { title: openDocsOption }
        );
        if (select?.title === openDocsOption) {
          await PluginFileUtils.openWithDefaultApp(
            "https://wiki.dendron.so/notes/q9yo0y7czv8mxlkbnw1ugj1"
          );
        }
      }
    }
  } catch (err) {
    Logger.warn({
      ctx: opts.logCtx ?? "checkAndWarnTransitiveDeps",
      err,
    });
  }
}

export async function addVaultToWorkspace(vault: DVault, wsRoot?: string) {
  return WorkspaceUtils.addVaultToWorkspace({
    vault,
    wsRoot: wsRoot ?? ExtensionProvider.getDWorkspace().wsRoot,
  });
}

export async function addWorkspaceToWorkspace(opts: {
  workspace: DWorkspace;
  wsRoot?: string;
}): Promise<void> {
  const wsRoot = opts.wsRoot ?? ExtensionProvider.getDWorkspace().wsRoot;
  const { workspace } = opts;
  for (const vault of workspace.vaults) {
    // eslint-disable-next-line no-await-in-loop
    await addVaultToWorkspace(vault, wsRoot);
  }
  await GitUtils.addToGitignore({
    addPath: workspace.name,
    root: wsRoot,
    noCreateIfMissing: true,
  });

  const workspaceDir = path.join(wsRoot, workspace.name);
  await fs.ensureDir(workspaceDir);
  await GitUtils.addToGitignore({
    addPath: ".dendron.cache.*",
    root: workspaceDir,
  });
}
