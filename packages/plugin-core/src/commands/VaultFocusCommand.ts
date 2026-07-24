import { VaultUtils } from "@dendronhq/common-all";
import { QuickPickItem, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { WorkspaceModesService } from "../services/WorkspaceModesService";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = void;

type VaultItem = QuickPickItem & { vaultName?: string; clear?: boolean };

/**
 * Sprint 4: focus Dendron work on a single vault (or clear focus).
 */
export class VaultFocusCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.VAULT_FOCUS.key;
  static requireActiveWorkspace = true;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(): Promise<CommandOutput> {
    const { vaults } = this._ext.getDWorkspace();
    const current = WorkspaceModesService.getFocusedVaultName();

    const items: VaultItem[] = [
      {
        label: "$(clear-all) All vaults",
        description: current ? "Clear vault focus" : "Currently unfocused",
        clear: true,
      },
      ...vaults.map((v) => {
        const name = VaultUtils.getName(v);
        return {
          label: `$(folder) ${name}`,
          description: v.fsPath,
          ...(name === current ? { detail: "Currently focused" } : {}),
          vaultName: name,
        };
      }),
    ];

    const picked = await window.showQuickPick(items, {
      title: "Dendron Vault Focus",
      placeHolder: "Limit capture / board / review to one vault",
    });
    if (!picked) return;

    if (picked.clear) {
      await WorkspaceModesService.setFocusedVaultName(undefined);
      await WorkspaceModesService.setActiveWorkmodeName(undefined);
      window.showInformationMessage("Vault focus cleared (all vaults).");
      return;
    }

    if (picked.vaultName) {
      await WorkspaceModesService.setFocusedVaultName(picked.vaultName);
      window.showInformationMessage(`Vault focus: ${picked.vaultName}`);
    }
  }
}
