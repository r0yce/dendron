"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyNoteLinkCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const unified_1 = require("@dendronhq/unified");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const clientUtils_1 = require("../clientUtils");
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const utils_2 = require("../utils");
const EditorUtils_1 = require("../utils/EditorUtils");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
class CopyNoteLinkCommand extends base_1.BasicCommand {
    static requireActiveWorkspace = true;
    key = constants_1.DENDRON_COMMANDS.COPY_NOTE_LINK.key;
    extension;
    _onEngineNoteStateChangedDisposable;
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
    async getUserLinkAnchorPreference() {
        const { config } = this.extension.getDWorkspace();
        let anchorType = common_all_1.ConfigUtils.getNonNoteLinkAnchorType(config);
        if (anchorType === "prompt") {
            // The preferred anchor type is not set, so ask the user if they want line numbers or block anchors
            const preference = await vscode_1.window.showQuickPick([
                {
                    label: "block",
                    description: "Use block anchors like `^fx2d`",
                    detail: "Always links to the right place. A short text is inserted into the file.",
                },
                {
                    label: "line",
                    description: "Use line numbers `L123`",
                    detail: "Links may point to the wrong place once code is changed.",
                },
            ], {
                canPickMany: false,
                ignoreFocusOut: true,
                title: "What type of anchors should Dendron create for links in non-note files?",
            });
            // User cancelled the prompt
            if (preference?.label !== "line" && preference?.label !== "block") {
                return "line";
            }
            anchorType = preference.label;
        }
        return anchorType;
    }
    async createNonNoteFileLink(editor) {
        const { wsRoot, vaults } = this.extension.getDWorkspace();
        let { fsPath } = editor.document.uri;
        // Find it relative to wsRoot
        fsPath = path_1.default.relative(wsRoot, fsPath);
        // Check if the file is in the assets of any vault. If it is, we can shorten the link.
        for (const vault of vaults) {
            const vaultPath = path_1.default.join(common_all_1.VaultUtils.getRelPath(vault), "assets");
            if ((0, common_server_1.isInsidePath)(vaultPath, fsPath)) {
                fsPath = path_1.default.relative(common_all_1.VaultUtils.getRelPath(vault), fsPath);
                break;
            }
        }
        let anchor = "";
        // If a range is selected, then we're making a link to the start of the selected range
        if (!editor.selection.isEmpty) {
            // First check if there's already a block anchor where the user selected.
            // If there is, we'll just use the existing anchor.
            const foundAnchor = EditorUtils_1.EditorUtils.getBlockAnchorAt({
                editor,
                position: editor.selection.start,
            });
            if (foundAnchor !== undefined) {
                anchor = `#${foundAnchor}`;
            }
            else {
                // Otherwise, we need to create the correct link based on user preference.
                const anchorType = await this.getUserLinkAnchorPreference();
                if (anchorType === "line") {
                    // If the user prefers line anchors (or they cancelled the prompt), generate a line number anchor.
                    // This is used for cancelled prompts too since it's a safe operation, it won't modify the file.
                    const line = editor.selection.start.line + 1; // line anchors are 1-indexed, vscode is 0
                    anchor = `#${unified_1.AnchorUtils.anchor2string({
                        type: "line",
                        line,
                        value: line.toString(),
                    })}`;
                }
                else if (anchorType === "block") {
                    // If the user prefers block anchors, we need to add the anchor to the file first
                    const { line } = editor.selection.start;
                    const endOfSelectedLine = editor.document.lineAt(line).range.end;
                    const anchorText = unified_1.AnchorUtils.anchor2string({
                        type: "block",
                        value: (0, common_all_1.genUUIDInsecure)(),
                    });
                    anchor = `#${anchorText}`;
                    await editor.edit((builder) => {
                        builder.insert(endOfSelectedLine, ` ${anchorText}`);
                    });
                }
                else
                    (0, common_all_1.assertUnreachable)(anchorType);
            }
        }
        return { link: `[[${fsPath}${anchor}]]`, anchor };
    }
    async createNoteLink(editor, note) {
        const engine = this.extension.getEngine();
        const { selection } = vsCodeUtils_1.VSCodeUtils.getSelection();
        const { startAnchor: anchor } = await EditorUtils_1.EditorUtils.getSelectionAnchors({
            editor,
            selection,
            engine,
            doEndAnchor: false,
        });
        const config = common_server_1.DConfig.readConfigSync(engine.wsRoot);
        const aliasMode = common_all_1.ConfigUtils.getAliasMode(config);
        return {
            link: common_all_1.NoteUtils.createWikiLink({
                note,
                anchor: lodash_1.default.isUndefined(anchor)
                    ? undefined
                    : {
                        value: anchor,
                        type: (0, common_all_1.isBlockAnchor)(anchor) ? "blockAnchor" : "header",
                    },
                useVaultPrefix: clientUtils_1.DendronClientUtilsV2.shouldUseVaultPrefix(engine),
                alias: { mode: aliasMode },
            }),
            anchor,
        };
    }
    addAnalyticsPayload(_opts, resp) {
        return { type: resp?.type, anchorType: resp?.anchorType };
    }
    anchorType(anchor) {
        if (!anchor)
            return undefined;
        if ((0, common_all_1.isBlockAnchor)(anchor))
            return "block";
        if ((0, common_all_1.isLineAnchor)(anchor))
            return "line";
        else
            return "header";
    }
    async execute(_opts) {
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        const fname = common_all_1.NoteUtils.uri2Fname(editor.document.uri);
        const engine = this.extension.getEngine();
        const vault = utils_1.PickerUtilsV2.getVaultForOpenEditor();
        if (editor.document.isDirty) {
            this._onEngineNoteStateChangedDisposable = this.extension
                .getEngine()
                .engineEventEmitter.onEngineNoteStateChanged(async (noteChangeEntries) => {
                const savedNote = noteChangeEntries.filter((entry) => entry.note.fname === fname && entry.status === "update");
                // Received event from engine about successful save
                if (savedNote.length > 0) {
                    await this.executeCopyNoteLink(savedNote[0].note, editor);
                    this.dispose();
                }
            });
            await editor.document.save();
            // Dispose of listener after 1 sec (if not already disposed) in case engine events never arrive
            setTimeout(() => {
                this.dispose();
            }, 1000);
            return;
        }
        else if (this._onEngineNoteStateChangedDisposable) {
            // If this is not disposed, it means we are still listening on engine state change from previous CopyNoteLink.execute command
            // Do nothing as engine may still not be up-to-date
            return;
        }
        else {
            const note = (await engine.findNotesMeta({ fname, vault }))[0];
            return this.executeCopyNoteLink(note, editor);
        }
    }
    dispose() {
        if (this._onEngineNoteStateChangedDisposable) {
            this._onEngineNoteStateChangedDisposable.dispose();
            this._onEngineNoteStateChangedDisposable = undefined;
        }
    }
    async executeCopyNoteLink(note, editor) {
        let link;
        let type;
        let anchor;
        if (note) {
            const out = await this.createNoteLink(editor, note);
            link = out.link;
            anchor = out.anchor;
            type = "note";
        }
        else {
            const out = await this.createNonNoteFileLink(editor);
            link = out.link;
            anchor = out.anchor;
            type = "non-note";
        }
        try {
            utils_2.clipboard.writeText(link);
        }
        catch (err) {
            this.L.error({ err, link });
            throw err;
        }
        this.showFeedback(link);
        return { link, type, anchorType: this.anchorType(anchor) };
    }
}
exports.CopyNoteLinkCommand = CopyNoteLinkCommand;
//# sourceMappingURL=CopyNoteLink.js.map