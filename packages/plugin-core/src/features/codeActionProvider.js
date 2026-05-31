"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refactorProvider = exports.doctorFrontmatterProvider = exports.codeActionProvider = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const unified_1 = require("@dendronhq/unified");
const is_url_1 = __importDefault(require("is-url"));
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const CopyNoteRef_1 = require("../commands/CopyNoteRef");
const Doctor_1 = require("../commands/Doctor");
const GotoNote_1 = require("../commands/GotoNote");
const NoteLookupCommand_1 = require("../commands/NoteLookupCommand");
const PasteLink_1 = require("../commands/PasteLink");
const RenameHeader_1 = require("../commands/RenameHeader");
const ExtensionProvider_1 = require("../ExtensionProvider");
const analytics_1 = require("../utils/analytics");
const EditorUtils_1 = require("../utils/EditorUtils");
const vsCodeUtils_1 = require("../vsCodeUtils");
const workspace_1 = require("../workspace");
const WSUtilsV2_1 = require("../WSUtilsV2");
function activate(context) {
    context.subscriptions.push(vscode_1.languages.registerCodeActionsProvider("markdown", exports.doctorFrontmatterProvider), vscode_1.languages.registerCodeActionsProvider("markdown", exports.refactorProvider));
}
exports.codeActionProvider = {
    activate,
};
exports.doctorFrontmatterProvider = {
    provideCodeActions: (0, analytics_1.sentryReportingCallback)((_document, _range, context, _token) => {
        // No-op if we're not in a Dendron Workspace
        if (!workspace_1.DendronExtension.isActive()) {
            return;
        }
        // Only provide fix frontmatter action if the diagnostic is correct
        const diagnostics = context.diagnostics.filter((item) => item.code === unified_1.BAD_FRONTMATTER_CODE);
        if (diagnostics.length !== 0) {
            const action = {
                title: "Fix the frontmatter",
                diagnostics,
                isPreferred: true,
                kind: vscode_1.CodeActionKind.QuickFix,
                command: {
                    command: new Doctor_1.DoctorCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).key,
                    title: "Fix the frontmatter",
                    arguments: [
                        { scope: "file", action: engine_server_1.DoctorActionsEnum.FIX_FRONTMATTER },
                    ],
                },
            };
            return [action];
        }
        return undefined;
    }),
};
/**
 * Code Action Provider for Refactor.
 * 1. Refactor Code Action for Rename Header
 * 2. Refactor Code Action for Broken Wikilinks
 * 3. Refactor Extract for highlighted text
 * (Similar to the current functionality of creating a new note in 'Selection Extract' mode)
 */
exports.refactorProvider = {
    provideCodeActions: (0, analytics_1.sentryReportingCallback)(async (_document, _range, _context, _token) => {
        // No-op if we're not in a Dendron Workspace
        const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
        if (!(await ext.isActiveAndIsDendronNote(_document.uri.fsPath))) {
            return;
        }
        const { editor, selection, text } = vsCodeUtils_1.VSCodeUtils.getSelection();
        if (!editor || !selection)
            return;
        const header = EditorUtils_1.EditorUtils.getHeaderAt({
            document: editor.document,
            position: selection.start,
        });
        // action declaration
        const renameHeaderAction = {
            title: "Rename Header",
            isPreferred: true,
            kind: vscode_1.CodeActionKind.RefactorInline,
            command: {
                command: new RenameHeader_1.RenameHeaderCommand(ExtensionProvider_1.ExtensionProvider.getExtension())
                    .key,
                title: "Rename Header",
                arguments: [{ source: common_all_1.ContextualUIEvents.ContextualUICodeAction }],
            },
        };
        const brokenWikilinkAction = {
            title: "Add missing note for wikilink declaration",
            isPreferred: true,
            kind: vscode_1.CodeActionKind.RefactorExtract,
            command: {
                command: new GotoNote_1.GotoNoteCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).key,
                title: "Add missing note for wikilink declaration",
                arguments: [{ source: common_all_1.ContextualUIEvents.ContextualUICodeAction }],
            },
        };
        const createNewNoteAction = {
            title: "Extract text to new note",
            isPreferred: true,
            kind: vscode_1.CodeActionKind.RefactorExtract,
            command: {
                command: new NoteLookupCommand_1.NoteLookupCommand().key,
                title: "Extract text to new note",
                arguments: [
                    {
                        selectionType: common_all_1.LookupSelectionTypeEnum.selectionExtract,
                        source: common_all_1.ContextualUIEvents.ContextualUICodeAction,
                    },
                ],
            },
        };
        const copyHeaderRefAction = {
            title: "Copy Header Reference",
            isPreferred: true,
            kind: vscode_1.CodeActionKind.RefactorInline,
            command: {
                command: new CopyNoteRef_1.CopyNoteRefCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).key,
                title: "Copy Header Reference",
                arguments: [{ source: common_all_1.ContextualUIEvents.ContextualUICodeAction }],
            },
        };
        const WrapAsMarkdownLink = {
            title: "Wrap as Markdown Link",
            isPreferred: true,
            kind: vscode_1.CodeActionKind.RefactorInline,
            command: {
                command: new PasteLink_1.PasteLinkCommand().key,
                title: "Wrap as Markdown Link",
                arguments: [
                    {
                        source: common_all_1.ContextualUIEvents.ContextualUICodeAction,
                        link: text,
                        selection,
                    },
                ],
            },
        };
        if (_range.isEmpty) {
            const { engine } = ext.getDWorkspace();
            const note = await new WSUtilsV2_1.WSUtilsV2(ext).getActiveNote();
            //return a code action for create note if user clicked next to a broken wikilink
            if (note &&
                (await EditorUtils_1.EditorUtils.isBrokenWikilink({
                    editor,
                    engine,
                    note,
                    selection,
                }))) {
                return [brokenWikilinkAction];
            }
            //return a code action for rename header and copy header ref if user clicks next to a header
            if (!lodash_1.default.isUndefined(header)) {
                return [renameHeaderAction, copyHeaderRefAction];
            }
            // return if none
            return;
        }
        else {
            //regex for url
            if (!lodash_1.default.isUndefined(text) && (0, is_url_1.default)(text)) {
                return [WrapAsMarkdownLink];
            }
            return !lodash_1.default.isUndefined(header)
                ? [createNewNoteAction, renameHeaderAction, copyHeaderRefAction]
                : [createNewNoteAction];
        }
    }),
};
//# sourceMappingURL=codeActionProvider.js.map