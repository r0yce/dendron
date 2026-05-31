"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const mocha_1 = require("mocha");
const sinon_1 = __importDefault(require("sinon"));
const constants_1 = require("../../constants");
const KeybindingUtils_1 = require("../../KeybindingUtils");
const analytics_1 = require("../../utils/analytics");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
/**
 * This is for testing functionality that is only triggered when activating
 * a workspace after installation
 */
suite("GIVEN Dendron plugin activation", function () {
    let setInitialInstallSpy;
    let showTelemetryNoticeSpy;
    let mockHomeDirStub;
    function stubDendronWhenNotFirstInstall() {
        engine_server_1.MetadataService.instance().setInitialInstall();
    }
    function stubDendronWhenFirstInstall(ctx) {
        ctx.globalState.update(constants_1.GLOBAL_STATE.VERSION, undefined);
        engine_server_1.MetadataService.instance().setMeta("welcomeClickedTime", common_all_1.Time.now().toMillis());
    }
    function setupSpies() {
        setInitialInstallSpy = sinon_1.default.spy(engine_server_1.MetadataService.instance(), "setInitialInstall");
        showTelemetryNoticeSpy = sinon_1.default.spy(analytics_1.AnalyticsUtils, "showTelemetryNotice");
    }
    async function afterHook() {
        mockHomeDirStub.restore();
        sinon_1.default.restore();
    }
    (0, mocha_1.describe)("AND WHEN not first install", () => {
        (0, testUtilsV3_1.describeMultiWS)("AND WHEN activate", {
            preActivateHook: async () => {
                mockHomeDirStub = engine_test_utils_1.TestEngineUtils.mockHomeDir();
                stubDendronWhenNotFirstInstall();
                setupSpies();
            },
            afterHook,
            timeout: 1e4,
        }, () => {
            test("THEN set initial install not called", () => {
                (0, testUtilsv2_1.expect)(setInitialInstallSpy.called).toBeFalsy();
            });
            test("THEN do not show telemetry notice", () => {
                (0, testUtilsv2_1.expect)(showTelemetryNoticeSpy.called).toBeFalsy();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("AND WHEN firstInstall not set for old user", {
            preActivateHook: async () => {
                mockHomeDirStub = engine_test_utils_1.TestEngineUtils.mockHomeDir();
                stubDendronWhenNotFirstInstall();
                setupSpies();
                // when check for first install, should be empty
                engine_server_1.MetadataService.instance().deleteMeta("firstInstall");
            },
            afterHook,
            timeout: 1e5,
        }, () => {
            test("THEN set initial install called", () => {
                (0, testUtilsv2_1.expect)(setInitialInstallSpy.calledWith(common_all_1.Time.DateTime.fromISO("2021-06-22").toSeconds())).toBeTruthy();
            });
            test("THEN do not show telemetry notice", () => {
                (0, testUtilsv2_1.expect)(showTelemetryNoticeSpy.called).toBeFalsy();
            });
        });
    });
    (0, mocha_1.describe)("AND WHEN first install", () => {
        (0, testUtilsV3_1.describeMultiWS)("AND WHEN activate", {
            preActivateHook: async ({ ctx }) => {
                mockHomeDirStub = engine_test_utils_1.TestEngineUtils.mockHomeDir();
                setupSpies();
                stubDendronWhenFirstInstall(ctx);
            },
            noSetInstallStatus: true,
            timeout: 1e5,
        }, () => {
            (0, mocha_1.after)(() => afterHook());
            test("THEN set initial install called", () => {
                (0, testUtilsv2_1.expect)(setInitialInstallSpy.called).toBeTruthy();
            });
            test("THEN global version set", () => {
                (0, testUtilsv2_1.expect)(engine_server_1.MetadataService.instance().getGlobalVersion()).toNotEqual(undefined);
            });
            test("THEN show telemetry notice", () => {
                (0, testUtilsv2_1.expect)(showTelemetryNoticeSpy.called).toBeTruthy();
            });
        });
    });
    (0, mocha_1.describe)("AND WHEN secondary install on a fresh vscode instance", () => {
        (0, testUtilsV3_1.describeMultiWS)("AND WHEN activate", {
            preActivateHook: async ({ ctx }) => {
                mockHomeDirStub = engine_test_utils_1.TestEngineUtils.mockHomeDir();
                // new instance, so fresh user-data. global storage is clean slate.
                stubDendronWhenFirstInstall(ctx);
                // but we have first install already recorded in metadata.
                stubDendronWhenNotFirstInstall();
                setupSpies();
            },
            afterHook,
            timeout: 1e4,
            noSetInstallStatus: true,
        }, () => {
            // we prevent this from happening in new vscode instances.
            test("THEN set initial install is not called", () => {
                (0, testUtilsv2_1.expect)(setInitialInstallSpy.called).toBeFalsy();
            });
            // but stil want to set this in the fresh globalStorage of the new vscode instance
            test("THEN global version set", () => {
                (0, testUtilsv2_1.expect)(engine_server_1.MetadataService.instance().getGlobalVersion()).toNotEqual(undefined);
            });
        });
    });
});
suite("GIVEN keybindings conflict", function () {
    let promptSpy;
    let installStatusStub;
    (0, testUtilsV3_1.describeMultiWS)("GIVEN initial install", {
        beforeHook: async () => {
            installStatusStub = sinon_1.default
                .stub(vsCodeUtils_1.VSCodeUtils, "getInstallStatusForExtension")
                .returns(common_all_1.InstallStatus.INITIAL_INSTALL);
            promptSpy = sinon_1.default.spy(KeybindingUtils_1.KeybindingUtils, "maybePromptKeybindingConflict");
        },
        noSetInstallStatus: true,
    }, () => {
        (0, mocha_1.beforeEach)(() => {
            installStatusStub = sinon_1.default
                .stub(KeybindingUtils_1.KeybindingUtils, "getInstallStatusForKnownConflictingExtensions")
                .returns([{ id: "dummyExt", installed: true }]);
        });
        (0, mocha_1.afterEach)(() => {
            installStatusStub.restore();
        });
        (0, mocha_1.after)(() => {
            promptSpy.restore();
        });
        test("THEN maybePromptKeybindingConflict is called", async () => {
            (0, testUtilsv2_1.expect)(promptSpy.called).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN not initial install", {
        beforeHook: async () => {
            promptSpy = sinon_1.default.spy(KeybindingUtils_1.KeybindingUtils, "maybePromptKeybindingConflict");
        },
    }, () => {
        (0, mocha_1.beforeEach)(() => {
            installStatusStub = sinon_1.default
                .stub(KeybindingUtils_1.KeybindingUtils, "getInstallStatusForKnownConflictingExtensions")
                .returns([{ id: "dummyExt", installed: true }]);
        });
        (0, mocha_1.afterEach)(() => {
            installStatusStub.restore();
        });
        (0, mocha_1.after)(() => {
            promptSpy.restore();
        });
        test("THEN maybePromptKeybindingConflict is not called", async () => {
            (0, testUtilsv2_1.expect)(promptSpy.called).toBeFalsy();
        });
    });
});
//# sourceMappingURL=Extension-PostInstall.test.js.map