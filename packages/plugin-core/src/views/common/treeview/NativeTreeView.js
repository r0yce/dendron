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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTreeView = void 0;
require("reflect-metadata");
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const inject_1 = require("../../../di/inject");
const vscode_1 = require("vscode");
const EngineNoteProvider_1 = require("./EngineNoteProvider");
const vscode = __importStar(require("vscode"));
const WSUtils_1 = require("../../../web/utils/WSUtils");
/**
 * Class managing the vscode native version of the Dendron tree view - this is
 * the side panel UI that gives a tree view of the Dendron note hierarchy
 */
let NativeTreeView = class NativeTreeView {
    _provider;
    wsUtils;
    treeView;
    _handler;
    _updateLabelTypeHandler;
    _getExpandableTreeItemsHandler;
    constructor(_provider, wsUtils) {
        this._provider = _provider;
        this.wsUtils = wsUtils;
    }
    dispose() {
        if (this._handler) {
            this._handler.dispose();
            this._handler = undefined;
        }
        if (this.treeView) {
            this.treeView.dispose();
            this.treeView = undefined;
        }
    }
    /**
     * Creates the Tree View and shows it in the UI (registers with vscode.window)
     */
    async show() {
        this._updateLabelTypeHandler = lodash_1.default.bind(this._provider.updateLabelType, this._provider);
        this.treeView = vscode_1.window.createTreeView(common_all_1.DendronTreeViewKey.TREE_VIEW, {
            treeDataProvider: this._provider,
            showCollapseAll: true,
        });
        this.treeView.onDidChangeVisibility((e) => {
            if (e.visible) {
                this.onOpenTextDocument(vscode.window.activeTextEditor);
            }
        });
        this._handler = vscode_1.window.onDidChangeActiveTextEditor(this.onOpenTextDocument, this);
    }
    updateLabelType(opts) {
        if (this._updateLabelTypeHandler) {
            this._updateLabelTypeHandler(opts);
        }
    }
    async expandAll() {
        if (this._getExpandableTreeItemsHandler) {
            const expandableTreeItems = this._getExpandableTreeItemsHandler();
            if (this.treeView) {
                await (0, common_all_1.asyncLoopOneAtATime)(expandableTreeItems, async (treeItem) => {
                    await this._provider.prepNodeForReveal(treeItem.note.id);
                    await this.treeView?.reveal(treeItem.note.id, {
                        expand: true,
                        focus: false,
                        select: false,
                    });
                });
            }
        }
    }
    async expandTreeItem(id) {
        if (this.treeView) {
            await this.treeView?.reveal(id, {
                expand: true,
                focus: false,
                select: false,
            });
        }
    }
    /**
     * Whenever a new note is opened, we move the tree view focus to the newly
     * opened note.
     * @param editor
     * @returns
     */
    async onOpenTextDocument(editor) {
        if (lodash_1.default.isUndefined(editor) ||
            lodash_1.default.isUndefined(this.treeView) ||
            lodash_1.default.isUndefined(this._provider) ||
            !this.treeView ||
            !this.treeView.visible) {
            return;
        }
        const doc = editor.document;
        if (!doc.fileName.endsWith("md")) {
            return;
        }
        const note = await this.wsUtils.getNoteFromDocument(doc);
        if (note && note.length > 0) {
            await this._provider.prepNodeForReveal(note[0].id);
            this.treeView.reveal(note[0].id, { focus: false, expand: 3 });
        }
    }
};
exports.NativeTreeView = NativeTreeView;
exports.NativeTreeView = NativeTreeView = __decorate([
    (0, inject_1.injectable)(),
    __metadata("design:paramtypes", [EngineNoteProvider_1.EngineNoteProvider,
        WSUtils_1.WSUtilsWeb])
], NativeTreeView);
//# sourceMappingURL=NativeTreeView.js.map