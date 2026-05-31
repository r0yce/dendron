"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowPreviewAssetOpener = exports.PreviewLinkHandler = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const logger_1 = require("../../logger");
const quickPick_1 = require("../../utils/quickPick");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const unified_1 = require("@dendronhq/unified");
const lodash_1 = __importDefault(require("lodash"));
const files_1 = require("../../utils/files");
const GotoNote_1 = require("../../commands/GotoNote");
const analytics_1 = require("../../utils/analytics");
const ExtensionUtils_1 = require("../../utils/ExtensionUtils");
const IPreviewLinkHandler_1 = require("./IPreviewLinkHandler");
/**
 * Default implementation for handling link clicks in preview
 */
class PreviewLinkHandler {
    _ext;
    /**
     * set of tutorial note ids that we will allow tracking of link clicked events.
     * TODO: consolidate tracking of tutorial ids to a central place
     * TODO: this logic is specific to the tutorial workspace
     *       add a way to register callbacks to the link handler in the future
     */
    _trackAllowedIds = ExtensionUtils_1.ExtensionUtils.getTutorialIds();
    constructor(ext) {
        this._ext = ext;
    }
    async onLinkClicked({ data, }) {
        const ctx = "PreviewLinkHandler.onLinkClicked";
        // If href is missing, something is wrong with our link handler. Just let the VSCode's default handle it.
        if (!data.href)
            return IPreviewLinkHandler_1.LinkType.UNKNOWN;
        // First check if it's a web URL.
        if ((0, common_all_1.isWebUri)(data.href)) {
            // There's nothing to do then, the default handler opens them automatically.
            // If we try to open it too, it will open twice.
            // track the link if it comes from a tutorial
            // TODO: this logic is specific to the tutorial workspace
            //       add a way to register callbacks to the link handler in the future
            if (data.id && this._trackAllowedIds.has(data.id)) {
                analytics_1.AnalyticsUtils.track(common_all_1.TutorialEvents.TutorialPreviewLinkClicked, {
                    LinkType: IPreviewLinkHandler_1.LinkType.WEBSITE,
                    href: data.href,
                });
                // some questions signal intent
                if (data.href.endsWith("98f6d928-3f61-49fb-9c9e-70c27d25f838")) {
                    analytics_1.AnalyticsUtils.identify({ teamIntent: true });
                }
            }
            return IPreviewLinkHandler_1.LinkType.WEBSITE;
        }
        if ((0, common_all_1.isVSCodeCommandUri)(data.href)) {
            // If it's a command uri, do nothing.
            // Let VSCode handle them.
            // but track the command uri if it comes from a tutorial
            // TODO: this logic is specific to the tutorial workspace
            //       add a way to register callbacks to the link handler in the future
            if (data.id && this._trackAllowedIds.has(data.id)) {
                analytics_1.AnalyticsUtils.track(common_all_1.TutorialEvents.TutorialPreviewLinkClicked, {
                    LinkType: IPreviewLinkHandler_1.LinkType.COMMAND,
                    href: data.href,
                });
            }
            return IPreviewLinkHandler_1.LinkType.COMMAND;
        }
        const uri = vscode.Uri.parse(data.href);
        // First, check if the URL matches any note
        try {
            const noteData = await this.getNavigationTargetNoteForWikiLink({
                data,
                engine: this._ext.getEngine(),
            });
            if (noteData.note) {
                // Found a note, open that
                const cmd = new GotoNote_1.GotoNoteCommand(this._ext);
                await cmd.execute({
                    qs: noteData.note.fname,
                    vault: noteData.note.vault,
                    // Avoid replacing the preview
                    column: vscode.ViewColumn.One,
                    anchor: noteData.anchor,
                });
                return IPreviewLinkHandler_1.LinkType.WIKI;
            }
        }
        catch (err) {
            logger_1.Logger.debug({ ctx, error: common_all_1.ErrorFactory.wrapIfNeeded(err) });
        }
        // If not, see if there's a matching asset (including in assets folder, outside vaults, or even an absolute path)
        const { wsRoot, vaults } = this._ext.getDWorkspace();
        const currentNote = data?.id
            ? (await this._ext.getEngine().getNoteMeta(data.id)).data
            : undefined;
        const { fullPath } = (await (0, common_server_1.findNonNoteFile)({
            fpath: path_1.default.normalize(uri.fsPath),
            vaults,
            wsRoot,
            currentVault: currentNote?.vault,
        })) || {};
        if (fullPath) {
            // Found a matching non-note file.
            if (common_server_1.FileExtensionUtils.isTextFileExtension(path_1.default.extname(fullPath))) {
                // If it's a text file, open it inside VSCode.
                const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(fullPath), {
                    // Avoid replacing the preview
                    column: vscode.ViewColumn.One,
                });
                if (!lodash_1.default.isEmpty(uri.fragment) && editor) {
                    const anchor = unified_1.AnchorUtils.string2anchor(uri.fragment);
                    await this._ext.wsUtils.trySelectRevealNonNoteAnchor(editor, anchor);
                }
                return IPreviewLinkHandler_1.LinkType.TEXT;
            }
            else {
                // Otherwise it's a binary file, try to open it with the default program
                ShowPreviewAssetOpener.openWithDefaultApp(path_1.default.normalize(fullPath));
                return IPreviewLinkHandler_1.LinkType.ASSET;
            }
        }
        // If nothing applies, VSCode's default will hopefully handle it
        logger_1.Logger.debug({
            ctx,
            msg: "Nothing applied for the URL, had to fall back to VSCode default.",
        });
        return IPreviewLinkHandler_1.LinkType.UNKNOWN;
    }
    /** Try to find the note to navigate to if the given path references a note.
     *
     * @returns a note if one was found, `undefined` if no notes were found, and
     * `null` if the link was ambiguous and user cancelled the prompt to pick a
     * note.
     */
    async getNavigationTargetNoteForWikiLink({ data, engine, }) {
        // wiki links will have the following format
        //
        // with `prettyLinks` set to false
        //    with anchor: vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/foo.html'
        //
        // with `prettyLinks` set to true
        //    with anchor: vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/foo'
        //    without anchor: vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/foo#foobar'
        //
        // And when the target of the link is a note in different vault without specifying
        // the vault explicitly the href is going to have the file name of the node in place of the id:
        // Example of href note inf different vault without vault specified:
        // vscode-webview://25d7783e-df29-479c-9838-386c17dbf9b6/dendron.ref.links.target-different-vault
        //
        if (!data.href) {
            throw common_all_1.ErrorFactory.createInvalidStateError({
                message: `href is missing from data: '${common_all_1.ErrorFactory.safeStringify(data)}'`,
            });
        }
        const noteId = this.extractNoteIdFromHref(data);
        if (!noteId) {
            throw common_all_1.ErrorFactory.createInvalidStateError({
                message: `Failed to extract noteId from '${common_all_1.ErrorFactory.safeStringify(data)}'`,
            });
        }
        const anchor = unified_1.AnchorUtils.string2anchor(vscode.Uri.parse(data.href).fragment);
        let note = (await engine.getNoteMeta(noteId)).data;
        if (note === undefined) {
            // If we could not find the note by the extracted id (when the note is within the same
            // vault we should have been able to find the note by id) there is a good chance that the name
            // of the note was in place of the id in the HREF (as in case of navigating to a note
            // in a different vault without explicit vault specification). Hence we will attempt
            // to find the note by file name.
            const candidates = await engine.findNotes({ fname: noteId });
            if (candidates.length === 1) {
                note = candidates[0];
            }
            else if (candidates.length > 1) {
                // We have more than one candidate hence lets as the user which candidate they would like
                // to navigate to
                note = await quickPick_1.QuickPickUtil.showChooseNote(candidates);
            }
        }
        return {
            note,
            anchor,
        };
    }
    extractNoteIdFromHref(data) {
        if (data.href === undefined) {
            throw common_all_1.ErrorFactory.createInvalidStateError({
                message: `href is missing.`,
            });
        }
        // For some cases such as markdown value='[head2](#head2)' the href isn't as nice
        // and looks like href='http://localhost:3005/vscode/note-preview.html?ws=WS-VALUE&port=3005#head2'
        // which currently happens when linking within the same note so we will consider it a special
        // case of parsing for now and return the id of the current note.
        if (data.href.includes("vscode/note-preview")) {
            return data.id;
        }
        /**
         * Will return a link like 'vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/foobar'
         * The path component includes a `/` (eg. `/foobar`) so we remove it
         */
        const { path: hrefPath } = vscode.Uri.parse(data.href);
        const out = path_1.default.basename(hrefPath, ".html");
        return out;
    }
}
exports.PreviewLinkHandler = PreviewLinkHandler;
class ShowPreviewAssetOpener {
    static openWithDefaultApp = files_1.PluginFileUtils.openWithDefaultApp;
}
exports.ShowPreviewAssetOpener = ShowPreviewAssetOpener;
//# sourceMappingURL=PreviewLinkHandler.js.map