"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigureServiceConnection = void 0;
const pods_core_1 = require("@dendronhq/pods-core");
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const PodControls_1 = require("../../components/pods/PodControls");
const constants_1 = require("../../constants");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const base_1 = require("../base");
class ConfigureServiceConnection extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.CONFIGURE_SERVICE_CONNECTION.key;
    extension;
    constructor(ext) {
        super();
        this.extension = ext;
    }
    async execute(_opts) {
        const ctx = { ctx: "ConfigureServiceConnection" };
        this.L.info({ ctx, msg: "enter" });
        let configFilePath;
        const mngr = new pods_core_1.ExternalConnectionManager(this.extension.podsDir);
        const allServiceConfigs = await mngr.getAllValidConfigs();
        const items = allServiceConfigs.map((value) => {
            return { label: value.connectionId, description: value.serviceType };
        });
        const createNewServiceLabel = { label: "Create New Service Connection" };
        const userChoice = await vscode_1.window.showQuickPick(items.concat(createNewServiceLabel), {
            title: "Pick the Service Connection Configuration or Create a New One",
            ignoreFocusOut: true,
        });
        if (!userChoice)
            return;
        if (userChoice.label === createNewServiceLabel.label) {
            const serviceType = await PodControls_1.PodUIControls.promptForExternalServiceType();
            if (!serviceType)
                return;
            await PodControls_1.PodUIControls.createNewServiceConfig(serviceType);
        }
        else {
            const configRoothPath = mngr.configRootPath;
            configFilePath = path_1.default.join(configRoothPath, `svcconfig.${userChoice.label}.yml`);
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode_1.Uri.file(configFilePath));
        }
    }
}
exports.ConfigureServiceConnection = ConfigureServiceConnection;
//# sourceMappingURL=ConfigureServiceConnection.js.map