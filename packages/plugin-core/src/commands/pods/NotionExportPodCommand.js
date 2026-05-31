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
exports.NotionExportPodCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const pods_core_1 = require("@dendronhq/pods-core");
const lodash_1 = __importDefault(require("lodash"));
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const HierarchySelector_1 = require("../../components/lookup/HierarchySelector");
const PodControls_1 = require("../../components/pods/PodControls");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const BaseExportPodCommand_1 = require("./BaseExportPodCommand");
/**
 * VSCode command for running the Notion Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
class NotionExportPodCommand extends BaseExportPodCommand_1.BaseExportPodCommand {
    key = "dendron.notionexport";
    constructor(extension) {
        super(new HierarchySelector_1.QuickPickHierarchySelector(), extension);
    }
    createPod(config) {
        return new pods_core_1.NotionExportPodV2({
            podConfig: config,
        });
    }
    getRunnableSchema() {
        return (0, pods_core_1.createRunnableNotionV2PodConfigSchema)();
    }
    async gatherInputs(opts) {
        if ((0, pods_core_1.isRunnableNotionV2PodConfig)(opts))
            return opts;
        let apiKey = opts?.apiKey;
        let connectionId = opts?.connectionId;
        const { wsRoot } = this.extension.getDWorkspace();
        // Get an Notion API Key
        if (!apiKey) {
            const mngr = new pods_core_1.ExternalConnectionManager(pods_core_1.PodUtils.getPodDir({ wsRoot }));
            // If the apiKey doesn't exist, see if we can first extract it from the connectedServiceId:
            if (opts?.connectionId) {
                const config = mngr.getConfigById({
                    id: opts.connectionId,
                });
                if (!config) {
                    vscode_1.window.showErrorMessage(`Couldn't find service config with the specified connection ID ${opts.connectionId}. Ensure that the connection ID is correct. You can check existing connections with the Dendron: Configure Service Connection command.`);
                    return;
                }
                apiKey = config.apiKey;
            }
            else {
                // Prompt User to pick an notion connection, or create a new one
                // (which will stop execution of current pod command)
                const connection = await PodControls_1.PodUIControls.promptForExternalServiceConnectionOrNew(pods_core_1.ExternalService.Notion);
                if (!connection) {
                    return;
                }
                connectionId = connection.connectionId;
                apiKey = connection.apiKey;
            }
        }
        // Get the export scope
        const exportScope = opts && opts.exportScope
            ? opts.exportScope
            : await PodControls_1.PodUIControls.promptForExportScope();
        if (!exportScope) {
            return;
        }
        let parentPageId = opts?.parentPageId;
        if (lodash_1.default.isUndefined(parentPageId)) {
            const pagesMap = await this.getAllNotionPages(apiKey);
            const parentPage = await this.promptForParentPage(Object.keys(pagesMap));
            if (lodash_1.default.isUndefined(parentPage))
                return;
            parentPageId = pagesMap[parentPage];
        }
        const inputs = {
            exportScope,
            parentPageId,
            ...opts,
            podType: pods_core_1.PodV2Types.NotionExportV2,
            apiKey,
            connectionId,
        };
        if (!opts?.podId) {
            const choice = await PodControls_1.PodUIControls.promptToSaveInputChoicesAsNewConfig();
            if (choice !== undefined && choice !== false) {
                const configPath = pods_core_1.ConfigFileUtils.genConfigFileV2({
                    fPath: pods_core_1.PodUtils.getCustomConfigPath({ wsRoot, podId: choice }),
                    configSchema: pods_core_1.NotionExportPodV2.config(),
                    setProperties: lodash_1.default.merge(inputs, {
                        podId: choice,
                        podType: pods_core_1.PodV2Types.NotionExportV2,
                        connectionId: inputs.connectionId,
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
        return inputs;
    }
    async onExportComplete({ exportReturnValue, }) {
        const engine = this.extension.getEngine();
        const { data } = exportReturnValue;
        if (data?.created) {
            await pods_core_1.NotionUtils.updateNotionIdForNewlyCreatedNotes(data.created, engine);
        }
        const createdCount = data?.created?.length ?? 0;
        if (common_all_1.ResponseUtil.hasError(exportReturnValue)) {
            const errorMsg = `Finished Notion Export. ${createdCount} notes created in Notion; Error encountered: ${common_all_1.ErrorFactory.safeStringify(exportReturnValue.error)}`;
            this.L.error(errorMsg);
        }
        else {
            vscode_1.window.showInformationMessage(`Finished Notion Export. ${createdCount} notes created in Notion`);
        }
    }
    getAllNotionPages = async (apiKey) => {
        const pagesMap = await vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "Fetching Parent Pages...",
            cancellable: false,
        }, async () => {
            const notion = new pods_core_1.Client({
                auth: apiKey,
            });
            const allDocs = await notion.search({
                sort: { direction: "descending", timestamp: "last_edited_time" },
                filter: { value: "page", property: "object" },
            });
            const pagesMap = {};
            const pages = allDocs.results;
            pages.map((page) => {
                const key = this.getPageName(page);
                const value = page.id;
                pagesMap[key] = value;
            });
            return pagesMap;
        });
        return pagesMap;
    };
    /**
     * Method to get page name of a Notion Page
     */
    getPageName = (page) => {
        const { title } = page.parent.type !== "database_id"
            ? page.properties.title
            : page.properties.Name;
        return title[0] ? title[0].plain_text : "Untitled";
    };
    /**
     * Prompt to choose the Parent Page in Notion. All the exported notes are created inside this page.
     * It is mandatory to have a parent page while create pages via API.
     * @param pagesMap
     * @returns pageId of selected page.
     */
    promptForParentPage = async (pagesMap) => {
        const pickItems = pagesMap.map((page) => {
            return {
                label: page,
            };
        });
        const selected = await vscode_1.window.showQuickPick(pickItems, {
            placeHolder: "Choose the Parent Page",
            ignoreFocusOut: true,
            matchOnDescription: true,
            canPickMany: false,
        });
        if (!selected) {
            return;
        }
        return selected.label;
    };
}
exports.NotionExportPodCommand = NotionExportPodCommand;
//# sourceMappingURL=NotionExportPodCommand.js.map