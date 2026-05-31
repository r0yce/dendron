"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestoreVaultCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const pods_core_1 = require("@dendronhq/pods-core");
const fs_extra_1 = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const WSUtils_1 = require("../WSUtils");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
const ExtensionProvider_1 = require("../ExtensionProvider");
class RestoreVaultCommand extends base_1.BaseCommand {
    key = constants_1.DENDRON_COMMANDS.RESTORE_VAULT.key;
    async gatherInputs() {
        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const snapshots = path_1.default.join(wsRoot, "snapshots");
        const choices = (0, fs_extra_1.readdirSync)(snapshots)
            .sort()
            .map((ent) => ({
            label: `${common_all_1.Time.DateTime.fromMillis(parseInt(ent, 10)).toLocaleString(common_all_1.Time.DateTime.DATETIME_FULL)} (${ent})`,
            data: ent,
        }));
        return vsCodeUtils_1.VSCodeUtils.showQuickPick(choices);
    }
    async enrichInputs(inputs) {
        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const snapshots = path_1.default.join(wsRoot, "snapshots");
        const { data } = inputs;
        const src = path_1.default.join(snapshots, data);
        if (!fs_extra_1.default.existsSync(src)) {
            vscode_1.window.showErrorMessage(`${src} does not exist`);
            return;
        }
        return { src };
    }
    async execute(opts) {
        const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
        const { engine, vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        try {
            const { src } = opts;
            const pod = new pods_core_1.SnapshotImportPod();
            const vault = vaults[0];
            if (ext.fileWatcher) {
                ext.fileWatcher.pause = true;
            }
            await pod.execute({
                vaults: [vault],
                wsRoot,
                engine,
                config: { src, vaultName: common_all_1.VaultUtils.getName(vault) },
            });
            vscode_1.window.showInformationMessage(`restored from snapshot`);
            await WSUtils_1.WSUtils.reloadWorkspace();
            return;
        }
        finally {
            if (ext.fileWatcher) {
                ext.fileWatcher.pause = false;
            }
        }
    }
}
exports.RestoreVaultCommand = RestoreVaultCommand;
//# sourceMappingURL=RestoreVault.js.map