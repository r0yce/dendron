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
import _ from "lodash";
import path from "path";
import { commands, QuickPickItem, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS, DENDRON_REMOTE_VAULTS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
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

export class VaultAddCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.VAULT_ADD.key;

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
    const localVaultPathPlaceholder = "vault2";
    let sourcePath: string;
    let sourceName: string | undefined;
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
          const path2Vault =
            selected.label === "custom"
              ? GitUtils.getRepoNameFromURL(sourceRemotePath)
              : selected.label;
          const placeHolder = path2Vault;

          const out = await VSCodeUtils.showInputBox({
            prompt: "Path to your new vault (relative to your workspace root)",
            placeHolder: localVaultPathPlaceholder,
            value: path2Vault,
          });
          if (PickerUtilsV2.isInputEmpty(out)) {
            resolve(undefined);
          }
          sourcePath = out!;

          sourceName = await VSCodeUtils.showInputBox({
            prompt: "Name of new vault (optional, press enter to skip)",
            value: placeHolder,
          });
          qp.hide();
          return resolve({
            type: sourceType!,
            name: sourceName,
            path: sourcePath,
            pathRemote: sourceRemotePath,
          });
        });
        qp.show();
      });
      return out;
    } else {
      const out = await VSCodeUtils.showInputBox({
        prompt: "Path to your new vault (relative to your workspace root)",
        placeHolder: localVaultPathPlaceholder,
      });
      if (PickerUtilsV2.isInputEmpty(out)) return;
      sourcePath = out!;
    }
    sourceName = await VSCodeUtils.showInputBox({
      prompt: "Name of new vault (optional, press enter to skip)",
    });
    return {
      type: sourceType,
      name: sourceName,
      path: sourcePath,
    };
  }

  async gatherVaultSelfContained(
    sourceType: VaultRemoteSource,
  ): Promise<CommandOpts | undefined> {
    // If the vault name already exists, creating a vault with the same name would break things

    if (sourceType === VaultType.LOCAL) {
      // Local vault
      // For self contained vaults, we'll have the vault name match the folder for
      // now. We can make this flexible later if that's a better UX, or give
      // instructions on the wiki on how to change the name later.
      const vaultName = await VSCodeUtils.showInputBox({
        title: "Vault name",
        prompt: "Name for the new vault",
        placeHolder: "my-vault",
      });
      // If empty, then user cancelled the prompt
      if (PickerUtilsV2.isInputEmpty(vaultName)) return;

      return {
        type: sourceType,
        name: vaultName,
        path: path.join(
          FOLDERS.DEPENDENCIES,
          FOLDERS.LOCAL_DEPENDENCY,
          vaultName,
        ),
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

      // Calculate the vault name from the remote. If that fails, ask the user for a unique name to use.
      const vaultName: string | undefined = GitUtils.getRepoNameFromURL(remote);

      return {
        type: sourceType,
        name: vaultName,
        path: path.join(
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
    window.showWarningMessage(
      `This command will be deprecated in future releases. 
      Please use Dendron: Create New Vault to create a new vault and 
      Dendron: Add Existing Vault to add an existing vault to your workspace.`,
    );
    const sourceTypeSelected = await VSCodeUtils.showQuickPick([
      { label: VaultType.LOCAL, picked: true },
      { label: VaultType.REMOTE },
    ]);
    if (!sourceTypeSelected) {
      return;
    }
    const sourceType = sourceTypeSelected.label;

    const { config } = ExtensionProvider.getDWorkspace();
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
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
      pathIsAbsolute: false,
    });
  }

  async handleRemoteRepoSelfContained(
    opts: CommandOpts,
  ): Promise<{ vaults: DVault[] }> {
    return handleRemoteRepoSelfContainedShared({
      vaultOpts: opts,
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
      pathIsAbsolute: false,
      logCtx: "VaultAddCommand.handleRemoteRepoSelfContained",
    });
  }

  async checkAndWarnTransitiveDeps(opts: {
    vault: SelfContainedVault;
    wsRoot: string;
  }) {
    return checkAndWarnTransitiveDepsHelper({
      ...opts,
      logCtx: "VaultAddCommand.handleRemoteRepoSelfContained",
    });
  }

  async addWorkspaceToWorkspace(workspace: DWorkspace) {
    return addWorkspaceToWorkspaceHelper({ workspace });
  }

  async addVaultToWorkspace(vault: DVault) {
    return addVaultToWorkspaceHelper(vault);
  }

  /**
   * Returns all vaults added
   * @param opts
   * @returns
   */
  async execute(opts: CommandOpts) {
    const ctx = "VaultAdd";
    let vaults: DVault[];
    Logger.info({ ctx, msg: "enter", opts });
    if (opts.type === VaultType.REMOTE) {
      if (opts.isSelfContained) {
        ({ vaults } = await this.handleRemoteRepoSelfContained(opts));
      } else {
        ({ vaults } = await this.handleRemoteRepo(opts));
      }
    } else {
      const wsRoot = ExtensionProvider.getDWorkspace().wsRoot;
      const fsPath = VaultUtils.normVaultPath({
        vault: { fsPath: opts.path },
        wsRoot,
      });
      const wsService = new WorkspaceService({ wsRoot });
      const vault: DVault = {
        fsPath,
      };
      // Make sure these don't get set to undefined, or serialization breaks
      if (opts.isSelfContained) {
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
          newVault: true,
        });
      } else {
        await wsService.createVault({ vault });
      }
      await this.addVaultToWorkspace(vault);
      vaults = [vault];
    }
    window.showInformationMessage("finished adding vault");
    await commands.executeCommand("workbench.action.reloadWindow");
    return { vaults };
  }
}
