"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStatusCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const constants_1 = require("../constants");
const base_1 = require("./base");
const vsCodeUtils_1 = require("../vsCodeUtils");
const EditorUtils_1 = require("../utils/EditorUtils");
const windowDecorations_1 = require("../features/windowDecorations");
class TaskStatusCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.TASK_SET_STATUS.key;
    static requireActiveWorkspace = true;
    _ext;
    constructor(extension) {
        super();
        this._ext = extension;
    }
    async gatherInputs(opts) {
        const selection = await EditorUtils_1.EditorUtils.getLinkFromSelectionWithWorkspace();
        let selectedNote;
        if (!selection) {
            // Then they are changing the status for the current note
            selectedNote = await this._ext.wsUtils.getActiveNote();
            if (!selectedNote || !common_all_1.TaskNoteUtils.isTaskNote(selectedNote)) {
                // No active note either
                vsCodeUtils_1.VSCodeUtils.showMessage(vsCodeUtils_1.MessageSeverity.WARN, "Please open a task note, or select a link to a task note before using this command.", {});
                return;
            }
        }
        else {
            const engine = this._ext.getDWorkspace().engine;
            const vault = selection.vaultName
                ? common_all_1.VaultUtils.getVaultByName({
                    vaults: this._ext.getDWorkspace().vaults,
                    vname: selection.vaultName,
                })
                : undefined;
            if (!selectedNote) {
                const notes = await engine.findNotes({ fname: selection.value, vault });
                if (notes.length === 0) {
                    vsCodeUtils_1.VSCodeUtils.showMessage(vsCodeUtils_1.MessageSeverity.WARN, `Linked note ${selection.value} is not found, make sure the note exists first.`, {});
                    return;
                }
                else if (notes.length > 1) {
                    const picked = await vsCodeUtils_1.VSCodeUtils.showQuickPick(notes.map((note) => {
                        return {
                            label: note.title,
                            description: common_all_1.VaultUtils.getName(note.vault),
                            detail: note.vault.fsPath,
                        };
                    }), {
                        canPickMany: false,
                        ignoreFocusOut: true,
                        matchOnDescription: true,
                        title: "Multiple notes match selected link, please pick one",
                    });
                    if (!picked) {
                        // Cancelled prompt
                        return;
                    }
                    const pickedNote = notes.find((note) => note.vault.fsPath === picked.detail);
                    if (!pickedNote) {
                        throw new common_all_1.DendronError({
                            message: "Can't find selected note",
                            payload: {
                                notes,
                                picked,
                            },
                        });
                    }
                    selectedNote = pickedNote;
                }
                else {
                    selectedNote = notes[0];
                }
            }
        }
        let setStatus = opts?.setStatus;
        if (!setStatus) {
            // If no status has been provided already (e.g. a custom shortcut),
            // then prompt for the status
            const currentStatus = selectedNote.custom?.status;
            const knownStatuses = Object.entries(common_all_1.ConfigUtils.getTask(this._ext.getDWorkspace().config).statusSymbols).filter(([key, value]) => 
            // Don't suggest the current status as an option
            key !== currentStatus && value !== currentStatus);
            const pickedStatus = await vsCodeUtils_1.VSCodeUtils.showQuickPick(knownStatuses.map(([key, value]) => {
                return {
                    label: key,
                    description: value,
                };
            }), {
                canPickMany: false,
                ignoreFocusOut: true,
                matchOnDescription: true,
                title: `Pick the new status for "${selectedNote.title}"`,
            });
            if (!pickedStatus) {
                // Prompt cancelled, do not change task status
                return;
            }
            setStatus = pickedStatus.label;
        }
        return {
            note: selectedNote,
            setStatus,
        };
    }
    async execute(opts) {
        opts.note.custom = {
            ...opts.note.custom,
            status: opts.setStatus,
        };
        await this._ext.getEngine().writeNote(opts.note);
        (0, windowDecorations_1.delayedUpdateDecorations)();
        return {};
    }
}
exports.TaskStatusCommand = TaskStatusCommand;
//# sourceMappingURL=TaskStatus.js.map