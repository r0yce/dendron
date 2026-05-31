"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportObsidianCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const pods_core_1 = require("@dendronhq/pods-core");
const vscode_1 = __importDefault(require("vscode"));
const utils_1 = require("../../components/lookup/utils");
const constants_1 = require("../../constants");
const ImportPod_1 = require("../ImportPod");
/**
 * Convenience command that uses the same flow as {@link ImportPodCommand} for
 * Markdown Pod but simplifies the steps by not requiring the user to fill out a
 * config.yml file.
 */
class ImportObsidianCommand extends ImportPod_1.ImportPodCommand {
    key = constants_1.DENDRON_COMMANDS.IMPORT_OBSIDIAN_POD.key;
    constructor(_name) {
        super(_name);
        this.pods = (0, pods_core_1.getAllImportPods)();
    }
    /**
     * Hardcoded to use markdown pod, as Obsidian is a markdown import.
     * @returns
     */
    async gatherInputs() {
        const markdownPod = (0, pods_core_1.podClassEntryToPodItemV4)(pods_core_1.MarkdownImportPod);
        const podChoice = {
            label: markdownPod.id,
            ...markdownPod,
        };
        return { podChoice };
    }
    /**
     * Use a file picker control instead of a pod config YAML file to get the
     * Obsidian vault location. Also, just default to the current vault.
     * @returns
     */
    async enrichInputs() {
        const podChoice = (0, pods_core_1.podClassEntryToPodItemV4)(pods_core_1.MarkdownImportPod);
        const uri = await vscode_1.default.window.showOpenDialog({
            title: "Obsidian vault location to import",
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
        });
        if (!uri || uri.length === 0) {
            return;
        }
        const src = uri[0].fsPath;
        const vault = utils_1.PickerUtilsV2.getVaultForOpenEditor();
        const config = {
            src,
            vaultName: common_all_1.VaultUtils.getName(vault),
        };
        return { podChoice, config };
    }
}
exports.ImportObsidianCommand = ImportObsidianCommand;
//# sourceMappingURL=ImportObsidianCommand.js.map