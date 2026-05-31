"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowLegacyPreviewCommand = void 0;
const lodash_1 = __importDefault(require("lodash"));
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const md_1 = require("../utils/md");
const base_1 = require("./base");
class ShowLegacyPreviewCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.SHOW_LEGACY_PREVIEW.key;
    async sanityCheck() {
        if (lodash_1.default.isUndefined(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor())) {
            return "No document open";
        }
        return;
    }
    async execute(_opts) {
        // eslint-disable-next-line  no-return-await
        return await md_1.MarkdownUtils.showLegacyPreview();
    }
}
exports.ShowLegacyPreviewCommand = ShowLegacyPreviewCommand;
//# sourceMappingURL=ShowLegacyPreview.js.map