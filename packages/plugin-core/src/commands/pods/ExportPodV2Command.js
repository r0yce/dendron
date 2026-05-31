"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportPodV2Command = void 0;
const pods_core_1 = require("@dendronhq/pods-core");
const PodCommandFactory_1 = require("../../components/pods/PodCommandFactory");
const PodControls_1 = require("../../components/pods/PodControls");
const constants_1 = require("../../constants");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const base_1 = require("../base");
/**
 * Command that will find the appropriate export command to run, and then run
 * it. This is the UI entry point for all export pod functionality.
 */
class ExportPodV2Command extends base_1.BaseCommand {
    pods;
    key = constants_1.DENDRON_COMMANDS.EXPORT_POD_V2.key;
    constructor(_name) {
        super(_name);
        this.pods = (0, pods_core_1.getAllExportPods)();
    }
    /**
     * Get from the user which
     * @returns a CommandInput for a Pod Export Command to run in turn, or
     * undefined if the user didn't select anything.
     */
    async gatherInputs(args) {
        // added check to return if export pod v2 is not enabled in dev config and is run using pod keyboard shortcuts
        const { config } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        if (!config.dev?.enableExportPodV2) {
            return;
        }
        // If a podId is passed in, use this instead of prompting the user
        if (args?.podId) {
            return PodCommandFactory_1.PodCommandFactory.createPodCommandForStoredConfig({
                configId: { podId: args.podId },
                exportScope: args.exportScope,
            });
        }
        const exportChoice = await PodControls_1.PodUIControls.promptForExportConfigOrNewExport();
        if (exportChoice === undefined) {
            return;
        }
        else if (exportChoice === "New Export") {
            const podType = await PodControls_1.PodUIControls.promptForPodType();
            if (!podType) {
                return;
            }
            return PodCommandFactory_1.PodCommandFactory.createPodCommandForPodType(podType);
        }
        else {
            return PodCommandFactory_1.PodCommandFactory.createPodCommandForStoredConfig({
                configId: exportChoice,
            });
        }
    }
    /**
     * no-op
     */
    async enrichInputs(inputs) {
        return inputs;
    }
    async execute(opts) {
        opts.run();
    }
    addAnalyticsPayload(opts) {
        return {
            configured: true,
            pod: opts.key,
        };
    }
}
exports.ExportPodV2Command = ExportPodV2Command;
//# sourceMappingURL=ExportPodV2Command.js.map