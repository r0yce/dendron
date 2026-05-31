"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportPodCommand = void 0;
const pods_core_1 = require("@dendronhq/pods-core");
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const pods_1 = require("../utils/pods");
const base_1 = require("./base");
class ExportPodCommand extends base_1.BaseCommand {
    pods;
    key = constants_1.DENDRON_COMMANDS.EXPORT_POD.key;
    extension;
    constructor(ext, _name) {
        super(_name);
        this.pods = (0, pods_core_1.getAllExportPods)();
        this.extension = ext;
    }
    async gatherInputs() {
        const pods = (0, pods_core_1.getAllExportPods)();
        const podItems = pods.map((p) => (0, pods_core_1.podClassEntryToPodItemV4)(p));
        const podChoice = await (0, pods_1.showPodQuickPickItemsV4)(podItems);
        if (!podChoice) {
            return;
        }
        return { podChoice };
    }
    async enrichInputs(inputs) {
        const podChoice = inputs.podChoice;
        const podsDir = this.extension.podsDir;
        const podClass = podChoice.podClass;
        const maybeConfig = pods_core_1.PodUtils.getConfig({ podsDir, podClass });
        if (maybeConfig.error) {
            const configPath = pods_core_1.PodUtils.genConfigFile({ podsDir, podClass });
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode_1.Uri.file(configPath));
            vscode_1.window.showInformationMessage("Looks like this is your first time running this pod. Please fill out the configuration and then run this command again. ");
            return;
        }
        return { podChoice, config: maybeConfig.data };
    }
    async execute(opts) {
        const ctx = { ctx: "ExportPod" };
        this.L.info({ ctx, opts });
        const { wsRoot, vaults } = this.extension.getDWorkspace();
        if (!wsRoot) {
            throw Error("ws root not defined");
        }
        const utilityMethods = {
            getSelectionFromQuickpick: pods_1.getSelectionFromQuickpick,
            withProgressOpts: pods_1.withProgressOpts,
        };
        const pod = new opts.podChoice.podClass(); // eslint-disable-line new-cap
        const engine = this.extension.getEngine();
        await pod.execute({
            config: opts.config,
            engine,
            wsRoot,
            vaults,
            utilityMethods,
        });
        const dest = opts.config.dest;
        if (!opts.quiet) {
            vscode_1.window.showInformationMessage(`done exporting. destination: ${dest}`);
        }
    }
    addAnalyticsPayload(opts) {
        return pods_core_1.PodUtils.getAnalyticsPayload(opts);
    }
}
exports.ExportPodCommand = ExportPodCommand;
//# sourceMappingURL=ExportPod.js.map