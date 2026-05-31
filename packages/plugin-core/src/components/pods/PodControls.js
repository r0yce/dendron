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
exports.PodUIControls = void 0;
const common_all_1 = require("@dendronhq/common-all");
const pods_core_1 = require("@dendronhq/pods-core");
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const constants_1 = require("../../constants");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const KeybindingUtils_1 = require("../../KeybindingUtils");
const autoCompleter_1 = require("../../utils/autoCompleter");
const pods_1 = require("../../utils/pods");
const AutoCompletableRegistrar_1 = require("../../utils/registers/AutoCompletableRegistrar");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const buttons_1 = require("../lookup/buttons");
const NoteLookupProviderUtils_1 = require("../lookup/NoteLookupProviderUtils");
/**
 * Contains VSCode UI controls for common Pod UI operations
 */
class PodUIControls {
    /**
     * Prompts the user with a quick-pick to select a {@link ExportPodConfigurationV2}
     * by its podId. Furthermore, there is an option to create a new export
     * configuration intead.
     * @returns
     */
    static async promptForExportConfigOrNewExport() {
        return new Promise((resolve) => {
            const qp = this.getExportConfigChooserQuickPick();
            qp.onDidAccept(() => {
                if (qp.selectedItems === undefined || qp.selectedItems.length === 0) {
                    resolve(undefined);
                }
                else if (qp.selectedItems[0].label === "New Export") {
                    resolve("New Export");
                }
                else {
                    resolve({ podId: qp.selectedItems[0].label });
                }
                qp.dispose();
                return;
            });
            qp.show();
        });
    }
    /**
     * Prompts user with a quick pick to specify the {@link PodExportScope}
     */
    static async promptForExportScope() {
        return new Promise((resolve) => {
            const qp = vscode.window.createQuickPick();
            qp.ignoreFocusOut = true;
            qp.title = "Select the Export Scope";
            qp.items = Object.keys(pods_core_1.PodExportScope)
                .filter((key) => Number.isNaN(Number(key)))
                .map((value) => {
                return {
                    label: value,
                    detail: PodUIControls.getDescriptionForScope(value),
                };
            });
            qp.onDidAccept(() => {
                resolve(pods_core_1.PodExportScope[qp.selectedItems[0].label]);
                qp.dispose();
            });
            qp.show();
        });
    }
    /**
     * Ask the user if they want to save their input choices as a new pod config,
     * enabling them to run it again later.
     * @returns a pod ID for the new config if they want to save it, false if they
     * don't want to save it, or undefined if they closed out the quick pick.
     */
    static async promptToSaveInputChoicesAsNewConfig() {
        const items = [
            {
                label: "Yes",
                detail: "Select this option if you anticipate running this pod multiple-times",
            },
            {
                label: "No",
                detail: "Run this pod now",
            },
        ];
        const picked = await vscode.window.showQuickPick(items, {
            title: "Would you like to save this configuration?",
            ignoreFocusOut: true,
        });
        if (picked === undefined) {
            return;
        }
        if (picked.label === "No") {
            return false;
        }
        return this.promptForGenericId();
    }
    /**
     * Get a generic ID from the user through a quick input box.
     * @returns
     */
    static async promptForGenericId() {
        return new Promise((resolve) => {
            const inputBox = vscode.window.createInputBox();
            inputBox.title = "Select a unique ID for your configuration";
            inputBox.placeholder = "my-id";
            inputBox.ignoreFocusOut = true;
            let id;
            inputBox.onDidAccept(() => {
                id = inputBox.value;
                resolve(id);
                inputBox.dispose();
                return;
            });
            inputBox.onDidHide(() => {
                resolve(undefined);
                inputBox.dispose();
            });
            inputBox.show();
        });
    }
    /**
     * Prompt user to pick a pod (v2) type
     * @returns a runnable code command for the selected pod
     */
    static async promptForPodType() {
        const newConnectionOptions = Object.keys(pods_core_1.PodV2Types)
            .filter((key) => Number.isNaN(Number(key)))
            .map((value) => {
            return {
                label: value,
                detail: PodUIControls.getDescriptionForPodType(value),
            };
        });
        const picked = await vscode.window.showQuickPick(newConnectionOptions, {
            title: "Pick the Pod Type",
            ignoreFocusOut: true,
        });
        if (!picked) {
            return;
        }
        return picked.label;
    }
    /**
     * Prompt user to pick an {@link ExternalService}
     * @returns
     */
    static async promptForExternalServiceType() {
        const newConnectionOptions = Object.keys(pods_core_1.ExternalService)
            .filter((key) => Number.isNaN(Number(key)))
            .map((value) => {
            return { label: value };
        });
        const picked = await vscode.window.showQuickPick(newConnectionOptions, {
            title: "Pick the Service Connection Type",
            ignoreFocusOut: true,
        });
        if (!picked) {
            return;
        }
        return picked.label;
    }
    /**
     * Prompt user to pick an existing service connection, or to create a new one.
     * @returns
     */
    static async promptForExternalServiceConnectionOrNew(connectionType) {
        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const mngr = new pods_core_1.ExternalConnectionManager(pods_core_1.PodUtils.getPodDir({ wsRoot }));
        const existingConnections = await mngr.getAllConfigsByType(connectionType);
        const items = existingConnections.map((value) => {
            return { label: value.connectionId };
        });
        const createNewOptionString = `Create new ${connectionType} connection`;
        const newConnectionOption = {
            label: createNewOptionString,
        };
        const selectedServiceOption = await vscode.window.showQuickPick(items.concat(newConnectionOption), { title: "Pick the service connection for export", ignoreFocusOut: true });
        if (!selectedServiceOption) {
            return;
        }
        if (selectedServiceOption.label === createNewOptionString) {
            await PodUIControls.createNewServiceConfig(connectionType);
            return;
        }
        else {
            const config = mngr.getConfigById({ id: selectedServiceOption.label });
            if (!config) {
                vscode.window.showErrorMessage(`Couldn't find service config with ID ${selectedServiceOption.label}.`);
                return;
            }
            return config;
        }
    }
    static async createNewServiceConfig(connectionType) {
        switch (connectionType) {
            case pods_core_1.ExternalService.Airtable: {
                await this.promptToCreateNewServiceConfig(pods_core_1.ExternalService.Airtable);
                vscode.window.showInformationMessage(`First setup a new ${connectionType} connection and then re-run the pod command.`);
                break;
            }
            case pods_core_1.ExternalService.GoogleDocs: {
                const id = await this.promptToCreateNewServiceConfig(pods_core_1.ExternalService.GoogleDocs);
                await (0, pods_1.launchGoogleOAuthFlow)(id);
                vscode.window.showInformationMessage("Google OAuth is a beta feature. Please contact us at support@dendron.so or on Discord to first gain access. Then, try again and authenticate with Google on your browser to continue.");
                break;
            }
            case pods_core_1.ExternalService.Notion: {
                await this.promptToCreateNewServiceConfig(pods_core_1.ExternalService.Notion);
                vscode.window.showInformationMessage(`First setup a new ${connectionType} connection and then re-run the pod command.`);
                break;
            }
            default:
                (0, common_all_1.assertUnreachable)(connectionType);
        }
    }
    /**
     * Ask the user to pick an ID for a new service connection. The connection
     * file will be opened in the editor.
     * @param serviceType
     * @returns
     */
    static async promptToCreateNewServiceConfig(serviceType) {
        const mngr = new pods_core_1.ExternalConnectionManager(ExtensionProvider_1.ExtensionProvider.getExtension().podsDir);
        const id = await this.promptForGenericId();
        if (!id) {
            return;
        }
        const newFile = await mngr.createNewConfig({ serviceType, id });
        await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(newFile));
        return id;
    }
    /**
     * Prompts a lookup control that allows user to select notes for export.
     * @param fromSelection set this flag to true if we are using {@link PodExportScope.LinksInSelection}
     * @param key key of the command. this will be used for lookup provider subscription.
     * @param logger logger object used by the command.
     * @returns
     */
    static async promptForScopeLookup(opts) {
        const { fromSelection, key, logger } = opts;
        const extraButtons = [
            buttons_1.MultiSelectBtn.create({ pressed: true, canToggle: false }),
        ];
        if (fromSelection) {
            extraButtons.push(buttons_1.Selection2ItemsBtn.create({ pressed: true, canToggle: false }));
        }
        const lcOpts = {
            nodeType: "note",
            disableVaultSelection: true,
            vaultSelectCanToggle: false,
            extraButtons,
        };
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        const lc = extension.lookupControllerFactory.create(lcOpts);
        const provider = extension.noteLookupProviderFactory.create(key, {
            allowNewNote: false,
            noHidePickerOnAccept: false,
        });
        return new Promise((resolve) => {
            let disposable;
            NoteLookupProviderUtils_1.NoteLookupProviderUtils.subscribe({
                id: key,
                controller: lc,
                logger,
                onDone: (event) => {
                    const data = event.data;
                    if (data.cancel) {
                        resolve(undefined);
                    }
                    resolve(data);
                    disposable?.dispose();
                    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, false);
                },
                onHide: () => {
                    resolve(undefined);
                    disposable?.dispose();
                    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, false);
                },
            });
            lc.show({
                title: "Select notes to export.",
                placeholder: "Lookup notes.",
                provider,
                selectAll: true,
            });
            vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, true);
            disposable = AutoCompletableRegistrar_1.AutoCompletableRegistrar.OnAutoComplete(() => {
                if (lc.quickPick) {
                    lc.quickPick.value = autoCompleter_1.AutoCompleter.getAutoCompletedValue(lc.quickPick);
                    lc.provider.onUpdatePickerItems({
                        picker: lc.quickPick,
                    });
                }
            });
        });
    }
    /**
     * Prompt to select vault
     * @returns vault
     *
     */
    static async promptForVaultSelection() {
        const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        if (vaults.length === 1)
            return vaults[0];
        const vaultQuickPick = await vsCodeUtils_1.VSCodeUtils.showQuickPick(vaults.map((ent) => ({
            label: common_all_1.VaultUtils.getName(ent),
            detail: ent.fsPath,
            data: ent,
        })), {
            placeHolder: "Select the vault to export",
        });
        return vaultQuickPick?.data;
    }
    static getExportConfigChooserQuickPick() {
        const qp = vscode.window.createQuickPick();
        qp.title = "Pick a Pod Configuration or Create a New One";
        qp.matchOnDetail = true;
        qp.matchOnDescription = true;
        qp.ignoreFocusOut = true;
        const items = [];
        const configs = pods_core_1.PodV2ConfigManager.getAllPodConfigs(path_1.default.join(ExtensionProvider_1.ExtensionProvider.getExtension().podsDir, "custom"));
        configs.forEach((config) => {
            let keybinding;
            try {
                keybinding = KeybindingUtils_1.KeybindingUtils.getKeybindingForPodIfExists(config.podId);
            }
            catch (e) {
                if (e.message &&
                    e.message.includes(KeybindingUtils_1.KeybindingUtils.getMultipleKeybindingsMsgFormat("pod"))) {
                    keybinding = "Multiple Keybindings";
                }
            }
            let description = config.podType.toString();
            if (keybinding) {
                description = description + "  " + keybinding;
            }
            items.push({
                label: config.podId,
                detail: config.description ?? undefined,
                description,
            });
        });
        items.push({
            label: "New Export",
            detail: "Create a new export for either one-time use or to save to a new pod configuration",
        });
        qp.items = items;
        return qp;
    }
    /**
     * Prompt the user via Quick Pick(s) to select the destination of the export
     * @returns
     */
    static async promptUserForDestination(exportScope, options) {
        const items = [
            {
                label: "clipboard",
                detail: "Puts the contents of the export into your clipboard",
            },
            {
                label: "local filesystem",
                detail: "Exports the contents to a local directory",
            },
        ];
        // Cannot have clipboard be the destination on a multi-note export
        if (exportScope === pods_core_1.PodExportScope.Note ||
            exportScope === pods_core_1.PodExportScope.Selection) {
            const picked = await vscode.window.showQuickPick(items);
            if (!picked) {
                return;
            }
            if (picked.label === "clipboard") {
                return "clipboard";
            }
        }
        // Else, local filesystem, show a file picker dialog:
        const fileUri = await vscode.window.showOpenDialog(options);
        if (fileUri && fileUri[0]) {
            return fileUri[0].fsPath;
        }
        return;
    }
    /**
     * Small helper method to get descriptions for {@link promptForExportScope}
     * @param scope
     * @returns
     */
    static getDescriptionForScope(scope) {
        switch (scope) {
            case pods_core_1.PodExportScope.Lookup:
                return "Prompts user to select note(s) for export";
            case pods_core_1.PodExportScope.LinksInSelection:
                return "Exports all notes in wikilinks of current selected portion of text in the open note editor";
            case pods_core_1.PodExportScope.Note:
                return "Exports the currently opened note";
            case pods_core_1.PodExportScope.Hierarchy:
                return "Exports all notes that fall under a hierarchy";
            case pods_core_1.PodExportScope.Vault:
                return "Exports all notes within a vault";
            case pods_core_1.PodExportScope.Workspace:
                return "Exports all notes in the Dendron workspace";
            case pods_core_1.PodExportScope.Selection:
                return "Export the selected text from currently opened note";
            default:
                (0, common_all_1.assertUnreachable)(scope);
        }
    }
    /**
     * Small helper method to get descriptions for {@link promptForExportScope}
     * @param type
     * @returns
     */
    static getDescriptionForPodType(type) {
        switch (type) {
            case pods_core_1.PodV2Types.AirtableExportV2:
                return "Exports notes to rows in an Airtable";
            case pods_core_1.PodV2Types.MarkdownExportV2:
                return "Formats Dendron markdown and exports it to the clipboard or local file system";
            case pods_core_1.PodV2Types.GoogleDocsExportV2:
                return "Formats Dendron note to google doc";
            case pods_core_1.PodV2Types.NotionExportV2:
                return "Exports notes to Notion";
            case pods_core_1.PodV2Types.JSONExportV2:
                return "Formats notes to JSON and exports it to clipboard or local file system";
            default:
                (0, common_all_1.assertUnreachable)(type);
        }
    }
    /**
     * Prompt user to select custom pod Id
     */
    static async promptToSelectCustomPodId() {
        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const configs = pods_core_1.PodV2ConfigManager.getAllPodConfigs(path_1.default.join(pods_core_1.PodUtils.getPodDir({ wsRoot }), "custom"));
        const items = configs.map((value) => {
            return { label: value.podId, description: value.podType };
        });
        const podIdQuickPick = await vsCodeUtils_1.VSCodeUtils.showQuickPick(items, {
            title: "Pick a pod configuration Id",
            ignoreFocusOut: true,
        });
        return podIdQuickPick?.label;
    }
    /**
     * Prompt user to select the copy as format
     */
    static async promptToSelectCopyAsFormat() {
        const items = (0, pods_core_1.getAllCopyAsFormat)().map((value) => {
            let keybinding;
            try {
                keybinding =
                    KeybindingUtils_1.KeybindingUtils.getKeybindingsForCopyAsIfExists(value) || "";
            }
            catch (e) {
                if (e.message &&
                    e.message.includes(KeybindingUtils_1.KeybindingUtils.getMultipleKeybindingsMsgFormat("copy as"))) {
                    keybinding = "Multiple Keybindings";
                }
            }
            return {
                label: value,
                description: keybinding,
                detail: `Format Dendron note to ${value} and copy it to the clipboard`,
            };
        });
        const formatQuickPick = await vsCodeUtils_1.VSCodeUtils.showQuickPick(items, {
            title: "Pick the format to convert",
            ignoreFocusOut: true,
        });
        return formatQuickPick?.label;
    }
}
exports.PodUIControls = PodUIControls;
//# sourceMappingURL=PodControls.js.map