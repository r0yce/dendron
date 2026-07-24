import {
  DVault,
  DWorkspace,
  FOLDERS,
  SelfContainedVault,
  VaultRemoteSource,
  VaultUtils,
} from "@dendronhq/common-all";
import { GitUtils } from "@dendronhq/common-server";
import { WorkspaceService } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import {
  commands,
  OpenDialogOptions,
  QuickPickItem,
  Uri,
  window,
} from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS, DENDRON_REMOTE_VAULTS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import {
  addVaultToWorkspace as addVaultToWorkspaceHelper,
  addWorkspaceToWorkspace as addWorkspaceToWorkspaceHelper,
  checkAndWarnTransitiveDeps as checkAndWarnTransitiveDepsHelper,
} from "./vaultWorkspaceHelpers";
import {
  handleRemoteRepoSelfContained as handleRemoteRepoSelfContainedShared,
  handleRemoteRepoStandard,
} from "./vaultRemoteHandlers";

type CommandOpts = {
  type: VaultRemoteSource;
  path: string;
  pathRemote?: string | undefined;
  name?: string | undefined;
  isSelfContained?: boolean | undefined;
};

type CommandOutput = { vaults: DVault[] };

export { CommandOpts as VaultAddCommandOpts };

type SourceQuickPickEntry = QuickPickItem & { src: string };

enum VaultType {
  LOCAL = "local",
  REMOTE = "remote",
}

