"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyToClipboardCommand = exports.CopyToClipboardSourceEnum = void 0;
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const base_1 = require("./base");
//  ^0joacbz2nblu
var CopyToClipboardSourceEnum;
(function (CopyToClipboardSourceEnum) {
    CopyToClipboardSourceEnum["keybindingConflictPreview"] = "keybindingConflictPreview";
})(CopyToClipboardSourceEnum || (exports.CopyToClipboardSourceEnum = CopyToClipboardSourceEnum = {}));
/**
 * This command is not accessible through the VSCode UI,
 * and only intended to be used as a proxy for copying arbitrary
 * text from the webview.
 *
 * e.g.)
 *
 * // you can use this in a markdown link to invoke commands
 * const commandUri = `command:dendron.copyToClipboard?${encodeURIComponent({
 *   text: "some text",
 *   message: "copied!"
 * })}`
 *
 * ...
 *
 * content = `[click this](${commandUri})`
 *
 */
class CopyToClipboardCommand extends base_1.InputArgCommand {
    key = constants_1.DENDRON_COMMANDS.COPY_TO_CLIPBOARD.key;
    addAnalyticsPayload(opts) {
        return { source: opts.source };
    }
    async execute(opts) {
        const ctx = "execute";
        this.L.info({ ctx, opts });
        const { text, message } = opts;
        utils_1.clipboard.writeText(text);
        vscode_1.window.showInformationMessage(message || "Text copied to clipboard");
    }
}
exports.CopyToClipboardCommand = CopyToClipboardCommand;
//# sourceMappingURL=CopyToClipboardCommand.js.map