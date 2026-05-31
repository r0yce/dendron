"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigureCommand = void 0;
const common_server_1 = require("@dendronhq/common-server");
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
class ConfigureCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.CONFIGURE_RAW.key;
    static requireActiveWorkspace = true;
    _ext;
    constructor(extension) {
        super();
        this._ext = extension;
    }
    async gatherInputs() {
        return {};
    }
    async execute() {
        const dendronRoot = this._ext.getDWorkspace().wsRoot;
        const configPath = common_server_1.DConfig.configPath(dendronRoot);
        const uri = vscode_1.Uri.file(configPath);
        await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri);
        return;
    }
}
exports.ConfigureCommand = ConfigureCommand;
//# sourceMappingURL=ConfigureCommand.js.map