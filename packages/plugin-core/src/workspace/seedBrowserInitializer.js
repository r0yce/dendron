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
exports.SeedBrowserInitializer = void 0;
const engine_server_1 = require("@dendronhq/engine-server");
const vscode = __importStar(require("vscode"));
const SeedBrowseCommand_1 = require("../commands/SeedBrowseCommand");
const workspace_1 = require("../workspace");
/**
 * Seed Browser Workspace Initializer - Open the Seed Browser
 */
class SeedBrowserInitializer {
    /**
     * Launch Seed Browser Webview
     * @param _opts
     */
    async onWorkspaceOpen(_opts) {
        const panel = SeedBrowseCommand_1.WebViewPanelFactory.create((0, workspace_1.getExtension)().workspaceService.seedService);
        const cmd = new SeedBrowseCommand_1.SeedBrowseCommand(panel);
        await cmd.execute();
        engine_server_1.MetadataService.instance().setActivationContext(engine_server_1.WorkspaceActivationContext.normal);
        vscode.window.showInformationMessage("Seeds Updated");
    }
}
exports.SeedBrowserInitializer = SeedBrowserInitializer;
//# sourceMappingURL=seedBrowserInitializer.js.map