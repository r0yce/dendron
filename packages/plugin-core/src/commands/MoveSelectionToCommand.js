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
exports.MoveSelectionToCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
const vscode = __importStar(require("vscode"));
const EditorUtils_1 = require("../utils/EditorUtils");
const buttons_1 = require("../components/lookup/buttons");
const unified_1 = require("@dendronhq/unified");
const ProxyMetricUtils_1 = require("../utils/ProxyMetricUtils");
const NoteLookupCommand_1 = require("./NoteLookupCommand");
class MoveSelectionToCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.MOVE_SELECTION_TO.key;
    _proxyMetricPayload;
    extension;
    constructor(ext) {
        super();
        this.extension = ext;
    }
    async sanityCheck() {
        const activeTextEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        const noNoteOpenMessage = "You need to have a note open to use this command.";
        const allEmptySelectionMessage = "All selections are empty. Please selection the text to move.";
        const someEmptySelectionMessage = "There are some empty selections. They will not be moved.";
        const selectionContainsFrontmatterMessage = "Selection contains frontmatter. Please only select the body of the note.";
        // needs active text editor
        if (activeTextEditor) {
            const activeNote = await this.extension.wsUtils.getNoteFromDocument(activeTextEditor?.document);
            // needs active note
            if (activeNote === undefined) {
                return noNoteOpenMessage;
            }
            else {
                const { selections } = activeTextEditor;
                // need at least one non-empty selection
                const numEmpty = selections.filter((selection) => {
                    return selection.isEmpty;
                }).length;
                if (numEmpty === selections.length) {
                    return allEmptySelectionMessage;
                }
                if (numEmpty > 0 && numEmpty < selections.length) {
                    vscode.window.showWarningMessage(someEmptySelectionMessage);
                }
                // selection shouldn't contain frontmatter
                const selectionContainsFrontmatter = await EditorUtils_1.EditorUtils.selectionContainsFrontmatter({
                    editor: activeTextEditor,
                });
                if (selectionContainsFrontmatter) {
                    return selectionContainsFrontmatterMessage;
                }
            }
        }
        else {
            return noNoteOpenMessage;
        }
        return;
    }
    createLookupController() {
        const opts = {
            nodeType: "note",
            disableVaultSelection: true,
            extraButtons: [
                buttons_1.SelectionExtractBtn.create({ pressed: true, canToggle: false }),
            ],
            title: "Move Selection To...",
        };
        const controller = this.extension.lookupControllerFactory.create(opts);
        return controller;
    }
    createLookupProvider(opts) {
        const { activeNote } = opts;
        // the id here should be "lookup" as long as we are supplying this
        // to the lookup command.
        // TODO: give it its own id once we refactor.
        return this.extension.noteLookupProviderFactory.create("lookup", {
            allowNewNote: true,
            allowNewNoteWithTemplate: false,
            noHidePickerOnAccept: false,
            preAcceptValidators: [
                // disallow accepting the currently active note from the picker.
                (selectedItems) => {
                    const maybeActiveNoteItem = selectedItems.find((item) => {
                        return item.id === activeNote?.id;
                    });
                    if (maybeActiveNoteItem) {
                        vscode.window.showErrorMessage("You cannot move selection to the current note.");
                    }
                    return !maybeActiveNoteItem;
                },
            ],
        });
    }
    async prepareProxyMetricPayload(opts) {
        const ctx = `${this.key}:prepareProxyMetricPayload`;
        const engine = this.extension.getEngine();
        const { sourceNote, selection, selectionText } = opts;
        if (sourceNote === undefined ||
            selection === undefined ||
            selectionText === undefined) {
            return;
        }
        const basicStats = common_all_1.StatisticsUtils.getBasicStatsFromNotes([sourceNote]);
        if (basicStats === undefined) {
            this.L.error({ ctx, message: "failed to get basic states from note" });
            return;
        }
        const { numChildren, numLinks, numChars, noteDepth } = basicStats;
        this._proxyMetricPayload = {
            command: this.key,
            numVaults: engine.vaults.length,
            traits: sourceNote.traits || [],
            numChildren,
            numLinks,
            numChars,
            noteDepth,
            extra: {
                numSelectionChars: selectionText.length,
                numSelectionAnchors: unified_1.RemarkUtils.findAnchors(selectionText).length,
            },
        };
    }
    async execute(opts) {
        const lookupCmd = new NoteLookupCommand_1.NoteLookupCommand();
        const controller = this.createLookupController();
        const activeNote = await this.extension.wsUtils.getActiveNote();
        const { selection, text: selectionText } = vsCodeUtils_1.VSCodeUtils.getSelection();
        await this.prepareProxyMetricPayload({
            sourceNote: activeNote,
            selection,
            selectionText,
        });
        this.trackProxyMetrics();
        const provider = this.createLookupProvider({ activeNote });
        lookupCmd.controller = controller;
        // TODO: don't set custom providers for NoteLookupCommand
        // modularize the logic needed for this command
        // so that it doesn't rely on other commands.
        lookupCmd.provider = provider;
        const runOpts = {
            initialValue: opts?.initialValue,
            noConfirm: opts?.noConfirm,
        };
        await lookupCmd.run(runOpts);
        return opts;
    }
    trackProxyMetrics() {
        if (this._proxyMetricPayload === undefined) {
            // something went wrong during prep. don't track.
            return;
        }
        const { extra, ...props } = this._proxyMetricPayload;
        ProxyMetricUtils_1.ProxyMetricUtils.trackRefactoringProxyMetric({
            props,
            extra: {
                ...extra,
            },
        });
    }
}
exports.MoveSelectionToCommand = MoveSelectionToCommand;
//# sourceMappingURL=MoveSelectionToCommand.js.map