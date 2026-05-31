"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeWorkspaceCommand = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const DENDRON_WS_NAME = common_all_1.CONSTANTS.DENDRON_WS_NAME;
class ChangeWorkspaceCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.CHANGE_WS.key;
    async gatherInputs() {
        // Show a file picker dialog to select existing workspace directory
        const options = {
            canSelectMany: false,
            openLabel: "Change Workspace",
            canSelectFiles: false,
            canSelectFolders: true,
        };
        const filePath = await vsCodeUtils_1.VSCodeUtils.openFilePicker(options);
        if (filePath) {
            return { rootDirRaw: filePath };
        }
        return;
    }
    async execute(opts) {
        const { rootDirRaw, skipOpenWS } = lodash_1.default.defaults(opts, { skipOpenWS: false });
        if (!fs_extra_1.default.existsSync(rootDirRaw)) {
            throw Error(`${rootDirRaw} does not exist`);
        }
        const wsType = await engine_server_1.WorkspaceUtils.getWorkspaceTypeFromDir(rootDirRaw);
        if (wsType === common_all_1.WorkspaceType.NONE) {
            vscode_1.window.showErrorMessage(`No Dendron workspace found. Please run ${constants_1.DENDRON_COMMANDS.INIT_WS.title} to create a workspace at ${rootDirRaw}`);
            return;
        }
        if (!skipOpenWS) {
            if (wsType === common_all_1.WorkspaceType.CODE)
                vsCodeUtils_1.VSCodeUtils.openWS(path_1.default.join(rootDirRaw, DENDRON_WS_NAME));
            else if (wsType === common_all_1.WorkspaceType.NATIVE)
                vsCodeUtils_1.VSCodeUtils.openWS(rootDirRaw);
        }
    }
}
exports.ChangeWorkspaceCommand = ChangeWorkspaceCommand;
//# sourceMappingURL=ChangeWorkspace.js.map