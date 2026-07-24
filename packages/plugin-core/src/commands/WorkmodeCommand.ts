import { VaultUtils } from "@dendronhq/common-all";
import { QuickPickItem, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import {
  Workmode,
  WorkspaceModesService,
} from "../services/WorkspaceModesService";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = void;

type ModeItem = QuickPickItem & {
  mode?: Workmode;
  action?: "apply" | "save" | "delete" | "clear";
};

/**
 * Sprint 4: named workmodes (spaces) — vault focus presets.
 */
export class WorkmodeCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.WORKMODE.key;
  static requireActiveWorkspace = true;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(): Promise<CommandOutput> {
    const modes = WorkspaceModesService.listWorkmodes();
    const active = WorkspaceModesService.getActiveWorkmodeName();
    const focus = WorkspaceModesService.getFocusedVaultName();

    const items: ModeItem[] = [
      {
        label: "$(add) Save current as workmode…",
        description: focus
          ? `vault=${focus}`
          : "vault=all (focus a vault first for best results)",
        action: "save",
      },
      {
        label: "$(close) Clear active workmode",
        description: active ? `active: ${active}` : "none active",
        action: "clear",
      },
      ...modes.map((mode) => ({
        label: `$(versions) ${mode.name}`,
        description: mode.vaultName
          ? `vault: ${mode.vaultName}`
          : "vault: all",
        detail:
          (mode.description || "") +
          (mode.name === active ? " · active" : ""),
        mode,
        action: "apply" as const,
      })),
      ...modes.map((mode) => ({
        label: `$(trash) Delete workmode: ${mode.name}`,
        mode,
        action: "delete" as const,
      })),
    ];

    const picked = await window.showQuickPick(items, {
      title: "Dendron Workmodes (Spaces)",
      placeHolder: "Apply a saved space, or save the current vault focus",
      matchOnDescription: true,
    });
    if (!picked?.action) return;

    if (picked.action === "clear") {
      await WorkspaceModesService.setActiveWorkmodeName(undefined);
      window.showInformationMessage("Workmode cleared.");
      return;
    }

    if (picked.action === "save") {
      const name = await window.showInputBox({
        title: "Save workmode",
        placeHolder: "e.g. Writing, Work, Research",
        prompt: "Name for this vault-focus preset",
        ignoreFocusOut: true,
      });
      if (!name?.trim()) return;
      const description = await window.showInputBox({
        title: "Workmode description (optional)",
        placeHolder: "What is this space for?",
        ignoreFocusOut: true,
      });
      const vaultName = WorkspaceModesService.getFocusedVaultName();
      const next: Workmode = {
        name: name.trim(),
        ...(vaultName ? { vaultName } : {}),
        ...(description?.trim() ? { description: description.trim() } : {}),
      };
      const existing = modes.filter((m) => m.name !== next.name);
      await WorkspaceModesService.saveWorkmodes([...existing, next]);
      await WorkspaceModesService.applyWorkmode(next);
      window.showInformationMessage(
        `Workmode saved & applied: ${next.name}` +
          (next.vaultName ? ` (vault ${next.vaultName})` : "")
      );
      return;
    }

    if (picked.action === "delete" && picked.mode) {
      const remaining = modes.filter((m) => m.name !== picked.mode!.name);
      await WorkspaceModesService.saveWorkmodes(remaining);
      if (active === picked.mode.name) {
        await WorkspaceModesService.setActiveWorkmodeName(undefined);
      }
      window.showInformationMessage(`Deleted workmode: ${picked.mode.name}`);
      return;
    }

    if (picked.action === "apply" && picked.mode) {
      // Validate vault still exists
      if (picked.mode.vaultName) {
        const { vaults } = this._ext.getDWorkspace();
        const ok = vaults.some(
          (v) => VaultUtils.getName(v) === picked.mode!.vaultName
        );
        if (!ok) {
          window.showErrorMessage(
            `Vault "${picked.mode.vaultName}" no longer exists. Edit/delete this workmode.`
          );
          return;
        }
      }
      await WorkspaceModesService.applyWorkmode(picked.mode);
      window.showInformationMessage(`Workmode: ${picked.mode.name}`);
    }
  }
}
