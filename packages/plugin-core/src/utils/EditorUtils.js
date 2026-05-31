"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorUtils = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const unified_1 = require("@dendronhq/unified");
const unist_util_visit_1 = __importDefault(require("unist-util-visit"));
const lodash_1 = __importDefault(require("lodash"));
const ExtensionProvider_1 = require("../ExtensionProvider");
const vsCodeUtils_1 = require("../vsCodeUtils");
const md_1 = require("./md");
/**
 * Utility methods that take the {@link vscode.editor} and / or its components
 * and retrieve / modify the content of it.
 *
 * If you are creating a utility that does something common when using the active text editor,
 * consider adding them here.
 */
class EditorUtils {
    /** Finds the header at the specified line, if any.
     *
     * @param editor the editor that has the document containing the header open
     * @param position the line where the header should be checked for
     * @returns the header text, or undefined if there wasn't a header
     */
    static getHeaderAt({ document, position, engine: _engine, }) {
        const line = document.lineAt(position.line);
        const headerLine = lodash_1.default.trim(line.text);
        if (headerLine.startsWith("#")) {
            const proc = unified_1.MDUtilsV5.procRemarkParseNoData({}, { dest: unified_1.DendronASTDest.MD_DENDRON });
            const parsed = proc.parse(headerLine);
            const header = (0, unified_1.select)(unified_1.DendronASTTypes.HEADING, parsed);
            if (lodash_1.default.isNull(header))
                return undefined;
            const headerText = unified_1.AnchorUtils.headerText(header);
            if (headerText.length === 0)
                return undefined;
            return headerText;
        }
        else {
            return undefined;
        }
    }
    /** Finds the block anchor at the end of the specified line, if any.
     *
     * @param editor the editor that has the document containing the anchor open
     * @param position the line where the anchor should be checked for
     * @returns the anchor (with ^), or undefined if there wasn't an anchor
     */
    static getBlockAnchorAt({ editor, position, }) {
        const line = editor.document.lineAt(position.line);
        const proc = unified_1.MDUtilsV5.procRemarkParseNoData({}, { dest: unified_1.DendronASTDest.MD_DENDRON });
        const parsed = proc.parse(lodash_1.default.trim(line.text));
        const blockAnchor = (0, unified_1.select)(unified_1.DendronASTTypes.BLOCK_ANCHOR, parsed);
        if (lodash_1.default.isNull(blockAnchor) || !blockAnchor.id)
            return undefined;
        return `^${blockAnchor.id}`;
    }
    /** Add a block anchor at the end of the specified line. The anchor is randomly generated if not supplied.
     *
     * If there is already an anchor at the end of this line, then this function doesn't actually insert an anchor but returns that anchor instead.
     *
     * @param editBuilder parameter of the callback in `editor.edit`
     * @param editor the editor that the editBuilder belongs to
     * @param position the line where the anchor will be inserted
     * @param anchor anchor id to insert (without ^), randomly generated if undefined
     * @returns the anchor that has been added (with ^)
     */
    static addOrGetAnchorAt(opts) {
        const { editBuilder, editor, position } = opts;
        let { anchor } = opts;
        const line = editor.document.lineAt(position.line);
        const existingAnchor = EditorUtils.getAnchorAt(opts);
        if (!lodash_1.default.isUndefined(existingAnchor))
            return existingAnchor;
        if (lodash_1.default.isUndefined(anchor))
            anchor = (0, common_all_1.genUUIDInsecure)();
        editBuilder.insert(line.range.end, ` ^${anchor}`);
        return `^${anchor}`;
    }
    /** Finds the header or block anchor at the end of the specified line, if any.
     *
     * @param editor the editor that has the document containing the anchor open
     * @param position the line where the anchor should be checked for
     * @returns the anchor (with ^), or undefined if there wasn't an anchor
     */
    static getAnchorAt(args) {
        const { editor } = args;
        return (EditorUtils.getHeaderAt({ document: editor.document, ...args }) ||
            EditorUtils.getBlockAnchorAt(args));
    }
    static async getSelectionAnchors(opts) {
        const { editor, selection, doStartAnchor, doEndAnchor, engine } = lodash_1.default.defaults(opts, { doStartAnchor: true, doEndAnchor: true });
        if (lodash_1.default.isUndefined(selection))
            return {};
        const { start, end } = selection;
        // first check if there's an existing anchor
        let startAnchor = doStartAnchor
            ? EditorUtils.getAnchorAt({ editor, position: start, engine })
            : undefined;
        // does the user have only a single
        const singleLine = 
        // single line selected
        start.line === end.line ||
            // the first line selected in full, nothing on second line (default behavior when double clicking on a line)
            (start.line + 1 === end.line && end.character === 0);
        // does the user have any amount of text selected?
        const hasSelectedRegion = start.line !== end.line || start.character !== end.character;
        // first check if there's an existing anchor
        let endAnchor;
        if (!singleLine && doEndAnchor)
            endAnchor = EditorUtils.getAnchorAt({ editor, position: end, engine });
        // if we found both anchors already, just return them.
        if (!lodash_1.default.isUndefined(startAnchor) && !lodash_1.default.isUndefined(endAnchor))
            return { startAnchor, endAnchor };
        // otherwise, we'll need to edit the document to insert block anchors
        await editor.edit((editBuilder) => {
            if (lodash_1.default.isUndefined(startAnchor) && doStartAnchor && hasSelectedRegion)
                startAnchor = EditorUtils.addOrGetAnchorAt({
                    editBuilder,
                    editor,
                    position: start,
                    engine,
                });
            if (lodash_1.default.isUndefined(endAnchor) && doEndAnchor && !singleLine)
                endAnchor = EditorUtils.addOrGetAnchorAt({
                    editBuilder,
                    editor,
                    position: end,
                    engine,
                });
        });
        return { startAnchor, endAnchor };
    }
    /**
     * Utility method to check if the selected text is a broken wikilink
     */
    static async isBrokenWikilink({ editor, selection, note, engine, }) {
        const line = editor.document.lineAt(selection.start.line).text;
        const proc = unified_1.MDUtilsV5.procRemarkParse({ mode: unified_1.ProcMode.FULL }, {
            noteToRender: note,
            dest: unified_1.DendronASTDest.MD_DENDRON,
            vault: note.vault,
            fname: note.fname,
            config: common_server_1.DConfig.readConfigSync(engine.wsRoot),
        });
        const parsedLine = proc.parse(line);
        let link;
        let type;
        let fname;
        await unified_1.MdastUtils.visitAsync(parsedLine, [
            unified_1.DendronASTTypes.WIKI_LINK,
            unified_1.DendronASTTypes.USERTAG,
            unified_1.DendronASTTypes.HASHTAG,
        ], async (linkvalue) => {
            link = linkvalue;
            if (!link)
                return false;
            fname =
                link.type === unified_1.DendronASTTypes.WIKI_LINK ? link.value : link.fname;
            type = (await (0, unified_1.linkedNoteType)({ fname, engine, vaults: engine.vaults }))
                .type;
            return false;
        });
        return type === common_all_1.DECORATION_TYPES.brokenWikilink;
    }
    /**
     * NOTE: this method requires that `ExtensionProvider` be available and can provide a workspace
     */
    static async getLinkFromSelectionWithWorkspace() {
        const { selection, editor } = vsCodeUtils_1.VSCodeUtils.getSelection();
        // can't just collapse to `selection?.start !== undefined`
        // because typescript compiler complains that selection might be undefined otherwise inside of the if block
        if (lodash_1.default.isEmpty(selection) ||
            lodash_1.default.isUndefined(selection) ||
            lodash_1.default.isUndefined(selection.start) ||
            !editor)
            return;
        const currentLine = editor.document.lineAt(selection.start.line).text;
        if (!currentLine)
            return;
        const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const reference = await (0, md_1.getReferenceAtPosition)({
            document: editor.document,
            position: selection.start,
            opts: { allowInCodeBlocks: true },
            wsRoot,
            vaults,
        });
        if (!reference)
            return;
        return {
            alias: reference.label,
            value: reference.ref,
            vaultName: reference.vaultName,
            anchorHeader: reference.anchorStart,
        };
    }
    /**
     * Given a document, get the end position of the frontmatter
     * if zeroIndex is true, the document's first line is 0
     * otherwise, it is 1 (default)
     */
    static getFrontmatterPosition(opts) {
        const { document, zeroIndex } = opts;
        return new Promise((resolve) => {
            const proc = unified_1.MDUtilsV5.procRemarkParseNoData({}, { dest: unified_1.DendronASTDest.MD_DENDRON });
            const parsed = proc.parse(document.getText());
            (0, unist_util_visit_1.default)(parsed, ["yaml"], (node) => {
                if (lodash_1.default.isUndefined(node.position))
                    return resolve(false); // Should never happen
                const offset = zeroIndex ? undefined : { line: 1 };
                const position = vsCodeUtils_1.VSCodeUtils.point2VSCodePosition(node.position.end, offset);
                resolve(position);
            });
        });
    }
    /**
     * Given a text editor, determine if any of the selection
     * contains part of the frontmatter.
     * if given editor holds a document that doesn't have frontmatter,
     * it will throw an error
     */
    static async selectionContainsFrontmatter(opts) {
        const { editor } = opts;
        const { document, selections } = editor;
        const frontmatterEndPosition = await EditorUtils.getFrontmatterPosition({
            document,
            zeroIndex: true,
        });
        if (frontmatterEndPosition) {
            return selections.some((selection) => {
                const out = selection.start.compareTo(frontmatterEndPosition);
                return out < 1;
            });
        }
        else {
            throw new common_all_1.DendronError({ message: "Note a note." });
        }
    }
}
exports.EditorUtils = EditorUtils;
//# sourceMappingURL=EditorUtils.js.map