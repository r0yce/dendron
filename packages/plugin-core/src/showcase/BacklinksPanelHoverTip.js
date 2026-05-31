"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BacklinksPanelHoverTip = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const ShowMeHowView_1 = require("../views/ShowMeHowView");
const IFeatureShowcaseMessage_1 = require("./IFeatureShowcaseMessage");
class BacklinksPanelHoverTip {
    shouldShow(_displayLocation) {
        return true;
    }
    get showcaseEntry() {
        return engine_server_1.ShowcaseEntry.BacklinksPanelHover;
    }
    getDisplayMessage(displayLocation) {
        switch (displayLocation) {
            case IFeatureShowcaseMessage_1.DisplayLocation.InformationMessage:
                return `The backlinks panel supports hover - place your cursor over a backlink to quickly browse the context of the note.`;
            case IFeatureShowcaseMessage_1.DisplayLocation.TipOfTheDayView:
                return 'The backlinks panel supports hover - place your cursor over a backlink to quickly browse the context of the note. To make the hover appear faster, reduce the "workbench.hover.delay" in your VSCode settings.';
            default:
                (0, common_all_1.assertUnreachable)(displayLocation);
        }
    }
    onConfirm() {
        (0, ShowMeHowView_1.showMeHowView)({
            name: "Backlinks Panel Hover",
            src: "https://org-dendron-public-assets.s3.amazonaws.com/images/vscode-hover-in-backlinks-panel.gif",
            href: "https://www.loom.com/share/1bf2dd0b42ff4f0f9945952fb463c4cc",
            alt: "Backlinks Panel supports Hover Preview",
        });
    }
    get confirmText() {
        return "Show me how";
    }
    get deferText() {
        return "Later";
    }
}
exports.BacklinksPanelHoverTip = BacklinksPanelHoverTip;
//# sourceMappingURL=BacklinksPanelHoverTip.js.map