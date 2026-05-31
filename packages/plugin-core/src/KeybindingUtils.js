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
exports.KeybindingUtils = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const comment_json_1 = require("comment-json");
const markdown_it_1 = __importDefault(require("markdown-it"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const constants_1 = require("./constants");
const vsCodeUtils_1 = require("./vsCodeUtils");
const vscode = __importStar(require("vscode"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const CopyToClipboardCommand_1 = require("./commands/CopyToClipboardCommand");
const analytics_1 = require("./utils/analytics");
class KeybindingUtils {
    static async openDefaultKeybindingFileAndGetJSON(opts) {
        await vscode.commands.executeCommand("workbench.action.openDefaultKeybindingsFile");
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        const defaultKeybindingText = editor?.document.getText();
        if (opts.close) {
            await vsCodeUtils_1.VSCodeUtils.closeCurrentFileEditor();
        }
        const defaultKeybindingJSON = defaultKeybindingText
            ? (0, comment_json_1.parse)(defaultKeybindingText)
            : undefined;
        return defaultKeybindingJSON;
    }
    static async openGlobalKeybindingFileAndGetJSON(opts) {
        await vscode.commands.executeCommand("workbench.action.openGlobalKeybindingsFile");
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        const globalKeybindingText = editor?.document.getText();
        if (opts.close) {
            await vsCodeUtils_1.VSCodeUtils.closeCurrentFileEditor();
        }
        const globalKeybindingJSON = globalKeybindingText
            ? (0, comment_json_1.parse)(globalKeybindingText)
            : undefined;
        return globalKeybindingJSON;
    }
    static getInstallStatusForKnownConflictingExtensions() {
        return constants_1.KNOWN_CONFLICTING_EXTENSIONS.map((extId) => {
            return {
                id: extId,
                installed: vsCodeUtils_1.VSCodeUtils.isExtensionInstalled(extId),
            };
        });
    }
    static getConflictingKeybindings(opts) {
        const { knownConflicts } = opts;
        const installStatus = KeybindingUtils.getInstallStatusForKnownConflictingExtensions();
        const installed = installStatus
            .filter((status) => status.installed)
            .map((status) => status.id);
        const conflicts = knownConflicts.filter((conflict) => {
            const isInstalled = installed.includes(conflict.extensionId);
            const osType = os_1.default.type();
            const conflictOSType = conflict.os || ["Darwin", "Linux", "Windows_NT"];
            const matchesOS = (0, constants_1.isOSType)(osType) && conflictOSType.includes(osType);
            return isInstalled && matchesOS;
        });
        // for each of the found conflicts, see if the user has them disabled in keybinding.json
        const { keybindingConfigPath } = this.getKeybindingConfigPath();
        const userKeybindingConfigExists = fs_extra_1.default.existsSync(keybindingConfigPath);
        // all conflicts are valid
        if (!userKeybindingConfigExists) {
            return conflicts;
        }
        const userKeybindingConfig = (0, common_server_1.readJSONWithCommentsSync)(keybindingConfigPath);
        const alreadyResolved = [];
        userKeybindingConfig.forEach((keybinding) => {
            // we only recognize disabling of the conflicting keybinding as resolution
            // remapping of either the conflicting / dendron command's keybinding
            // or disabling the dendron command's keybinding is not considered a resolution.
            if (keybinding.command && keybinding.command.startsWith("-")) {
                const command = keybinding.command.substring(1);
                const resolvedConflict = conflicts.find((conflict) => conflict.commandId === command);
                if (resolvedConflict) {
                    alreadyResolved.push(resolvedConflict);
                }
            }
        });
        return lodash_1.default.differenceBy(conflicts, alreadyResolved);
    }
    static generateKeybindingBlockForCopy(opts) {
        const { entry, disable } = opts;
        const whenClause = entry.when ? `  "when": "${entry.when}",` : undefined;
        const args = entry.args
            ? `  "args": ${JSON.stringify(entry.args)},`
            : undefined;
        const block = [
            "{",
            `  "key": "${disable ? entry.key : ""}",`,
            `  "command": "${disable ? "-" : ""}${entry.command}",`,
            whenClause,
            args,
            "}",
            "",
        ]
            .filter((line) => line !== undefined)
            .join("\n");
        return block;
    }
    static async showKeybindingConflictPreview(opts) {
        const md = (0, markdown_it_1.default)();
        const { conflicts } = opts;
        const defaultKeybindingJSON = await KeybindingUtils.openDefaultKeybindingFileAndGetJSON({
            close: false,
        });
        if (defaultKeybindingJSON === undefined) {
            throw new common_all_1.DendronError({
                message: "Failed reading default keybinding.",
                severity: common_all_1.ERROR_SEVERITY.MINOR,
            });
        }
        await KeybindingUtils.openGlobalKeybindingFileAndGetJSON({
            close: false,
        });
        const keybindingJSONCommandUri = `command:workbench.action.openGlobalKeybindingsFile`;
        const defaultKeybindingJSONCommandUri = `command:workbench.action.openDefaultKeybindingsFile`;
        const contents = [
            "# Known Keybinding Conflicts",
            "",
            "The keybindings listed at the bottom are known to have conflicts with default keybindings for Dendron commands.",
            "",
            "Neither Dendron nor the extension may function properly if the keybinding conflict is not resolved.",
            "",
            "Consider resolving the keybinding conflicts throught the following method:",
            "",
            "#### Disable conflicting keybindings",
            "",
            `1. Click on the link \`Copy JSON to disable this keybinding\` next to each conflicting keybinding listed below.`,
            `    - This will copy the necessary keybinding entry to your clipboard.`,
            `1. Open [keybindings.json](${keybindingJSONCommandUri})`,
            `1. Paste the clipboard content to \`keybindings.json\``,
            "",
            `[Video Guide](https://www.loom.com/embed/82d3fbccd126446bac7a4d16027c07aa)`,
            "",
            "For more information on how to set keyboard rules in VSCode, visit [Keyboard Rules](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-rules)",
            "",
            `Use [Default Keybindings](${defaultKeybindingJSONCommandUri}) to reference all default keybindings.`,
            "",
            "***",
            "## List of Keybinding Conflicts",
            conflicts
                .map((conflict) => {
                const conflictKeybindingEntry = defaultKeybindingJSON.find((keybinding) => {
                    return keybinding.command === conflict.commandId;
                });
                const dendronKeybindingEntry = defaultKeybindingJSON.find((keybinding) => {
                    return keybinding.command === conflict.conflictsWith;
                });
                if (conflictKeybindingEntry === undefined) {
                    return undefined;
                }
                if (dendronKeybindingEntry === undefined) {
                    return undefined;
                }
                const disableBlock = KeybindingUtils.generateKeybindingBlockForCopy({
                    entry: conflictKeybindingEntry,
                    disable: true,
                });
                const copyCommandUri = (args) => `command:dendron.copyToClipboard?${encodeURIComponent(JSON.stringify(args))}`;
                const out = [
                    `### \`${conflict.commandId}\` [Copy JSON to disable this keybinding](${copyCommandUri({
                        text: disableBlock,
                        source: CopyToClipboardCommand_1.CopyToClipboardSourceEnum.keybindingConflictPreview,
                        message: "Copied JSON to clipboard. Paste this into keybindings.json",
                    })})`,
                    `- key: \`${conflictKeybindingEntry.key}\``,
                    `- command: \`${conflict.commandId}\``,
                    `- from: \`${conflict.extensionId}\``,
                    `- conflicts with: \`${conflict.conflictsWith}\``,
                    "",
                ].join("\n");
                return out;
            })
                .filter((line) => line !== undefined)
                .join("\n"),
        ].join("\n");
        const panel = vscode.window.createWebviewPanel("keybindingConflictPreview", "Keybinding Conflicts", vscode.ViewColumn.Beside, {
            enableCommandUris: true,
        });
        panel.webview.html = md.render(contents);
    }
    static async showKeybindingConflictConfirmationMessage(opts) {
        const message = "We noticed some extensions that have known keybinding conflicts with Dendron. Would you like to view a list of keybinding conflicts?";
        const action = "Show Conflicts";
        await vscode.window
            .showWarningMessage(message, action)
            .then(async (resp) => {
            if (resp === action) {
                analytics_1.AnalyticsUtils.track(common_all_1.ExtensionEvents.ShowKeybindingConflictAccepted);
                await this.showKeybindingConflictPreview(opts);
            }
            else {
                analytics_1.AnalyticsUtils.track(common_all_1.ExtensionEvents.ShowKeybindingConflictRejected);
            }
        });
    }
    static async maybePromptKeybindingConflict() {
        const conflicts = KeybindingUtils.getConflictingKeybindings({
            knownConflicts: constants_1.KNOWN_KEYBINDING_CONFLICTS,
        });
        if (conflicts.length > 0) {
            analytics_1.AnalyticsUtils.track(common_all_1.ExtensionEvents.KeybindingConflictDetected, {
                source: common_all_1.KeybindingConflictDetectedSource.activation,
            });
            await KeybindingUtils.showKeybindingConflictConfirmationMessage({
                conflicts,
            });
        }
    }
    static checkKeybindingsExist(val) {
        if (lodash_1.default.isNull(val)) {
            return false;
        }
        return true;
    }
    /**
     * This returns the path of user-level `keybindings.json`.
     * This handles windows, linux and darwin, for both regular vscode and insider as well as portable mode.
     * This does NOT handle the case where vscode is opened through cli with a custom `--user-data-dir` argument.
     *
     * The most reliable way of accessing the path of `keybindings.json` is to execute `workbench.action.openGlobalKeybindingsFile`
     * and fetching the uri of the active editor document, but this requires opening and closing an editor tab in quick succession.
     * This will visually be very unpleasant, thus avoided here.
     *
     * @returns path of user defined `keybindings.json`, and the platform.
     */
    static getKeybindingConfigPath = () => {
        const { userConfigDir, osName } = vsCodeUtils_1.VSCodeUtils.getCodeUserConfigDir();
        return {
            keybindingConfigPath: path_1.default.join(userConfigDir, "keybindings.json"),
            osName,
        };
    };
    /**
     * For the given pod ID, returns a user-configured shortcut (in VSCode
     * settings) if it exists. Otherwise, returns undefined.
     * @param podId
     * @returns
     */
    static getKeybindingForPodIfExists(podId) {
        const { keybindingConfigPath } = this.getKeybindingConfigPath();
        if (!fs_extra_1.default.existsSync(keybindingConfigPath)) {
            return undefined;
        }
        const keybindings = (0, common_server_1.readJSONWithCommentsSync)(keybindingConfigPath);
        if (!KeybindingUtils.checkKeybindingsExist(keybindings)) {
            return undefined;
        }
        const result = keybindings.filter((item) => item.command &&
            item.command === constants_1.DENDRON_COMMANDS.EXPORT_POD_V2.key &&
            item.args === podId);
        if (result.length === 1 && result[0].key) {
            return result[0].key;
        }
        else if (result.length > 1) {
            throw new common_all_1.DendronError({
                message: this.getMultipleKeybindingsMsgFormat("pod"),
            });
        }
        return undefined;
    }
    static getKeybindingsForCopyAsIfExists(format) {
        const { keybindingConfigPath } = this.getKeybindingConfigPath();
        if (!fs_extra_1.default.existsSync(keybindingConfigPath)) {
            return undefined;
        }
        const keybindings = (0, common_server_1.readJSONWithCommentsSync)(keybindingConfigPath);
        if (!KeybindingUtils.checkKeybindingsExist(keybindings)) {
            return undefined;
        }
        const result = keybindings.filter((item) => {
            return (item.command &&
                item.command === constants_1.DENDRON_COMMANDS.COPY_AS.key &&
                item.args === format);
        });
        if (result.length === 1 && result[0].key) {
            return result[0].key;
        }
        else if (result.length > 1) {
            throw new common_all_1.DendronError({
                message: this.getMultipleKeybindingsMsgFormat("copy as"),
            });
        }
        return undefined;
    }
    static getMultipleKeybindingsMsgFormat(cmd) {
        return `Multiple keybindings found for ${cmd} command shortcut.`;
    }
}
exports.KeybindingUtils = KeybindingUtils;
//# sourceMappingURL=KeybindingUtils.js.map