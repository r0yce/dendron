"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeNote = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = __importDefault(require("vscode"));
const vscode_uri_1 = require("vscode-uri");
const constants_1 = require("../../../constants");
/**
 * Contains {@link NoteProps} representing a single Tree Item inside the
 * NativeTreeView
 */
class TreeNote extends vscode_1.default.TreeItem {
    id;
    note;
    uri;
    _labelType;
    get labelType() {
        return this._labelType;
    }
    set labelType(value) {
        if (value !== this._labelType) {
            this._labelType = value;
            const label = this._labelType === common_all_1.TreeViewItemLabelTypeEnum.filename
                ? lodash_1.default.last(this.note.fname.split("."))
                : this.note.title;
            this.label = common_all_1.DNodeUtils.isRoot(this.note)
                ? `root (${common_all_1.VaultUtils.getName(this.note.vault)})`
                : label;
        }
    }
    constructor(wsRoot, { note, collapsibleState, labelType, }) {
        super(common_all_1.DNodeUtils.basename(note.fname, true), collapsibleState);
        this.note = note;
        this.id = this.note.id;
        this.tooltip = this.note.title;
        this.contextValue = this.note.stub ? "stub" : "note";
        const vaultPath = (0, common_all_1.vault2Path)({
            vault: this.note.vault,
            wsRoot,
        });
        this.uri = vscode_uri_1.Utils.joinPath(vaultPath, this.note.fname + ".md");
        // Invoke the setter logic during setup:
        this.labelType = labelType;
        // TODO: Need to replace with go-to note if we want parity with local ext.
        // This will not create a new note right now if you click on a 'stub' but
        // will show an error page
        if (note.stub) {
            this.command = {
                command: constants_1.DENDRON_COMMANDS.TREEVIEW_EXPAND_STUB.key,
                title: "",
                arguments: [this.note.id],
            };
        }
        else {
            this.command = {
                command: "vscode.open",
                title: "",
                arguments: [this.uri],
            };
        }
    }
}
exports.TreeNote = TreeNote;
//# sourceMappingURL=TreeNote.js.map