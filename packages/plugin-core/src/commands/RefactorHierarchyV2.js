"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefactorHierarchyCommandV2 = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const markdown_it_1 = __importDefault(require("markdown-it"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const NoteLookupProviderUtils_1 = require("../components/lookup/NoteLookupProviderUtils");
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const WSUtils_1 = require("../WSUtils");
const base_1 = require("./base");
const RenameNoteV2a_1 = require("./RenameNoteV2a");
const buttons_1 = require("../components/lookup/buttons");
const ExtensionProvider_1 = require("../ExtensionProvider");
const ProxyMetricUtils_1 = require("../utils/ProxyMetricUtils");
const unified_1 = require("@dendronhq/unified");
const autoCompleter_1 = require("../utils/autoCompleter");
const AutoCompletableRegistrar_1 = require("../utils/registers/AutoCompletableRegistrar");
const md = (0, markdown_it_1.default)();
class RefactorHierarchyCommandV2 extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.REFACTOR_HIERARCHY.key;
    _proxyMetricPayload;
    entireWorkspaceQuickPickItem = {
        label: "Entire Workspace",
        detail: "Scope refactor to entire workspace",
        alwaysShow: true,
    };
    async promptScope() {
        // see if we have a selection that contains wikilinks
        const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
        const wikiLinks = text ? unified_1.LinkUtils.extractWikiLinks(text) : [];
        const shouldUseSelection = wikiLinks.length > 0;
        // if we have a selection w/ wikilinks, selection2Items
        if (!shouldUseSelection) {
            return {
                selectedItems: [this.entireWorkspaceQuickPickItem],
                onAcceptHookResp: [],
            };
        }
        const lcOpts = {
            nodeType: "note",
            disableVaultSelection: true,
            vaultSelectCanToggle: false,
            extraButtons: [
                buttons_1.Selection2ItemsBtn.create({ pressed: true, canToggle: false }),
                buttons_1.MultiSelectBtn.create({ pressed: true, canToggle: false }),
            ],
        };
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        const lc = extension.lookupControllerFactory.create(lcOpts);
        const provider = extension.noteLookupProviderFactory.create(this.key, {
            allowNewNote: false,
            noHidePickerOnAccept: false,
        });
        return new Promise((resolve) => {
            let disposable;
            NoteLookupProviderUtils_1.NoteLookupProviderUtils.subscribe({
                id: this.key,
                controller: lc,
                logger: this.L,
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
                title: "Decide the scope of refactor",
                placeholder: "Query for scope.",
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
    async promptMatchText() {
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        const value = editor?.document
            ? (await WSUtils_1.WSUtils.getNoteFromDocument(editor.document))?.fname
            : "";
        const match = await vsCodeUtils_1.VSCodeUtils.showInputBox({
            title: "Enter match text",
            prompt: "The matched portion of the file name will be the part that gets modified. The rest will remain unchanged. This supports full range of regular expression. Leave blank to capture entire file name",
            value,
        });
        if (match === undefined) {
            // immediately return if user cancels.
            return;
        }
        else if (match.trim() === "") {
            return "(.*)";
        }
        return match;
    }
    async promptReplaceText() {
        let done = false;
        let replace;
        do {
            // eslint-disable-next-line no-await-in-loop
            replace = await vsCodeUtils_1.VSCodeUtils.showInputBox({
                title: "Enter replace text",
                prompt: "This will replace the matched portion of the file name. If the matched text from previous step has named / unnamed captured groups, they are available here.",
            });
            if (replace === undefined) {
                return;
            }
            else if (replace.trim() === "") {
                vscode_1.window.showWarningMessage("Please provide a replace text.");
            }
            else {
                done = true;
            }
        } while (!done);
        return replace;
    }
    async gatherInputs() {
        const scope = await this.promptScope();
        if (lodash_1.default.isUndefined(scope)) {
            vscode_1.window.showInformationMessage("No scope provided.");
            return;
        }
        else if (scope.selectedItems &&
            scope.selectedItems[0] === this.entireWorkspaceQuickPickItem) {
            vscode_1.window.showInformationMessage("Refactor scoped to all notes.");
        }
        else {
            vscode_1.window.showInformationMessage(`Refactor scoped to ${scope.selectedItems.length} selected note(s).`);
        }
        const match = await this.promptMatchText();
        if (lodash_1.default.isUndefined(match)) {
            vscode_1.window.showErrorMessage("No match text provided.");
            return;
        }
        else {
            vscode_1.window.showInformationMessage(`Matching: ${match}`);
        }
        const replace = await this.promptReplaceText();
        if (lodash_1.default.isUndefined(replace) || replace.trim() === "") {
            vscode_1.window.showErrorMessage("No replace text provided.");
            return;
        }
        else {
            vscode_1.window.showInformationMessage(`Replacing with: ${replace}`);
        }
        return {
            scope,
            match,
            replace,
        };
    }
    showPreview(operations) {
        let content = [
            "# Refactor Preview",
            "",
            "## The following files will be renamed",
        ];
        content = content.concat(lodash_1.default.map(lodash_1.default.groupBy(operations, "vault.fsPath"), (ops, k) => {
            const out = [`${k}`].concat("\n||||\n|-|-|-|"); //create table of changes
            return out
                .concat(ops.map(({ oldUri, newUri }) => {
                return `| ${path_1.default.basename(oldUri.fsPath)} |-->| ${path_1.default.basename(newUri.fsPath)} |`;
            }))
                .join("\n");
        }));
        const panel = vscode_1.window.createWebviewPanel("refactorPreview", // Identifies the type of the webview. Used internally
        "Refactor Preview", // Title of the panel displayed to the user
        { viewColumn: vscode_1.ViewColumn.One, preserveFocus: true }, // Editor column to show the new webview panel in.
        {} // Webview options. More on these later.
        );
        panel.webview.html = md.render(content.join("\n"));
    }
    async showError(operations) {
        const content = [
            "# Error - Refactoring would overwrite files",
            "",
            "### The following files would be overwritten",
        ]
            .concat("\n||||\n|-|-|-|")
            .concat(operations.map(({ oldUri, newUri }) => {
            return `| ${path_1.default.basename(oldUri.fsPath)} |-->| ${path_1.default.basename(newUri.fsPath)} |`;
        }))
            .join("\n");
        const panel = vscode_1.window.createWebviewPanel("refactorPreview", // Identifies the type of the webview. Used internally
        "Refactor Preview", // Title of the panel displayed to the user
        vscode_1.ViewColumn.One, // Editor column to show the new webview panel in.
        {} // Webview options. More on these later.
        );
        panel.webview.html = md.render(content);
    }
    async getCapturedNotes(opts) {
        const { scope, matchRE, engine } = opts;
        const scopedItems = lodash_1.default.isUndefined(scope) ||
            scope.selectedItems[0] === this.entireWorkspaceQuickPickItem
            ? await engine.findNotes({ excludeStub: false })
            : scope.selectedItems.map((item) => lodash_1.default.omit(item, ["label", "detail", "alwaysShow"]));
        const capturedNotes = scopedItems.filter((item) => {
            const result = matchRE.exec(item.fname);
            return result && !common_all_1.DNodeUtils.isRoot(item);
        });
        // filter out notes that are not in fs (virtual stub notes)
        return capturedNotes.filter((note) => {
            if (note.stub) {
                // if a stub is captured, see if it actually exists in the file system.
                // if it is in the file system, we should include it should be part of the refactor
                // otherwise, this should be omitted.
                // as the virtual stubs will automatically be handled by the rename operation.
                const notePath = common_all_1.NoteUtils.getFullPath({ wsRoot: engine.wsRoot, note });
                const existsInFileSystem = fs_extra_1.default.existsSync(notePath);
                return existsInFileSystem;
            }
            else {
                return true;
            }
        });
    }
    getRenameOperations(opts) {
        const { capturedNotes, matchRE, replace, wsRoot } = opts;
        const operations = capturedNotes.map((note) => {
            const vault = note.vault;
            const vpath = (0, common_server_1.vault2Path)({ wsRoot, vault });
            const rootUri = vscode_1.Uri.file(vpath);
            const source = note.fname;
            const dest = note.fname.replace(matchRE, replace);
            return {
                oldUri: vsCodeUtils_1.VSCodeUtils.joinPath(rootUri, source + ".md"),
                newUri: vsCodeUtils_1.VSCodeUtils.joinPath(rootUri, dest + ".md"),
                vault,
            };
        });
        return operations;
    }
    async hasExistingFiles(opts) {
        const { operations } = opts;
        const filesThatExist = lodash_1.default.filter(operations, (op) => {
            return fs_extra_1.default.pathExistsSync(op.newUri.fsPath);
        });
        if (!lodash_1.default.isEmpty(filesThatExist)) {
            await this.showError(filesThatExist);
            vscode_1.window.showErrorMessage("refactored files would overwrite existing files");
            return true;
        }
        return false;
    }
    async runOperations(opts) {
        const { operations, renameCmd } = opts;
        const ctx = "RefactorHierarchy:runOperations";
        const out = await lodash_1.default.reduce(operations, async (resp, op) => {
            const acc = await resp;
            this.L.info({
                ctx,
                orig: op.oldUri.fsPath,
                replace: op.newUri.fsPath,
            });
            const resp2 = await renameCmd.execute({
                files: [op],
                silent: true,
                closeCurrentFile: false,
                openNewFile: false,
                noModifyWatcher: true,
            });
            acc.changed = resp2.changed.concat(acc.changed);
            return acc;
        }, Promise.resolve({
            changed: [],
        }));
        return out;
    }
    async promptConfirmation(noConfirm) {
        if (noConfirm)
            return true;
        const options = ["Proceed", "Cancel"];
        const resp = await vsCodeUtils_1.VSCodeUtils.showQuickPick(options, {
            title: "Proceed with Refactor?",
            placeHolder: "Proceed",
            ignoreFocusOut: true,
        });
        return resp === "Proceed";
    }
    prepareProxyMetricPayload(capturedNotes) {
        const ctx = `${this.key}:prepareProxyMetricPayload`;
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const basicStats = common_all_1.StatisticsUtils.getBasicStatsFromNotes(capturedNotes);
        if (basicStats === undefined) {
            this.L.error({ ctx, message: "failed to get basic stats from notes." });
            return;
        }
        const { numChildren, numLinks, numChars, noteDepth, ...rest } = basicStats;
        const traitsAcc = capturedNotes.flatMap((note) => note.traits && note.traits.length > 0 ? note.traits : []);
        const traitsSet = new Set(traitsAcc);
        this._proxyMetricPayload = {
            command: this.key,
            numVaults: engine.vaults.length,
            traits: [...traitsSet],
            numChildren,
            numLinks,
            numChars,
            noteDepth,
            extra: {
                numProcessed: capturedNotes.length,
                ...rest,
            },
        };
    }
    async execute(opts) {
        const ctx = "RefactorHierarchy:execute";
        const { scope, match, replace, noConfirm } = opts;
        this.L.info({ ctx, opts, msg: "enter" });
        const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
        const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const matchRE = new RegExp(match);
        const capturedNotes = await this.getCapturedNotes({
            scope,
            matchRE,
            engine,
        });
        this.prepareProxyMetricPayload(capturedNotes);
        const operations = this.getRenameOperations({
            capturedNotes,
            matchRE,
            replace,
            wsRoot: engine.wsRoot,
        });
        if (await this.hasExistingFiles({ operations })) {
            return;
        }
        this.showPreview(operations);
        const shouldProceed = await this.promptConfirmation(noConfirm);
        if (!shouldProceed) {
            vscode_1.window.showInformationMessage("Cancelled");
            return;
        }
        if (ext.fileWatcher) {
            ext.fileWatcher.pause = true;
        }
        const renameCmd = new RenameNoteV2a_1.RenameNoteV2aCommand();
        const out = await vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "Refactoring...",
            cancellable: false,
        }, async () => {
            const out = await this.runOperations({ operations, renameCmd });
            return out;
        });
        return { ...out, operations };
    }
    async showResponse(res) {
        if (lodash_1.default.isUndefined(res)) {
            vscode_1.window.showInformationMessage("No note refactored.");
            return;
        }
        vscode_1.window.showInformationMessage("Done refactoring.");
        const { changed } = res;
        if (changed.length > 0) {
            vscode_1.window.showInformationMessage(`Dendron updated ${lodash_1.default.uniqBy(changed, (ent) => ent.note.fname).length} files`);
        }
    }
    trackProxyMetrics({ noteChangeEntryCounts, }) {
        if (this._proxyMetricPayload === undefined) {
            return;
        }
        const { extra, ...props } = this._proxyMetricPayload;
        ProxyMetricUtils_1.ProxyMetricUtils.trackRefactoringProxyMetric({
            props,
            extra: {
                ...extra,
                ...noteChangeEntryCounts,
            },
        });
    }
    addAnalyticsPayload(_opts, out) {
        const noteChangeEntryCounts = out !== undefined
            ? { ...(0, common_all_1.extractNoteChangeEntryCounts)(out.changed) }
            : {
                createdCount: 0,
                updatedCount: 0,
                deletedCount: 0,
            };
        try {
            this.trackProxyMetrics({ noteChangeEntryCounts });
        }
        catch (error) {
            this.L.error({ error });
        }
        return noteChangeEntryCounts;
    }
}
exports.RefactorHierarchyCommandV2 = RefactorHierarchyCommandV2;
//# sourceMappingURL=RefactorHierarchyV2.js.map