"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoToSiblingCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const utils_1 = require("../components/lookup/utils");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const vsCodeUtils_1 = require("../vsCodeUtils");
const WSUtilsV2_1 = require("../WSUtilsV2");
const base_1 = require("./base");
class GoToSiblingCommand extends base_1.BasicCommand {
    key = "dendron.goToSibling";
    async gatherInputs() {
        return {};
    }
    async execute(opts) {
        const ctx = "GoToSiblingCommand";
        // check if editor exists
        const textEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (!textEditor) {
            vscode_1.window.showErrorMessage("You need to be in a note to use this command");
            return {
                msg: "no_editor",
            };
        }
        const fname = path_1.default.basename(textEditor.document.uri.fsPath, ".md");
        const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
        const workspace = ext.getDWorkspace();
        const note = await this.getActiveNote(workspace.engine, fname);
        // check if a Dendron note is active
        if (!note) {
            vscode_1.window.showErrorMessage("Please open a Dendron note to use this command");
            return {
                msg: "other_error",
            };
        }
        let siblingNote;
        // If the active note is a journal note, get the sibling note based on the chronological order
        if (await this.canBeHandledAsJournalNote(note, workspace.wsRoot)) {
            const resp = await this.getSiblingForJournalNote(workspace.engine, note, opts.direction);
            if (resp.error) {
                vsCodeUtils_1.VSCodeUtils.showMessage(vsCodeUtils_1.MessageSeverity.WARN, resp.error.message, {});
                return { msg: "other_error" };
            }
            siblingNote = resp.data.sibling;
        }
        else {
            const resp = await this.getSibling(workspace, note, opts.direction, ctx);
            if (resp.error) {
                vsCodeUtils_1.VSCodeUtils.showMessage(vsCodeUtils_1.MessageSeverity.WARN, resp.error.message, {});
                return { msg: "other_error" };
            }
            siblingNote = resp.data.sibling;
        }
        await new WSUtilsV2_1.WSUtilsV2(ext).openNote(siblingNote);
        return { msg: "ok" };
    }
    async getActiveNote(engine, fname) {
        const vault = utils_1.PickerUtilsV2.getVaultForOpenEditor();
        const hitNotes = await engine.findNotesMeta({ fname, vault });
        return hitNotes.length !== 0 ? hitNotes[0] : null;
    }
    async canBeHandledAsJournalNote(note, wsRoot) {
        const markedAsJournalNote = common_all_1.NoteUtils.getNoteTraits(note).includes("journalNote");
        if (!markedAsJournalNote)
            return false;
        // Check the date format for journal note. Only when date format of journal notes is default,
        // navigate chronologically
        const config = common_server_1.DConfig.readConfigSync(wsRoot);
        const dateFormat = config.workspace.journal.dateFormat;
        return dateFormat === "y.MM.dd";
    }
    async getSiblingForJournalNote(engine, currNote, direction) {
        const journalNotes = await this.getSiblingsForJournalNote(engine, currNote);
        // If the active note is the only journal note in the workspace, there is no sibling
        if (journalNotes.length === 1) {
            return {
                error: {
                    name: "no_siblings",
                    message: "There is no sibling journal note. Currently open note is the only journal note in the current workspace",
                },
            };
        }
        // Sort all journal notes in the workspace
        const sortedJournalNotes = lodash_1.default.sortBy(journalNotes, [
            (note) => this.getDateFromJournalNote(note).valueOf(),
        ]);
        const currNoteIdx = lodash_1.default.findIndex(sortedJournalNotes, { id: currNote.id });
        // Get the sibling based on the direction.
        let sibling;
        if (direction === "next") {
            sibling =
                currNoteIdx !== sortedJournalNotes.length - 1
                    ? sortedJournalNotes[currNoteIdx + 1]
                    : // If current note is the latest journal note, get the earliest note as the sibling
                        sortedJournalNotes[0];
        }
        else {
            sibling =
                currNoteIdx !== 0
                    ? sortedJournalNotes[currNoteIdx - 1]
                    : // If current note is the earliest journal note, get the last note as the sibling
                        lodash_1.default.last(sortedJournalNotes);
        }
        return { data: { sibling } };
    }
    getSiblingsForJournalNote = async (engine, currNote) => {
        if (!currNote.parent) {
            return [];
        }
        const monthNote = await engine.getNoteMeta(currNote.parent);
        if (!monthNote.data) {
            return [];
        }
        if (!monthNote.data.parent) {
            return [];
        }
        const yearNote = await engine.getNoteMeta(monthNote.data.parent);
        if (!yearNote.data) {
            return [];
        }
        if (!yearNote.data.parent) {
            return [];
        }
        const parentNote = await engine.getNoteMeta(yearNote.data.parent);
        if (!parentNote.data) {
            return [];
        }
        const siblings = await Promise.all(parentNote.data.children.flatMap(async (yearNoteId) => {
            const yearNote = await engine.getNoteMeta(yearNoteId);
            if (yearNote.data) {
                const children = await engine.bulkGetNotesMeta(yearNote.data.children);
                const results = await Promise.all(children.data.flatMap(async (monthNote) => {
                    const monthChildren = await engine.bulkGetNotesMeta(monthNote.children);
                    return monthChildren.data;
                }));
                return results.flat();
            }
            else {
                return [];
            }
        }));
        // Filter out stub notes
        return siblings.flat().filter((note) => !note.stub);
    };
    async getSibling(workspace, note, direction, ctx) {
        // Get sibling notes
        const siblingNotes = await this.getSiblings(workspace.engine, note);
        // Check if there is any sibling notes
        if (siblingNotes.length <= 1) {
            return {
                error: {
                    name: "no_siblings",
                    message: "One is the loneliest number. This node has no siblings :(",
                },
            };
        }
        // Sort the sibling notes
        const sortedSiblingNotes = this.sortNotes(siblingNotes);
        // Get the index of the active note in the sorted notes
        const idx = lodash_1.default.findIndex(sortedSiblingNotes, { id: note.id });
        // Deal with the unexpected error
        if (idx < 0) {
            throw new Error(`${ctx}: ${logger_1.UNKNOWN_ERROR_MSG}`);
        }
        // Get sibling based on the direction
        let sibling;
        if (direction === "next") {
            sibling =
                idx !== siblingNotes.length - 1
                    ? sortedSiblingNotes[idx + 1]
                    : sortedSiblingNotes[0];
        }
        else {
            sibling =
                idx !== 0 ? sortedSiblingNotes[idx - 1] : lodash_1.default.last(sortedSiblingNotes);
        }
        return { data: { sibling } };
    }
    async getSiblings(engine, currNote) {
        if (currNote.parent === null) {
            const children = await engine.bulkGetNotesMeta(currNote.children);
            return children.data.filter((note) => !note.stub).concat(currNote);
        }
        else {
            const parent = await engine.getNoteMeta(currNote.parent);
            if (parent.data) {
                const children = await engine.bulkGetNotesMeta(parent.data.children);
                return children.data.filter((note) => !note.stub);
            }
            else {
                return [];
            }
        }
    }
    sortNotes(notes) {
        // check if there are numeric-only nodes
        const numericNodes = lodash_1.default.filter(notes, (o) => {
            const leafName = common_all_1.DNodeUtils.getLeafName(o);
            return (0, common_all_1.isNumeric)(leafName);
        });
        // determine how much we want to zero-pad the numeric-only node names
        let padLength = 0;
        if (numericNodes.length > 0) {
            const sortedNumericNodes = lodash_1.default.orderBy(numericNodes, (o) => {
                return common_all_1.DNodeUtils.getLeafName(o).length;
            }, "desc");
            padLength = sortedNumericNodes[0].fname.length;
        }
        // zero-pad numeric-only nodes before sorting
        return lodash_1.default.sortBy(notes, (o) => {
            const leafName = common_all_1.DNodeUtils.getLeafName(o);
            if ((0, common_all_1.isNumeric)(leafName)) {
                return lodash_1.default.padStart(leafName, padLength, "0");
            }
            return leafName;
        });
    }
    getDateFromJournalNote(note) {
        const [year, month, date] = note.fname
            .split("")
            .slice(-3)
            .map((str) => parseInt(str, 10));
        return new Date(year, month - 1, date);
    }
}
exports.GoToSiblingCommand = GoToSiblingCommand;
//# sourceMappingURL=GoToSiblingCommand.js.map