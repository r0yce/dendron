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
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const unified_1 = require("@dendronhq/unified");
const Sentry = __importStar(require("@sentry/node"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = __importStar(require("vscode"));
const utils_1 = require("../components/lookup/utils");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const md_1 = require("../utils/md");
const HOVER_IMAGE_MAX_HEIGHT = Math.max(200, 10);
class ReferenceHoverProvider {
    async provideHoverNonNote({ refAtPos, vault, }) {
        const { wsRoot, config } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const vpath = (0, common_server_1.vault2Path)({
            vault: utils_1.PickerUtilsV2.getVaultForOpenEditor(),
            wsRoot,
        });
        const fullPath = path_1.default.join(vpath, refAtPos.ref);
        const foundUri = vscode_1.Uri.file(fullPath);
        // Handle URI's like https://example.com or mailto:user@example.com
        const nonDendronURIMessage = this.handleNonDendronUri(refAtPos.refText);
        if (!lodash_1.default.isUndefined(nonDendronURIMessage))
            return nonDendronURIMessage;
        if ((0, md_1.isUncPath)(foundUri.fsPath))
            return "UNC paths are not supported for images preview due to VSCode Content Security Policy. Use markdown preview or open image via cmd (ctrl) + click instead.";
        if ((0, md_1.containsImageExt)(foundUri.fsPath)) {
            // This is an image that the preview supports
            if (!(await fs_extra_1.default.pathExists(foundUri.fsPath))) {
                // Warn the user if the image is missing
                return `file ${foundUri.fsPath} in reference ${refAtPos.ref} is missing`;
            }
            return `![](${foundUri.toString()}|height=${HOVER_IMAGE_MAX_HEIGHT})`;
        }
        // Could be some other type of non-note file.
        const nonNoteFile = await this.maybeFindNonNoteFile(refAtPos, vault);
        if (nonNoteFile) {
            return `Preview is not supported for this link. [Click to open in the default app](${nonNoteFile}).`;
        }
        // Otherwise, this is a note link, but the note doesn't exist (otherwise `provideHover` wouldn't call this function).
        // Also let the user know if the file name is valid
        const validationResp = common_all_1.NoteUtils.validateFname(refAtPos.ref);
        const vaultName = refAtPos.vaultName
            ? ` in vault "${refAtPos.vaultName}"`
            : "";
        if (validationResp.isValid) {
            const autoCreateOnDefinition = common_all_1.ConfigUtils.getWorkspace(config).enableAutoCreateOnDefinition;
            const ctrlClickToCreate = autoCreateOnDefinition ? "Ctrl+Click or " : "";
            return `Note ${refAtPos.ref}${vaultName} is missing, ${ctrlClickToCreate}use "Dendron: Go to Note" command to create it.`;
        }
        else {
            return new vscode_1.MarkdownString(`Note \`${refAtPos.ref}${vaultName}\` is missing, and the filename is invalid for the following reason:\n\n \`${validationResp.reason}\`.\n\n Maybe you meant \`${common_all_1.NoteUtils.cleanFname({
                fname: refAtPos.ref,
            })}\`?`);
        }
    }
    /** Returns a message if this is a non-dendron URI. */
    handleNonDendronUri(refText) {
        const [first, second] = refText.split("|");
        const maybeUri = second || first;
        const maybe = (0, common_all_1.containsNonDendronUri)(maybeUri);
        // Not a URI, or is dendron://, so it must be a note (or image) and the rest of the code can handle this.
        if (lodash_1.default.isUndefined(maybe) || !maybe)
            return undefined;
        // Otherwise, this is a URI like http://example.com or mailto:user@example.com
        return `Preview is not supported for this link. [Click to open in the default app.](${maybeUri}).`;
    }
    async maybeFindNonNoteFile(refAtPos, vault) {
        const { vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        // This could be a non-note file
        // Could be a non-note file link
        const nonNoteFile = await (0, common_server_1.findNonNoteFile)({
            fpath: refAtPos.ref,
            vaults: vault ? [vault] : vaults,
            wsRoot,
        });
        return nonNoteFile?.fullPath;
    }
    async provideHover(document, position) {
        try {
            const ctx = "provideHover";
            // No-op if we're not in a Dendron Workspace
            if (!(await ExtensionProvider_1.ExtensionProvider.isActiveAndIsDendronNote(document.uri.fsPath))) {
                return null;
            }
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const refAtPos = await (0, md_1.getReferenceAtPosition)({
                document,
                position,
                wsRoot,
                vaults,
            });
            if (!refAtPos)
                return null;
            const { range } = refAtPos;
            const hoverRange = new vscode_1.default.Range(new vscode_1.default.Position(range.start.line, range.start.character + 2), new vscode_1.default.Position(range.end.line, range.end.character - 2));
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            let vault;
            if (refAtPos.vaultName) {
                // If the link specifies a vault, we should only look at that vault
                const maybeVault = common_all_1.VaultUtils.getVaultByName({
                    vname: refAtPos.vaultName,
                    vaults: engine.vaults,
                });
                if (lodash_1.default.isUndefined(maybeVault)) {
                    logger_1.Logger.info({
                        ctx,
                        msg: "vault specified in link is missing",
                        refAtPos,
                    });
                    return new vscode_1.default.Hover(`Vault ${refAtPos.vaultName} does not exist.`, hoverRange);
                }
                vault = maybeVault;
            }
            // Check if what's being referenced is a note.
            // If vault is specified, search only that vault. Otherwise search all vaults.
            let note;
            const maybeNotes = await engine.findNotesMeta({
                fname: refAtPos.ref,
                vault,
            });
            if (maybeNotes.length === 0) {
                // If it isn't, then it might be an image, a URL like https://example.com, or some other file that we can't preview.
                return new vscode_1.default.Hover(await this.provideHoverNonNote({ refAtPos }), hoverRange);
            }
            else if (maybeNotes.length > 1) {
                // If there are multiple notes with this fname, default to one that's in the same vault first.
                const currentVault = utils_1.PickerUtilsV2.getVaultForOpenEditor();
                const sameVaultNote = lodash_1.default.filter(maybeNotes, (note) => common_all_1.VaultUtils.isEqual(note.vault, currentVault, engine.wsRoot))[0];
                if (!lodash_1.default.isUndefined(sameVaultNote)) {
                    // There is a note that's within the same vault, let's go with that.
                    note = sameVaultNote;
                }
                else {
                    // Otherwise, just pick one, doesn't matter which.
                    note = maybeNotes[0];
                }
            }
            else {
                // Just 1 note, use that.
                note = maybeNotes[0];
            }
            // For notes, let's use the noteRef functionality to render the referenced portion. ^tiagtt7sjzyw
            const referenceText = ["![["];
            if (refAtPos.vaultName)
                referenceText.push(`dendron://${refAtPos.vaultName}/`);
            referenceText.push(refAtPos.ref);
            if (refAtPos.anchorStart)
                referenceText.push(`#${unified_1.AnchorUtils.anchor2string(refAtPos.anchorStart)}`);
            if (refAtPos.anchorEnd)
                referenceText.push(`:#${unified_1.AnchorUtils.anchor2string(refAtPos.anchorEnd)}`);
            referenceText.push("]]");
            const reference = referenceText.join("");
            // now we create a fake note so we can pass this to the engine
            const id = `note.id-${reference}`;
            const fakeNote = common_all_1.NoteUtils.createForFake({
                // Mostly same as the note...
                fname: note.fname,
                vault: note.vault,
                // except the changed ID to avoid caching
                id,
                // And using the reference as the text of the note
                contents: reference,
            });
            const rendered = await engine.renderNote({
                id: fakeNote.id,
                note: fakeNote,
                dest: unified_1.DendronASTDest.MD_REGULAR,
                flavor: unified_1.ProcFlavor.HOVER_PREVIEW,
            });
            if (rendered.error) {
                const error = rendered.error instanceof common_all_1.DendronError
                    ? rendered.error
                    : new common_all_1.DendronError({
                        message: "Error while rendering hover",
                        payload: rendered.error,
                    });
                Sentry.captureException(error);
                logger_1.Logger.error({
                    ctx,
                    msg: "Error while rendering the hover",
                    error,
                });
            }
            if (rendered.data) {
                const markdownString = new vscode_1.MarkdownString(rendered.data);
                // Support the usage of command URI's for gotoNote navigation
                markdownString.isTrusted = true;
                return new vscode_1.default.Hover(markdownString, hoverRange);
            }
            return null;
        }
        catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }
}
exports.default = ReferenceHoverProvider;
//# sourceMappingURL=ReferenceHoverProvider.js.map