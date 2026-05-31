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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteLookupCmd = void 0;
const common_all_1 = require("@dendronhq/common-all");
const inject_1 = require("../../di/inject");
const vscode = __importStar(require("vscode"));
const vscode_uri_1 = require("vscode-uri");
const constants_1 = require("../../constants");
const LookupQuickpickFactory_1 = require("./lookup/LookupQuickpickFactory");
let NoteLookupCmd = class NoteLookupCmd {
    factory;
    wsRoot;
    engine;
    noteProvider;
    _analytics;
    constructor(factory, wsRoot, engine, noteProvider, _analytics) {
        this.factory = factory;
        this.wsRoot = wsRoot;
        this.engine = engine;
        this.noteProvider = noteProvider;
        this._analytics = _analytics;
    }
    async run() {
        this._analytics.track(constants_1.DENDRON_COMMANDS.LOOKUP_NOTE.key);
        const result = await this.factory.showLookup({
            provider: this.noteProvider,
        });
        if (!result) {
            return;
        }
        let isNew = false;
        await Promise.all(result.items.map(async (value) => {
            if (value.label === "Create New") {
                isNew = true;
                const newNote = common_all_1.NoteUtils.create({
                    fname: value.fname,
                    vault: value.vault,
                });
                // TODO: Add Schema and Template functionality
                // const newNote = NoteUtils.createWithSchema({
                //   noteOpts: {
                //     fname: value.fname,
                //     vault: value.vault,
                //   },
                //   engine: this.engine as DEngineClient, // TODO: Remove cast
                // });
                // await TemplateUtils.findAndApplyTemplate({
                //   note: newNote,
                //   engine: client,
                //   pickNote: async (choices: NoteProps[]) => {
                //     return WSUtilsV2.instance().promptForNoteAsync({
                //       notes: choices,
                //       quickpickTitle:
                //         "Select which template to apply or press [ESC] to not apply a template",
                //       nonStubOnly: true,
                //     });
                //   },
                // });
                // note = _.merge(newNote, overrides || {});
                const res = await this.engine.writeNote(newNote);
                if (res.error) {
                    vscode.window.showErrorMessage(`Failed to write note to engine! Error: ${res.error}`);
                }
            }
            const doc = await vscode.workspace.openTextDocument(
            // TODO: Replace with getURIForNote utils method
            vscode_uri_1.Utils.joinPath(this.wsRoot, common_all_1.VaultUtils.getRelPath(value.vault), value.fname + ".md"));
            await vscode.window.showTextDocument(doc);
        }));
        this._analytics.track(common_all_1.VSCodeEvents.NoteLookup_Accept, { isNew });
    }
};
exports.NoteLookupCmd = NoteLookupCmd;
exports.NoteLookupCmd = NoteLookupCmd = __decorate([
    (0, inject_1.injectable)(),
    __param(1, (0, inject_1.inject)("wsRoot")),
    __param(2, (0, inject_1.inject)("ReducedDEngine")),
    __param(3, (0, inject_1.inject)("NoteProvider")),
    __param(4, (0, inject_1.inject)("ITelemetryClient")),
    __metadata("design:paramtypes", [LookupQuickpickFactory_1.LookupQuickpickFactory,
        vscode_uri_1.URI, Object, Object, Object])
], NoteLookupCmd);
//# sourceMappingURL=NoteLookupCmd.js.map