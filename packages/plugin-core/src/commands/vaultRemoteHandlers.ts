/**
 * Shared remote-vault clone + register logic for VaultAdd / AddExistingVault.
 */
import {
  asyncLoopOneAtATime,
  DendronError,
  DVault,
  DWorkspace,
  VaultUtils,
} from "@dendronhq/common-all";
import { GitUtils, simpleGit } from "@dendronhq/common-server";
import { Git, WorkspaceService } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ProgressLocation, window } from "vscode";
import {
  addVaultToWorkspace,
  addWorkspaceToWorkspace,
  checkAndWarnTransitiveDeps,
} from "./vaultWorkspaceHelpers";

export type RemoteVaultOpts = {
  path: string;
  pathRemote?: string | undefined;
  name?: string | undefined;
};

/**
 * Resolve local clone path: relative to wsRoot (new vault) vs absolute (existing).
 */
export function resolveRemoteCloneLocalPath(opts: {
  wsRoot: string;
  path: string;
  pathIsAbsolute: boolean;
}): string {
  return opts.pathIsAbsolute ? opts.path : path.join(opts.wsRoot, opts.path);
}

/**
 * Clone a remote git repo and register vaults (non self-contained).
 */
export async function handleRemoteRepoStandard(opts: {
  vaultOpts: RemoteVaultOpts;
  wsRoot: string;
  /** true = AddExisting (absolute path); false = VaultAdd (relative to wsRoot) */
  pathIsAbsolute: boolean;
}): Promise<{ vaults: DVault[]; workspace?: DWorkspace | undefined }> {
  const { vaultOpts, wsRoot, pathIsAbsolute } = opts;
  const { vaults, workspace } = await window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: "Adding remote vault",
      cancellable: false,
    },
    async (progress) => {
      progress.report({ message: "cloning repo" });
      const git = simpleGit({ baseDir: wsRoot });
      // path may be relative (VaultAdd) or absolute (AddExisting)
      await git.clone(vaultOpts.pathRemote!, vaultOpts.path);
      const repoPath = resolveRemoteCloneLocalPath({
        wsRoot,
        path: vaultOpts.path,
        pathIsAbsolute,
      });
      const { vaults, workspace } = await GitUtils.getVaultsFromRepo({
        repoPath,
        wsRoot,
        repoUrl: vaultOpts.pathRemote!,
      });
      if (_.size(vaults) === 1 && vaultOpts.name) {
        vaults[0]!.name = vaultOpts.name;
      }
      progress.report({ message: "adding vault" });
      const wsService = new WorkspaceService({ wsRoot });

      if (workspace) {
        await wsService.addWorkspace({ workspace });
        await addWorkspaceToWorkspace({ workspace, wsRoot });
      } else {
        for (const vault of vaults) {
          await wsService.createVault({ vault });
          await addVaultToWorkspace(vault, wsRoot);
        }
      }
      return { vaults, workspace };
    },
  );
  return { vaults, workspace };
}

/**
 * Clone a remote repo as self-contained vault(s).
 */
export async function handleRemoteRepoSelfContained(opts: {
  vaultOpts: RemoteVaultOpts;
  wsRoot: string;
  pathIsAbsolute: boolean;
  logCtx: string;
}): Promise<{ vaults: DVault[] }> {
  const { vaultOpts, wsRoot, pathIsAbsolute, logCtx } = opts;
  return window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: "Adding remote vault",
      cancellable: false,
    },
    async (progress) => {
      progress.report({
        message: "cloning repo",
        increment: 0,
      });
      const { name, pathRemote: remoteUrl } = vaultOpts;
      const localUrl = resolveRemoteCloneLocalPath({
        wsRoot,
        path: vaultOpts.path,
        pathIsAbsolute,
      });
      if (!remoteUrl) {
        throw new DendronError({
          message:
            "Remote vault has no remote set. This should never happen, please send a bug report if you encounter this.",
        });
      }

      await fs.ensureDir(localUrl);
      const git = new Git({ localUrl, remoteUrl });
      await git.clone(".");
      const { vaults, workspace } = await GitUtils.getVaultsFromRepo({
        repoPath: localUrl,
        wsRoot,
        repoUrl: remoteUrl,
      });
      if (_.size(vaults) === 1 && name) {
        vaults[0]!.name = name;
      }
      const increment = 100 / (vaults.length + 1);
      progress.report({
        message:
          vaults.length === 1
            ? "adding vault"
            : `adding ${vaults.length} vaults`,
        increment,
      });
      const wsService = new WorkspaceService({ wsRoot });

      if (workspace) {
        const clonedWSPath = path.join(wsRoot, workspace.name);
        await fs.move(localUrl, clonedWSPath);
        workspace.vaults = (
          await GitUtils.getVaultsFromRepo({
            repoPath: clonedWSPath,
            repoUrl: remoteUrl,
            wsRoot,
          })
        ).vaults;
        await wsService.addWorkspace({ workspace });
        await addWorkspaceToWorkspace({ workspace, wsRoot });
      } else {
        await asyncLoopOneAtATime(vaults, async (vault) => {
          if (VaultUtils.isSelfContained(vault)) {
            await checkAndWarnTransitiveDeps({
              vault,
              wsRoot,
              logCtx,
            });
            await wsService.createSelfContainedVault({
              vault,
              addToConfig: true,
              newVault: false,
            });
          } else {
            await wsService.createVault({ vault });
          }
          await addVaultToWorkspace(vault, wsRoot);
          progress.report({ increment });
        });
      }
      wsService.dispose();
      return { vaults, workspace };
    },
  );
}
