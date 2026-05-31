"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenLinkCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const open_1 = __importDefault(require("open"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const md_1 = require("../utils/md");
const vsCodeUtils_1 = require("../vsCodeUtils");
const workspace_1 = require("../workspace");
const base_1 = require("./base");
class OpenLinkCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.OPEN_LINK.key;
    async gatherInputs() {
        return {};
    }
    async execute(opts) {
        const ctx = constants_1.DENDRON_COMMANDS.OPEN_LINK;
        this.L.info({ ctx });
        let text = "";
        text = opts?.uri ?? (0, md_1.getURLAt)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor());
        if (lodash_1.default.isUndefined(text) || text === "") {
            const error = common_all_1.DendronError.createFromStatus({
                status: common_all_1.ERROR_STATUS.INVALID_STATE,
                message: `no valid path or URL selected`,
            });
            this.L.error({ error });
            return { error };
        }
        let assetPath;
        if (text.indexOf(":/") !== -1 ||
            text.indexOf("/") === 0 ||
            text.indexOf(":\\") !== -1) {
            vscode_1.window.showInformationMessage("the selection reads as a full URI or filepath so an attempt will be made to open it");
            vscode_1.env.openExternal(vscode_1.Uri.parse(text.replace("\\", "/"))); // make sure vscode doesn't choke on "\"s
            assetPath = text;
        }
        else {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            if (text.startsWith("asset")) {
                const vault = utils_1.PickerUtilsV2.getOrPromptVaultForOpenEditor();
                assetPath = path_1.default.join((0, common_server_1.vault2Path)({ vault, wsRoot }), text);
            }
            else {
                assetPath = (0, common_server_1.resolvePath)(text, (0, workspace_1.getExtension)().rootWorkspace.uri.fsPath);
            }
            if (!fs_extra_1.default.existsSync(assetPath)) {
                const error = common_all_1.DendronError.createFromStatus({
                    status: common_all_1.ERROR_STATUS.INVALID_STATE,
                    message: `no valid path or URL selected`,
                });
                this.L.error({ error });
                return { error };
            }
            await (0, open_1.default)(assetPath).catch((err) => {
                const error = common_all_1.DendronError.createFromStatus({
                    status: common_all_1.ERROR_STATUS.UNKNOWN,
                    innerError: err,
                });
                this.L.error({ error });
                return { error };
            });
        }
        return { filepath: assetPath };
    }
}
exports.OpenLinkCommand = OpenLinkCommand;
//# sourceMappingURL=OpenLink.js.map