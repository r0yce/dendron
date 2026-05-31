"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateNewVaultCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
class CreateNewVaultCommand extends base_1.BasicCommand {
    _ext;
    key = constants_1.DENDRON_COMMANDS.CREATE_NEW_VAULT.key;
    constructor(_ext) {
        super();
        this._ext = _ext;
    }
    async gatherDestinationFolder() {
        const defaultUri = vscode_1.Uri.file(this._ext.getDWorkspace().wsRoot);
        // Prompt user where to create new vault
        const options = {
            canSelectMany: false,
            openLabel: "Pick or create a folder for your new vault",
            canSelectFiles: false,
            canSelectFolders: true,
            defaultUri,
        };
        const folder = await vsCodeUtils_1.VSCodeUtils.openFilePicker(options);
        if (lodash_1.default.isUndefined(folder)) {
            return;
        }
        return folder;
    }
    async gatherVaultStandard() {
        const vaultDestination = await this.gatherDestinationFolder();
        if (!vaultDestination)
            return;
        const sourceName = await vsCodeUtils_1.VSCodeUtils.showInputBox({
            prompt: "Name of new vault (optional, press enter to skip)",
            placeHolder: path_1.default.basename(vaultDestination),
        });
        return {
            name: sourceName,
            path: vaultDestination,
        };
    }
    async gatherVaultSelfContained() {
        const vaultName = await vsCodeUtils_1.VSCodeUtils.showInputBox({
            title: "Vault name",
            prompt: "Name for the new vault",
            placeHolder: "my-vault",
        });
        // If empty, then user cancelled the prompt
        if (utils_1.PickerUtilsV2.isInputEmpty(vaultName))
            return;
        return {
            name: vaultName,
            path: path_1.default.join(this._ext.getDWorkspace().wsRoot, common_all_1.FOLDERS.DEPENDENCIES, common_all_1.FOLDERS.LOCAL_DEPENDENCY, vaultName),
            isSelfContained: true,
        };
    }
    async gatherInputs() {
        const { config } = this._ext.getDWorkspace();
        if (config.dev?.enableSelfContainedVaults) {
            return this.gatherVaultSelfContained();
        }
        else {
            // A "standard", non self contained vault
            return this.gatherVaultStandard();
        }
    }
    async addVaultToWorkspace(vault) {
        return engine_server_1.WorkspaceUtils.addVaultToWorkspace({
            vault,
            wsRoot: this._ext.getDWorkspace().wsRoot,
        });
    }
    /**
     * Returns all vaults added
     * @param opts
     * @returns
     */
    async execute(opts) {
        const ctx = "CreateNewVaultCommand";
        let vaults = [];
        logger_1.Logger.info({ ctx, msg: "enter", opts });
        const wsRoot = this._ext.getDWorkspace().wsRoot;
        const fsPath = common_all_1.VaultUtils.normVaultPath({
            vault: { fsPath: opts.path },
            wsRoot,
        });
        const wsService = new engine_server_1.WorkspaceService({ wsRoot });
        const vault = {
            fsPath,
        };
        // Make sure these don't get set to undefined, or serialization breaks
        if (opts.isSelfContained) {
            vault.selfContained = true;
        }
        if (opts.name) {
            vault.name = opts.name;
        }
        if (common_all_1.VaultUtils.isSelfContained(vault)) {
            await wsService.createSelfContainedVault({
                vault,
                addToConfig: true,
                addToCodeWorkspace: false,
                newVault: true,
            });
        }
        else {
            await wsService.createVault({ vault });
        }
        await this.addVaultToWorkspace(vault);
        vaults = [vault];
        await vscode_1.commands.executeCommand("workbench.action.reloadWindow");
        vscode_1.window.showInformationMessage("finished creating a new vault");
        return { vaults };
    }
}
exports.CreateNewVaultCommand = CreateNewVaultCommand;
//# sourceMappingURL=CreateNewVaultCommand.js.map