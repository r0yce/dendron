"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TogglePreviewLockCommand = void 0;
const ExtensionProvider_1 = require("../ExtensionProvider");
const constants_1 = require("../constants");
const base_1 = require("./base");
class TogglePreviewLockCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.TOGGLE_PREVIEW_LOCK.key;
    _panel;
    constructor(previewPanel) {
        super();
        this._panel = previewPanel;
    }
    async sanityCheck() {
        if (!this._panel || !this._panel.isVisible()) {
            return "No preview currently open";
        }
        return;
    }
    async execute(_opts) {
        if (this._panel) {
            const note = await ExtensionProvider_1.ExtensionProvider.getWSUtils().getActiveNote();
            if (this._panel.isLocked()) {
                this._panel.unlock();
                if (note) {
                    this._panel.show(note);
                }
            }
            else {
                this._panel.lock(note?.id);
            }
        }
        return {};
    }
}
exports.TogglePreviewLockCommand = TogglePreviewLockCommand;
//# sourceMappingURL=TogglePreviewLock.js.map