"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurePodCommand = void 0;
const pods_core_1 = require("@dendronhq/pods-core");
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const pods_1 = require("../utils/pods");
const base_1 = require("./base");
class ConfigurePodCommand extends base_1.BasicCommand {
    pods;
    extension;
    key = constants_1.DENDRON_COMMANDS.CONFIGURE_POD.key;
    constructor(ext, _name) {
        super(_name);
        this.pods = (0, pods_core_1.getAllExportPods)();
        this.extension = ext;
    }
    async gatherInputs() {
        const podsImport = (0, pods_core_1.getAllImportPods)();
        const podsExport = (0, pods_core_1.getAllExportPods)();
        /**added publish pod to configure publish configs */
        const podsPublish = (0, pods_core_1.getAllPublishPods)();
        const podItems = podsExport
            .map((p) => (0, pods_core_1.podClassEntryToPodItemV4)(p))
            .concat(podsImport.map((p) => (0, pods_core_1.podClassEntryToPodItemV4)(p)))
            .concat(podsPublish.map((p) => (0, pods_core_1.podClassEntryToPodItemV4)(p)));
        const userPick = await (0, pods_1.showPodQuickPickItemsV4)(podItems);
        if (!userPick) {
            return;
        }
        const podClass = userPick.podClass;
        return { podClass };
    }
    async execute(opts) {
        const podClass = opts.podClass;
        const ctx = { ctx: "ConfigurePod" };
        this.L.info({ ctx, opts });
        const podsDir = this.extension.podsDir;
        const configPath = pods_core_1.PodUtils.genConfigFile({ podsDir, podClass });
        await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode_1.Uri.file(configPath));
    }
}
exports.ConfigurePodCommand = ConfigurePodCommand;
//# sourceMappingURL=ConfigurePodCommand.js.map