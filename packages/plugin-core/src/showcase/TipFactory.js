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
exports.createSimpleTipOfDayMsg = createSimpleTipOfDayMsg;
exports.createTipOfDayMsgWithDocsLink = createTipOfDayMsgWithDocsLink;
const IFeatureShowcaseMessage_1 = require("./IFeatureShowcaseMessage");
const vscode = __importStar(require("vscode"));
/**
 * Creates a tip of the day that contains a simple message with no buttons
 * @param showcaseEntry
 * @param displayMessage
 * @returns
 */
function createSimpleTipOfDayMsg(showcaseEntry, displayMessage) {
    return new TipOnlyMessage(showcaseEntry, displayMessage, undefined, () => { });
}
/**
 * Creates a tip of the day that also contains a button linking to a url containing a doc
 * url (to wiki.dendron.so for example)
 * @param input
 * @returns
 */
function createTipOfDayMsgWithDocsLink(input) {
    return new TipOnlyMessage(input.showcaseEntry, input.displayMessage, input.confirmText, () => {
        vscode.commands.executeCommand("vscode.open", input.docsUrl);
    });
}
class TipOnlyMessage {
    _showcaseEntry;
    _displayMessage;
    _confirmText;
    _onConfirm;
    constructor(_showcaseEntry, _displayMessage, _confirmText, _onConfirm) {
        this._showcaseEntry = _showcaseEntry;
        this._displayMessage = _displayMessage;
        this._confirmText = _confirmText;
        this._onConfirm = _onConfirm;
    }
    shouldShow(displayLocation) {
        return displayLocation === IFeatureShowcaseMessage_1.DisplayLocation.TipOfTheDayView;
    }
    get showcaseEntry() {
        return this._showcaseEntry;
    }
    getDisplayMessage() {
        return this._displayMessage;
    }
    onConfirm() {
        this._onConfirm();
    }
    get confirmText() {
        return this._confirmText;
    }
    get deferText() {
        return undefined;
    }
}
//# sourceMappingURL=TipFactory.js.map