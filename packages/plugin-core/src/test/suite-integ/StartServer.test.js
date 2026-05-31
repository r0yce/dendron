"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_server_1 = require("@dendronhq/api-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("StartServer", function () {
    let homeDirStub;
    (0, testUtilsV3_1.setupBeforeAfter)(this, {
        beforeHook: async () => {
            sinon_1.default.restore();
            await (0, testUtilsv2_1.resetCodeWorkspace)();
            homeDirStub = engine_test_utils_1.TestEngineUtils.mockHomeDir();
        },
        afterHook: async () => {
            homeDirStub.restore();
        },
    });
    (0, mocha_1.describe)("basic", function () {
        test("ok", function (done) {
            api_server_1.ServerUtils.execServerNode({
                scriptPath: path_1.default.join(__dirname, "..", "..", "server.js"),
                logPath: ExtensionProvider_1.ExtensionProvider.getExtension().context.logPath,
            }).then(({ port }) => {
                (0, testUtilsv2_1.expect)(port > 0).toBeTruthy();
                done();
            });
        });
    });
});
//# sourceMappingURL=StartServer.test.js.map