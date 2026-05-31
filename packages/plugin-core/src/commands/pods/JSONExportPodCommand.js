"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONExportPodCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const pods_core_1 = require("@dendronhq/pods-core");
const lodash_1 = __importDefault(require("lodash"));
const vscode = __importStar(require("vscode"));
const HierarchySelector_1 = require("../../components/lookup/HierarchySelector");
const PodControls_1 = require("../../components/pods/PodControls");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const BaseExportPodCommand_1 = require("./BaseExportPodCommand");
/**
 * VSCode command for running the JSON Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
class JSONExportPodCommand extends BaseExportPodCommand_1.BaseExportPodCommand {
    key = "dendron.jsonexportv2";
    constructor(extension) {
        super(new HierarchySelector_1.QuickPickHierarchySelector(), extension);
    }
    async gatherInputs(opts) {
        if ((0, pods_core_1.isRunnableJSONV2PodConfig)(opts)) {
            const { destination, exportScope } = opts;
            this.multiNoteExportCheck({ destination, exportScope });
            return opts;
        }
        // First get the export scope:
        const exportScope = opts && opts.exportScope
            ? opts.exportScope
            : await PodControls_1.PodUIControls.promptForExportScope();
        if (!exportScope) {
            return;
        }
        const options = {
            canSelectMany: false,
            openLabel: "Select Export Destination",
            canSelectFiles: true,
            canSelectFolders: false,
        };
        const destination = await PodControls_1.PodUIControls.promptUserForDestination(exportScope, options);
        if (!destination) {
            return;
        }
        const config = {
            exportScope,
            destination,
        };
        // If this is not an already saved pod config, then prompt user whether they
        // want to save as a new config or just run it one-time
        if (!opts?.podId) {
            const choice = await PodControls_1.PodUIControls.promptToSaveInputChoicesAsNewConfig();
            const { wsRoot } = this.extension.getDWorkspace();
            if (choice !== undefined && choice !== false) {
                const configPath = pods_core_1.ConfigFileUtils.genConfigFileV2({
                    fPath: pods_core_1.PodUtils.getCustomConfigPath({ wsRoot, podId: choice }),
                    configSchema: pods_core_1.JSONExportPodV2.config(),
                    setProperties: lodash_1.default.merge(config, {
                        podId: choice,
                        podType: pods_core_1.PodV2Types.JSONExportV2,
                    }),
                });
                vscode.window
                    .showInformationMessage(`Configuration saved to ${configPath}`, "Open Config")
                    .then((selectedItem) => {
                    if (selectedItem) {
                        vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(configPath));
                    }
                });
            }
        }
        return config;
    }
    async onExportComplete({ exportReturnValue, config, }) {
        let successMessage = "Finished running JSON export pod.";
        const data = exportReturnValue.data?.exportedNotes;
        if (lodash_1.default.isString(data) && config.destination === "clipboard") {
            vscode.env.clipboard.writeText(data);
            successMessage += " Content is copied to the clipboard";
        }
        if (common_all_1.ResponseUtil.hasError(exportReturnValue)) {
            const errorMsg = `Finished JSON Export. Error encountered: ${common_all_1.ErrorFactory.safeStringify(exportReturnValue.error)}`;
            this.L.error(errorMsg);
        }
        else {
            vscode.window.showInformationMessage(successMessage);
        }
    }
    createPod(config) {
        return new pods_core_1.JSONExportPodV2({
            podConfig: config,
        });
    }
    getRunnableSchema() {
        return (0, pods_core_1.createRunnableJSONV2PodConfigSchema)();
    }
}
exports.JSONExportPodCommand = JSONExportPodCommand;
//# sourceMappingURL=JSONExportPodCommand.js.map