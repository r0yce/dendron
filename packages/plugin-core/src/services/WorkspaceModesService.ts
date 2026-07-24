import { DVault, VaultUtils } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";

const KEY_VAULT_FOCUS = "dendron.vaultFocus";
const KEY_WORKMODES = "dendron.workmodes";
const KEY_ACTIVE_WORKMODE = "dendron.activeWorkmode";

export type Workmode = {
  name: string;
  vaultName?: string;
  description?: string;
};

/**
 * Vault focus + named workmodes ("spaces"), persisted in VS Code workspaceState.
 *
 * **Vault focus** — when set, rituals (inbox, board, health, review), lookup
 * candidates, tree roots, and graph vault filters should call
 * `filterNotesByFocus` / `getFocusedVaultName` so the UX stays single-vault.
 *
 * **Workmodes** — named presets that can apply a vault focus (and later more).
 *
 * Subscribe with `onFocusChange` so tree/graph webviews refresh live.
 */
export class WorkspaceModesService {
  private static _statusBar: vscode.StatusBarItem | undefined;
  private static _focusListeners: Array<() => void> = [];

  /** Subscribe to vault-focus changes (tree view refresh, etc.). */
  static onFocusChange(listener: () => void): vscode.Disposable {
    this._focusListeners.push(listener);
    return {
      dispose: () => {
        this._focusListeners = this._focusListeners.filter((l) => l !== listener);
      },
    };
  }

  private static notifyFocusChange(): void {
    for (const l of this._focusListeners) {
      try {
        l();
      } catch {
        // ignore listener errors
      }
    }
  }

  private static wsState(): vscode.Memento | undefined {
    try {
      return ExtensionProvider.getExtension().context.workspaceState;
    } catch {
      return undefined;
    }
  }

  static getFocusedVaultName(): string | undefined {
    return this.wsState()?.get<string>(KEY_VAULT_FOCUS);
  }

  static getFocusedVault(): DVault | undefined {
    const name = this.getFocusedVaultName();
    if (!name) return undefined;
    try {
      const { vaults } = ExtensionProvider.getDWorkspace();
      return VaultUtils.getVaultByName({ vaults, vname: name });
    } catch {
      return undefined;
    }
  }

  static async setFocusedVaultName(
    vaultName: string | undefined
  ): Promise<void> {
    const state = this.wsState();
    if (!state) return;
    if (vaultName) {
      await state.update(KEY_VAULT_FOCUS, vaultName);
    } else {
      await state.update(KEY_VAULT_FOCUS, undefined);
    }
    await vscode.commands.executeCommand(
      "setContext",
      "dendron:vaultFocus",
      !!vaultName
    );
    await vscode.commands.executeCommand(
      "setContext",
      "dendron:vaultFocusName",
      vaultName || ""
    );
    this.refreshStatusBar();
    this.notifyFocusChange();
  }

  static listWorkmodes(): Workmode[] {
    return this.wsState()?.get<Workmode[]>(KEY_WORKMODES) ?? [];
  }

  static async saveWorkmodes(modes: Workmode[]): Promise<void> {
    await this.wsState()?.update(KEY_WORKMODES, modes);
  }

  static getActiveWorkmodeName(): string | undefined {
    return this.wsState()?.get<string>(KEY_ACTIVE_WORKMODE);
  }

  static async setActiveWorkmodeName(name: string | undefined): Promise<void> {
    await this.wsState()?.update(KEY_ACTIVE_WORKMODE, name);
    this.refreshStatusBar();
  }

  static async applyWorkmode(mode: Workmode): Promise<void> {
    await this.setFocusedVaultName(mode.vaultName);
    await this.setActiveWorkmodeName(mode.name);
  }

  static ensureStatusBar(): void {
    if (!this._statusBar) {
      this._statusBar = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        50
      );
      this._statusBar.command = "dendron.vaultFocus";
      this._statusBar.tooltip = "Dendron vault focus (click to change)";
      try {
        ExtensionProvider.getExtension().context.subscriptions.push(
          this._statusBar
        );
      } catch {
        // extension not ready
      }
    }
    this.refreshStatusBar();
  }

  static refreshStatusBar(): void {
    if (!this._statusBar) return;
    const vault = this.getFocusedVaultName();
    const mode = this.getActiveWorkmodeName();
    if (!vault && !mode) {
      this._statusBar.text = "$(folder) Vault: all";
      this._statusBar.show();
      return;
    }
    const parts = [
      mode ? `$(versions) ${mode}` : undefined,
      vault ? `$(folder) ${vault}` : "$(folder) all",
    ].filter(Boolean);
    this._statusBar.text = parts.join(" · ");
    this._statusBar.show();
  }

  /** Prefer focused vault when present, else first vault. */
  static resolveWriteVault(): DVault | undefined {
    const focused = this.getFocusedVault();
    if (focused) return focused;
    try {
      return ExtensionProvider.getDWorkspace().vaults[0];
    } catch {
      return undefined;
    }
  }

  /** Filter notes to focused vault when focus is active. */
  static filterNotesByFocus<T extends { vault: DVault }>(notes: T[]): T[] {
    const focused = this.getFocusedVault();
    if (!focused) return notes;
    return notes.filter((n) => VaultUtils.isEqualV2(n.vault, focused));
  }

  /**
   * Filter lookup QuickPick rows by vault focus while **keeping create-new rows**.
   * Create-new items often carry a picker vault that may not equal the focused vault;
   * they must remain visible so users can still create notes under focus.
   */
  static filterQuickPickItemsByFocus<
    T extends { vault?: DVault; label?: string; detail?: string }
  >(
    items: T[],
    opts?: {
      /** Labels that always pass (defaults cover "Create New" variants). */
      alwaysKeepLabels?: string[];
      /** Detail strings that always pass (create-new note detail). */
      alwaysKeepDetails?: string[];
    }
  ): T[] {
    const focused = this.getFocusedVault();
    if (!focused) return items;

    const keepLabels = new Set(
      opts?.alwaysKeepLabels ?? ["Create New", "Create New with Template"]
    );
    const keepDetails = new Set(opts?.alwaysKeepDetails ?? []);

    return items.filter((item) => {
      const label = String(item.label || "");
      if (keepLabels.has(label) || label.includes("Create New")) {
        return true;
      }
      if (item.detail && keepDetails.has(item.detail)) {
        return true;
      }
      if (!item.vault) {
        return true;
      }
      return VaultUtils.isEqualV2(item.vault, focused);
    });
  }
}
