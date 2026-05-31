"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomNoteCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
class RandomNoteCommand extends base_1.BasicCommand {
    _ext;
    key = constants_1.DENDRON_COMMANDS.RANDOM_NOTE.key;
    constructor(_ext) {
        super();
        this._ext = _ext;
    }
    async gatherInputs() {
        return {};
    }
    async execute(_opts) {
        const { engine, config } = this._ext.getDWorkspace();
        // If no pattern is specified for include, then include all notes for the search set.
        const randomNoteConfig = common_all_1.ConfigUtils.getCommands(config).randomNote;
        const includeSet = randomNoteConfig.include ?? [""];
        const searchPredicate = function (note) {
            if (note.stub === true) {
                return false;
            }
            let isMatch = false;
            // eslint-disable-next-line no-restricted-syntax
            for (const pattern of includeSet) {
                if (note.fname.toLowerCase().startsWith(pattern.toLowerCase())) {
                    isMatch = true;
                    break;
                }
            }
            // Remove Exclude Paths, if specified:
            if (randomNoteConfig.exclude) {
                // eslint-disable-next-line no-restricted-syntax
                for (const pattern of randomNoteConfig.exclude) {
                    if (note.fname.toLowerCase().startsWith(pattern.toLowerCase())) {
                        isMatch = false;
                        break;
                    }
                }
            }
            return isMatch;
        };
        // TODO: Potentially expensive call. Consider deferring to engine
        const notesToPick = await engine.findNotesMeta({ excludeStub: true });
        const noteSet = lodash_1.default.filter(notesToPick, (ent) => searchPredicate(ent));
        const noteCount = noteSet.length;
        if (noteCount === 0) {
            vscode_1.window.showInformationMessage("No notes match the search pattern. Adjust the patterns with the Dendron:Configure (yaml) command");
            return;
        }
        const index = Math.floor(Math.random() * noteCount);
        const note = noteSet[index];
        const npath = common_all_1.NoteUtils.getFullPath({
            note,
            wsRoot: engine.wsRoot,
        });
        const uri = vscode_1.Uri.file(npath);
        await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri);
        return note;
    }
}
exports.RandomNoteCommand = RandomNoteCommand;
//# sourceMappingURL=RandomNote.js.map