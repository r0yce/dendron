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
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const mocha_1 = require("mocha");
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const constants_1 = require("../../constants");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const stateService_1 = require("../../services/stateService");
const survey_1 = require("../../survey");
const StartupPrompts_1 = require("../../utils/StartupPrompts");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const tutorialInitializer_1 = require("../../workspace/tutorialInitializer");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("SurveyUtils", function () {
    (0, mocha_1.describe)("showInitialSurvey", () => {
        let homeDirStub;
        let stateStub;
        let surveySpy;
        (0, testUtilsV3_1.describeMultiWS)("GIVEN INITIAL_SURVEY_SUBMITTED is not set", {
            beforeHook: async () => {
                await (0, testUtilsv2_1.resetCodeWorkspace)();
                homeDirStub = engine_test_utils_1.TestEngineUtils.mockHomeDir();
            },
        }, () => {
            (0, mocha_1.after)(() => {
                homeDirStub.restore();
            });
            (0, mocha_1.beforeEach)(() => {
                stateStub = sinon_1.default
                    .stub(stateService_1.StateService.instance(), "getGlobalState")
                    .resolves(undefined);
                surveySpy = sinon_1.default.spy(survey_1.SurveyUtils, "showInitialSurvey");
            });
            (0, mocha_1.afterEach)(() => {
                stateStub.restore();
                surveySpy.restore();
            });
            (0, mocha_1.describe)("AND initialSurveyStatus is not set", () => {
                test("THEN showInitialSurvey is called", async () => {
                    const tutorialInitializer = new tutorialInitializer_1.TutorialInitializer();
                    const ws = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    (0, testUtilsv2_1.expect)(engine_server_1.MetadataService.instance().getMeta().initialSurveyStatus).toEqual(undefined);
                    (0, testUtilsv2_1.expect)(await stateService_1.StateService.instance().getGlobalState(constants_1.GLOBAL_STATE.INITIAL_SURVEY_SUBMITTED)).toEqual(undefined);
                    await tutorialInitializer.onWorkspaceOpen({ ws });
                    (0, testUtilsv2_1.expect)(surveySpy.calledOnce).toBeTruthy();
                });
            });
            (0, mocha_1.describe)("AND initialSurveyStatus is set to cancelled", () => {
                test("THEN showInitialSurvey is called", async () => {
                    const tutorialInitializer = new tutorialInitializer_1.TutorialInitializer();
                    const ws = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    engine_server_1.MetadataService.instance().setInitialSurveyStatus(engine_server_1.InitialSurveyStatusEnum.cancelled);
                    (0, testUtilsv2_1.expect)(await stateService_1.StateService.instance().getGlobalState(constants_1.GLOBAL_STATE.INITIAL_SURVEY_SUBMITTED)).toEqual(undefined);
                    await tutorialInitializer.onWorkspaceOpen({ ws });
                    (0, testUtilsv2_1.expect)(surveySpy.calledOnce).toBeTruthy();
                });
            });
            (0, mocha_1.describe)("AND initialSurveyStatus is set to submitted", () => {
                test("THEN showInitialSurvey is not called", async () => {
                    const tutorialInitializer = new tutorialInitializer_1.TutorialInitializer();
                    const ws = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    engine_server_1.MetadataService.instance().setInitialSurveyStatus(engine_server_1.InitialSurveyStatusEnum.submitted);
                    (0, testUtilsv2_1.expect)(await stateService_1.StateService.instance().getGlobalState(constants_1.GLOBAL_STATE.INITIAL_SURVEY_SUBMITTED)).toEqual(undefined);
                    await tutorialInitializer.onWorkspaceOpen({ ws });
                    (0, testUtilsv2_1.expect)(surveySpy.calledOnce).toBeFalsy();
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("GIVEN INITIAL_SURVEY_SUBMITTED is set", {
            beforeHook: async () => {
                await (0, testUtilsv2_1.resetCodeWorkspace)();
                homeDirStub = engine_test_utils_1.TestEngineUtils.mockHomeDir();
            },
        }, () => {
            (0, mocha_1.after)(() => {
                homeDirStub.restore();
            });
            (0, mocha_1.beforeEach)(() => {
                stateStub = sinon_1.default
                    .stub(stateService_1.StateService.instance(), "getGlobalState")
                    .resolves("submitted");
                surveySpy = sinon_1.default.spy(survey_1.SurveyUtils, "showInitialSurvey");
            });
            (0, mocha_1.afterEach)(() => {
                stateStub.restore();
                surveySpy.restore();
            });
            (0, mocha_1.describe)("AND initialSurveyStatus is set to submitted", () => {
                test("THEN showInitialSurvey is not called", async () => {
                    const tutorialInitializer = new tutorialInitializer_1.TutorialInitializer();
                    const ws = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    engine_server_1.MetadataService.instance().setInitialSurveyStatus(engine_server_1.InitialSurveyStatusEnum.submitted);
                    (0, testUtilsv2_1.expect)(await stateService_1.StateService.instance().getGlobalState(constants_1.GLOBAL_STATE.INITIAL_SURVEY_SUBMITTED)).toEqual("submitted");
                    await tutorialInitializer.onWorkspaceOpen({ ws });
                    (0, testUtilsv2_1.expect)(surveySpy.calledOnce).toBeFalsy();
                });
            });
        });
    });
    (0, mocha_1.describe)("showLapsedUserSurvey", () => {
        let homeDirStub;
        let stateStub;
        let surveySpy;
        let infoMsgStub;
        (0, testUtilsV3_1.describeMultiWS)("GIVEN LAPSED_USER_SURVEY_SUBMITTED is not set", {
            beforeHook: async () => {
                await (0, testUtilsv2_1.resetCodeWorkspace)();
                homeDirStub = engine_test_utils_1.TestEngineUtils.mockHomeDir();
            },
        }, (ctx) => {
            (0, mocha_1.after)(() => {
                homeDirStub.restore();
            });
            (0, mocha_1.beforeEach)(() => {
                stateStub = sinon_1.default
                    .stub(stateService_1.StateService.instance(), "getGlobalState")
                    .resolves(undefined);
                surveySpy = sinon_1.default.spy(survey_1.SurveyUtils, "showLapsedUserSurvey");
                infoMsgStub = sinon_1.default
                    .stub(vscode.window, "showInformationMessage")
                    .resolves({ title: "foo" });
            });
            (0, mocha_1.afterEach)(() => {
                stateStub.restore();
                surveySpy.restore();
                infoMsgStub.restore();
            });
            (0, mocha_1.describe)("AND lapsedUserSurveyStatus is not set", () => {
                test("THEN showLapsedUserSurvey is called", async () => {
                    await StartupPrompts_1.StartupPrompts.showLapsedUserMessage(vsCodeUtils_1.VSCodeUtils.getAssetUri(ctx));
                    await new Promise((resolve) => {
                        setTimeout(() => {
                            resolve();
                        }, 1);
                    });
                    (0, testUtilsv2_1.expect)(surveySpy.calledOnce).toBeTruthy();
                });
            });
            (0, mocha_1.describe)("AND lapsedUserSurveyStatus is set to submitted", () => {
                test("THEN showLapsedUserSurvey is not called", async () => {
                    engine_server_1.MetadataService.instance().setLapsedUserSurveyStatus(engine_server_1.LapsedUserSurveyStatusEnum.submitted);
                    await StartupPrompts_1.StartupPrompts.showLapsedUserMessage(vsCodeUtils_1.VSCodeUtils.getAssetUri(ctx));
                    await new Promise((resolve) => {
                        setTimeout(() => {
                            resolve();
                        }, 1);
                    });
                    (0, testUtilsv2_1.expect)(surveySpy.calledOnce).toBeFalsy();
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("GIVEN LAPSED_USER_SURVEY_SUBMITTED is set", {
            beforeHook: async () => {
                await (0, testUtilsv2_1.resetCodeWorkspace)();
                homeDirStub = engine_test_utils_1.TestEngineUtils.mockHomeDir();
            },
        }, (ctx) => {
            (0, mocha_1.after)(() => {
                homeDirStub.restore();
            });
            (0, mocha_1.beforeEach)(() => {
                stateStub = sinon_1.default
                    .stub(stateService_1.StateService.instance(), "getGlobalState")
                    .resolves("submitted");
                surveySpy = sinon_1.default.spy(survey_1.SurveyUtils, "showLapsedUserSurvey");
                infoMsgStub = sinon_1.default
                    .stub(vscode.window, "showInformationMessage")
                    .resolves({ title: "foo" });
            });
            (0, mocha_1.afterEach)(() => {
                stateStub.restore();
                surveySpy.restore();
                infoMsgStub.restore();
            });
            (0, mocha_1.describe)("AND lapsedUserSurveyStatus is not set", () => {
                test("THEN metadata is backfilled AND showLapsedUserSurvye is not called", async () => {
                    // metadata is not set yet, we expect this to be backfilled.
                    (0, testUtilsv2_1.expect)(engine_server_1.MetadataService.instance().getLapsedUserSurveyStatus()).toEqual(undefined);
                    // global state is already set.
                    (0, testUtilsv2_1.expect)(await stateService_1.StateService.instance().getGlobalState(constants_1.GLOBAL_STATE.LAPSED_USER_SURVEY_SUBMITTED)).toEqual("submitted");
                    await StartupPrompts_1.StartupPrompts.showLapsedUserMessage(vsCodeUtils_1.VSCodeUtils.getAssetUri(ctx));
                    await new Promise((resolve) => {
                        setTimeout(() => {
                            resolve();
                        }, 1);
                    });
                    (0, testUtilsv2_1.expect)(surveySpy.calledOnce).toBeFalsy();
                    // metadata is backfilled.
                    (0, testUtilsv2_1.expect)(engine_server_1.MetadataService.instance().getLapsedUserSurveyStatus()).toEqual(engine_server_1.LapsedUserSurveyStatusEnum.submitted);
                });
            });
            (0, mocha_1.describe)("AND lapsedUserSurveyStatus is set to submitted", () => {
                test("THEN showLapsedUserSurvey is not called", async () => {
                    (0, testUtilsv2_1.expect)(engine_server_1.MetadataService.instance().getLapsedUserSurveyStatus()).toEqual(engine_server_1.LapsedUserSurveyStatusEnum.submitted);
                    (0, testUtilsv2_1.expect)(await stateService_1.StateService.instance().getGlobalState(constants_1.GLOBAL_STATE.LAPSED_USER_SURVEY_SUBMITTED)).toEqual("submitted");
                    await StartupPrompts_1.StartupPrompts.showLapsedUserMessage(vsCodeUtils_1.VSCodeUtils.getAssetUri(ctx));
                    await new Promise((resolve) => {
                        setTimeout(() => {
                            resolve();
                        }, 1);
                    });
                    (0, testUtilsv2_1.expect)(surveySpy.calledOnce).toBeFalsy();
                });
            });
        });
    });
});
//# sourceMappingURL=Survey.test.js.map