export class AddExistingVaultCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.ADD_EXISTING_VAULT.key;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  generateRemoteEntries = (): SourceQuickPickEntry[] => {
    return DENDRON_REMOTE_VAULTS.map(
      ({ name: label, description, data: src }): SourceQuickPickEntry => {
        return { label, description, src };
      },
    ).concat([
      {
        label: "custom",
        description: "custom endpoint",
        alwaysShow: true,
        src: "",
      },
    ]);
  };

  /** A regular, non-self contained vault. */
  async gatherVaultStandard(
    sourceType: VaultRemoteSource,
  ): Promise<CommandOpts | undefined> {
    let sourceName: string | undefined;
    let vaultDestination: string | undefined;
    if (sourceType === VaultType.REMOTE) {
      // eslint-disable-next-line  no-async-promise-executor
      const out = new Promise<CommandOpts | undefined>(async (resolve) => {
        const qp = VSCodeUtils.createQuickPick<SourceQuickPickEntry>();
        qp.ignoreFocusOut = true;
        qp.placeholder = "choose a preset or enter a custom git endpoint";
        qp.items = this.generateRemoteEntries();
        qp.onDidAccept(async () => {
          const value = qp.value;
          const selected = qp.selectedItems[0];
          if (!selected) {
            qp.hide();
            return resolve(undefined);
          }
          if (selected.label === "custom") {
            if (PickerUtilsV2.isInputEmpty(value)) {
              return window.showInformationMessage("please enter an endpoint");
            }
            selected.src = qp.value;
          }
          const sourceRemotePath = selected.src;

          const placeHolder =
            selected.label === "custom"
              ? GitUtils.getRepoNameFromURL(sourceRemotePath)
              : selected.label;

          const out = await VSCodeUtils.showInputBox({
            prompt: "Path to your new vault (relative to your workspace root)",
            placeHolder: path.basename(placeHolder),
            value: placeHolder,
          });

          if (PickerUtilsV2.isInputEmpty(out)) {
            return resolve(undefined);
          }
          vaultDestination = path.join(this._ext.getDWorkspace().wsRoot, out);

          sourceName = await VSCodeUtils.showInputBox({
            prompt: "Name of new vault (optional, press enter to skip)",
            value: placeHolder,
          });
          qp.hide();
          return resolve({
            type: sourceType,
            name: sourceName,
            path: vaultDestination,
            pathRemote: sourceRemotePath,
          });
        });
        qp.show();
      });
      return out;
    }

    vaultDestination = await this.gatherDestinationFolder();
    if (!vaultDestination) return;
    const placeHolder = path.basename(vaultDestination);
    sourceName = await VSCodeUtils.showInputBox({
      prompt: "Name of new vault (optional, press enter to skip)",
      placeHolder,
    });
    return {
      type: sourceType,
      name: sourceName,
      path: vaultDestination,
    };
  }

  async gatherDestinationFolder() {
    const defaultUri = Uri.file(this._ext.getDWorkspace().wsRoot);
    // opens the workspace root by default and prompts user to select vault
    const options: OpenDialogOptions = {
      canSelectMany: false,
      openLabel: "Select vault to add",
      canSelectFiles: false,
      canSelectFolders: true,
      defaultUri,
    };
    const folder = await VSCodeUtils.openFilePicker(options);
    if (_.isUndefined(folder)) {
      return;
    }
    return folder;
  }

  async gatherVaultSelfContained(
    sourceType: VaultRemoteSource,
  ): Promise<CommandOpts | undefined> {
    if (sourceType === VaultType.LOCAL) {
      const sourcePath = await this.gatherDestinationFolder();
      if (!sourcePath) return;
      const placeHolder = path.basename(sourcePath);
      const sourceName =
        (await VSCodeUtils.showInputBox({
          prompt: "Name of new vault (optional, press enter to skip)",
          placeHolder,
        })) || placeHolder;

      const vaultDestination = path.join(
        this._ext.getDWorkspace().wsRoot,
        FOLDERS.DEPENDENCIES,
        FOLDERS.LOCAL_DEPENDENCY,
        sourceName,
      );
      await fs.copy(sourcePath, vaultDestination);

      return {
        type: sourceType,
        name: sourceName,
        path: vaultDestination,
        isSelfContained: true,
      };
    } else {
      // Remote vault
      const remote = await VSCodeUtils.showInputBox({
        title: "Remote URL",
        prompt: "Enter the URL for the git remote",
        placeHolder: "git@github.com:dendronhq/dendron.git",
        ignoreFocusOut: true,
      });
      // Cancelled
      if (PickerUtilsV2.isInputEmpty(remote)) return;

      // Calculate the vault name from the remote.
      const vaultName: string | undefined = GitUtils.getRepoNameFromURL(remote);

      const sourceName = await VSCodeUtils.showInputBox({
        prompt: "Name of new vault (optional, press enter to skip)",
        value: vaultName,
      });

      return {
        type: sourceType,
        name: sourceName,
        path: path.join(
          this._ext.getDWorkspace().wsRoot,
          FOLDERS.DEPENDENCIES,
          GitUtils.remoteUrlToDependencyPath({
            vaultName,
            url: remote,
          }),
        ),
        pathRemote: remote,
        isSelfContained: true,
      };
    }
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const sourceTypeSelected = await VSCodeUtils.showQuickPick([
      {
        label: VaultType.LOCAL,
        picked: true,
        detail: "eg. /home/dendron/hello-vault",
        description:
          "A local vault is a Dendron vault that is present in your computer",
      },
      {
        label: VaultType.REMOTE,
        detail: "eg. git@github.com:dendronhq/dendron-site.git",
        description:
          "A remote vault is a Dendron vault that is available at a git endpoint",
      },
    ]);
    if (!sourceTypeSelected) {
      return;
    }
    const sourceType = sourceTypeSelected.label;

    const { config } = this._ext.getDWorkspace();
    if (config.dev?.enableSelfContainedVaults) {
      return this.gatherVaultSelfContained(sourceType);
    } else {
      // A "standard", non self contained vault
      return this.gatherVaultStandard(sourceType);
    }
  }

  async handleRemoteRepo(
    opts: CommandOpts,
  ): Promise<{ vaults: DVault[]; workspace?: DWorkspace | undefined }> {
    return handleRemoteRepoStandard({
      vaultOpts: opts,
      wsRoot: this._ext.getDWorkspace().wsRoot,
      pathIsAbsolute: true,
    });
  }

  async handleRemoteRepoSelfContained(
    opts: CommandOpts,
  ): Promise<{ vaults: DVault[] }> {
    return handleRemoteRepoSelfContainedShared({
      vaultOpts: opts,
      wsRoot: this._ext.getDWorkspace().wsRoot,
      pathIsAbsolute: true,
      logCtx: "AddExistingVaultCommand.handleRemoteRepoSelfContained",
    });
  }

  async checkAndWarnTransitiveDeps(opts: {
    vault: SelfContainedVault;
    wsRoot: string;
  }) {
    return checkAndWarnTransitiveDepsHelper({
      ...opts,
      logCtx: "AddExistingVaultCommand.handleRemoteRepoSelfContained",
    });
  }

  async addWorkspaceToWorkspace(workspace: DWorkspace) {
    return addWorkspaceToWorkspaceHelper({
      workspace,
      wsRoot: this._ext.getDWorkspace().wsRoot,
    });
  }

  async addVaultToWorkspace(vault: DVault) {
    return addVaultToWorkspaceHelper(vault, this._ext.getDWorkspace().wsRoot);
  }

  /**
   * Returns all vaults added
   * @param opts
   * @returns
   */
  async execute(opts: CommandOpts) {
    const ctx = "AddExistingVaultCommand";
    let vaults: DVault[];
    Logger.info({ ctx, msg: "enter", opts });
    if (opts.type === VaultType.REMOTE) {
      if (opts.isSelfContained) {
        ({ vaults } = await this.handleRemoteRepoSelfContained(opts));
      } else {
        ({ vaults } = await this.handleRemoteRepo(opts));
      }
    } else {
      const wsRoot = this._ext.getDWorkspace().wsRoot;
      const fsPath = VaultUtils.normVaultPath({
        vault: { fsPath: opts.path },
        wsRoot,
      });
      const wsService = new WorkspaceService({ wsRoot });
      const vault: DVault = {
        fsPath,
      };
      // Make sure these don't get set to undefined, or serialization breaks
      if (await fs.pathExists(path.join(opts.path, FOLDERS.NOTES))) {
        vault.selfContained = true;
      }
      if (opts.name) {
        vault.name = opts.name;
      }

      if (VaultUtils.isSelfContained(vault)) {
        await wsService.createSelfContainedVault({
          vault,
          addToConfig: true,
          addToCodeWorkspace: false,
          newVault: false,
        });
      } else {
        await wsService.createVault({ vault });
      }
      await this.addVaultToWorkspace(vault);
      vaults = [vault];
    }
    await commands.executeCommand("workbench.action.reloadWindow");
    window.showInformationMessage("finished adding vault");
    return { vaults };
  }
}
