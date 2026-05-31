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
var CopyNoteURLCmd_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyNoteURLCmd = void 0;
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const WSUtils_1 = require("../utils/WSUtils");
const SiteUtilsWeb_1 = require("../utils/SiteUtilsWeb");
const inject_1 = require("../../di/inject");
const constants_1 = require("../../constants");
let CopyNoteURLCmd = class CopyNoteURLCmd {
    static { CopyNoteURLCmd_1 = this; }
    wsUtils;
    _analytics;
    siteUtils;
    static key = constants_1.DENDRON_COMMANDS.COPY_NOTE_URL.key;
    constructor(wsUtils, _analytics, siteUtils) {
        this.wsUtils = wsUtils;
        this._analytics = _analytics;
        this.siteUtils = siteUtils;
    }
    async showFeedback(link) {
        vscode_1.window.showInformationMessage(`${link} copied`);
    }
    async run() {
        this._analytics.track(CopyNoteURLCmd_1.key);
        const maybeTextEditor = this.getActiveTextEditor();
        if (lodash_1.default.isUndefined(maybeTextEditor)) {
            vscode_1.window.showErrorMessage("no active document found");
            return;
        }
        const vault = this.wsUtils.getVaultFromDocument(maybeTextEditor.document);
        const notes = await this.wsUtils.getNoteFromDocument(maybeTextEditor.document);
        if (!notes || notes.length !== 1) {
            vscode_1.window.showErrorMessage("You need to be in a note to use this command");
            return;
        }
        const link = this.siteUtils?.getNoteUrl({
            note: notes[0],
            vault,
        });
        if (link) {
            this.showFeedback(link);
            vscode_1.env.clipboard.writeText(link);
        }
        return link;
    }
    getActiveTextEditor() {
        return vscode_1.window.activeTextEditor;
    }
};
exports.CopyNoteURLCmd = CopyNoteURLCmd;
exports.CopyNoteURLCmd = CopyNoteURLCmd = CopyNoteURLCmd_1 = __decorate([
    (0, inject_1.injectable)(),
    __param(1, (0, inject_1.inject)("ITelemetryClient")),
    __metadata("design:paramtypes", [WSUtils_1.WSUtilsWeb, Object, SiteUtilsWeb_1.SiteUtilsWeb])
], CopyNoteURLCmd);
//# sourceMappingURL=CopyNoteURLCmd.js.map