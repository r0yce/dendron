"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyAsCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const pods_core_1 = require("@dendronhq/pods-core");
const lodash_1 = __importDefault(require("lodash"));
const PodCommandFactory_1 = require("../components/pods/PodCommandFactory");
const PodControls_1 = require("../components/pods/PodControls");
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
/**
 * Command that will find the appropriate export command to run, and then run
 * it. This is the UI entry point for all export pod functionality.
 */
class CopyAsCommand extends base_1.BasicCommand {
    format;
    key = constants_1.DENDRON_COMMANDS.COPY_AS.key;
    constructor(_name) {
        super(_name);
        this.format = (0, pods_core_1.getAllCopyAsFormat)();
    }
    async sanityCheck() {
        if (lodash_1.default.isUndefined(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor())) {
            return "you must have a note open to execute this command";
        }
        return;
    }
    async gatherInputs(copyAsFormat) {
        const format = copyAsFormat || (await PodControls_1.PodUIControls.promptToSelectCopyAsFormat());
        if (!format) {
            return;
        }
        switch (format) {
            case pods_core_1.CopyAsFormat.JSON: {
                const config = {
                    destination: "clipboard",
                    exportScope: pods_core_1.PodExportScope.Selection,
                    podType: pods_core_1.PodV2Types.JSONExportV2,
                    podId: "copyAs.json", // dummy value, required property
                };
                return PodCommandFactory_1.PodCommandFactory.createPodCommandForStoredConfig({ config });
            }
            case pods_core_1.CopyAsFormat.MARKDOWN: {
                const config = {
                    destination: "clipboard",
                    exportScope: pods_core_1.PodExportScope.Selection,
                    podType: pods_core_1.PodV2Types.MarkdownExportV2,
                    podId: "copyAs.markdown", // dummy value, required property
                    addFrontmatterTitle: false,
                };
                return PodCommandFactory_1.PodCommandFactory.createPodCommandForStoredConfig({ config });
            }
            default:
                throw new common_all_1.DendronError({
                    message: `${format} is not a valid copy as format. If you are using a keybinding, make sure the argument is one of the following values: ${(0, pods_core_1.getAllCopyAsFormat)()}`,
                });
        }
    }
    async execute(opts) {
        opts.run();
    }
}
exports.CopyAsCommand = CopyAsCommand;
//# sourceMappingURL=CopyAsCommand.js.map