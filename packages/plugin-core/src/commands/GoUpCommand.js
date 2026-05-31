"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoUpCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
class GoUpCommand extends base_1.BasicCommand {
    _ext;
    constructor(_ext) {
        super();
        this._ext = _ext;
    }
    key = constants_1.DENDRON_COMMANDS.GO_UP_HIERARCHY.key;
    async gatherInputs() {
        return {};
    }
    async execute() {
        const maybeTextEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (lodash_1.default.isUndefined(maybeTextEditor)) {
            vscode_1.window.showErrorMessage("no active document found");
            return;
        }
        const engine = this._ext.getEngine();
        const nparent = await common_all_1.DNodeUtils.findClosestParentWithEngine(path_1.default.basename(maybeTextEditor.document.uri.fsPath, ".md"), engine, {
            excludeStub: true,
            vault: utils_1.PickerUtilsV2.getVaultForOpenEditor(),
        });
        const nppath = common_all_1.NoteUtils.getFullPath({
            note: nparent,
            wsRoot: this._ext.getDWorkspace().wsRoot,
        });
        await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode_1.Uri.file(nppath));
        return;
    }
}
exports.GoUpCommand = GoUpCommand;
//# sourceMappingURL=GoUpCommand.js.map