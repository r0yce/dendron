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
exports.StartupPrompts = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const luxon_1 = require("luxon");
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
const stateService_1 = require("../services/stateService");
const survey_1 = require("../survey");
const WelcomeUtils_1 = require("../WelcomeUtils");
const analytics_1 = require("./analytics");
class StartupPrompts {
    static async showLapsedUserMessageIfNecessary(opts) {
        if (StartupPrompts.shouldDisplayLapsedUserMsg()) {
            await StartupPrompts.showLapsedUserMessage(opts.assetUri);
        }
    }
    static shouldDisplayLapsedUserMsg() {
        const ONE_DAY = luxon_1.Duration.fromObject({ days: 1 });
        const ONE_WEEK = luxon_1.Duration.fromObject({ weeks: 1 });
        const CUR_TIME = luxon_1.Duration.fromObject({ seconds: common_all_1.Time.now().toSeconds() });
        const metaData = engine_server_1.MetadataService.instance().getMeta();
        // If we haven't prompted the user yet and it's been a day since their
        // initial install OR if it's been one week since we last prompted the user
        const lapsedUserMsgSendTime = metaData.lapsedUserMsgSendTime;
        if (lapsedUserMsgSendTime !== undefined) {
            engine_server_1.MetadataService.instance().setLapsedUserSurveyStatus(engine_server_1.LapsedUserSurveyStatusEnum.cancelled);
        }
        const timeFromFirstInstall = CUR_TIME.minus(luxon_1.Duration.fromObject({ seconds: metaData.firstInstall }));
        const timeFromLastLapsedUserMsg = CUR_TIME.minus(luxon_1.Duration.fromObject({ seconds: metaData.lapsedUserMsgSendTime }));
        const refreshMsg = (metaData.lapsedUserMsgSendTime === undefined &&
            ONE_DAY <= timeFromFirstInstall) ||
            (metaData.lapsedUserMsgSendTime !== undefined &&
                ONE_WEEK <= timeFromLastLapsedUserMsg);
        // If the user has never initialized, has never activated a dendron workspace,
        // and it's time to refresh the lapsed user message
        return (!metaData.dendronWorkspaceActivated &&
            !metaData.firstWsInitialize &&
            refreshMsg);
    }
    static async showLapsedUserMessage(assetUri) {
        const START_TITLE = "Get Started";
        analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.ShowLapsedUserMessage);
        engine_server_1.MetadataService.instance().setLapsedUserMsgSendTime();
        vscode.window
            .showInformationMessage("Hey, we noticed you haven't started using Dendron yet. Would you like to get started?", { modal: true }, { title: START_TITLE })
            .then(async (resp) => {
            if (resp?.title === START_TITLE) {
                analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.LapsedUserMessageAccepted);
                (0, WelcomeUtils_1.showWelcome)(assetUri);
            }
            else {
                analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.LapsedUserMessageRejected);
                const lapsedSurveySubmittedState = await stateService_1.StateService.instance().getGlobalState(constants_1.GLOBAL_STATE.LAPSED_USER_SURVEY_SUBMITTED);
                if (lapsedSurveySubmittedState) {
                    engine_server_1.MetadataService.instance().setLapsedUserSurveyStatus(engine_server_1.LapsedUserSurveyStatusEnum.submitted);
                }
                const lapsedUserSurveySubmitted = engine_server_1.MetadataService.instance().getLapsedUserSurveyStatus();
                if (lapsedUserSurveySubmitted !== engine_server_1.LapsedUserSurveyStatusEnum.submitted) {
                    await survey_1.SurveyUtils.showLapsedUserSurvey();
                }
                return;
            }
        });
    }
}
exports.StartupPrompts = StartupPrompts;
//# sourceMappingURL=StartupPrompts.js.map