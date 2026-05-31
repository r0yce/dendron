"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabUtils = void 0;
const lodash_1 = __importDefault(require("lodash"));
const semver_1 = __importDefault(require("semver"));
const vscode_1 = require("vscode");
class TabUtils {
    static tabAPIAvailable() {
        return semver_1.default.gte(vscode_1.version, "1.67.0");
    }
    static isPreviewTab(tab) {
        // label will look like this: mainThreadWebview-DendronNotePreview
        return (lodash_1.default.isString(tab.input?.viewType) &&
            tab.input.viewType.endsWith("DendronNotePreview"));
    }
    static getAllTabGroups() {
        return vscode_1.window.tabGroups;
    }
}
exports.TabUtils = TabUtils;
//# sourceMappingURL=TabUtils.js.map