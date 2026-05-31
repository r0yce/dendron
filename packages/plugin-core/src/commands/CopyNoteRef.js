"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyNoteRefCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const clientUtils_1 = require("../clientUtils");
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const utils_2 = require("../utils");
const EditorUtils_1 = require("../utils/EditorUtils");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
class CopyNoteRefCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.COPY_NOTE_REF.key;
    extension;
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
    async showFeedback(link) {
        vscode_1.window.showInformationMessage(`${link} copied`);
    }
    hasNextHeader(opts) {
        const { selection } = opts;
        const lineEndForSelection = selection.end.line;
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        const lineEndForDoc = editor.document.lineCount;
        const text = editor.document.getText(new vscode_1.Range(new vscode_1.Position(lineEndForSelection + 1, 0), new vscode_1.Position(lineEndForDoc, 0)));
        return !lodash_1.default.isNull(text.match(/^#+\s/m));
    }
    async buildLink(opts) {
        const { note, useVaultPrefix, editor } = opts;
        const { fname, vault } = note;
        const linkData = {
            type: "file",
        };
        const slugger = (0, common_all_1.getSlugger)();
        const { selection } = vsCodeUtils_1.VSCodeUtils.getSelection();
        if (selection) {
            const { startAnchor, endAnchor } = await EditorUtils_1.EditorUtils.getSelectionAnchors({
                editor,
                selection,
                engine: this.extension.getEngine(),
            });
            linkData.anchorStart = startAnchor;
            if (!lodash_1.default.isUndefined(startAnchor) && !(0, common_all_1.isBlockAnchor)(startAnchor)) {
                // if a header is selected, skip the header itself
                linkData.anchorStart = slugger.slug(startAnchor);
            }
            linkData.anchorEnd = endAnchor;
            if (!lodash_1.default.isUndefined(endAnchor) && !(0, common_all_1.isBlockAnchor)(endAnchor)) {
                linkData.anchorEnd = slugger.slug(endAnchor);
            }
        }
        const link = {
            data: linkData,
            type: "ref",
            from: {
                fname,
                vaultName: common_all_1.VaultUtils.getName(vault),
            },
        };
        const refLinkString = (0, engine_server_1.refLink2Stringv2)({
            link,
            useVaultPrefix,
            rawAnchors: true,
        });
        return refLinkString;
    }
    async execute(_opts) {
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        const fname = common_all_1.NoteUtils.uri2Fname(editor.document.uri);
        const vault = utils_1.PickerUtilsV2.getVaultForOpenEditor();
        const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const note = (await engine.findNotesMeta({ fname, vault }))[0];
        if (note) {
            const useVaultPrefix = clientUtils_1.DendronClientUtilsV2.shouldUseVaultPrefix(engine);
            const link = await this.buildLink({
                note,
                useVaultPrefix,
                editor,
            });
            try {
                utils_2.clipboard.writeText(link);
            }
            catch (err) {
                this.L.error({ err, link });
                throw err;
            }
            this.showFeedback(link);
            return link;
        }
        else {
            throw new common_all_1.DendronError({ message: `note ${fname} not found` });
        }
    }
}
exports.CopyNoteRefCommand = CopyNoteRefCommand;
//# sourceMappingURL=CopyNoteRef.js.map