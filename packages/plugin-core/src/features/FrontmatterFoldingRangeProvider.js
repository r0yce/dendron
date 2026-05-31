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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const unified_1 = require("@dendronhq/unified");
const Sentry = __importStar(require("@sentry/node"));
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = __importStar(require("vscode"));
const vsCodeUtils_1 = require("../vsCodeUtils");
class FrontmatterFoldingRangeProvider {
    /**
     * Returns the folding range of the frontmatter section of a markdown note.
     * @param document The document we want to find the folding range.
     * @returns The frontmatter folding range of given Dendron note as an array.
     */
    async provideFoldingRanges(document) {
        try {
            const nodePosition = unified_1.RemarkUtils.getNodePositionPastFrontmatter(document.getText());
            const range = nodePosition !== undefined
                ? new vscode_1.default.FoldingRange(vsCodeUtils_1.VSCodeUtils.point2VSCodePosition(nodePosition.start).line, vsCodeUtils_1.VSCodeUtils.point2VSCodePosition(nodePosition.end).line, vscode_1.FoldingRangeKind.Region)
                : undefined;
            if (lodash_1.default.isUndefined(range))
                return [];
            return [range];
        }
        catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }
}
exports.default = FrontmatterFoldingRangeProvider;
//# sourceMappingURL=FrontmatterFoldingRangeProvider.js.map