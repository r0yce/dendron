"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateScratchNoteKeybindingTip = void 0;
const engine_server_1 = require("@dendronhq/engine-server");
const vsCodeUtils_1 = require("../vsCodeUtils");
const IFeatureShowcaseMessage_1 = require("./IFeatureShowcaseMessage");
class CreateScratchNoteKeybindingTip {
    /**
     * Only shows a toast, this tip does not appear in tip of day.
     * @param displayLocation
     * @returns
     */
    shouldShow(displayLocation) {
        if (displayLocation === IFeatureShowcaseMessage_1.DisplayLocation.TipOfTheDayView) {
            return false;
        }
        return true;
    }
    get showcaseEntry() {
        return engine_server_1.ShowcaseEntry.CreateScratchNoteKeybindingTip;
    }
    getDisplayMessage(_displayLocation) {
        return `Keyboard shortcut for "Dendron: Create Scratch Note" has changed. If you wish to keep the original, please follow the instructions online.`;
    }
    onConfirm() {
        vsCodeUtils_1.VSCodeUtils.openLink("https://wiki.dendron.so/notes/50kdbcwwda3gphjhccb0e5t");
    }
    get confirmText() {
        return "Show me how";
    }
    get deferText() {
        return "Later";
    }
}
exports.CreateScratchNoteKeybindingTip = CreateScratchNoteKeybindingTip;
//# sourceMappingURL=CreateScratchNoteKeybindingTip.js.map