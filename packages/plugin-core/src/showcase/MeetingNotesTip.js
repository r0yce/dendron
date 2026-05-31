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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingNotesTip = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const vscode = __importStar(require("vscode"));
const IFeatureShowcaseMessage_1 = require("./IFeatureShowcaseMessage");
class MeetingNotesTip {
    shouldShow(_displayLocation) {
        return true;
    }
    get showcaseEntry() {
        return engine_server_1.ShowcaseEntry.TryMeetingNotes;
    }
    getDisplayMessage(displayLocation) {
        switch (displayLocation) {
            case IFeatureShowcaseMessage_1.DisplayLocation.InformationMessage:
                return `Dendron now has meeting notes. Try it out!`;
            case IFeatureShowcaseMessage_1.DisplayLocation.TipOfTheDayView:
                return "Dendron now has meeting notes, which lets you easily create a meeting note with a pre-built template. Try it out now!";
            default:
                (0, common_all_1.assertUnreachable)(displayLocation);
        }
    }
    onConfirm() {
        vscode.commands.executeCommand("dendron.createMeetingNote");
    }
    get confirmText() {
        return "Create a meeting note";
    }
    get deferText() {
        return "Later";
    }
}
exports.MeetingNotesTip = MeetingNotesTip;
//# sourceMappingURL=MeetingNotesTip.js.map