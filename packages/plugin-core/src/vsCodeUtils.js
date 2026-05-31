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
exports.VSCodeUtils = exports.MessageSeverity = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const lodash_1 = __importDefault(require("lodash"));
const markdown_it_1 = __importDefault(require("markdown-it"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const constants_1 = require("./constants");
const FileItem_1 = require("./external/fileutils/FileItem");
// NOTE: used for tests
let _MOCK_CONTEXT;
/** The severity of a message shown by {@link VSCodeUtils.showMessage}.
 *
 * The function will call `vscode.window.show(Information|Warning|Error)Message` with the parameters given to it.
 *
 * The severities map to numbers for easy comparison, `INFO < WARN && WARN < ERROR`.
 */
var MessageSeverity;
(function (MessageSeverity) {
    MessageSeverity[MessageSeverity["INFO"] = 1] = "INFO";
    MessageSeverity[MessageSeverity["WARN"] = 2] = "WARN";
    MessageSeverity[MessageSeverity["ERROR"] = 3] = "ERROR";
})(MessageSeverity || (exports.MessageSeverity = MessageSeverity = {}));
/**
 * IMPORTANT: Do not import from  workspace.ts from this file. Any utils that
 * depend on workspace must go into WSUtils, otherwise this will create circular
 * dependencies.
 */
class VSCodeUtils {
    /**
     * In development, this is `packages/plugin-core/assets`
     * In production, this is `$HOME/$VSCODE_DIR/{path-to-app}/dist/
     * @param context
     * @returns
     */
    static getAssetUri(context) {
        if ((0, common_all_1.getStage)() === "dev")
            return VSCodeUtils.joinPath(context.extensionUri, "assets");
        return VSCodeUtils.joinPath(context.extensionUri, "dist");
    }
    static closeCurrentFileEditor() {
        return vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    }
    static closeAllEditors() {
        const closeEditorsCmd = vscode.commands.executeCommand("workbench.action.closeAllEditors");
        const closeGroupsCmd = vscode.commands.executeCommand("workbench.action.closeAllGroups");
        return Promise.all([closeEditorsCmd, closeGroupsCmd]);
    }
    static createCancelSource(existingSource) {
        const tokenSource = new vscode_1.CancellationTokenSource();
        if (existingSource) {
            existingSource.cancel();
            existingSource.dispose();
        }
        return tokenSource;
    }
    static createQuickPick = vscode.window.createQuickPick;
    static extractRangeFromActiveEditor = async (documentParam, rangeParam) => {
        const document = documentParam || vscode.window.activeTextEditor?.document;
        if (!document || (document && document.languageId !== "markdown")) {
            return;
        }
        const range = rangeParam || vscode.window.activeTextEditor?.selection;
        if (!range || (range && range.isEmpty)) {
            return;
        }
        return { document, range };
    };
    static deleteRange = async (document, range) => {
        const editor = await vscode.window.showTextDocument(document);
        await editor.edit((edit) => edit.delete(range));
    };
    /** Wraps the selected range with comment symbols using builtin VSCode command. */
    static async makeBlockComment(editor, range) {
        // The command doesn't accept any arguments, it uses the current selection.
        // So save then restore the selection.
        const selectionsBefore = editor.selections;
        if (range) {
            editor.selection = new vscode.Selection(range?.start, range?.end);
        }
        await vscode.commands.executeCommand("editor.action.blockComment");
        editor.selections = selectionsBefore;
    }
    static getActiveTextEditor() {
        return vscode.window.activeTextEditor;
    }
    static getActiveTextEditorOrThrow() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new common_all_1.DendronError({ message: "no active editor" });
        }
        return editor;
    }
    static getFsPathFromTextEditor(editor) {
        return editor.document.uri.fsPath;
    }
    /**
     * Check if we upgraded, initialized for the first time or no change was detected
     * @returns {@link InstallStatus}
     */
    static getInstallStatusForWorkspace({ previousWorkspaceVersion, currentVersion, }) {
        if (lodash_1.default.isUndefined(previousWorkspaceVersion) ||
            previousWorkspaceVersion === common_all_1.CONSTANTS.DENDRON_INIT_VERSION) {
            return common_all_1.InstallStatus.INITIAL_INSTALL;
        }
        if (previousWorkspaceVersion !== currentVersion) {
            return common_all_1.InstallStatus.UPGRADED;
        }
        return common_all_1.InstallStatus.NO_CHANGE;
    }
    /**
     * Get {@link InstallStatus}
     * ^pubko8e3tu7i
     */
    static getInstallStatusForExtension({ previousGlobalVersion, currentVersion, }) {
        // if there is no global version set, then its a new install
        if (lodash_1.default.isUndefined(previousGlobalVersion) ||
            previousGlobalVersion === common_all_1.CONSTANTS.DENDRON_INIT_VERSION) {
            return common_all_1.InstallStatus.INITIAL_INSTALL;
        }
        if (previousGlobalVersion !== currentVersion) {
            return common_all_1.InstallStatus.UPGRADED;
        }
        return common_all_1.InstallStatus.NO_CHANGE;
    }
    static getSelection() {
        const editor = vscode.window.activeTextEditor;
        if (lodash_1.default.isUndefined(editor))
            return { text: undefined, selection: undefined, editor: undefined };
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        return { text, selection, editor };
    }
    // create mock context for testing ^7a83pznb91c8
    static getOrCreateMockContext() {
        if (!_MOCK_CONTEXT) {
            const logPath = (0, common_server_1.tmpDir)().name;
            const pkgRoot = (0, common_server_1.goUpTo)({ base: __dirname, fname: "package.json" });
            _MOCK_CONTEXT = {
                extensionMode: vscode.ExtensionMode.Development,
                logPath,
                logUri: vscode.Uri.file(logPath),
                subscriptions: [],
                extensionPath: pkgRoot,
                globalState: VSCodeUtils.createMockState({
                    [constants_1.GLOBAL_STATE.VERSION]: "0.0.1",
                }),
                workspaceState: VSCodeUtils.createMockState({}),
                extensionUri: vscode.Uri.file(pkgRoot),
                environmentVariableCollection: {},
                storagePath: (0, common_server_1.tmpDir)().name,
                globalStoragePath: (0, common_server_1.tmpDir)().name,
                asAbsolutePath: {}, //vscode.Uri.file(wsPath)
            };
        }
        return _MOCK_CONTEXT;
    }
    static createMockState(settings) {
        const _settings = settings;
        return {
            get: (_key) => {
                return _settings[_key];
            },
            update: async (_key, _value) => {
                _settings[_key] = _value;
                return;
            },
            has: (key) => {
                return key in _settings;
            },
            inspect: (_section) => {
                return _settings;
            },
        };
    }
    static createWSFolder(root) {
        const uri = vscode.Uri.file(root);
        return {
            index: 0,
            uri,
            name: path_1.default.basename(root),
        };
    }
    /**
     * URI.joinPath currentl'y doesn't work in theia
     * @param uri
     * @param path
     */
    static joinPath(uri, ...fpath) {
        return vscode.Uri.file(path_1.default.join(uri.fsPath, ...fpath));
    }
    static async openFileInEditor(fileItemOrURI, opts) {
        let textDocument;
        if (fileItemOrURI instanceof FileItem_1.FileItem) {
            if (fileItemOrURI.isDir) {
                return;
            }
            textDocument = await vscode.workspace.openTextDocument(fileItemOrURI.path);
        }
        else {
            textDocument = await vscode.workspace.openTextDocument(fileItemOrURI);
        }
        if (!textDocument) {
            throw new Error("Could not open file!");
        }
        const col = opts?.column || vscode.ViewColumn.Active;
        const editor = await vscode.window.showTextDocument(textDocument, col);
        if (!editor) {
            throw new Error("Could not show document!");
        }
        return editor;
    }
    static openLink(link) {
        vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(link));
    }
    closeAllEditors() {
        return vscode.commands.executeCommand("workbench.action.closeAllEditors");
    }
    static async openWS(wsFile) {
        return vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(wsFile));
    }
    static async reloadWindow() {
        if ((0, common_all_1.getStage)() !== "test") {
            await vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
    }
    /**
     * Opens file picker which allows user to select a file or folder
     *
     * @param options Options to configure the behaviour of a file open dialog
     * @returns Filesystem path
     */
    static async openFilePicker(options) {
        const fileUri = await vscode.window.showOpenDialog(options);
        if (fileUri && fileUri[0]) {
            return fileUri[0].fsPath;
        }
        return;
    }
    /** Prompt the user for an absolute path to a folder. Supports `~`.
     *
     * @param opts.default The default path to suggest.
     * @param opts.relativeTo If given, this should be an absolute folder prefix. Anything the user types will be prefixed with this.
     * @param opts.override Use to override the prompts suggestions.
     * @returns
     */
    static async gatherFolderPath(opts) {
        let folderPath = await vscode.window.showInputBox({
            prompt: "Select path to folder",
            ignoreFocusOut: true,
            value: opts?.default,
            validateInput: (input) => {
                if (opts?.relativeTo)
                    input = path_1.default.join(opts.relativeTo, input);
                if (!path_1.default.isAbsolute(input)) {
                    if (input[0] !== "~") {
                        return "must enter absolute path";
                    }
                }
                return undefined;
            },
            ...opts?.override,
        });
        if (lodash_1.default.isUndefined(folderPath)) {
            return;
        }
        if (opts?.relativeTo)
            folderPath = path_1.default.join(opts.relativeTo, folderPath);
        return (0, common_server_1.resolvePath)(folderPath);
    }
    static isDevMode() {
        // HACK: vscode does not save env variables btw workspaces
        return !!process.env.VSCODE_DEBUGGING_EXTENSION;
    }
    static setContext(key, status) {
        vscode.commands.executeCommand("setContext", key, status);
    }
    static setContextStringValue(key, value) {
        vscode.commands.executeCommand("setContext", key, value);
    }
    static showInputBox = vscode.window.showInputBox;
    static showQuickPick = vscode.window.showQuickPick;
    static showWebView = (opts) => {
        const { title, content, rawHTML } = opts;
        const panel = vscode.window.createWebviewPanel(lodash_1.default.kebabCase(title), title, // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {} // Webview options. More on these later.
        );
        panel.webview.html = rawHTML ? content : (0, markdown_it_1.default)().render(content);
    };
    static showMessage(severity, ...opts) {
        switch (severity) {
            case MessageSeverity.INFO:
                return vscode.window.showInformationMessage(...opts);
            case MessageSeverity.WARN:
                return vscode.window.showWarningMessage(...opts);
            case MessageSeverity.ERROR:
                return vscode.window.showErrorMessage(...opts);
            default:
                (0, common_all_1.assertUnreachable)(severity);
        }
    }
    /** Convert a `Point` from a parsed remark node to a `vscode.Poisition`
     *
     * @param point The point to convert.
     * @param offset When converting the point, shift it by this much.
     * @returns The converted Position, shifted by `offset` if provided.
     */
    static point2VSCodePosition(point, offset) {
        return new vscode.Position(
        // remark Point's are 0 indexed
        point.line - 1 + (offset?.line || 0), point.column - 1 + (offset?.column || 0));
    }
    /** Convert a `Position` from a parsed remark node to a `vscode.Range`
     *
     * @param position The position to convert.
     * @returns The converted Range.
     */
    static position2VSCodeRange(position, offset) {
        return new vscode.Range(
        // remark Point's are 0 indexed
        this.point2VSCodePosition(position.start, offset), this.point2VSCodePosition(position.end, offset));
    }
    /** Given a `range`, extend the start and end lines of the range by `padding` many lines.
     *
     * @param opts.range The range to extend.
     * @param opts.padding The number of lines to extend the range.
     * @param zeroCharacter If true, the starting and ending characters of the range will be set to 0.
     * @returns
     */
    static padRange(opts) {
        const { range, padding, zeroCharacter } = opts;
        return new vscode.Range(new vscode.Position(Math.max(range.start.line - padding, 0), zeroCharacter ? 0 : range.start.character), new vscode.Position(range.end.line + padding, zeroCharacter ? 0 : range.end.character));
    }
    /** Given a list of ranges, return a set of ranges where any overlapping ranges have been merged together. No two returned range will overlap. */
    static mergeOverlappingRanges(ranges) {
        const out = [];
        ranges = lodash_1.default.sortBy(ranges, (range) => range.start.line, (range) => range.start.character);
        // Reverse them so `.pop()` gives us the earliest list element.
        ranges.reverse();
        while (ranges.length > 0) {
            // Get the earliest range
            let earliest = ranges.pop();
            if (!earliest)
                break;
            while (ranges.length > 0) {
                // If the next range overlaps...
                const next = ranges[ranges.length - 1]; // what pop would have returned
                if (earliest.intersection(next) === undefined)
                    break; // no overlap
                // Then extend this range
                earliest = earliest.union(next);
                // And remove the next range because it's now part of the current one
                ranges.pop();
                // Continue until we get to a non-overlapping range
            }
            out.push(earliest);
        }
        return out;
    }
    /** Converts any range similar to a VSCode range into an actual VSCode range, which is needed for VSCode APIs. */
    static toRangeObject(range) {
        return new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character);
    }
    /** Opposite of `toRangeObject`, which is required to call Dendron APIs. */
    static toPlainRange(range) {
        return (0, common_all_1.newRange)(range.start.line, range.start.character, range.end.line, range.end.character);
    }
    /** Fold the foldable region at the given line for the active editor.
     *
     * This is equivalent to selecting that point, and using the "Fold" command in the editor.
     */
    static foldActiveEditorAtPosition(opts) {
        return vscode.commands.executeCommand("editor.fold", {
            selectionLines: [opts.line],
            levels: opts.levels,
        });
    }
    /** Use the built-in markdown preview to display preview for a file. */
    static showDefaultPreview(uri) {
        return vscode.commands.executeCommand("markdown.showPreview", uri);
    }
    static getCodeUserConfigDir() {
        const CODE_RELEASE_MAP = {
            VSCodium: "VSCodium",
            "Visual Studio Code - Insiders": "Code - Insiders",
        };
        const vscodeRelease = vscode.env.appName;
        const name = lodash_1.default.get(CODE_RELEASE_MAP, vscodeRelease, "Code");
        const osName = os_1.default.type();
        let delimiter = "/";
        let userConfigDir;
        switch (osName) {
            case "Darwin": {
                userConfigDir =
                    process.env.HOME + "/Library/Application Support/" + name + "/User/";
                break;
            }
            case "Linux": {
                userConfigDir = process.env.HOME + "/.config/" + name + "/User/";
                break;
            }
            case "Windows_NT": {
                userConfigDir = process.env.APPDATA + "\\" + name + "\\User\\";
                delimiter = "\\";
                break;
            }
            default: {
                userConfigDir = process.env.HOME + "/.config/" + name + "/User/";
                break;
            }
        }
        // if vscode is in portable mode, we need to handle it differently
        // there is also a case where the user opens vscode with a custom `--user-data-dir` args through the CLI,
        // but there is no reliable way for the extension authors to identify that through the node env or vscode API
        const portableDir = process.env["VSCODE_PORTABLE"];
        if (portableDir) {
            userConfigDir = path_1.default.join(portableDir, "user-data", "User");
        }
        return {
            userConfigDir,
            delimiter,
            osName,
        };
    }
    static getWorkspaceConfig = vscode.workspace.getConfiguration;
    static setWorkspaceConfig(section, value, configurationTarget) {
        const config = vscode.workspace.getConfiguration();
        config.update(section, value, configurationTarget);
    }
    static isExtensionInstalled(extensionId) {
        return !lodash_1.default.isUndefined(vscode.extensions.getExtension(extensionId));
    }
    static isTextDocument(obj) {
        return (obj.uri !== undefined &&
            lodash_1.default.isString(obj.fileName) &&
            lodash_1.default.isNumber(obj.lineCount));
    }
}
exports.VSCodeUtils = VSCodeUtils;
//# sourceMappingURL=vsCodeUtils.js.map