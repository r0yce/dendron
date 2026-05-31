"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const CreateHookCommand_1 = require("../../commands/CreateHookCommand");
const DeleteHookCommand_1 = require("../../commands/DeleteHookCommand");
const constants_1 = require("../../constants");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite(constants_1.DENDRON_COMMANDS.DELETE_HOOK.key, function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this);
    (0, mocha_1.describe)("main", () => {
        test("basic", (done) => {
            const hookName = "foo";
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async (opts) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
                },
                onInit: async ({ wsRoot }) => {
                    await new CreateHookCommand_1.CreateHookCommand().execute({ hookFilter: "*", hookName });
                    await new DeleteHookCommand_1.DeleteHookCommand().execute({
                        hookName,
                        shouldDeleteScript: true,
                    });
                    const config = common_server_1.DConfig.getOrCreate(wsRoot);
                    const hooks = common_all_1.ConfigUtils.getHooks(config);
                    (0, testUtilsv2_1.expect)(hooks).toEqual({
                        onCreate: [],
                    });
                    (0, testUtilsv2_1.expect)(fs_extra_1.default.existsSync(path_1.default.join(engine_server_1.HookUtils.getHookScriptPath({
                        basename: `${hookName}.js`,
                        wsRoot,
                    })))).toBeFalsy();
                    done();
                },
            });
        });
        test("no delete", (done) => {
            const hookName = "foo";
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async (opts) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
                },
                onInit: async ({ wsRoot }) => {
                    await new CreateHookCommand_1.CreateHookCommand().execute({ hookFilter: "*", hookName });
                    await new DeleteHookCommand_1.DeleteHookCommand().execute({
                        hookName,
                        shouldDeleteScript: false,
                    });
                    const config = common_server_1.DConfig.getOrCreate(wsRoot);
                    const hooks = common_all_1.ConfigUtils.getHooks(config);
                    (0, testUtilsv2_1.expect)(hooks).toEqual({
                        onCreate: [],
                    });
                    (0, testUtilsv2_1.expect)(fs_extra_1.default.existsSync(path_1.default.join(engine_server_1.HookUtils.getHookScriptPath({
                        basename: `${hookName}.js`,
                        wsRoot,
                    })))).toBeTruthy();
                    done();
                },
            });
        });
    });
});
//# sourceMappingURL=DeleteHookCommand.test.js.map