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
exports.TogglePreviewCmd = void 0;
const _ = __importStar(require("lodash"));
const inject_1 = require("../../di/inject");
const vscode = __importStar(require("vscode"));
const constants_1 = require("../../constants");
const WSUtils_1 = require("../utils/WSUtils");
/**
 * Command to show the preview. If the desire is to programmatically show the
 * preview webview, then prefer to get an instance of {@link PreviewProxy}
 * instead of creating an instance of this command.
 */
let TogglePreviewCmd = class TogglePreviewCmd {
    _analytics;
    wsUtils;
    key = constants_1.DENDRON_COMMANDS.TOGGLE_PREVIEW.key;
    _panel;
    constructor(previewPanel, _analytics, 
    // @inject("wsRoot") private wsRoot: URI, // This will be needed later for openFile functionality
    wsUtils) {
        this._analytics = _analytics;
        this.wsUtils = wsUtils;
        this._panel = previewPanel;
    }
    async run() {
        this._analytics.track(constants_1.DENDRON_COMMANDS.TOGGLE_PREVIEW.key, {
            providedFile: false,
        });
        if (!this.shouldShowPreview()) {
            return;
        }
        // Hide (dispose) the preview panel when it's already visible
        if (this._panel.isVisible()) {
            this._panel.hide();
            return undefined;
        }
        const note = await this.wsUtils.getActiveNote();
        await this._panel.show();
        if (note) {
            await this._panel.show(note);
            return { note };
            // } else if (opts?.fsPath) {
            //   const fsPath = opts.fsPath;
            //   // We can't find the note, so this is not in the Dendron workspace.
            //   // Preview the file anyway if it's a markdown file.
            //   await this.openFileInPreview(fsPath);
            //   return { fsPath };
        }
        // TODO: Add back open file functionality
        // else {
        //   // Not file selected for preview, default to open file
        //   const editor = vscode.window.activeTextEditor;
        //   if (editor) {
        //     const fsPath = editor.document.uri.fsPath;
        //     await this.openFileInPreview(fsPath);
        //     return { fsPath };
        //   }
        // }
        return undefined;
    }
    shouldShowPreview(opts) {
        return !(_.isUndefined(vscode.window.activeTextEditor) &&
            _.isEmpty(opts) &&
            !this._panel.isVisible());
    }
};
exports.TogglePreviewCmd = TogglePreviewCmd;
exports.TogglePreviewCmd = TogglePreviewCmd = __decorate([
    (0, inject_1.injectable)(),
    __param(0, (0, inject_1.inject)("PreviewProxy")),
    __param(1, (0, inject_1.inject)("ITelemetryClient")),
    __metadata("design:paramtypes", [Object, Object, WSUtils_1.WSUtilsWeb])
], TogglePreviewCmd);
//# sourceMappingURL=TogglePreviewCmd.js.map