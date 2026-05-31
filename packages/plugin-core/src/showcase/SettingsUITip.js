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
exports.SettingsUITip = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const vscode = __importStar(require("vscode"));
const ShowMeHowView_1 = require("../views/ShowMeHowView");
const IFeatureShowcaseMessage_1 = require("./IFeatureShowcaseMessage");
class SettingsUITip {
    shouldShow(displayLocation) {
        switch (displayLocation) {
            case IFeatureShowcaseMessage_1.DisplayLocation.InformationMessage:
            case IFeatureShowcaseMessage_1.DisplayLocation.TipOfTheDayView:
                return true;
            default:
                (0, common_all_1.assertUnreachable)(displayLocation);
        }
    }
    get showcaseEntry() {
        return engine_server_1.ShowcaseEntry.SettingsUI;
    }
    getDisplayMessage(_displayLocation) {
        return "You can configure Dendron by using the `Dendron: Configure(UI) command`. You can also optionally edit the config file directly it with the `Dendron: Configure(yaml) command`";
    }
    onConfirm() {
        vscode.commands.executeCommand("dendron.configureUI");
        (0, ShowMeHowView_1.showMeHowView)({
            name: "Dendron Configure (UI)",
            src: "https://org-dendron-public-assets.s3.amazonaws.com/images/settingsUI.gif",
            href: "https://www.loom.com/share/3eba0f8523ac4d1ab150e8d3af9f1b0b",
            alt: "Run Ctrl+shift+P > Dendron: Configure (UI)",
        });
    }
    get confirmText() {
        return "Show me how";
    }
    get deferText() {
        return "Later";
    }
}
exports.SettingsUITip = SettingsUITip;
//# sourceMappingURL=SettingsUITip.js.map