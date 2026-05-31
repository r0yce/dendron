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
exports.Backlink = exports.BacklinkTreeItemType = void 0;
const vscode_1 = __importStar(require("vscode"));
var BacklinkTreeItemType;
(function (BacklinkTreeItemType) {
    /**
     * Tree item that represents a note, which may contain several backlinks to
     * the current note (1st level)
     */
    BacklinkTreeItemType["noteLevel"] = "noteLevel";
    /**
     * Tree item that represents a single backlink reference (2nd level)
     */
    BacklinkTreeItemType["referenceLevel"] = "referenceLevel";
})(BacklinkTreeItemType || (exports.BacklinkTreeItemType = BacklinkTreeItemType = {}));
class Backlink extends vscode_1.default.TreeItem {
    treeItemType;
    singleRef;
    refs;
    parentBacklink;
    static createRefLevelBacklink(reference) {
        return new Backlink(reference.matchText, undefined, vscode_1.TreeItemCollapsibleState.None, BacklinkTreeItemType.referenceLevel, reference);
    }
    static createNoteLevelBacklink(label, references) {
        return new Backlink(label, references, vscode_1.TreeItemCollapsibleState.Collapsed, BacklinkTreeItemType.noteLevel, undefined);
    }
    constructor(label, refs, collapsibleState, treeItemType, singleRef) {
        super(label, collapsibleState);
        this.treeItemType = treeItemType;
        if (refs) {
            this.refs = refs.map((r) => ({ ...r, parentBacklink: this }));
        }
        else {
            this.refs = undefined;
        }
        if (singleRef) {
            this.singleRef = singleRef;
        }
    }
}
exports.Backlink = Backlink;
//# sourceMappingURL=Backlink.js.map