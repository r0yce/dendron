"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigureExportPodV2 = void 0;
const pods_core_1 = require("@dendronhq/pods-core");
const vscode_1 = require("vscode");
const PodControls_1 = require("../../components/pods/PodControls");
const constants_1 = require("../../constants");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const base_1 = require("../base");
class ConfigureExportPodV2 extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.CONFIGURE_EXPORT_POD_V2.key;
    async execute() {
        const ctx = { ctx: "ConfigureExportPodV2" };
        this.L.info({ ctx, msg: "enter" });
        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        let configFilePath;
        const exportChoice = await PodControls_1.PodUIControls.promptForExportConfigOrNewExport();
        if (exportChoice === undefined) {
            return;
        }
        else if (exportChoice === "New Export") {
            const podType = await PodControls_1.PodUIControls.promptForPodType();
            if (!podType) {
                return;
            }
            const podId = await PodControls_1.PodUIControls.promptForGenericId();
            if (!podId)
                return;
            configFilePath = pods_core_1.ConfigFileUtils.genConfigFileV2({
                fPath: pods_core_1.PodUtils.getCustomConfigPath({ wsRoot, podId }),
                configSchema: pods_core_1.ConfigFileUtils.getConfigSchema(podType),
                setProperties: { podId, podType },
            });
        }
        else {
            configFilePath = pods_core_1.PodUtils.getCustomConfigPath({
                wsRoot,
                podId: exportChoice.podId,
            });
        }
        await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode_1.Uri.file(configFilePath));
    }
}
exports.ConfigureExportPodV2 = ConfigureExportPodV2;
//# sourceMappingURL=ConfigureExportPodV2.js.map