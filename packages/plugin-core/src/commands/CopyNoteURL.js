"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyNoteURLCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const EditorUtils_1 = require("../utils/EditorUtils");
const vsCodeUtils_1 = require("../vsCodeUtils");
const workspace_1 = require("../workspace");
const WSUtils_1 = require("../WSUtils");
const base_1 = require("./base");
class CopyNoteURLCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.COPY_NOTE_URL.key;
    extension;
    constructor(ext) {
        super();
        this.extension = ext;
    }
    async gatherInputs() {
        return {};
    }
    async showFeedback(link) {
        vscode_1.window.showInformationMessage(`${link} copied`);
    }
    isHeader(text, selection) {
        return text.startsWith("#") && selection.start.line === selection.end.line;
    }
    async execute() {
        const { config } = this.extension.getDWorkspace();
        const publishingConfig = common_all_1.ConfigUtils.getPublishing(config);
        const urlRoot = publishingConfig.siteUrl ||
            workspace_1.DendronExtension.configuration().get(constants_1.CONFIG.COPY_NOTE_URL_ROOT?.key ?? "");
        const maybeTextEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (lodash_1.default.isUndefined(maybeTextEditor)) {
            vscode_1.window.showErrorMessage("no active document found");
            return;
        }
        const vault = WSUtils_1.WSUtils.getVaultFromDocument(maybeTextEditor.document);
        const note = await WSUtils_1.WSUtils.getNoteFromDocument(maybeTextEditor.document);
        if (lodash_1.default.isUndefined(note)) {
            vscode_1.window.showErrorMessage("You need to be in a note to use this command");
            return;
        }
        const { engine } = this.extension.getDWorkspace();
        // add the anchor if one is selected and exists
        const { selection, editor } = vsCodeUtils_1.VSCodeUtils.getSelection();
        let anchor;
        if (selection) {
            anchor = EditorUtils_1.EditorUtils.getAnchorAt({
                editor: editor,
                position: selection.start,
                engine,
            });
        }
        const link = engine_server_1.WorkspaceUtils.getNoteUrl({
            config,
            note,
            vault,
            urlRoot: urlRoot ?? undefined,
            anchor: anchor ?? undefined,
        } /* TODO: Monorepo 4-axis + exactOptionalPropertyTypes on WorkspaceUtils.getNoteUrl opts (common-server boundary); Batch 6+ debug launch sweep; see ADR 0001 */);
        this.showFeedback(link);
        utils_1.clipboard.writeText(link);
        return link;
    }
}
exports.CopyNoteURLCommand = CopyNoteURLCommand;
//# sourceMappingURL=CopyNoteURL.js.map