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
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const mocha_1 = require("mocha");
const fs_extra_1 = __importDefault(require("fs-extra"));
const sinon_1 = __importDefault(require("sinon"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const StartupUtils_1 = require("../../utils/StartupUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const common_server_1 = require("@dendronhq/common-server");
const vscode = __importStar(require("vscode"));
const os_1 = __importDefault(require("os"));
async function inactiveMessageTest(opts) {
    const { done, firstInstall, firstWsInitialize, inactiveUserMsgStatus, inactiveUserMsgSendTime, shouldDisplayMessage, firstLookupTime, lastLookupTime, workspaceActivated, } = opts;
    const svc = engine_server_1.MetadataService.instance();
    svc.setMeta("firstInstall", firstInstall);
    svc.setMeta("firstWsInitialize", firstWsInitialize);
    svc.setMeta("inactiveUserMsgStatus", inactiveUserMsgStatus);
    svc.setMeta("inactiveUserMsgSendTime", inactiveUserMsgSendTime);
    svc.setMeta("dendronWorkspaceActivated", workspaceActivated);
    svc.setMeta("firstLookupTime", firstLookupTime);
    svc.setMeta("lastLookupTime", lastLookupTime);
    const expected = StartupUtils_1.StartupUtils.shouldDisplayInactiveUserSurvey();
    (0, testUtilsv2_1.expect)(expected).toEqual(shouldDisplayMessage);
    sinon_1.default.restore();
    done();
}
function getDefaultConfig() {
    const defaultConfig = {
        ...common_all_1.ConfigUtils.genDefaultConfig(),
    };
    defaultConfig.workspace.vaults = engine_test_utils_1.VAULTS.MULTI_VAULT_WITH_THREE_VAULTS();
    return defaultConfig;
}
suite("GIVEN local config", () => {
    (0, mocha_1.describe)("AND WHEN workspace config is present", () => {
        const configScope = common_server_1.LocalConfigScope.WORKSPACE;
        const defaultConfig = getDefaultConfig();
        const localVaults = [{ fsPath: "vault-local" }];
        (0, testUtilsV3_1.describeMultiWS)("AND given additional vaults in local config", {
            preActivateHook: async ({ wsRoot }) => {
                await common_server_1.DConfig.writeLocalConfig({
                    wsRoot,
                    config: { workspace: { vaults: localVaults } },
                    configScope,
                });
            },
        }, () => {
            test("THEN engine should load with extra workspace", () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                const _defaultConfig = getDefaultConfig();
                _defaultConfig.workspace.vaults = localVaults.concat(defaultConfig.workspace.vaults);
                const config = ext.getDWorkspace().config;
                (0, testUtilsv2_1.expect)(config).toEqual(_defaultConfig);
            });
        });
    });
});
// These tests run on Windows too actually, but fail on the CI. Skipping for now.
(0, mocha_1.describe)("shouldDisplayInactiveUserSurvey", () => {
    const ONE_WEEK = 604800;
    const NOW = common_all_1.Time.now().toSeconds();
    const ONE_WEEK_BEFORE = NOW - ONE_WEEK;
    const TWO_WEEKS_BEFORE = NOW - 2 * ONE_WEEK;
    const THREE_WEEKS_BEFORE = NOW - 3 * ONE_WEEK;
    const FOUR_WEEKS_BEFORE = NOW - 4 * ONE_WEEK;
    const FIVE_WEEKS_BEFORE = NOW - 5 * ONE_WEEK;
    const SIX_WEEKS_BEFORE = NOW - 6 * ONE_WEEK;
    const SEVEN_WEEKS_BEFORE = NOW - 7 * ONE_WEEK;
    (0, mocha_1.describe)("GIVEN not prompted yet", () => {
        (0, mocha_1.describe)("WHEN is first week active user AND inactive for less than four weeks", () => {
            test("THEN should not display inactive user survey", (done) => {
                inactiveMessageTest({
                    done,
                    firstInstall: THREE_WEEKS_BEFORE,
                    firstWsInitialize: THREE_WEEKS_BEFORE,
                    firstLookupTime: THREE_WEEKS_BEFORE,
                    lastLookupTime: THREE_WEEKS_BEFORE,
                    workspaceActivated: true,
                    shouldDisplayMessage: false,
                });
            });
        });
        (0, mocha_1.describe)("WHEN is first week active user AND inactive for at least four weeks", () => {
            test("THEN should display inactive user survey", (done) => {
                inactiveMessageTest({
                    done,
                    firstInstall: FIVE_WEEKS_BEFORE,
                    firstWsInitialize: FIVE_WEEKS_BEFORE,
                    firstLookupTime: FIVE_WEEKS_BEFORE,
                    lastLookupTime: FOUR_WEEKS_BEFORE,
                    workspaceActivated: true,
                    shouldDisplayMessage: true,
                });
            });
        });
    });
    (0, mocha_1.describe)("GIVEN already prompted", () => {
        (0, mocha_1.describe)("WHEN user has submitted", () => {
            test("THEN should never display inactive user survey", (done) => {
                inactiveMessageTest({
                    done,
                    firstInstall: FIVE_WEEKS_BEFORE,
                    firstWsInitialize: FIVE_WEEKS_BEFORE,
                    firstLookupTime: FIVE_WEEKS_BEFORE,
                    lastLookupTime: FOUR_WEEKS_BEFORE,
                    inactiveUserMsgSendTime: TWO_WEEKS_BEFORE,
                    workspaceActivated: true,
                    inactiveUserMsgStatus: "submitted",
                    shouldDisplayMessage: false,
                });
            });
        });
        (0, mocha_1.describe)("WHEN it has been another four weeks since user rejected survey", () => {
            test("THEN should display inactive user survey if inactive", (done) => {
                inactiveMessageTest({
                    done,
                    firstInstall: SEVEN_WEEKS_BEFORE,
                    firstWsInitialize: SEVEN_WEEKS_BEFORE,
                    firstLookupTime: SEVEN_WEEKS_BEFORE,
                    lastLookupTime: SIX_WEEKS_BEFORE,
                    inactiveUserMsgSendTime: FOUR_WEEKS_BEFORE,
                    workspaceActivated: true,
                    inactiveUserMsgStatus: "cancelled",
                    shouldDisplayMessage: true,
                });
            });
            test("THEN should not display inactive user survey if active", (done) => {
                inactiveMessageTest({
                    done,
                    firstInstall: SEVEN_WEEKS_BEFORE,
                    firstWsInitialize: SEVEN_WEEKS_BEFORE,
                    firstLookupTime: SEVEN_WEEKS_BEFORE,
                    lastLookupTime: ONE_WEEK_BEFORE,
                    inactiveUserMsgSendTime: FOUR_WEEKS_BEFORE,
                    workspaceActivated: true,
                    inactiveUserMsgStatus: "cancelled",
                    shouldDisplayMessage: false,
                });
            });
        });
        (0, mocha_1.describe)("WHEN it hasn't been another four weeks since rejected prompt", () => {
            test("THEN should not display inactive user survey", (done) => {
                inactiveMessageTest({
                    done,
                    firstInstall: SEVEN_WEEKS_BEFORE,
                    firstWsInitialize: SEVEN_WEEKS_BEFORE,
                    firstLookupTime: SEVEN_WEEKS_BEFORE,
                    lastLookupTime: SIX_WEEKS_BEFORE,
                    inactiveUserMsgSendTime: THREE_WEEKS_BEFORE,
                    workspaceActivated: true,
                    inactiveUserMsgStatus: "cancelled",
                    shouldDisplayMessage: false,
                });
            });
        });
    });
});
suite("missing default config detection", () => {
    (0, testUtilsV3_1.describeMultiWS)("GIVEN dendron.yml with missing default key", {
        modConfigCb: (config) => {
            // @ts-ignore
            delete config.workspace.workspaceVaultSyncMode;
            return config;
        },
        timeout: 1e5,
    }, () => {
        test("THEN missing defaults are detected", () => {
            const ws = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const config = common_server_1.DConfig.getRaw(ws.wsRoot);
            (0, testUtilsv2_1.expect)(config.workspace?.workspaceVaultSyncMode).toEqual(undefined);
            const out = common_all_1.ConfigUtils.detectMissingDefaults({ config });
            (0, testUtilsv2_1.expect)(out.needsBackfill).toBeTruthy();
            (0, testUtilsv2_1.expect)(out.backfilledConfig.workspace.workspaceVaultSyncMode).toBeTruthy();
        });
    });
    (0, mocha_1.describe)("GIVEN upgraded", () => {
        (0, testUtilsV3_1.describeMultiWS)("AND missing default key", {
            modConfigCb: (config) => {
                // @ts-ignore
                delete config.workspace.workspaceVaultSyncMode;
                return config;
            },
        }, () => {
            test("THEN prompted to add missing defaults", () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                const out = StartupUtils_1.StartupUtils.shouldDisplayMissingDefaultConfigMessage({
                    ext,
                    extensionInstallStatus: common_all_1.InstallStatus.UPGRADED,
                });
                (0, testUtilsv2_1.expect)(out).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("AND not missing default key", {}, () => {
            test("THEN not prompted to add missing defaults", () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                const out = StartupUtils_1.StartupUtils.shouldDisplayMissingDefaultConfigMessage({
                    ext,
                    extensionInstallStatus: common_all_1.InstallStatus.UPGRADED,
                });
                (0, testUtilsv2_1.expect)(out).toBeFalsy();
            });
        });
    });
    (0, mocha_1.describe)("GIVEN not upgraded", () => {
        (0, testUtilsV3_1.describeMultiWS)("AND missing default key", {
            modConfigCb: (config) => {
                // @ts-ignore
                delete config.workspace.workspaceVaultSyncMode;
                return config;
            },
        }, () => {
            test("THEN not prompted to add missing defaults", () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                [common_all_1.InstallStatus.NO_CHANGE, common_all_1.InstallStatus.INITIAL_INSTALL].forEach((extensionInstallStatus) => {
                    const out = StartupUtils_1.StartupUtils.shouldDisplayMissingDefaultConfigMessage({
                        ext,
                        extensionInstallStatus,
                    });
                    (0, testUtilsv2_1.expect)(out).toBeFalsy();
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("AND not missing default key", {}, () => {
            test("THEN not prompted to add missing defaults", () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                [common_all_1.InstallStatus.NO_CHANGE, common_all_1.InstallStatus.INITIAL_INSTALL].forEach((extensionInstallStatus) => {
                    const out = StartupUtils_1.StartupUtils.shouldDisplayMissingDefaultConfigMessage({
                        ext,
                        extensionInstallStatus,
                    });
                    (0, testUtilsv2_1.expect)(out).toBeFalsy();
                });
            });
        });
    });
});
suite("deprecated config detection", () => {
    (0, testUtilsV3_1.describeMultiWS)("GIVEN dendron.yml with deprecated key", {
        modConfigCb: (config) => {
            // @ts-ignore
            config.dev = { enableWebUI: true };
            return config;
        },
        timeout: 1e5,
    }, () => {
        test("THEN deprecated key is detected", () => {
            const ws = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const config = common_server_1.DConfig.getRaw(ws.wsRoot);
            (0, testUtilsv2_1.expect)(config.dev.enableWebUI).toBeTruthy();
            const out = common_all_1.ConfigUtils.detectDeprecatedConfigs({
                config,
                deprecatedPaths: engine_server_1.DEPRECATED_PATHS,
            });
            (0, testUtilsv2_1.expect)(out).toEqual(["dev.enableWebUI"]);
        });
    });
    (0, mocha_1.describe)("GIVEN upgraded", () => {
        (0, testUtilsV3_1.describeMultiWS)("AND deprecated key exists", {
            modConfigCb: (config) => {
                // @ts-ignore
                config.dev = { enableWebUI: true };
                return config;
            },
            timeout: 1e5,
        }, () => {
            test("THEN prompted to remove deprecated config", () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                const out = StartupUtils_1.StartupUtils.shouldDisplayDeprecatedConfigMessage({
                    ext,
                    extensionInstallStatus: common_all_1.InstallStatus.UPGRADED,
                });
                (0, testUtilsv2_1.expect)(out).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("AND deprecated key doesn't exist", {}, () => {
            test("THEN not prompted to remove deprecated config", () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                const out = StartupUtils_1.StartupUtils.shouldDisplayDeprecatedConfigMessage({
                    ext,
                    extensionInstallStatus: common_all_1.InstallStatus.UPGRADED,
                });
                (0, testUtilsv2_1.expect)(out).toBeFalsy();
            });
        });
    });
    (0, mocha_1.describe)("GIVEN not upgraded", () => {
        (0, testUtilsV3_1.describeMultiWS)("AND deprecated key exists", {
            modConfigCb: (config) => {
                // @ts-ignore
                config.dev = { enableWebUI: true };
                return config;
            },
            timeout: 1e5,
        }, () => {
            test("THEN not prompted to remove deprecated config", () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                [common_all_1.InstallStatus.NO_CHANGE, common_all_1.InstallStatus.INITIAL_INSTALL].forEach((extensionInstallStatus) => {
                    const out = StartupUtils_1.StartupUtils.shouldDisplayDeprecatedConfigMessage({
                        ext,
                        extensionInstallStatus,
                    });
                    (0, testUtilsv2_1.expect)(out).toBeFalsy();
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("AND deprecated key doesn't exist", {}, () => {
            test("THEN not prompted to remove deprecated config", () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                [common_all_1.InstallStatus.NO_CHANGE, common_all_1.InstallStatus.INITIAL_INSTALL].forEach((extensionInstallStatus) => {
                    const out = StartupUtils_1.StartupUtils.shouldDisplayDeprecatedConfigMessage({
                        ext,
                        extensionInstallStatus,
                    });
                    (0, testUtilsv2_1.expect)(out).toBeFalsy();
                });
            });
        });
    });
});
suite("duplicate config entry detection", () => {
    (0, testUtilsV3_1.describeMultiWS)("GIVEN dendron.yml with duplicate config", {
        preActivateHook: async ({ wsRoot }) => {
            const configPath = common_server_1.DConfig.configPath(wsRoot);
            let configContent = fs_extra_1.default.readFileSync(configPath, {
                encoding: "utf-8",
            });
            configContent = configContent.replace("    enablePreviewV2: true", "    enablePreviewV2: true\n    enablePreviewV2: false");
            fs_extra_1.default.writeFileSync(configPath, configContent);
        },
    }, () => {
        test("THEN duplicate entry is detected", () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const out = StartupUtils_1.StartupUtils.getDuplicateKeysMessage({
                ext,
            });
            (0, testUtilsv2_1.expect)(out.includes("duplicated mapping key")).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN dendron.yml without duplicate config", {}, () => {
        test("THEN duplicate entry is not detected", () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const out = StartupUtils_1.StartupUtils.getDuplicateKeysMessage({
                ext,
            });
            (0, testUtilsv2_1.expect)(out).toEqual(undefined);
        });
    });
});
suite("localhost blocked on user's machine", () => {
    (0, testUtilsV3_1.describeSingleWS)("GIVEN localhost is blocked on user's machine", { timeout: 5e3 }, () => {
        test("THEN warning toaster with mitigation docs link is displayed", async () => {
            sinon_1.default.stub(engine_server_1.execa, "command").resolves({
                failed: true,
                stderr: Buffer.from("error"),
                stdout: Buffer.from(""),
                isCanceled: false,
                command: "ping",
                escapedCommand: "ping",
                exitCode: 0,
                timedOut: false,
                killed: false,
            });
            const warningToaster = sinon_1.default
                .stub(vscode.window, "showWarningMessage")
                .resolves(undefined);
            await StartupUtils_1.StartupUtils.showWhitelistingLocalhostDocsIfNecessary();
            (0, testUtilsv2_1.expect)(warningToaster.callCount).toEqual(1);
            (0, testUtilsv2_1.expect)(warningToaster.args[0][0]).toEqual("Dendron is facing issues while connecting with localhost. Please ensure that you don't have anything running that can block localhost.");
            (0, testUtilsv2_1.expect)(warningToaster.args[0][1]).toEqual("Open troubleshooting docs");
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN localhost is not blocked user's machine", { timeout: 5e3 }, () => {
        test("THEN dendron inits", async () => {
            const pingArgs = os_1.default.platform() === "win32"
                ? "ping -n 1 127.0.0.1"
                : "ping -c 1 127.0.0.1";
            sinon_1.default
                .stub(engine_server_1.execa, "command")
                .withArgs(pingArgs)
                .resolves({
                failed: false,
                stderr: Buffer.from(""),
                stdout: Buffer.from(""),
                isCanceled: false,
                command: "ping",
                escapedCommand: "ping",
                exitCode: 0,
                timedOut: false,
                killed: false,
            });
            const warningToaster = sinon_1.default
                .stub(vscode.window, "showWarningMessage")
                .resolves(undefined);
            await StartupUtils_1.StartupUtils.showWhitelistingLocalhostDocsIfNecessary();
            (0, testUtilsv2_1.expect)(warningToaster.callCount).toEqual(0);
        });
    });
});
//# sourceMappingURL=Extension.test.js.map