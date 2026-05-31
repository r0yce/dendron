"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasteLinkCommand = void 0;
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
// Command based on copying CopyNoteRef.ts
class PasteLinkCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.PASTE_LINK.key;
    async sanityCheck() {
        if (lodash_1.default.isUndefined(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor())) {
            return "No document open";
        }
        return;
    }
    async showFeedback(formattedLink) {
        vscode_1.window.showInformationMessage(`Wrote ${formattedLink} to note`);
    }
    getFormattedLinkFromOpenGraphResult(result, url) {
        // Check whichever field has non falsy info
        const title = ((result.ogTitle ?? result.twitterTitle ?? result.dcTitle) ||
            url).trim();
        return title ? `[${title}](${url})` : `<${url}>`;
    }
    async execute(opts) {
        const maybeTextEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (maybeTextEditor === undefined)
            return "";
        const textEditor = maybeTextEditor;
        const { link, selection } = opts;
        // First, get web address from clipboard
        let url = "";
        try {
            url = link
                ? link.trim()
                : await utils_1.clipboard.readText().then((r) => r.trim());
        }
        catch (err) {
            this.L.error({ err, url });
            throw err;
        }
        // Second: get metadata + put into a markdown string.
        let formattedLink = `<${url}>`;
        try {
            const data = await (0, utils_1.getOpenGraphMetadata)({ url });
            // Third: combine metadata with markdown
            if (!data.error) {
                formattedLink = this.getFormattedLinkFromOpenGraphResult(data.result, url);
            }
        }
        catch (err) {
            this.L.debug("Your clipboard did not contain a valid web address, or your internet connection may not be working");
            this.L.error({ err });
        }
        // Fourth: write string back out to VScode
        // Get current Position: https://github.com/microsoft/vscode/issues/111
        // Write text to document with Edit Builder: https://github.com/Microsoft/vscode-extension-samples/tree/main/document-editing-sample
        const position = textEditor.selection.active;
        if (!lodash_1.default.isUndefined(selection)) {
            textEditor.edit((eb) => {
                eb.replace(selection, formattedLink);
            });
        }
        else {
            textEditor.edit((eb) => {
                eb.insert(position, formattedLink);
            });
        }
        this.showFeedback(formattedLink);
        // The return is used for testing, but not by the main app.
        return formattedLink;
    }
}
exports.PasteLinkCommand = PasteLinkCommand;
//# sourceMappingURL=PasteLink.js.map