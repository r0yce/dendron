"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpgradeSettingsCommand = void 0;
const common_server_1 = require("@dendronhq/common-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const settings_1 = require("../settings");
const workspace_1 = require("../workspace");
const base_1 = require("./base");
const L = (0, common_server_1.createLogger)("UpgradeSettingsCommand");
class UpgradeSettingsCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.UPGRADE_SETTINGS.key;
    async execute(_opts) {
        const ctx = "Upgrade:execute";
        L.info({ ctx });
        const wsRoot = (await workspace_1.DendronExtension.workspaceRoots())[0];
        const newConfig = await settings_1.WorkspaceConfig.update(wsRoot);
        this.L.info({ ctx, newConfig });
        // vscode doesn't let us uninstall extensions
        // tell user to uninstall extensions we no longer want
        const badExtensions = newConfig.extensions.unwantedRecommendations
            ?.map((ext) => {
            return vscode_1.extensions.getExtension(ext);
        })
            .filter(Boolean) || [];
        this.L.info({ ctx, badExtensions });
        if (!lodash_1.default.isEmpty(badExtensions)) {
            const msg = [
                "Manual action needed!",
                "The following extensions need to be uninstalled: ",
            ]
                .concat([
                badExtensions.map((ext) => ext.packageJSON.displayName).join(", "),
            ])
                .concat([
                "- Reload the window afterwards and Dendron will offer to install the Dendron version of the extension",
            ]);
            vscode_1.window.showWarningMessage(msg.join(" "));
        }
        return { configUpdate: newConfig };
    }
}
exports.UpgradeSettingsCommand = UpgradeSettingsCommand;
//# sourceMappingURL=UpgradeSettings.js.map