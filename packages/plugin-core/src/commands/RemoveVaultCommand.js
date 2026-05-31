"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveVaultCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
class RemoveVaultCommand extends base_1.BasicCommand {
    _ext;
    key = constants_1.DENDRON_COMMANDS.REMOVE_VAULT.key;
    constructor(_ext) {
        super();
        this._ext = _ext;
    }
    async gatherInputs(opts) {
        const { vaults } = this._ext.getDWorkspace();
        const { wsRoot } = this._ext.getDWorkspace();
        /**
         * check added for contextual-ui. If the args are passed to the gather inputs,
         * there is no need to show quickpick to select a vault
         */
        if (opts && opts.fsPath) {
            const vault = common_all_1.VaultUtils.getVaultByDirPath({
                fsPath: opts.fsPath,
                vaults,
                wsRoot,
            });
            return { vault };
        }
        else {
            const vaultQuickPick = await vsCodeUtils_1.VSCodeUtils.showQuickPick(vaults.map((ent) => ({
                label: common_all_1.VaultUtils.getName(ent),
                detail: ent.fsPath,
                data: ent,
            })));
            if (lodash_1.default.isUndefined(vaultQuickPick)) {
                return;
            }
            return { vault: vaultQuickPick?.data };
        }
    }
    async execute(opts) {
        const ctx = "RemoveVaultCommand";
        // NOTE: relative vault
        const { vault } = opts;
        const { wsRoot } = this._ext.getDWorkspace();
        const wsService = new engine_server_1.WorkspaceService({ wsRoot });
        logger_1.Logger.info({ ctx, msg: "preRemoveVault", vault });
        await wsService.removeVault({ vault, updateWorkspace: true });
        await vscode_1.commands.executeCommand("workbench.action.reloadWindow");
        vscode_1.window.showInformationMessage("finished removing vault (from dendron). you will still need to delete the notes from your disk");
        return { vault };
    }
}
exports.RemoveVaultCommand = RemoveVaultCommand;
//# sourceMappingURL=RemoveVaultCommand.js.map