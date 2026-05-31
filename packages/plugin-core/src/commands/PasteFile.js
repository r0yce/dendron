"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasteFileCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const utils_2 = require("../utils");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
const cleanFname = (basename) => {
    const { name, ext } = path_1.default.parse(basename);
    return lodash_1.default.kebabCase(name) + ext;
};
class PasteFileCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.PASTE_FILE.key;
    async gatherInputs() {
        const maybeFilePath = await utils_2.clipboard.readText();
        if (!lodash_1.default.isUndefined(maybeFilePath) && fs_extra_1.default.existsSync(maybeFilePath)) {
            return { filePath: maybeFilePath };
        }
        // if not in clipboard, prompt for file
        const out = await vsCodeUtils_1.VSCodeUtils.showInputBox({
            prompt: "Path of file",
            placeHolder: "",
        });
        if (utils_1.PickerUtilsV2.isInputEmpty(out))
            return;
        return { filePath: out };
    }
    async execute(opts) {
        const { filePath } = opts;
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (!editor) {
            const error = common_all_1.DendronError.createFromStatus({
                status: common_all_1.ERROR_STATUS.INVALID_STATE,
                message: "no active editor",
            });
            logger_1.Logger.error({ error });
            return { error };
        }
        const uri = editor.document.uri;
        const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
        const { vaults, wsRoot } = ext.getDWorkspace();
        if (!engine_server_1.WorkspaceUtils.isPathInWorkspace({ vaults, wsRoot, fpath: uri.fsPath })) {
            const error = common_all_1.DendronError.createFromStatus({
                status: common_all_1.ERROR_STATUS.INVALID_STATE,
                message: "not in a vault",
            });
            logger_1.Logger.error({ error });
            return { error };
        }
        const vault = common_all_1.VaultUtils.getVaultByFilePath({
            vaults,
            wsRoot,
            fsPath: uri.fsPath,
        });
        const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
        const suffix = path_1.default.join("assets", cleanFname(path_1.default.basename(filePath)));
        const dstPath = path_1.default.join(vpath, suffix);
        if (!fs_extra_1.default.existsSync(filePath)) {
            const error = common_all_1.DendronError.createFromStatus({
                status: common_all_1.ERROR_STATUS.INVALID_STATE,
                message: `${filePath} does not exist`,
            });
            logger_1.Logger.error({ error });
            return { error };
        }
        if (fs_extra_1.default.existsSync(dstPath)) {
            const error = common_all_1.DendronError.createFromStatus({
                status: common_all_1.ERROR_STATUS.INVALID_STATE,
                message: `${dstPath} already exists`,
            });
            logger_1.Logger.error({ error });
            return { error };
        }
        fs_extra_1.default.ensureDirSync(path_1.default.dirname(dstPath));
        fs_extra_1.default.copyFileSync(filePath, dstPath);
        vscode_1.window.showInformationMessage(`${filePath} moved to ${dstPath}`);
        const pos = editor.selection.active;
        await editor.edit((builder) => {
            const txt = `[${path_1.default.basename(dstPath)}](${suffix})`;
            const selection = new vscode_1.Selection(pos, pos);
            builder.replace(selection, txt);
        });
        return {
            fpath: dstPath,
        };
    }
}
exports.PasteFileCommand = PasteFileCommand;
//# sourceMappingURL=PasteFile.js.map