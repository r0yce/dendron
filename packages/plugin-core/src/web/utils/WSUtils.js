"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
exports.WSUtilsWeb = void 0;
const common_all_1 = require("@dendronhq/common-all");
const inject_1 = require("../../di/inject");
const vscode_1 = __importDefault(require("vscode"));
const vscode_uri_1 = require("vscode-uri");
let WSUtilsWeb = class WSUtilsWeb {
    engine;
    wsRoot;
    vaults;
    constructor(engine, wsRoot, vaults) {
        this.engine = engine;
        this.wsRoot = wsRoot;
        this.vaults = vaults;
    }
    getVaultFromDocument(document) {
        const txtPath = document.uri.fsPath;
        const vault = common_all_1.VaultUtils.getVaultByFilePath({
            wsRoot: (0, common_all_1.normalizeUnixPath)(this.wsRoot.fsPath),
            vaults: this.vaults,
            fsPath: (0, common_all_1.normalizeUnixPath)(txtPath),
        });
        return vault;
    }
    getNoteFromDocument(document) {
        const txtPath = document.uri;
        const fname = vscode_uri_1.Utils.basename(txtPath).slice(0, -3); //remove .md;
        let vault;
        try {
            vault = this.getVaultFromDocument(document);
        }
        catch (err) {
            // No vault
            return undefined;
        }
        return this.engine.findNotes({
            fname,
            vault,
        });
    }
    async getActiveNote() {
        const editor = vscode_1.default.window.activeTextEditor;
        if (!editor) {
            return undefined;
        }
        const notes = await this.getNoteFromDocument(editor.document);
        if (!notes || notes.length !== 1) {
            return undefined;
        }
        return notes[0];
    }
    /**
     * Returns a URI for a given fname/vault combination. Note - this will return
     * a URI, even if a valid note doesn't exist at the specified location/vault.
     * @param fname
     * @param vault
     */
    async getURIForNote(fname, vault) {
        return vscode_uri_1.Utils.joinPath(this.wsRoot, common_all_1.VaultUtils.getRelPath(vault), fname + ".md");
    }
};
exports.WSUtilsWeb = WSUtilsWeb;
exports.WSUtilsWeb = WSUtilsWeb = __decorate([
    (0, inject_1.injectable)(),
    __param(0, (0, inject_1.inject)("ReducedDEngine")),
    __param(1, (0, inject_1.inject)("wsRoot")),
    __param(2, (0, inject_1.inject)("vaults")),
    __metadata("design:paramtypes", [Object, vscode_uri_1.URI, Array])
], WSUtilsWeb);
//# sourceMappingURL=WSUtils.js.map