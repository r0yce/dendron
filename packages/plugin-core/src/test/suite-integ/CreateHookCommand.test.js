"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const CreateHookCommand_1 = require("../../commands/CreateHookCommand");
const constants_1 = require("../../constants");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite(constants_1.DENDRON_COMMANDS.CREATE_HOOK.key, function () {
    let ctx;
    ctx = (0, testUtilsV3_1.setupBeforeAfter)(this);
    (0, mocha_1.describe)("main", () => {
        test("basic", (done) => {
            const hook = "foo";
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async (opts) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
                },
                onInit: async ({ wsRoot }) => {
                    const stub = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showInputBox");
                    stub.onCall(0).returns(Promise.resolve(hook));
                    stub.onCall(1).returns(Promise.resolve("*"));
                    await new CreateHookCommand_1.CreateHookCommand().run();
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    const config = common_server_1.DConfig.getOrCreate(wsRoot);
                    const hooksConfig = common_all_1.ConfigUtils.getHooks(config);
                    (0, testUtilsv2_1.expect)(hooksConfig).toEqual({
                        onCreate: [{ id: hook, pattern: "*", type: "js" }],
                    });
                    (0, testUtilsv2_1.expect)(editor.document.uri.fsPath.toLowerCase()).toEqual(path_1.default
                        .join(engine_server_1.HookUtils.getHookScriptPath({ basename: `${hook}.js`, wsRoot }))
                        .toLowerCase());
                    (0, testUtilsv2_1.expect)(common_test_utils_1.AssertUtils.assertInString({
                        body: editor.document.getText(),
                        match: ["module.export"],
                    })).toBeTruthy();
                    done();
                },
            });
        });
        test("overwrite existing file", (done) => {
            const hook = "foo";
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async (opts) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
                    engine_test_utils_1.TestHookUtils.writeJSHook({
                        wsRoot: opts.wsRoot,
                        fname: hook,
                        canary: "hook",
                    });
                },
                onInit: async ({}) => {
                    sinon_1.default
                        .stub(vsCodeUtils_1.VSCodeUtils, "showInputBox")
                        .returns(Promise.resolve(hook));
                    const { error } = (await new CreateHookCommand_1.CreateHookCommand().run());
                    (0, testUtilsv2_1.expect)(error.message.endsWith("exists")).toBeTruthy();
                    done();
                },
            });
        });
    });
});
//# sourceMappingURL=CreateHookCommand.test.js.map