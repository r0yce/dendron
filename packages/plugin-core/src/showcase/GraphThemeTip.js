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
exports.GraphThemeTip = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const vscode = __importStar(require("vscode"));
const ShowMeHowView_1 = require("../views/ShowMeHowView");
const IFeatureShowcaseMessage_1 = require("./IFeatureShowcaseMessage");
class GraphThemeTip {
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
        return engine_server_1.ShowcaseEntry.GraphTheme;
    }
    getDisplayMessage(_displayLocation) {
        return `Dendron now has new themes for Graph View. Check it out`;
    }
    onConfirm() {
        (0, ShowMeHowView_1.showMeHowView)({
            name: "Graph Theme",
            src: "https://org-dendron-public-assets.s3.amazonaws.com/images/graph-theme.gif",
            href: "https://www.loom.com/share/f2c53d2a5aeb48209b5587a3dfbb1015",
            alt: "Click on menu icon in the Graph View to change themes",
        });
        vscode.commands.executeCommand("dendron.showNoteGraphView");
    }
    get confirmText() {
        return "Show me how";
    }
    get deferText() {
        return "Later";
    }
}
exports.GraphThemeTip = GraphThemeTip;
//# sourceMappingURL=GraphThemeTip.js.map