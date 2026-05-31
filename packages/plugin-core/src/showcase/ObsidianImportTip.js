"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObsidianImportTip = void 0;
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = __importDefault(require("vscode"));
const IFeatureShowcaseMessage_1 = require("./IFeatureShowcaseMessage");
class ObsidianImportTip {
    /**
     * Only shows a toast, this tip does not appear in tip of day.
     * @param displayLocation
     * @returns
     */
    shouldShow(displayLocation) {
        if (displayLocation === IFeatureShowcaseMessage_1.DisplayLocation.TipOfTheDayView) {
            return false;
        }
        return lodash_1.default.includes(engine_server_1.MetadataService.instance().priorTools, engine_server_1.PriorTools.Obsidian);
    }
    get showcaseEntry() {
        return engine_server_1.ShowcaseEntry.ObsidianImport;
    }
    getDisplayMessage(_displayLocation) {
        return `Would you like to import your notes from an existing Obsidian vault?`;
    }
    onConfirm() {
        vscode_1.default.commands.executeCommand("dendron.importObsidianPod");
    }
    get confirmText() {
        return "Import Now";
    }
    get deferText() {
        return "Later";
    }
}
exports.ObsidianImportTip = ObsidianImportTip;
//# sourceMappingURL=ObsidianImportTip.js.map