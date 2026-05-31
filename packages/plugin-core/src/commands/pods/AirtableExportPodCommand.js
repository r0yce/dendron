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
exports.AirtableExportPodCommand = void 0;
const airtable_1 = __importDefault(require("@dendronhq/airtable"));
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
 * VSCode command for running the Airtable Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
class AirtableExportPodCommand extends BaseExportPodCommand_1.BaseExportPodCommand {
    key = "dendron.airtableexport";
    constructor(extension) {
        super(new HierarchySelector_1.QuickPickHierarchySelector(), extension);
    }
    createPod(config) {
        return new pods_core_1.AirtableExportPodV2({
            airtable: new airtable_1.default({ apiKey: config.apiKey }),
            config,
            engine: this.extension.getEngine(),
        });
    }
    getRunnableSchema() {
        return (0, pods_core_1.createRunnableAirtableV2PodConfigSchema)();
    }
    async gatherInputs(opts) {
        let apiKey = opts?.apiKey;
        let connectionId = opts?.connectionId;
        const { wsRoot } = this.extension.getDWorkspace();
        // Get an Airtable API Key
        if (!apiKey) {
            const mngr = new pods_core_1.ExternalConnectionManager(pods_core_1.PodUtils.getPodDir({ wsRoot }));
            // If the apiKey doesn't exist, see if we can first extract it from the connectedServiceId:
            if (opts?.connectionId) {
                const config = mngr.getConfigById({
                    id: opts.connectionId,
                });
                if (!config) {
                    vscode_1.window.showErrorMessage(`Couldn't find service config with the passed in connection ID ${opts.connectionId}.`);
                    return;
                }
                apiKey = config.apiKey;
            }
            else {
                // Prompt User to pick an airtable connection, or create a new one
                // (which will stop execution of current pod command)
                const connection = await PodControls_1.PodUIControls.promptForExternalServiceConnectionOrNew(pods_core_1.ExternalService.Airtable);
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
        // Get the airtable base to export to
        const baseId = opts && opts.baseId ? opts.baseId : await this.getAirtableBaseFromUser();
        // Get the airtable table name to export to
        const tableName = opts && opts.tableName ? opts.tableName : await this.getTableFromUser();
        // Currently, there's no UI outside of manually editing the config.yaml file
        // to specify the source field mapping
        const sourceFieldMapping = opts?.sourceFieldMapping ?? undefined;
        const inputs = {
            exportScope,
            tableName,
            sourceFieldMapping,
            ...opts,
            podType: pods_core_1.PodV2Types.AirtableExportV2,
            apiKey,
            connectionId,
            baseId,
        };
        if (!(0, pods_core_1.isRunnableAirtableV2PodConfig)(inputs)) {
            let id = inputs.podId;
            if (!id) {
                const picked = await PodControls_1.PodUIControls.promptForGenericId();
                if (!picked) {
                    return;
                }
                id = picked;
            }
            const configPath = pods_core_1.ConfigFileUtils.genConfigFileV2({
                fPath: pods_core_1.PodUtils.getCustomConfigPath({ wsRoot, podId: id }),
                configSchema: pods_core_1.AirtableExportPodV2.config(),
                setProperties: lodash_1.default.merge(inputs, {
                    podId: id,
                    connectionId: inputs.connectionId,
                }),
            });
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(configPath));
            //TODO: Modify message:
            vscode_1.window.showInformationMessage("Looks like this is your first time running this pod. Please fill out the configuration and then run this command again.");
            return;
        }
        else {
            return inputs;
        }
    }
    /**
     * Upon finishing the export, add the airtable record ID back to the
     * corresponding note in Dendron, so that on future writes, we know how to
     * distinguish between whether a note export should create a new row in
     * Airtable or update an existing one.
     * @param exportReturnValue
     * @returns
     */
    async onExportComplete({ exportReturnValue, config, }) {
        const records = exportReturnValue.data;
        const engine = this.extension.getEngine();
        const logger = this.L;
        if (records?.created) {
            await pods_core_1.AirtableUtils.updateAirtableIdForNewlySyncedNotes({
                records: records.created,
                engine,
                logger,
                podId: config.podId,
            });
        }
        const createdCount = exportReturnValue.data?.created?.length ?? 0;
        const updatedCount = exportReturnValue.data?.updated?.length ?? 0;
        let errorMsg = "";
        if (common_all_1.ResponseUtil.hasError(exportReturnValue)) {
            errorMsg = `Finished Airtable Export. ${createdCount} records created; ${updatedCount} records updated. Error encountered: ${common_all_1.ErrorFactory.safeStringify(exportReturnValue.error)}`;
            this.L.error(errorMsg);
        }
        else {
            vscode_1.window.showInformationMessage(`Finished Airtable Export. ${createdCount} records created; ${updatedCount} records updated.`);
        }
        return errorMsg;
    }
    /**
     * Get the Airtable base name to export to
     * v1 - just an input box
     * v2 - get available tables via an airtable api
     */
    async getAirtableBaseFromUser() {
        return new Promise((resolve) => {
            const inputBox = vscode.window.createInputBox();
            inputBox.title = "Enter the Airtable Base ID";
            inputBox.placeholder = "airtable-base-id";
            inputBox.ignoreFocusOut = true;
            inputBox.onDidAccept(() => {
                resolve(inputBox.value);
                inputBox.dispose();
            });
            inputBox.show();
        });
    }
    /**
     * Get the Airtable table name to export to
     * v1 - just an input box
     * v2 - get available tables via an airtable api
     */
    async getTableFromUser() {
        return new Promise((resolve) => {
            const inputBox = vscode.window.createInputBox();
            inputBox.title = "Enter the Airtable Table ID";
            inputBox.placeholder = "airtable-table-id";
            inputBox.ignoreFocusOut = true;
            inputBox.onDidAccept(() => {
                resolve(inputBox.value);
                inputBox.dispose();
            });
            inputBox.show();
        });
    }
}
exports.AirtableExportPodCommand = AirtableExportPodCommand;
//# sourceMappingURL=AirtableExportPodCommand.js.map