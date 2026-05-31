"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoveNoteCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const lodash_1 = __importDefault(require("lodash"));
const markdown_it_1 = __importDefault(require("markdown-it"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const buttons_1 = require("../components/lookup/buttons");
const utils_1 = require("../components/lookup/utils");
const NoteLookupProviderUtils_1 = require("../components/lookup/NoteLookupProviderUtils");
const constants_1 = require("../constants");
const FileItem_1 = require("../external/fileutils/FileItem");
const logger_1 = require("../logger");
const vsCodeUtils_1 = require("../vsCodeUtils");
const quickPick_1 = require("../utils/quickPick");
const base_1 = require("./base");
const ExtensionProvider_1 = require("../ExtensionProvider");
const ProxyMetricUtils_1 = require("../utils/ProxyMetricUtils");
const AutoCompletableRegistrar_1 = require("../utils/registers/AutoCompletableRegistrar");
const autoCompleter_1 = require("../utils/autoCompleter");
const md = (0, markdown_it_1.default)();
function isMultiMove(moves) {
    return moves.length > 1;
}
function isMoveNecessary(move) {
    return (move.oldLoc.vaultName !== move.newLoc.vaultName ||
        move.oldLoc.fname.toLowerCase() !== move.newLoc.fname.toLowerCase());
}
class MoveNoteCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.MOVE_NOTE.key;
    extension;
    _proxyMetricPayload;
    constructor(ext) {
        super();
        this.extension = ext;
    }
    async sanityCheck() {
        if (lodash_1.default.isUndefined(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor())) {
            return "No document open";
        }
        return;
    }
    async gatherInputs(opts) {
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        const engine = extension.getEngine();
        const vault = opts?.vaultName
            ? common_all_1.VaultUtils.getVaultByName({
                vaults: engine.vaults,
                vname: opts.vaultName,
            })
            : undefined;
        const lookupCreateOpts = {
            nodeType: "note",
            disableVaultSelection: opts?.useSameVault,
            // If vault selection is enabled we alwaysPrompt selection mode,
            // hence disable toggling.
            vaultSelectCanToggle: false,
            // allow users to select multiple notes to move
            extraButtons: [buttons_1.MultiSelectBtn.create({ pressed: false })],
        };
        if (vault) {
            lookupCreateOpts.buttons = [];
        }
        const lc = extension.lookupControllerFactory.create(lookupCreateOpts);
        const provider = extension.noteLookupProviderFactory.create("move", {
            allowNewNote: true,
            forceAsIsPickerValueUsage: true,
        });
        provider.registerOnAcceptHook(utils_1.ProviderAcceptHooks.oldNewLocationHook);
        const initialValue = path_1.default.basename(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "", ".md");
        return new Promise((resolve) => {
            let disposable;
            NoteLookupProviderUtils_1.NoteLookupProviderUtils.subscribe({
                id: "move",
                controller: lc,
                logger: this.L,
                onDone: async (event) => {
                    const data = event.data;
                    if (data.cancel) {
                        resolve(undefined);
                        return;
                    }
                    await this.prepareProxyMetricPayload(data);
                    const opts = {
                        moves: this.getDesiredMoves(data),
                    };
                    resolve(opts);
                    disposable?.dispose();
                    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, false);
                },
                onError: (event) => {
                    const error = event.data.error;
                    vscode_1.window.showErrorMessage(error.message);
                    resolve(undefined);
                    disposable?.dispose();
                    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, false);
                },
            });
            lc.show({
                title: opts?.title || "Move note",
                placeholder: "foo",
                provider,
                initialValue: opts?.initialValue || initialValue,
                nonInteractive: opts?.nonInteractive,
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
    async prepareProxyMetricPayload(data) {
        const ctx = `${this.key}:prepareProxyMetricPayload`;
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        let items;
        if (data.selectedItems.length === 1) {
            // single move. find note from resp
            const { oldLoc } = data.onAcceptHookResp[0];
            const { fname, vaultName: vname } = oldLoc;
            if (fname !== undefined && vname !== undefined) {
                const vault = common_all_1.VaultUtils.getVaultByName({
                    vaults: engine.vaults,
                    vname,
                });
                const note = (await engine.findNotes({ fname, vault }))[0];
                items = [note];
            }
            else {
                items = [];
            }
        }
        else {
            const notes = data.selectedItems.map((item) => lodash_1.default.omit(item, ["label", "detail", "alwaysShow"]));
            items = notes;
        }
        const basicStats = common_all_1.StatisticsUtils.getBasicStatsFromNotes(items);
        if (basicStats === undefined) {
            this.L.error({ ctx, message: "failed to get basic stats from notes." });
            return;
        }
        const { numChildren, numLinks, numChars, noteDepth, ...rest } = basicStats;
        const traitsAcc = items.flatMap((item) => item.traits && item.traits.length > 0 ? item.traits : []);
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
                numProcessed: items.length,
                ...rest,
            },
        };
    }
    getDesiredMoves(data) {
        if (data.selectedItems.length === 1) {
            // If there is only a single element that we are working on then we can allow
            // for the file name to be renamed as part of the move, hence we need to
            // use onAcceptHookResp since it contains the destination file name.
            return data.onAcceptHookResp;
        }
        else if (data.selectedItems.length > 1) {
            // If there are multiple elements selected then we are aren't doing multi rename
            // in multi note move and therefore we will use selected items to get
            // all the files that the user has selected.
            const newVaultName = data.onAcceptHookResp[0].newLoc.vaultName;
            return data.selectedItems.map((item) => {
                const renameOpt = {
                    oldLoc: {
                        fname: item.fname,
                        vaultName: common_all_1.VaultUtils.getName(item.vault),
                    },
                    newLoc: {
                        fname: item.fname,
                        vaultName: newVaultName,
                    },
                };
                return renameOpt;
            });
        }
        else {
            throw new common_all_1.DendronError({
                message: `MoveNoteCommand: No items are selected. ${logger_1.UNKNOWN_ERROR_MSG}`,
            });
        }
    }
    async execute(opts) {
        const ctx = "MoveNoteCommand:execute";
        opts = lodash_1.default.defaults(opts, {
            closeAndOpenFile: true,
            allowMultiselect: true,
        });
        const { engine, wsRoot } = this.extension.getDWorkspace();
        if (this.extension.fileWatcher && !opts.noPauseWatcher) {
            this.extension.fileWatcher.pause = true;
        }
        try {
            this.L.info({ ctx, opts });
            if (isMultiMove(opts.moves)) {
                await this.showMultiMovePreview(opts.moves);
                const result = await quickPick_1.QuickPickUtil.showProceedCancel();
                if (result !== quickPick_1.ProceedCancel.PROCEED) {
                    vscode_1.window.showInformationMessage("cancelled");
                    return { changed: [] };
                }
            }
            const changed = await vscode_1.window.withProgress({
                location: vscode_1.ProgressLocation.Notification,
                title: "Refactoring...",
                cancellable: false,
            }, async () => {
                const allChanges = await this.moveNotes(engine, opts.moves);
                return allChanges;
            });
            if (opts.closeAndOpenFile) {
                // During bulk move we will only open a single file that was moved to avoid
                // cluttering user tabs with all moved files.
                await closeCurrentFileOpenMovedFile(engine, opts.moves[0], wsRoot);
            }
            return { changed };
        }
        finally {
            if (this.extension.fileWatcher && !opts.noPauseWatcher) {
                setTimeout(() => {
                    if (this.extension.fileWatcher) {
                        this.extension.fileWatcher.pause = false;
                    }
                    this.L.info({ ctx, msg: "exit" });
                }, 3000);
            }
        }
    }
    /** Performs the actual move of the notes. */
    async moveNotes(engine, moves) {
        const necessaryMoves = moves.filter((move) => isMoveNecessary(move));
        const allChanges = [];
        for (const move of necessaryMoves) {
            // We need to wait for a rename to finish before triggering another rename
            // eslint-disable-next-line no-await-in-loop
            const changes = await engine.renameNote(move);
            allChanges.push(...changes.data);
        }
        return allChanges;
    }
    async showMultiMovePreview(moves) {
        // All the moves when doing bulk-move will have the same destination vault.
        const destVault = moves[0].newLoc.vaultName;
        const contentLines = [
            "# Move notes preview",
            "",
            `## The following files will be moved to vault: ${destVault}`,
        ];
        const necessaryMoves = moves.filter((m) => isMoveNecessary(m));
        const movesBySourceVaultName = lodash_1.default.groupBy(necessaryMoves, "oldLoc.vaultName");
        function formatRowFileName(move) {
            return `| ${path_1.default.basename(move.oldLoc.fname)} |`;
        }
        lodash_1.default.forEach(movesBySourceVaultName, (moves, sourceVault) => {
            contentLines.push(`| From vault: ${sourceVault} to ${destVault} |`);
            contentLines.push(`|------------------------|`);
            moves.forEach((move) => {
                contentLines.push(formatRowFileName(move));
            });
            contentLines.push("---");
        });
        // When we are doing multi select move we don't support renaming file name
        // functionality hence the files that do not require a move must have
        // been attempted to be moved into the vault that they are already are.
        const sameVaultMoves = moves.filter((m) => !isMoveNecessary(m));
        if (sameVaultMoves.length) {
            contentLines.push(`|The following are already in vault: ${destVault}|`);
            contentLines.push(`|-----------------------------------------------|`);
            sameVaultMoves.forEach((m) => {
                contentLines.push(formatRowFileName(m));
            });
        }
        const panel = vscode_1.window.createWebviewPanel("noteMovePreview", // Identifies the type of the webview. Used internally
        "Move Notes Preview", // Title of the panel displayed to the user
        vscode_1.ViewColumn.One, // Editor column to show the new webview panel in.
        {} // Webview options. More on these later.
        );
        panel.webview.html = md.render(contentLines.join("\n"));
    }
    trackProxyMetrics({ opts, noteChangeEntryCounts, }) {
        if (this._proxyMetricPayload === undefined) {
            // something went wrong during prep. don't track.
            return;
        }
        const { extra, ...props } = this._proxyMetricPayload;
        ProxyMetricUtils_1.ProxyMetricUtils.trackRefactoringProxyMetric({
            props,
            extra: {
                ...extra,
                ...noteChangeEntryCounts,
                isMultiMove: isMultiMove(opts.moves),
            },
        });
    }
    addAnalyticsPayload(opts, out) {
        const noteChangeEntryCounts = out !== undefined
            ? { ...(0, common_all_1.extractNoteChangeEntryCounts)(out.changed) }
            : {
                createdCount: 0,
                updatedCount: 0,
                deletedCount: 0,
            };
        try {
            this.trackProxyMetrics({ opts, noteChangeEntryCounts });
        }
        catch (error) {
            this.L.error({ error });
        }
        return noteChangeEntryCounts;
    }
}
exports.MoveNoteCommand = MoveNoteCommand;
async function closeCurrentFileOpenMovedFile(engine, moveOpts, wsRoot) {
    const vault = common_all_1.VaultUtils.getVaultByName({
        vaults: engine.vaults,
        vname: moveOpts.newLoc.vaultName,
    });
    const vpath = (0, common_server_1.vault2Path)({ wsRoot, vault });
    const newUri = vscode_1.Uri.file(path_1.default.join(vpath, moveOpts.newLoc.fname + ".md"));
    await vsCodeUtils_1.VSCodeUtils.closeCurrentFileEditor();
    await vsCodeUtils_1.VSCodeUtils.openFileInEditor(new FileItem_1.FileItem(newUri));
}
//# sourceMappingURL=MoveNoteCommand.js.map