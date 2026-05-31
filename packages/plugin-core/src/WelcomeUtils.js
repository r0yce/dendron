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
exports.WelcomePageMedia = void 0;
exports.showWelcome = showWelcome;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const lodash_1 = __importDefault(require("lodash"));
const semver_1 = __importDefault(require("semver"));
const vscode = __importStar(require("vscode"));
const LaunchTutorialWorkspaceCommand_1 = require("./commands/LaunchTutorialWorkspaceCommand");
const constants_1 = require("./constants");
const analytics_1 = require("./utils/analytics");
const vsCodeUtils_1 = require("./vsCodeUtils");
async function initWorkspace() {
    // ^z5hpzc3fdkxs
    await analytics_1.AnalyticsUtils.trackForNextRun(common_all_1.TutorialEvents.ClickStart);
    await new LaunchTutorialWorkspaceCommand_1.LaunchTutorialWorkspaceCommand().run({
        invocationPoint: constants_1.LaunchTutorialCommandInvocationPoint.WelcomeWebview,
    });
    return;
}
/**
 * video formats are supported above vscode version 1.71. For users below this version,
 * we render gif in welcome page
 */
var WelcomePageMedia;
(function (WelcomePageMedia) {
    WelcomePageMedia["gif"] = "gif";
    WelcomePageMedia["video"] = "video";
})(WelcomePageMedia || (exports.WelcomePageMedia = WelcomePageMedia = {}));
function showWelcome(assetUri) {
    try {
        let content;
        let testgroup;
        if (semver_1.default.gte(vscode.version, "1.71.0")) {
            const videoUri = vsCodeUtils_1.VSCodeUtils.joinPath(assetUri, "dendron-ws", "vault", "welcome_video.html");
            content = (0, common_server_1.readMD)(videoUri.fsPath).content;
            testgroup = WelcomePageMedia.video;
        }
        else {
            // NOTE: this needs to be from extension because no workspace might exist at this point
            const uri = vsCodeUtils_1.VSCodeUtils.joinPath(assetUri, "dendron-ws", "vault", "welcome.html");
            content = (0, common_server_1.readMD)(uri.fsPath).content;
            testgroup = WelcomePageMedia.gif;
        }
        const title = "Welcome to Dendron";
        const panel = vscode.window.createWebviewPanel(lodash_1.default.kebabCase(title), title, vscode.ViewColumn.One, {
            enableScripts: true,
        });
        panel.webview.html = content;
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case "loaded":
                    analytics_1.AnalyticsUtils.track(common_all_1.TutorialEvents.WelcomeShow, { testgroup });
                    return;
                case "initializeWorkspace": {
                    // ^z5hpzc3fdkxs
                    await initWorkspace();
                    return;
                }
                default:
                    break;
            }
        }, undefined, undefined);
        return;
    }
    catch (err) {
        vscode.window.showErrorMessage(JSON.stringify(err));
        return;
    }
}
//# sourceMappingURL=WelcomeUtils.js.map