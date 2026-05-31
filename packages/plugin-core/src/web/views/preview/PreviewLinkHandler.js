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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewLinkHandler = void 0;
const common_all_1 = require("@dendronhq/common-all");
const vscode = __importStar(require("vscode"));
const unified_1 = require("@dendronhq/unified");
const lodash_1 = __importDefault(require("lodash"));
const IPreviewLinkHandler_1 = require("../../../components/views/IPreviewLinkHandler");
const inject_1 = require("../../../di/inject");
const vscode_uri_1 = require("vscode-uri");
const openNote_1 = require("../../utils/openNote");
/**
 * Web extension implementation for handling link clicks in preview
 */
let PreviewLinkHandler = class PreviewLinkHandler {
    wsRoot;
    engine;
    logger;
    constructor(wsRoot, engine, logger) {
        this.wsRoot = wsRoot;
        this.engine = engine;
        this.logger = logger;
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
            return IPreviewLinkHandler_1.LinkType.WEBSITE;
        }
        if ((0, common_all_1.isVSCodeCommandUri)(data.href)) {
            // If it's a command uri, do nothing.
            // Let VSCode handle them.
            return IPreviewLinkHandler_1.LinkType.COMMAND;
        }
        // const uri = vscode.Uri.parse(data.href);
        // First, check if the URL matches any note
        try {
            const noteData = await this.getNavigationTargetNoteForWikiLink({
                data: data /* TODO: exactOptional on wiki link data (id/href |undef); final strict Batch 5+ web cluster; see di-container proposal for related @ts sites */,
            });
            if (noteData.note) {
                // Found a note, open that
                (0, openNote_1.openNote)({
                    wsRoot: this.wsRoot,
                    fname: noteData.note.fname,
                    vault: noteData.note.vault,
                    column: vscode.ViewColumn.One,
                    anchor: noteData.anchor ?? undefined /* TODO: exactOptional anchor |undef to openNote; Batch 5+ web; ties to PreviewPanel DI cluster */,
                });
                return IPreviewLinkHandler_1.LinkType.WIKI;
            }
        }
        catch (err) {
            this.logger.debug({ ctx, error: common_all_1.ErrorFactory.wrapIfNeeded(err) });
        }
        // TODO: Add back functionality
        // // If not, see if there's a matching asset (including in assets folder, outside vaults, or even an absolute path)
        // const currentNote = data?.id
        //  ? (await this._ext.getEngine().getNoteMeta(data.id)).data
        //  : undefined;
        // const { fullPath } =
        //   (await findNonNoteFile({
        //     fpath: path.normalize(uri.fsPath),
        //     vaults: this.vaults,
        //     wsRoot: this.wsRoot,
        //     currentVault: currentNote?.vault,
        //   })) || {};
        // if (fullPath) {
        //   // Found a matching non-note file.
        //   if (FileExtensionUtils.isTextFileExtension(path.extname(fullPath))) {
        //     // If it's a text file, open it inside VSCode.
        //     const editor = await VSCodeUtils.openFileInEditor(
        //       vscode.Uri.file(fullPath),
        //       {
        //         // Avoid replacing the preview
        //         column: vscode.ViewColumn.One,
        //       }
        //     );
        //     if (!_.isEmpty(uri.fragment) && editor) {
        //       const anchor = AnchorUtils.string2anchor(uri.fragment);
        //       await this._ext.wsUtils.trySelectRevealNonNoteAnchor(editor, anchor);
        //     }
        //     return LinkType.TEXT;
        //   } else {
        //     // Otherwise it's a binary file, try to open it with the default program
        //     ShowPreviewAssetOpener.openWithDefaultApp(path.normalize(fullPath));
        //     return LinkType.ASSET;
        //   }
        // }
        // If nothing applies, VSCode's default will hopefully handle it
        this.logger.debug({
            ctx,
            msg: "Nothing applied for the URL, had to fall back to VSCode default.",
        });
        return IPreviewLinkHandler_1.LinkType.UNKNOWN;
    }
    /**
     * Try to find the note to navigate to if the given path references a note.
     * @returns a note if one was found, `undefined` if no notes were found, and
     * `null` if the link was ambiguous and user cancelled the prompt to pick a
     * note.
     */
    async getNavigationTargetNoteForWikiLink({ data, }) {
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
        const resp = await this.engine.getNoteMeta(noteId);
        let note;
        if (resp.data) {
            note = resp.data;
        }
        else {
            // If we could not find the note by the extracted id (when the note is within the same
            // vault we should have been able to find the note by id) there is a good chance that the name
            // of the note was in place of the id in the HREF (as in case of navigating to a note
            // in a different vault without explicit vault specification). Hence we will attempt
            // to find the note by file name.
            const candidates = await this.engine.findNotesMeta({ fname: noteId });
            note = candidates[0];
            // TODO: Add back quickpicker functionality in case there are multiple candidates:
            // if (candidates.length === 1) {
            //   note = candidates[0];
            // } else if (candidates.length > 1) {
            //   // We have more than one candidate hence lets as the user which candidate they would like
            //   // to navigate to
            //   note = await QuickPickUtil.showChooseNote(candidates);
            //   if (note === undefined) note = null;
            // }
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
        const path = vscode.Uri.parse(data.href);
        const out = lodash_1.default.trimEnd(vscode_uri_1.Utils.basename(path), ".html");
        return out;
    }
};
exports.PreviewLinkHandler = PreviewLinkHandler;
exports.PreviewLinkHandler = PreviewLinkHandler = __decorate([
    (0, inject_1.injectable)(),
    __param(0, (0, inject_1.inject)("wsRoot")),
    __param(1, (0, inject_1.inject)("ReducedDEngine")),
    __param(2, (0, inject_1.inject)("logger")),
    __metadata("design:paramtypes", [common_all_1.URI, Object, Object])
], PreviewLinkHandler);
//# sourceMappingURL=PreviewLinkHandler.js.map