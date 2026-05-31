"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateHookCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
const hookTemplate = `
/**
 @params wsRoot: string, root of your current workspace
 @params note: Object with following properties https://github.com/dendronhq/dendron/blob/master/packages/common-all/src/types/foundation.ts#L66:L66
 @params NoteUtils: utilities for working with notes. [code](https://github.com/dendronhq/dendron/blob/master/packages/common-all/src/dnode.ts#L323:L323)
 @params execa: instance of [execa](https://github.com/sindresorhus/execa#execacommandcommand-options)
 @params axios: instance of [axios](https://axios-http.com/docs/example)
 @params _: instance of [lodash](https://lodash.com/docs)
 */
module.exports = async function({wsRoot, note, NoteUtils, execa, axios, _}) {
    // do some changes
    return {note};
};
`;
class CreateHookCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.CREATE_HOOK.key;
    async gatherInputs() {
        const hookName = await vsCodeUtils_1.VSCodeUtils.showInputBox({
            placeHolder: "name of hook",
        });
        if (!hookName) {
            return undefined;
        }
        const hookFilter = await vsCodeUtils_1.VSCodeUtils.showInputBox({
            placeHolder: "filter for hook",
            value: "*",
        });
        if (!hookFilter) {
            return undefined;
        }
        return { hookName, hookFilter };
    }
    async execute({ hookName, hookFilter }) {
        const wsRoot = ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot;
        const scriptPath = engine_server_1.HookUtils.getHookScriptPath({
            wsRoot,
            basename: hookName + ".js",
        });
        fs_extra_1.default.ensureDirSync(path_1.default.dirname(scriptPath));
        if (fs_extra_1.default.existsSync(scriptPath)) {
            const error = common_all_1.DendronError.createPlainError({
                message: `${scriptPath} exists`,
            });
            this.L.error({ error });
            return { error };
        }
        fs_extra_1.default.writeFileSync(scriptPath, hookTemplate);
        const config = engine_server_1.HookUtils.addToConfig({
            config: common_server_1.DConfig.readConfigSync(wsRoot),
            hookEntry: {
                id: hookName,
                pattern: hookFilter,
                type: "js",
            },
            hookType: common_all_1.DHookType.onCreate,
        });
        await common_server_1.DConfig.writeConfig({ wsRoot, config });
        await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode_1.Uri.file(scriptPath));
        return;
    }
}
exports.CreateHookCommand = CreateHookCommand;
//# sourceMappingURL=CreateHookCommand.js.map