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
exports.TutorialInitializer = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const TogglePreview_1 = require("../commands/TogglePreview");
const PreviewViewFactory_1 = require("../components/views/PreviewViewFactory");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const FeatureShowcaseToaster_1 = require("../showcase/FeatureShowcaseToaster");
const ObsidianImportTip_1 = require("../showcase/ObsidianImportTip");
const survey_1 = require("../survey");
const analytics_1 = require("../utils/analytics");
const vsCodeUtils_1 = require("../vsCodeUtils");
const workspace_1 = require("../workspace");
const blankInitializer_1 = require("./blankInitializer");
const TogglePreviewLock_1 = require("../commands/TogglePreviewLock");
/**
 * Workspace Initializer for the Tutorial Experience. Copies tutorial notes and
 * launches the user into the tutorial layout after the workspace is opened.
 */
class TutorialInitializer extends blankInitializer_1.BlankInitializer {
    static getTutorialType() {
        if ((0, common_all_1.isABTest)(common_all_1.CURRENT_TUTORIAL_TEST)) {
            // NOTE: to force a tutorial group, uncomment the below code
            // return QuickstartTutorialTestGroups.
            return common_all_1.CURRENT_TUTORIAL_TEST.getUserGroup(common_server_1.SegmentClient.instance().anonymousId);
        }
        else {
            return common_all_1.MAIN_TUTORIAL_TYPE_NAME;
        }
    }
    async onWorkspaceCreation(opts) {
        super.onWorkspaceCreation(opts);
        engine_server_1.MetadataService.instance().setActivationContext(engine_server_1.WorkspaceActivationContext.tutorial);
        const assetUri = vsCodeUtils_1.VSCodeUtils.getAssetUri(workspace_1.DendronExtension.context());
        const dendronWSTemplate = vsCodeUtils_1.VSCodeUtils.joinPath(assetUri, "dendron-ws");
        const vpath = (0, common_server_1.vault2Path)({ vault: opts.wsVault, wsRoot: opts.wsRoot });
        const tutorialDir = TutorialInitializer.getTutorialType();
        fs_extra_1.default.copySync(path_1.default.join(dendronWSTemplate.fsPath, "tutorial", "treatments", tutorialDir), vpath);
        // 3 minutes after setup, try to show this toast if we haven't already tried
        setTimeout(() => {
            this.tryShowImportNotesFeatureToaster();
        }, 1000 * 60 * 3);
    }
    getAnalyticsPayloadFromDocument(opts) {
        const { document, ws } = opts;
        const tutorialType = TutorialInitializer.getTutorialType();
        const fsPath = document.uri.fsPath;
        const { vaults, wsRoot } = ws;
        const vault = common_all_1.VaultUtils.getVaultByFilePath({ vaults, wsRoot, fsPath });
        const resp = (0, common_server_1.file2Note)(fsPath, vault);
        if (common_all_1.ErrorUtils.isErrorResp(resp)) {
            throw resp.error;
        }
        const note = resp.data;
        const { fname, custom } = note;
        const { currentStep, totalSteps } = custom;
        return {
            tutorialType,
            fname,
            currentStep,
            totalSteps,
        };
    }
    async onWorkspaceOpen(opts) {
        const ctx = "TutorialInitializer.onWorkspaceOpen";
        // Register a special analytics handler for the tutorial:
        // This needs to be registered before we open any tutorial note.
        // Otherwise some events may be lost and not reported properly.
        const disposable = vscode.window.onDidChangeActiveTextEditor((e) => {
            const document = e?.document;
            if (document !== undefined) {
                try {
                    const payload = this.getAnalyticsPayloadFromDocument({
                        document,
                        ws: opts.ws,
                    });
                    const { fname } = payload;
                    if (fname.includes("tutorial")) {
                        analytics_1.AnalyticsUtils.track(common_all_1.TutorialEvents.TutorialNoteViewed, payload);
                        // Show import notes tip when they're on the final page of the tutorial.
                        if (payload.currentStep === payload.totalSteps) {
                            this.tryShowImportNotesFeatureToaster();
                        }
                    }
                }
                catch (err) {
                    logger_1.Logger.info({ ctx, msg: "Cannot get payload from document." });
                }
            }
        });
        ExtensionProvider_1.ExtensionProvider.getExtension().context.subscriptions.push(disposable);
        const { wsRoot, vaults } = opts.ws;
        const vaultRelPath = common_all_1.VaultUtils.getRelPath(vaults[0]); // safe: tutorial initializer assumes non-empty vaults (Batch 5+ noUnchecked guard; invariant from ws init)
        const rootUri = vscode.Uri.file(path_1.default.join(wsRoot, vaultRelPath, "tutorial.md"));
        if (fs_extra_1.default.pathExistsSync(rootUri.fsPath)) {
            // Set the view to have the tutorial page showing with the preview opened to the side.
            await vscode.window.showTextDocument(rootUri);
            if ((0, common_all_1.getStage)() !== "test") {
                const preview = PreviewViewFactory_1.PreviewPanelFactory.create(ExtensionProvider_1.ExtensionProvider.getExtension());
                // TODO: HACK to wait for existing preview to be ready
                setTimeout(async () => {
                    await new TogglePreview_1.TogglePreviewCommand(preview).execute();
                    if (common_all_1.CURRENT_TUTORIAL_TEST?.getUserGroup(common_server_1.SegmentClient.instance().anonymousId) === common_all_1.QuickstartTutorialTestGroups["quickstart-with-lock"]) {
                        await new TogglePreviewLock_1.TogglePreviewLockCommand(preview).execute();
                    }
                }, 1000);
            }
        }
        else {
            logger_1.Logger.error({
                ctx,
                error: new common_all_1.DendronError({ message: `Unable to find tutorial.md` }),
            });
        }
        engine_server_1.MetadataService.instance().setActivationContext(engine_server_1.WorkspaceActivationContext.normal);
        const metaData = engine_server_1.MetadataService.instance().getMeta();
        const initialSurveySubmitted = metaData.initialSurveyStatus === engine_server_1.InitialSurveyStatusEnum.submitted;
        if (!initialSurveySubmitted) {
            await survey_1.SurveyUtils.showInitialSurvey();
        }
    }
    triedToShowImportToast = false;
    tryShowImportNotesFeatureToaster() {
        if (!this.triedToShowImportToast) {
            const toaster = new FeatureShowcaseToaster_1.FeatureShowcaseToaster();
            // This will only show if the user indicated they've used Obsidian in 'Prior Tools'
            toaster.showSpecificToast(new ObsidianImportTip_1.ObsidianImportTip());
            this.triedToShowImportToast = true;
        }
    }
    async onWorkspaceActivate(opts) {
        const skipOpts = opts.skipOpts;
        if (!skipOpts?.skipTreeView) {
            // for tutorial workspaces,
            // we want the tree view to be focused
            // so that new users can discover the tree view feature.
            vscode.commands.executeCommand("dendron.treeView.focus");
        }
    }
}
exports.TutorialInitializer = TutorialInitializer;
//# sourceMappingURL=tutorialInitializer.js.map