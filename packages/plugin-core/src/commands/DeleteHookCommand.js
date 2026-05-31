"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteHookCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
const ReloadIndex_1 = require("./ReloadIndex");
class DeleteHookCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.DELETE_HOOK.key;
    async gatherInputs() {
        const hookName = await vsCodeUtils_1.VSCodeUtils.showInputBox({
            placeHolder: "name of hook",
        });
        if (!hookName) {
            return undefined;
        }
        const shouldDeleteScript = await vsCodeUtils_1.VSCodeUtils.showQuickPick(["yes", "no"], {
            placeHolder: "delete the script",
        });
        if (!shouldDeleteScript) {
            return undefined;
        }
        return { hookName, shouldDeleteScript: shouldDeleteScript === "yes" };
    }
    async execute({ hookName, shouldDeleteScript }) {
        const wsRoot = ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot;
        const scriptPath = engine_server_1.HookUtils.getHookScriptPath({
            wsRoot,
            basename: hookName + ".js",
        });
        if (shouldDeleteScript) {
            fs_extra_1.default.removeSync(scriptPath);
        }
        const config = engine_server_1.HookUtils.removeFromConfig({
            config: common_server_1.DConfig.readConfigSync(wsRoot),
            hookId: hookName,
            hookType: common_all_1.DHookType.onCreate,
        });
        await common_server_1.DConfig.writeConfig({ wsRoot, config });
        vscode_1.window.showInformationMessage(`hook ${hookName} removed`);
        await new ReloadIndex_1.ReloadIndexCommand().run();
        return;
    }
}
exports.DeleteHookCommand = DeleteHookCommand;
//# sourceMappingURL=DeleteHookCommand.js.map