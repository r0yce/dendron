"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportPodCommand = void 0;
const pods_core_1 = require("@dendronhq/pods-core");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const pods_1 = require("../utils/pods");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
const ReloadIndex_1 = require("./ReloadIndex");
class ImportPodCommand extends base_1.BaseCommand {
    pods;
    key = constants_1.DENDRON_COMMANDS.IMPORT_POD.key;
    constructor(_name) {
        super(_name);
        this.pods = (0, pods_core_1.getAllImportPods)();
    }
    async gatherInputs() {
        const pods = (0, pods_core_1.getAllImportPods)();
        const podItems = pods.map((p) => (0, pods_core_1.podClassEntryToPodItemV4)(p));
        const podChoice = await (0, pods_1.showPodQuickPickItemsV4)(podItems);
        if (!podChoice) {
            return;
        }
        return { podChoice };
    }
    async enrichInputs(inputs) {
        const podChoice = inputs.podChoice;
        const podClass = podChoice.podClass;
        const podsDir = ExtensionProvider_1.ExtensionProvider.getPodsDir();
        try {
            const resp = pods_core_1.PodUtils.getConfig({ podsDir, podClass });
            if (resp.error) {
                pods_core_1.PodUtils.genConfigFile({ podsDir, podClass });
            }
            const maybeConfig = resp.data || {};
            // config defined and not just the default placeholder config
            if (maybeConfig &&
                !lodash_1.default.isEmpty(maybeConfig) &&
                (maybeConfig.src !== "TODO" || maybeConfig.vaultName !== "TODO")) {
                return { podChoice, config: maybeConfig };
            }
            const configPath = pods_core_1.PodUtils.getConfigPath({ podsDir, podClass });
            if (constants_1.Oauth2Pods.includes(podChoice.id) &&
                (maybeConfig.accessToken === undefined ||
                    maybeConfig.accessToken === "TODO")) {
                await (0, pods_1.launchGoogleOAuthFlow)();
                vscode_1.window.showInformationMessage("Google OAuth is a beta feature. Please contact us at support@dendron.so or on Discord to first gain access. Then, try again and authenticate with Google on your browser to continue.");
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode_1.Uri.file(configPath));
            }
            else {
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode_1.Uri.file(configPath));
                vscode_1.window.showInformationMessage("Looks like this is your first time running this pod. Please fill out the configuration and then run this command again.");
                return;
            }
            return;
        }
        catch (e) {
            // The user's import configuration has YAML syntax errors:
            if (e.name === "YAMLException")
                vscode_1.window.showErrorMessage("The configuration is invalid YAML. Please fix and run this command again.");
            else {
                throw e;
            }
            return;
        }
    }
    async execute(opts) {
        const ctx = { ctx: "ImportPod" };
        this.L.info({ ctx, msg: "enter", podChoice: opts.podChoice.id });
        const { wsRoot, engine, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const utilityMethods = {
            getGlobalState: pods_1.getGlobalState,
            updateGlobalState: pods_1.updateGlobalState,
            showDocumentQuickPick: pods_1.showDocumentQuickPick,
            showInputBox: pods_1.showInputBox,
            openFileInEditor: pods_1.openFileInEditor,
            handleConflict: pods_1.handleConflict,
        };
        if (!wsRoot) {
            throw Error("ws root not defined");
        }
        const pod = new opts.podChoice.podClass(); // eslint-disable-line new-cap
        const fileWatcher = ExtensionProvider_1.ExtensionProvider.getExtension().fileWatcher;
        if (fileWatcher) {
            fileWatcher.pause = true;
        }
        const importedNotes = await vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "Finding documents...",
            cancellable: false,
        }, async () => {
            const { importedNotes, errors } = await pod.execute({
                config: opts.config,
                engine,
                wsRoot,
                vaults,
                utilityMethods,
                onPrompt: async (type) => {
                    const resp = type === pods_core_1.PROMPT.USERPROMPT
                        ? await vscode_1.window.showInformationMessage("Do you want to overwrite", { modal: true }, { title: "Yes" })
                        : vscode_1.window.showInformationMessage("Note is already in sync with the google doc");
                    return resp;
                },
            });
            if (errors && errors.length > 0) {
                let errorMsg = `Error while importing ${errors.length} notes:\n`;
                errors.forEach((e) => {
                    errorMsg += e.path + "\n";
                });
                vscode_1.window.showErrorMessage(errorMsg);
            }
            return importedNotes;
        });
        await new ReloadIndex_1.ReloadIndexCommand().execute();
        if (fileWatcher) {
            fileWatcher.pause = false;
        }
        vscode_1.window.showInformationMessage(`${importedNotes.length} notes imported successfully.`);
        return importedNotes;
    }
    addAnalyticsPayload(opts, out) {
        return {
            ...pods_core_1.PodUtils.getAnalyticsPayload(opts),
            importCount: out?.length,
        };
    }
}
exports.ImportPodCommand = ImportPodCommand;
//# sourceMappingURL=ImportPod.js.map