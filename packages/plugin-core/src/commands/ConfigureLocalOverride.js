"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigureLocalOverride = void 0;
const common_server_1 = require("@dendronhq/common-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
class ConfigureLocalOverride extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.CONFIGURE_LOCAL_OVERRIDE.key;
    static requireActiveWorkspace = true;
    _ext;
    constructor(extension) {
        super();
        this._ext = extension;
    }
    async execute(opts) {
        /* In the test environemnt, configScope is passed as option for this command */
        const configScope = opts?.configScope || (await getConfigScope());
        if (configScope === undefined) {
            vsCodeUtils_1.VSCodeUtils.showMessage(vsCodeUtils_1.MessageSeverity.ERROR, "Configuration scope needs to be selected to open dendronrc.yml file", {});
            return;
        }
        const dendronRoot = this._ext.getDWorkspace().wsRoot;
        const configPath = common_server_1.DConfig.configOverridePath(dendronRoot, configScope);
        /* If the config file doesn't exist, create one */
        await fs_extra_1.default.ensureFile(configPath);
        const uri = vscode_1.Uri.file(configPath);
        // What happens if the file doesn't exist
        await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri);
        return;
    }
}
exports.ConfigureLocalOverride = ConfigureLocalOverride;
const getConfigScope = async () => {
    const options = [
        {
            label: common_server_1.LocalConfigScope.WORKSPACE,
            detail: "Configure dendronrc.yml for current workspace",
        },
        {
            label: common_server_1.LocalConfigScope.GLOBAL,
            detail: "Configure dendronrc.yml for all dendron workspaces",
        },
    ];
    const scope = await vsCodeUtils_1.VSCodeUtils.showQuickPick(options, {
        title: "Select configuration scope",
        placeHolder: "vault",
        ignoreFocusOut: true,
    });
    return scope ? scope.label : undefined;
};
//# sourceMappingURL=ConfigureLocalOverride.js.map