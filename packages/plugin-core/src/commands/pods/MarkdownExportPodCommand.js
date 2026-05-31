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
exports.MarkdownExportPodCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const pods_core_1 = require("@dendronhq/pods-core");
const lodash_1 = __importDefault(require("lodash"));
const vscode = __importStar(require("vscode"));
const HierarchySelector_1 = require("../../components/lookup/HierarchySelector");
const PodControls_1 = require("../../components/pods/PodControls");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const BaseExportPodCommand_1 = require("./BaseExportPodCommand");
/**
 * VSCode command for running the Markdown Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
class MarkdownExportPodCommand extends BaseExportPodCommand_1.BaseExportPodCommand {
    key = "dendron.markdownexportv2";
    constructor(extension) {
        super(new HierarchySelector_1.QuickPickHierarchySelector(), extension);
    }
    async gatherInputs(opts) {
        if ((0, pods_core_1.isRunnableMarkdownV2PodConfig)(opts)) {
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
            canSelectFiles: false,
            canSelectFolders: true,
        };
        const destination = opts && opts.destination
            ? opts.destination
            : await PodControls_1.PodUIControls.promptUserForDestination(exportScope, options);
        if (!destination) {
            return;
        }
        //use FM Title as h1 header
        const addFrontmatterTitle = opts && !lodash_1.default.isUndefined(opts.addFrontmatterTitle)
            ? opts.addFrontmatterTitle
            : await this.promptUserForaddFMTitleSetting();
        if (addFrontmatterTitle === undefined)
            return;
        const config = {
            exportScope,
            wikiLinkToURL: opts?.wikiLinkToURL || false,
            destination,
            addFrontmatterTitle,
            convertTagNotesToLinks: opts?.convertTagNotesToLinks || false,
            convertUserNotesToLinks: opts?.convertUserNotesToLinks || false,
        };
        // If this is not an already saved pod config, then prompt user whether they
        // want to save as a new config or just run it one-time
        if (!opts?.podId) {
            const choice = await PodControls_1.PodUIControls.promptToSaveInputChoicesAsNewConfig();
            const { wsRoot } = this.extension.getDWorkspace();
            if (choice !== undefined && choice !== false) {
                const configPath = pods_core_1.ConfigFileUtils.genConfigFileV2({
                    fPath: pods_core_1.PodUtils.getCustomConfigPath({ wsRoot, podId: choice }),
                    configSchema: pods_core_1.MarkdownExportPodV2.config(),
                    setProperties: lodash_1.default.merge(config, {
                        podId: choice,
                        podType: pods_core_1.PodV2Types.MarkdownExportV2,
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
        const data = exportReturnValue.data?.exportedNotes;
        let successMessage = "Finished running Markdown export pod.";
        if (lodash_1.default.isString(data) && config.destination === "clipboard") {
            vscode.env.clipboard.writeText(data);
            successMessage += " Content is copied to the clipboard";
        }
        const count = data?.length ?? 0;
        if (common_all_1.ResponseUtil.hasError(exportReturnValue)) {
            const errorMsg = `Finished Markdown Export. ${count} notes exported; Error encountered: ${common_all_1.ErrorFactory.safeStringify(exportReturnValue.error)}`;
            this.L.error(errorMsg);
        }
        else {
            vscode.window.showInformationMessage(successMessage);
        }
    }
    createPod(config) {
        return new pods_core_1.MarkdownExportPodV2({
            podConfig: config,
            engine: this.extension.getEngine(),
            dendronConfig: this.extension.getDWorkspace().config,
        });
    }
    getRunnableSchema() {
        return (0, pods_core_1.createRunnableMarkdownV2PodConfigSchema)();
    }
    /*
     * Region: UI Controls
     */
    /**
     * Prompt user with simple quick pick to select whether to use FM title as h1 header or not
     * @returns
     */
    async promptUserForaddFMTitleSetting() {
        const items = [
            {
                label: "Add note title from FM as h1 header",
                detail: "Add note title from the frontmatter to the start of exported note",
            },
            {
                label: "Skip adding note FM title as h1 header",
                detail: "Skip adding note title from the frontmatter to the start of exported note",
            },
        ];
        const picked = await vscode.window.showQuickPick(items, {
            title: "Do you want to add note frontmatter title as h1 header?",
        });
        return picked
            ? picked.label === "Add note title from FM as h1 header"
            : undefined;
    }
}
exports.MarkdownExportPodCommand = MarkdownExportPodCommand;
//# sourceMappingURL=MarkdownExportPodCommand.js.map