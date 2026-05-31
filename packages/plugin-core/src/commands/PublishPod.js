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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishPodCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const pods_core_1 = require("@dendronhq/pods-core");
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const utils_2 = require("../utils");
const vsCodeUtils_1 = require("../vsCodeUtils");
const pods_1 = require("../utils/pods");
const base_1 = require("./base");
class PublishPodCommand extends base_1.BaseCommand {
    key = constants_1.DENDRON_COMMANDS.PUBLISH_POD.key;
    extension;
    constructor(ext) {
        super();
        this.extension = ext;
    }
    async gatherInputs() {
        const pods = (0, pods_core_1.getAllPublishPods)();
        const podItems = pods.map((p) => (0, pods_core_1.podClassEntryToPodItemV4)(p));
        const podChoice = await (0, pods_1.showPodQuickPickItemsV4)(podItems);
        if (!podChoice) {
            return;
        }
        return { podChoice };
    }
    async enrichInputs(inputs) {
        const podChoice = inputs.podChoice;
        const podsDir = this.extension.podsDir;
        const podClass = podChoice.podClass;
        const maybeConfig = pods_core_1.PodUtils.getConfig({ podsDir, podClass });
        if (maybeConfig.error && pods_core_1.PodUtils.hasRequiredOpts(podClass)) {
            const configPath = pods_core_1.PodUtils.genConfigFile({ podsDir, podClass });
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode_1.Uri.file(configPath));
            vscode_1.window.showInformationMessage("Looks like this is your first time running this pod. Please fill out the configuration and then run this command again. ");
            return;
        }
        let noteByName = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
        if (!noteByName) {
            vscode_1.window.showErrorMessage("you must have a note open to execute this command");
            return;
        }
        noteByName = common_all_1.DNodeUtils.fname(noteByName);
        return { config: maybeConfig.data, noteByName, ...inputs };
    }
    async execute(opts) {
        const { podChoice, config, noteByName } = opts;
        const { engine, wsRoot, config: dendronConfig, vaults, } = this.extension.getDWorkspace();
        const pod = new podChoice.podClass(); // eslint-disable-line new-cap
        const vault = utils_1.PickerUtilsV2.getVaultForOpenEditor();
        const utilityMethods = {
            showMessage: utils_2.showMessage,
        };
        try {
            const link = await pod.execute({
                config: {
                    ...config,
                    fname: noteByName,
                    vaultName: common_all_1.VaultUtils.getName(vault),
                    dest: "stdout",
                },
                vaults,
                wsRoot,
                engine,
                dendronConfig,
                utilityMethods,
            });
            await vscode.env.clipboard.writeText(link);
            return link;
        }
        catch (err) {
            this.L.error({ err });
            throw err;
        }
    }
    async showResponse(resp) {
        //do not show this message if resp is empty string or is only a url. Url check ids added for github publish pod.
        if (resp.trim() &&
            !resp.match("^(http://www.|https://www.|http://|https://)?[a-z0-9]+([-.]{1}[a-z0-9]+)*.[a-z]{2,5}(:[0-9]{1,5})?(/.*)?$"))
            vscode_1.window.showInformationMessage("contents copied to clipboard");
    }
    addAnalyticsPayload(opts) {
        return pods_core_1.PodUtils.getAnalyticsPayload(opts);
    }
}
exports.PublishPodCommand = PublishPodCommand;
//# sourceMappingURL=PublishPod.js.map