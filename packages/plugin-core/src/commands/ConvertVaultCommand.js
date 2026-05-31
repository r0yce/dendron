"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertVaultCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const constants_1 = require("../constants");
const base_1 = require("./base");
const vscode_1 = require("vscode");
const vsCodeUtils_1 = require("../vsCodeUtils");
const workspace_1 = require("../workspace");
const logger_1 = require("../logger");
const ReloadIndex_1 = require("./ReloadIndex");
const common_server_1 = require("@dendronhq/common-server");
class ConvertVaultCommand extends base_1.BasicCommand {
    _ext;
    key = constants_1.DENDRON_COMMANDS.CONVERT_VAULT.key;
    constructor(_ext) {
        super();
        this._ext = _ext;
    }
    async gatherVault() {
        const { vaults } = this._ext.getDWorkspace();
        return (await vsCodeUtils_1.VSCodeUtils.showQuickPick(vaults.map((ent) => ({
            label: common_all_1.VaultUtils.getName(ent),
            detail: ent.fsPath,
            data: ent,
        }))))?.data;
    }
    async gatherType(vault) {
        // Guess what we are converting to, based on the vault the user selected.
        let pickedLocal = false;
        let pickedRemote = false;
        if (vault.remote) {
            pickedLocal = true;
        }
        else {
            pickedRemote = true;
        }
        // We still ask the user in case we guessed wrong, or they are trying to
        // fix an issue with their workspace.
        return (await vsCodeUtils_1.VSCodeUtils.showQuickPick([
            {
                label: "Convert to local",
                detail: "The vault will become a local vault, which is a direct part of your workspace.",
                picked: pickedLocal,
                data: "local",
            },
            {
                label: "Convert to remote",
                detail: "The vault will become a remote vault, which can be shared and maintained separately from your workspace.",
                picked: pickedRemote,
                data: "remote",
            },
        ]))?.data;
    }
    async gatherRemoteURL() {
        // Ask for a remote URL, but it's not strictly required. The user can set up the remote themselves later.
        return vsCodeUtils_1.VSCodeUtils.showInputBox({
            title: "Remote URL",
            prompt: "Enter the remote URL",
            placeHolder: "git@github.com:dendronhq/dendron-site.git",
        });
    }
    /** Prompt the user if they agree to have their vault folder moved.
     *
     * @return true if the user agreed to the prompt, false if they cancelled or dismissed it.
     */
    async promptForFolderMove(vault, remote) {
        const fromPath = common_all_1.VaultUtils.getRelPath(vault);
        const toPath = common_server_1.GitUtils.getDependencyPathWithRemote({ vault, remote });
        const acceptLabel = "Accept";
        const items = [
            {
                label: acceptLabel,
                description: `${fromPath} will be moved to ${toPath}`,
            },
            {
                label: "Cancel",
            },
        ];
        const out = await vscode_1.window.showQuickPick(items, {
            canPickMany: false,
            ignoreFocusOut: true,
            title: "The vault folder will be moved",
        });
        if (out?.label === acceptLabel)
            return true;
        return false;
    }
    async gatherInputs(opts) {
        const ctx = "ConvertVaultCommand:gatherInputs";
        let { vault, type, remoteUrl } = opts || {};
        // Let the user select the vault
        if (!vault)
            vault = await this.gatherVault();
        if (!vault) {
            logger_1.Logger.info({
                ctx,
                msg: "User cancelled vault convert when picking vault",
            });
            return;
        }
        if (!type)
            type = await this.gatherType(vault);
        if (!type) {
            logger_1.Logger.info({
                ctx,
                msg: "User cancelled vault convert when picking vault type",
                vault,
            });
            return;
        }
        // Don't need a remote URL for local vaults
        if (type === "remote" && !remoteUrl) {
            remoteUrl = await this.gatherRemoteURL();
            if (!remoteUrl) {
                logger_1.Logger.info({
                    ctx,
                    msg: "User cancelled vault convert when picking remote",
                    vault,
                    type,
                });
                return;
            }
        }
        if (this._ext.getDWorkspace().config.dev?.enableSelfContainedVaults) {
            // If self contained vaults are enabled, we'll move the vault into the
            // `dependencies` folder. We should ask the user if they are okay with us
            // moving the folder.
            const acceptedMove = await this.promptForFolderMove(vault, remoteUrl ?? null);
            if (!acceptedMove)
                return;
        }
        return { type, vault, remoteUrl };
    }
    /**
     * Returns all vaults added
     * @param opts
     * @returns
     */
    async execute(opts) {
        const ctx = "ConvertVaultCommand";
        const { vault, type, remoteUrl } = opts;
        const { wsRoot } = this._ext.getDWorkspace();
        if (!vault || !type)
            throw new common_all_1.DendronError({
                message: "Vault or type has not been specified when converting a vault.",
                payload: { vault, type, remoteUrl },
            });
        const workspaceService = (0, workspace_1.getExtension)().workspaceService;
        if (!workspaceService)
            throw new common_all_1.DendronError({
                message: "Workspace service is not available when converting a vault.",
                payload: { vault, type, remoteUrl },
            });
        if (type === "local") {
            await vscode_1.window.withProgress({
                location: vscode_1.ProgressLocation.Notification,
                cancellable: false,
                title: "Converting vault to local",
            }, async (progress) => {
                logger_1.Logger.info({ ctx, msg: "Converting vault to local", vault, wsRoot });
                await workspaceService.convertVaultLocal({ wsRoot, vault });
                progress.report({ increment: 50 });
                // Reload the index to use the updated config
                await new ReloadIndex_1.ReloadIndexCommand().run({ silent: true });
                progress.report({ increment: 50 });
                vscode_1.window.showInformationMessage(`Converted vault '${common_all_1.VaultUtils.getName(vault)}' to a ${type} vault.`);
                logger_1.Logger.info({
                    ctx,
                    msg: "Done converting vault to local",
                    vault,
                    wsRoot,
                });
            });
            return { updatedVault: vault };
        }
        else if (type === "remote") {
            if (!remoteUrl)
                throw new common_all_1.DendronError({
                    message: "Remote URL for remote vault has not been specified.",
                    payload: { vault, type, remoteUrl },
                });
            await vscode_1.window.withProgress({
                location: vscode_1.ProgressLocation.Notification,
                cancellable: false,
                title: "Converting vault to remote",
            }, async (progress) => {
                logger_1.Logger.info({
                    ctx,
                    msg: "Converting vault to remote",
                    vault,
                    wsRoot,
                    remoteUrl,
                });
                const results = await workspaceService.convertVaultRemote({
                    wsRoot,
                    vault,
                    remoteUrl,
                });
                progress.report({ increment: 50 });
                // Reload the index to use the updated config
                await new ReloadIndex_1.ReloadIndexCommand().run({ silent: true });
                progress.report({ increment: 50 });
                vscode_1.window.showInformationMessage(`Converted vault '${common_all_1.VaultUtils.getName(vault)}' to a ${type} vault. Remote set to ${results.remote} on branch ${results.branch}`);
                logger_1.Logger.info({
                    ctx,
                    msg: "Done converting vault to remote",
                    vault,
                    wsRoot,
                    remoteUrl,
                });
            });
            return { updatedVault: vault };
        }
        else {
            (0, common_all_1.assertUnreachable)(type);
        }
    }
}
exports.ConvertVaultCommand = ConvertVaultCommand;
//# sourceMappingURL=ConvertVaultCommand.js.map