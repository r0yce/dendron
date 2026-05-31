"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decorateTaskNote = decorateTaskNote;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const utils_1 = require("./utils");
/** Decorates the note `fname` in vault `vaultName` if the note is a task note. */
async function decorateTaskNote({ engine, range, fname, vaultName, config, }) {
    const taskConfig = common_all_1.ConfigUtils.getTask(config);
    const vault = vaultName && config.workspace.vaults
        ? common_all_1.VaultUtils.getVaultByName({
            vname: vaultName,
            vaults: config.workspace.vaults,
        })
        : undefined;
    const note = (await engine.findNotesMeta({ fname, vault }))[0];
    if (!note || !common_all_1.TaskNoteUtils.isTaskNote(note))
        return;
    // Determines whether the task link is preceded by an empty or full checkbox
    const status = common_all_1.TaskNoteUtils.getStatusSymbol({ note, taskConfig });
    const { due, owner, priority } = note.custom;
    const decorationString = [];
    if (due)
        decorationString.push(`due:${due}`);
    if (owner)
        decorationString.push(`@${owner}`);
    if (priority) {
        const prioritySymbol = common_all_1.TaskNoteUtils.getPrioritySymbol({
            note,
            taskConfig,
        });
        if (prioritySymbol)
            decorationString.push(`priority:${prioritySymbol}`);
    }
    if (note.tags) {
        const tags = lodash_1.default.isString(note.tags) ? [note.tags] : note.tags;
        decorationString.push(...tags.map((tag) => `#${tag}`));
    }
    const decoration = {
        type: utils_1.DECORATION_TYPES.taskNote,
        range,
        beforeText: status ? `${status} ` : undefined,
        afterText: decorationString.length > 0
            ? ` ${decorationString.join(" ")}`
            : undefined,
    };
    return decoration;
}
//# sourceMappingURL=taskNotes.js.map