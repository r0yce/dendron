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
/* eslint-disable no-undef */
const common_server_1 = require("@dendronhq/common-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const pods_core_1 = require("@dendronhq/pods-core");
const fs_extra_1 = require("fs-extra");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const PodControls_1 = require("../../components/pods/PodControls");
const vscode = __importStar(require("vscode"));
const ConfigureServiceConnection_1 = require("../../commands/pods/ConfigureServiceConnection");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const mocha_1 = require("mocha");
suite("ConfigureServiceConnection", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {
        afterHook: () => {
            sinon_1.default.restore();
        },
    });
    (0, mocha_1.describe)("GIVEN Configure Service Connection command is run", () => {
        (0, testUtilsV3_1.describeMultiWS)("WHEN Create New option is selected", {
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            test("THEN new service config must be created", async () => {
                const cmd = new ConfigureServiceConnection_1.ConfigureServiceConnection(ExtensionProvider_1.ExtensionProvider.getExtension());
                sinon_1.default.stub(vscode.window, "showQuickPick").returns(Promise.resolve({
                    label: "Create New Service Connection",
                }));
                const serviceType = pods_core_1.ExternalService.Airtable;
                sinon_1.default
                    .stub(PodControls_1.PodUIControls, "promptForExternalServiceType")
                    .returns(Promise.resolve(serviceType));
                sinon_1.default
                    .stub(PodControls_1.PodUIControls, "promptForGenericId")
                    .returns(Promise.resolve("airtable"));
                await cmd.run();
                const activePath = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
                (0, testUtilsv2_1.expect)(activePath?.endsWith(path_1.default.join("pods", "service-connections", "svcconfig.airtable.yml"))).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("AND WHEN a service connection Id is selected", {
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            test("THEN service config of selected connection Id must open", async () => {
                const cmd = new ConfigureServiceConnection_1.ConfigureServiceConnection(ExtensionProvider_1.ExtensionProvider.getExtension());
                sinon_1.default.stub(vscode.window, "showQuickPick").returns(Promise.resolve({
                    label: "airtable-2",
                }));
                //setup
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const configPath = pods_core_1.PodUtils.getServiceConfigPath({
                    wsRoot,
                    connectionId: "airtable-2",
                });
                (0, fs_extra_1.ensureDirSync)(path_1.default.dirname(configPath));
                (0, common_server_1.writeYAML)(configPath, {
                    serviceType: pods_core_1.ExternalService.Airtable,
                    podId: "airtable-2",
                    connectionId: "test",
                });
                await cmd.run();
                const activePath = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
                (0, testUtilsv2_1.expect)(activePath?.endsWith(path_1.default.join("pods", "service-connections", "svcconfig.airtable-2.yml"))).toBeTruthy();
            });
        });
    });
});
//# sourceMappingURL=ConfigureServiceConnection.spec.js.map