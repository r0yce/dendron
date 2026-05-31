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
exports.GoogleDocsExportPodCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const pods_core_1 = require("@dendronhq/pods-core");
const lodash_1 = __importDefault(require("lodash"));
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const HierarchySelector_1 = require("../../components/lookup/HierarchySelector");
const PodControls_1 = require("../../components/pods/PodControls");
const pods_1 = require("../../utils/pods");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const BaseExportPodCommand_1 = require("./BaseExportPodCommand");
/**
 * VSCode command for running the Google Docs Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
class GoogleDocsExportPodCommand extends BaseExportPodCommand_1.BaseExportPodCommand {
    key = "dendron.googledocsexport";
    constructor(extension) {
        super(new HierarchySelector_1.QuickPickHierarchySelector(), extension);
    }
    createPod(config) {
        const { engine, wsRoot } = this.extension.getDWorkspace();
        const fpath = engine_server_1.EngineUtils.getPortFilePathForWorkspace({ wsRoot });
        const port = (0, engine_server_1.openPortFile)({ fpath });
        return new pods_core_1.GoogleDocsExportPodV2({
            podConfig: config,
            engine,
            port,
        });
    }
    getRunnableSchema() {
        return (0, pods_core_1.createRunnableGoogleDocsV2PodConfigSchema)();
    }
    async gatherInputs(opts) {
        let accessToken = opts?.accessToken;
        let refreshToken = opts?.refreshToken;
        let expirationTime = opts?.expirationTime;
        let connectionId = opts?.connectionId;
        const { wsRoot } = this.extension.getDWorkspace();
        // Get tokens and expiration time for gdoc services
        if (!accessToken || !refreshToken || !expirationTime || !connectionId) {
            const mngr = new pods_core_1.ExternalConnectionManager(pods_core_1.PodUtils.getPodDir({ wsRoot }));
            // If the tokens doesn't exist, see if we can first extract it from the connectedServiceId:
            if (opts?.connectionId) {
                const config = mngr.getConfigById({
                    id: opts.connectionId,
                });
                if (!config) {
                    vscode_1.window.showErrorMessage(`Couldn't find service config with the passed in connection ID ${opts.connectionId}.`);
                    return;
                }
                accessToken = config.accessToken;
                refreshToken = config.refreshToken;
                expirationTime = config.expirationTime;
                connectionId = config.connectionId;
            }
            else {
                // Prompt User to pick an gdoc connection, or create a new one
                // (which will stop execution of current pod command)
                const connection = await PodControls_1.PodUIControls.promptForExternalServiceConnectionOrNew(pods_core_1.ExternalService.GoogleDocs);
                if (!connection) {
                    return;
                }
                connectionId = connection.connectionId;
                accessToken = connection.accessToken;
                refreshToken = connection.refreshToken;
                expirationTime = connection.expirationTime;
            }
        }
        // Get the export scope
        const exportScope = opts && opts.exportScope
            ? opts.exportScope
            : await PodControls_1.PodUIControls.promptForExportScope();
        if (!exportScope) {
            return;
        }
        let parentFolderId = opts?.parentFolderId;
        if (lodash_1.default.isUndefined(parentFolderId)) {
            /** refreshes token if token has already expired */
            if (common_all_1.Time.now().toSeconds() > expirationTime) {
                const { wsRoot } = this.extension.getDWorkspace();
                const fpath = engine_server_1.EngineUtils.getPortFilePathForWorkspace({ wsRoot });
                const port = (0, engine_server_1.openPortFile)({ fpath });
                accessToken = await pods_core_1.PodUtils.refreshGoogleAccessToken(refreshToken, port, connectionId);
            }
            const folderIdsHashMap = await this.candidateForParentFolders(accessToken);
            const folders = Object.keys(folderIdsHashMap);
            const parentFolder = folders.length > 1
                ? await this.promtForParentFolderId(Object.keys(folderIdsHashMap))
                : "root";
            if (lodash_1.default.isUndefined(parentFolder))
                return;
            parentFolderId = folderIdsHashMap[parentFolder];
        }
        const inputs = {
            exportScope,
            accessToken,
            refreshToken,
            ...opts,
            podType: pods_core_1.PodV2Types.GoogleDocsExportV2,
            expirationTime,
            connectionId,
            parentFolderId,
        };
        // If this is not an already saved pod config, then prompt user whether they
        // want to save as a new config or just run it one-time
        if (!opts?.podId) {
            const choice = await PodControls_1.PodUIControls.promptToSaveInputChoicesAsNewConfig();
            if (choice !== undefined && choice !== false) {
                const configPath = pods_core_1.ConfigFileUtils.genConfigFileV2({
                    fPath: pods_core_1.PodUtils.getCustomConfigPath({ wsRoot, podId: choice }),
                    configSchema: pods_core_1.GoogleDocsExportPodV2.config(),
                    setProperties: lodash_1.default.merge(inputs, {
                        podId: choice,
                        podType: pods_core_1.PodV2Types.GoogleDocsExportV2,
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
        if (!(0, pods_core_1.isRunnableGoogleDocsV2PodConfig)(inputs)) {
            const id = await PodControls_1.PodUIControls.promptToCreateNewServiceConfig(pods_core_1.ExternalService.GoogleDocs);
            await (0, pods_1.launchGoogleOAuthFlow)(id);
            vscode.window.showInformationMessage("Google OAuth is a beta feature. Please contact us at support@dendron.so or on Discord to first gain access. Then, try again and authenticate with Google on your browser to continue.");
            return;
        }
        else {
            return inputs;
        }
    }
    async candidateForParentFolders(accessToken) {
        try {
            const result = await this.getAllFoldersInDrive(accessToken);
            return result;
        }
        catch (err) {
            this.L.error((0, common_all_1.stringifyError)(err));
            return { root: "root" };
        }
    }
    /**
     * sends request to drive API to fetch folders
     */
    async getAllFoldersInDrive(accessToken) {
        const folderIdsHashMap = await vscode_1.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Fetching Parent Folders...",
            cancellable: false,
        }, async () => {
            const headers = {
                Authorization: `Bearer ${accessToken}`,
            };
            const result = await common_all_1.axios.get(`https://www.googleapis.com/drive/v3/files`, {
                params: {
                    q: "mimeType= 'application/vnd.google-apps.folder'",
                },
                headers,
                timeout: 5000,
            });
            const files = result?.data.files;
            let folderIdsHashMap = { root: "root" };
            //creates HashMap of documents with key as doc name and value as doc id
            files.forEach((file) => {
                folderIdsHashMap = {
                    ...folderIdsHashMap,
                    [file.name]: file.id,
                };
            });
            return folderIdsHashMap;
        });
        return folderIdsHashMap;
    }
    /**
     * prompts to select the folder docs are exported to
     * @param folderIdsHashMap
     */
    async promtForParentFolderId(folderIdsHashMap) {
        const pickItems = folderIdsHashMap.map((folder) => {
            return {
                label: folder,
            };
        });
        const selected = await vscode_1.window.showQuickPick(pickItems, {
            placeHolder: "Choose the Destination Folder",
            ignoreFocusOut: true,
            matchOnDescription: true,
            canPickMany: false,
        });
        if (!selected) {
            return;
        }
        return selected.label;
    }
    async onExportComplete(opts) {
        const engine = this.extension.getEngine();
        const { exportReturnValue, config } = opts;
        let errorMsg = "";
        const createdDocs = exportReturnValue.data?.created?.filter((ent) => !!ent);
        const updatedDocs = exportReturnValue.data?.updated?.filter((ent) => !!ent);
        const createdCount = createdDocs?.length ?? 0;
        const updatedCount = updatedDocs?.length ?? 0;
        if (createdDocs && createdCount > 0) {
            await pods_core_1.GoogleDocsUtils.updateNotesWithCustomFrontmatter(createdDocs, engine, config.parentFolderId);
        }
        if (updatedDocs && updatedCount > 0) {
            await pods_core_1.GoogleDocsUtils.updateNotesWithCustomFrontmatter(updatedDocs, engine, config.parentFolderId);
        }
        if (common_all_1.ResponseUtil.hasError(exportReturnValue)) {
            errorMsg = `Finished GoogleDocs Export. ${createdCount} docs created; ${updatedCount} docs updated. Error encountered: ${common_all_1.ErrorFactory.safeStringify(exportReturnValue.error?.message)}`;
            this.L.error(errorMsg);
        }
        else {
            vscode_1.window.showInformationMessage(`Finished GoogleDocs Export. ${createdCount} docs created; ${updatedCount} docs updated.`);
        }
        return errorMsg;
    }
}
exports.GoogleDocsExportPodCommand = GoogleDocsExportPodCommand;
//# sourceMappingURL=GoogleDocsExportPodCommand.js.map