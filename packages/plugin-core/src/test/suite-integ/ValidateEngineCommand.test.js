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
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const vscode = __importStar(require("vscode"));
const testUtilsV3_1 = require("../testUtilsV3");
const testUtilsv2_1 = require("../testUtilsv2");
const ValidateEngineCommand_1 = require("../../commands/ValidateEngineCommand");
const sinon_1 = __importDefault(require("sinon"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
suite("ValidateEngineCommand tests", function () {
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a workspace with no issues", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN command detects no issues", async () => {
            const windowSpy = sinon_1.default.spy(vscode.window, "showErrorMessage");
            await new ValidateEngineCommand_1.ValidateEngineCommand().execute();
            (0, testUtilsv2_1.expect)(windowSpy.callCount).toEqual(0);
            windowSpy.restore();
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a workspace with engine child/parent issues", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN command shows error message", async () => {
            const windowSpy = sinon_1.default.spy(vscode.window, "showErrorMessage");
            const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            // Purposely remove children from foo note
            const foo = (await engine.getNote("foo")).data;
            foo.children = [];
            await engine.writeNote(foo, { metaOnly: true });
            await new ValidateEngineCommand_1.ValidateEngineCommand().execute();
            (0, testUtilsv2_1.expect)(windowSpy.callCount).toEqual(1);
            const errorMsg = windowSpy.getCall(0).args[0];
            (0, testUtilsv2_1.expect)(errorMsg.includes("Mismatch at foo's children")).toBeTruthy();
            windowSpy.restore();
        });
    });
});
//# sourceMappingURL=ValidateEngineCommand.test.js.map