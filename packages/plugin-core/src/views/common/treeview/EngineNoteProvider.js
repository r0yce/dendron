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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineNoteProvider = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const inject_1 = require("../../../di/inject");
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const vscode_uri_1 = require("vscode-uri");
const constants_1 = require("../../../constants");
const TreeNote_1 = require("./TreeNote");
/**
 * Provides engine event data to generate the views for the native Tree View
 */
let EngineNoteProvider = class EngineNoteProvider {
    wsRoot;
    engine;
    _engineEvents;
    _treeViewConfig;
    _onDidChangeTreeDataEmitter;
    _onEngineNoteStateChangedDisposable;
    _tree = {};
    /**
     * Signals to vscode UI engine that the tree view needs to be refreshed.
     */
    onDidChangeTreeData;
    setLabelContext(labelType) {
        vscode.commands.executeCommand("setContext", "dendron:treeviewItemLabelType", labelType);
    }
    /**
     *
     * @param engineEvents - specifies when note state has been changed on the
     * engine
     */
    constructor(wsRoot, engine, _engineEvents, _treeViewConfig) {
        this.wsRoot = wsRoot;
        this.engine = engine;
        this._engineEvents = _engineEvents;
        this._treeViewConfig = _treeViewConfig;
        this._onDidChangeTreeDataEmitter = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeDataEmitter.event;
        this._onEngineNoteStateChangedDisposable = this.setupSubscriptions();
        this.setLabelContext(this._treeViewConfig.LabelTypeSetting);
    }
    /**
     * Changes the appearance of the labels in the tree view
     * @param opts
     * @returns
     */
    updateLabelType(opts) {
        const { labelType } = opts;
        if (labelType === this._treeViewConfig.LabelTypeSetting) {
            return;
        }
        this._treeViewConfig.LabelTypeSetting = labelType;
        this.setLabelContext(labelType);
        Object.values(this._tree).forEach((treeNote) => {
            treeNote.labelType = labelType;
        });
        // Fire on the root note to make all labels update
        this._onDidChangeTreeDataEmitter.fire();
    }
    /**
     * This method should be called prior to calling treeView.reveal(noteId) -
     * this is to ensure that the ancestral chain is present in the tree view's
     * node cache so that the targeted node can be properly revealed in the tree.
     * @param noteId
     */
    async prepNodeForReveal(noteId) {
        if (!this._tree[noteId]) {
            this._tree[noteId] = await this.createTreeNote(noteId);
        }
        let curNode = this._tree[noteId];
        while (curNode.note.parent && !this._tree[curNode.note.parent]) {
            // eslint-disable-next-line no-await-in-loop
            await this.addParentOfNoteToCache(curNode.note);
            curNode = this._tree[curNode.note.parent];
        }
    }
    getParent(noteId) {
        if (this._tree[noteId]) {
            const parentId = this._tree[noteId].note.parent;
            if (!parentId) {
                return;
            }
            return new Promise((resolve) => {
                this.addParentOfNoteToCache(this._tree[noteId].note).then(() => {
                    resolve(parentId);
                });
            });
        }
        throw new Error(`Unable to getParent for ${noteId}`);
    }
    getChildren(noteId) {
        return new Promise((resolve) => {
            if (noteId) {
                // Need to pre-fetch so it's available in the cache immediately upon render request.
                // TODO: use bulk get
                if (this._tree[noteId]) {
                    this.addChildrenOfNoteToCache(this._tree[noteId].note).then((children) => {
                        const sortedChildren = this.sortNotesAtLevel({
                            noteMeta: children,
                            labelType: this._treeViewConfig.LabelTypeSetting,
                        }).map((metaProps) => metaProps.id);
                        resolve(sortedChildren);
                    });
                    return;
                }
                this.createTreeNote(noteId).then((treeNote) => {
                    this.addChildrenOfNoteToCache(treeNote.note).then((children) => {
                        const sortedChildren = this.sortNotesAtLevel({
                            noteMeta: children,
                            labelType: this._treeViewConfig.LabelTypeSetting,
                        }).map((metaProps) => metaProps.id);
                        resolve(sortedChildren);
                    });
                });
                return;
            }
            else {
                this.engine.findNotesMeta({ fname: "root" }).then((values) => {
                    const all = Promise.all(values.map(async (noteProps) => {
                        this._tree[noteProps.id] = await this.createTreeNoteFromProps(noteProps);
                        return noteProps.id;
                    }));
                    all.then((value) => {
                        return resolve(value);
                    });
                });
            }
        });
    }
    getTreeItem(noteProps) {
        if (this._tree[noteProps]) {
            return this._tree[noteProps];
        }
        else {
            throw new Error(`${noteProps} not found in cache!`);
        }
    }
    dispose() {
        if (this._onDidChangeTreeDataEmitter) {
            this._onDidChangeTreeDataEmitter.dispose();
        }
        if (this._onEngineNoteStateChangedDisposable) {
            this._onEngineNoteStateChangedDisposable.dispose();
        }
    }
    setupSubscriptions() {
        return this._engineEvents.onEngineNoteStateChanged((e) => {
            e.forEach(async (noteChangeEntry) => {
                // TODO: Add Special logic to handle deletes
                this._tree[noteChangeEntry.note.id] =
                    await this.createTreeNoteFromProps(noteChangeEntry.note);
                this._onDidChangeTreeDataEmitter.fire(noteChangeEntry.note.id);
            });
        });
    }
    async addChildrenOfNoteToCache(noteProps) {
        return Promise.all(noteProps.children.map(async (child) => {
            if (!this._tree[child]) {
                const props = await this.createTreeNote(child);
                this._tree[child] = props;
                return props.note;
            }
            return this._tree[child].note;
        }));
    }
    async addParentOfNoteToCache(noteProps) {
        if (!noteProps.parent) {
            return;
        }
        if (!this._tree[noteProps.parent]) {
            this._tree[noteProps.parent] = await this.createTreeNote(noteProps.parent);
        }
    }
    async createTreeNote(noteId) {
        const note = await this.engine.getNoteMeta(noteId);
        if (!note || !note.data) {
            throw new Error(`Unable to find note ${note} for tree view!`);
        }
        return this.createTreeNoteFromProps(note.data);
    }
    async createTreeNoteFromProps(note) {
        const collapsibleState = lodash_1.default.isEmpty(note.children)
            ? vscode_1.TreeItemCollapsibleState.None
            : vscode_1.TreeItemCollapsibleState.Collapsed;
        const tn = new TreeNote_1.TreeNote(this.wsRoot, {
            note,
            collapsibleState,
            labelType: this._treeViewConfig.LabelTypeSetting,
        });
        this._tree[note.id] = tn;
        if (note.schema) {
            tn.iconPath = new vscode_1.ThemeIcon(constants_1.ICONS.SCHEMA);
        }
        return tn;
    }
    /**
     *  Derived from common-all's sortNotesAtLevel
     * @param param0
     * @returns
     */
    sortNotesAtLevel({ noteMeta, reverse, labelType, }) {
        const out = lodash_1.default.sortBy(noteMeta, 
        // Sort by nav order if set
        (noteProps) => noteProps.custom?.nav_order, 
        // Sort by label
        (noteProps) => {
            if (labelType) {
                return labelType === common_all_1.TreeViewItemLabelTypeEnum.filename
                    ? lodash_1.default.last(noteProps.fname.split("."))?.toLowerCase()
                    : noteProps.title?.toLowerCase();
            }
            else {
                return noteProps.title?.toLowerCase();
            }
        }, 
        // If titles are identical, sort by last updated date
        (noteProps) => noteProps.updated);
        // bubble down tags hierarchy if nav_order is not set
        const maybeTagsHierarchy = out.find((noteId) => noteId.fname === common_all_1.TAGS_HIERARCHY_BASE);
        if (maybeTagsHierarchy &&
            maybeTagsHierarchy.custom?.nav_order === undefined) {
            const idx = out.indexOf(maybeTagsHierarchy);
            out.splice(idx, 1);
            out.push(maybeTagsHierarchy);
        }
        if (reverse) {
            return lodash_1.default.reverse(out);
        }
        return out;
    }
};
exports.EngineNoteProvider = EngineNoteProvider;
exports.EngineNoteProvider = EngineNoteProvider = __decorate([
    (0, inject_1.injectable)(),
    __param(0, (0, inject_1.inject)("wsRoot")),
    __param(1, (0, inject_1.inject)("ReducedDEngine")),
    __param(2, (0, inject_1.inject)("EngineEventEmitter")),
    __param(3, (0, inject_1.inject)("ITreeViewConfig")),
    __metadata("design:paramtypes", [vscode_uri_1.URI, Object, Object, Object])
], EngineNoteProvider);
//# sourceMappingURL=EngineNoteProvider.js.map