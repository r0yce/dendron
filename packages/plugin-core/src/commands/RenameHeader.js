"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenameHeaderCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const unified_1 = require("@dendronhq/unified");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const windowDecorations_1 = require("../features/windowDecorations");
const vsCodeUtils_1 = require("../vsCodeUtils");
const analytics_1 = require("../utils/analytics");
const base_1 = require("./base");
const ProxyMetricUtils_1 = require("../utils/ProxyMetricUtils");
class RenameHeaderCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.RENAME_HEADER.key;
    extension;
    constructor(ext) {
        super();
        this.extension = ext;
    }
    async gatherInputs(opts) {
        let { oldHeader, newHeader, source } = opts || {};
        const { editor, selection } = vsCodeUtils_1.VSCodeUtils.getSelection();
        const { wsUtils } = this.extension;
        const note = await wsUtils.getActiveNote();
        if (lodash_1.default.isUndefined(note)) {
            throw new common_all_1.DendronError({
                message: "You must first open a note to rename a header.",
            });
        }
        if (lodash_1.default.isUndefined(oldHeader)) {
            // parse from current selection
            if (!editor || !selection)
                throw new common_all_1.DendronError({
                    message: "You must first select the header you want to rename.",
                });
            const line = editor.document.lineAt(selection.start.line).text;
            const proc = unified_1.MDUtilsV5.procRemarkParseNoData({}, { dest: unified_1.DendronASTDest.MD_DENDRON });
            const parsedLine = proc.parse(line);
            let header;
            (0, unified_1.visit)(parsedLine, [unified_1.DendronASTTypes.HEADING], (heading) => {
                header = heading;
                return false; // There can only be one header in a line
            });
            if (!header)
                throw new common_all_1.DendronError({
                    message: "You must first select the header you want to rename.",
                });
            const range = vsCodeUtils_1.VSCodeUtils.position2VSCodeRange(unified_1.AnchorUtils.headerTextPosition(header), { line: selection.start.line });
            const text = unified_1.AnchorUtils.headerText(header);
            oldHeader = { text, range };
        }
        if (lodash_1.default.isUndefined(newHeader)) {
            // prompt from the user
            newHeader = await vscode_1.window.showInputBox({
                ignoreFocusOut: true,
                placeHolder: "Header text here",
                title: "Rename Header",
                prompt: "Enter the new header text",
                value: oldHeader.text,
            });
            if (!newHeader)
                return; // User cancelled the prompt
        }
        if (lodash_1.default.isUndefined(source)) {
            source = "command palette";
        }
        return {
            oldHeader,
            newHeader,
            source,
            note,
        };
    }
    async execute(opts) {
        const { oldHeader, newHeader } = opts || {};
        const ctx = "RenameHeaderCommand";
        this.L.info({ ctx, oldHeader, newHeader, msg: "enter" });
        const engine = this.extension.getEngine();
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (lodash_1.default.isUndefined(newHeader) || lodash_1.default.isUndefined(oldHeader) || !editor)
            return;
        const note = await this.extension.wsUtils.getNoteFromDocument(editor.document);
        if (!note)
            return;
        const noteLoc = {
            fname: note.fname,
            vaultName: common_all_1.VaultUtils.getName(note?.vault),
        };
        const slugger = (0, common_all_1.getSlugger)();
        await editor.edit((editBuilder) => {
            editBuilder.replace(oldHeader.range, newHeader);
        });
        // Parse the new header and extract the text again. This allows us to correctly handle things like wikilinks embedded in the new header.
        let newAnchorHeader = newHeader;
        const proc = unified_1.MDUtilsV5.procRemarkParseNoData({}, { dest: unified_1.DendronASTDest.MD_DENDRON });
        const parsed = proc.parse(`## ${newHeader}`);
        (0, unified_1.visit)(parsed, [unified_1.DendronASTTypes.HEADING], (node) => {
            newAnchorHeader = unified_1.AnchorUtils.headerText(node);
        });
        // Save the updated header, so that same file links update correctly with `renameNote` which reads the files.
        await editor.document.save();
        // This doesn't update the decorations for some reason, we need to update them to get any same-file decorations updated
        (0, windowDecorations_1.delayedUpdateDecorations)();
        const out = await engine.renameNote({
            oldLoc: {
                ...noteLoc,
                anchorHeader: slugger.slug(oldHeader.text),
                alias: oldHeader.text,
            },
            newLoc: {
                ...noteLoc,
                anchorHeader: slugger.slug(newAnchorHeader),
                alias: newAnchorHeader,
            },
            metaOnly: true,
        });
        return out;
    }
    trackProxyMetrics({ opts, noteChangeEntryCounts, }) {
        if (lodash_1.default.isUndefined(opts)) {
            return;
        }
        const { note } = opts;
        if (lodash_1.default.isUndefined(note)) {
            return;
        }
        const engine = this.extension.getEngine();
        const { vaults } = engine;
        ProxyMetricUtils_1.ProxyMetricUtils.trackRefactoringProxyMetric({
            props: {
                command: this.key,
                numVaults: vaults.length,
                traits: note.traits || [],
                numChildren: note.children.length,
                numLinks: note.links.length,
                numChars: note.body.length,
                noteDepth: common_all_1.DNodeUtils.getDepth(note),
            },
            extra: {
                ...noteChangeEntryCounts,
            },
        });
    }
    addAnalyticsPayload(opts, out) {
        const noteChangeEntryCounts = out?.data !== undefined
            ? { ...(0, common_all_1.extractNoteChangeEntryCounts)(out.data) }
            : {
                createdCount: 0,
                updatedCount: 0,
                deletedCount: 0,
            };
        try {
            this.trackProxyMetrics({ opts, noteChangeEntryCounts });
        }
        catch (error) {
            this.L.error({ error });
        }
        return {
            ...noteChangeEntryCounts,
            ...(0, analytics_1.getAnalyticsPayload)(opts?.source),
        };
    }
}
exports.RenameHeaderCommand = RenameHeaderCommand;
//# sourceMappingURL=RenameHeader.js.map