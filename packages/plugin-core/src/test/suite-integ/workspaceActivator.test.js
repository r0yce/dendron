"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const testUtilsV3_1 = require("../testUtilsV3");
const mocha_1 = require("mocha");
const testUtilsv2_1 = require("../testUtilsv2");
const workspaceActivator_1 = require("../../workspace/workspaceActivator");
const sinon_1 = __importDefault(require("sinon"));
const lodash_1 = __importDefault(require("lodash"));
suite("workspaceActivator", function () {
    (0, mocha_1.describe)("trackTopLevelRepoFound", () => {
        (0, testUtilsV3_1.describeMultiWS)("GIVEN a workspace tracked remotely", {
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            (0, mocha_1.describe)("WHEN https", () => {
                (0, mocha_1.describe)("AND GitHub", () => {
                    test("THEN correctly track top level repo info", async () => {
                        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                        const wsService = new engine_server_1.WorkspaceService({ wsRoot });
                        const urlStub = sinon_1.default
                            .stub(wsService, "getTopLevelRemoteUrl")
                            .returns(Promise.resolve("https://github.com/foo/bar.git"));
                        const out = await (0, workspaceActivator_1.trackTopLevelRepoFound)({ wsService });
                        (0, testUtilsv2_1.expect)(out).toBeTruthy();
                        (0, testUtilsv2_1.expect)(lodash_1.default.omit(out, "path")).toEqual({
                            protocol: "https",
                            provider: "github.com",
                        });
                        // hashed path is same every time
                        const out2 = await (0, workspaceActivator_1.trackTopLevelRepoFound)({ wsService });
                        (0, testUtilsv2_1.expect)(out2).toBeTruthy();
                        (0, testUtilsv2_1.expect)(out).toEqual(out2);
                        urlStub.restore();
                    });
                });
                (0, mocha_1.describe)("AND GitLab", () => {
                    test("THEN correctly track top level repo info", async () => {
                        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                        const wsService = new engine_server_1.WorkspaceService({ wsRoot });
                        const urlStub = sinon_1.default
                            .stub(wsService, "getTopLevelRemoteUrl")
                            .returns(Promise.resolve("https://gitlab.com/foo/bar.git"));
                        const out = await (0, workspaceActivator_1.trackTopLevelRepoFound)({ wsService });
                        (0, testUtilsv2_1.expect)(out).toBeTruthy();
                        (0, testUtilsv2_1.expect)(lodash_1.default.omit(out, "path")).toEqual({
                            protocol: "https",
                            provider: "gitlab.com",
                        });
                        // hashed path is same every time
                        const out2 = await (0, workspaceActivator_1.trackTopLevelRepoFound)({ wsService });
                        (0, testUtilsv2_1.expect)(out2).toBeTruthy();
                        (0, testUtilsv2_1.expect)(out).toEqual(out2);
                        urlStub.restore();
                    });
                });
                (0, mocha_1.describe)("AND arbitrary provider", () => {
                    test("THEN correctly track top level repo info", async () => {
                        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                        const wsService = new engine_server_1.WorkspaceService({ wsRoot });
                        const urlStub = sinon_1.default
                            .stub(wsService, "getTopLevelRemoteUrl")
                            .returns(Promise.resolve("https://some.host/foo/bar.git"));
                        const out = await (0, workspaceActivator_1.trackTopLevelRepoFound)({ wsService });
                        (0, testUtilsv2_1.expect)(out).toBeTruthy();
                        (0, testUtilsv2_1.expect)(lodash_1.default.omit(out, "path")).toEqual({
                            protocol: "https",
                            provider: "some.host",
                        });
                        // hashed path is same every time
                        const out2 = await (0, workspaceActivator_1.trackTopLevelRepoFound)({ wsService });
                        (0, testUtilsv2_1.expect)(out2).toBeTruthy();
                        (0, testUtilsv2_1.expect)(out).toEqual(out2);
                        urlStub.restore();
                    });
                });
            });
            (0, mocha_1.describe)("WHEN git", () => {
                (0, mocha_1.describe)("AND GitHub", () => {
                    test("THEN correctly track top level repo info", async () => {
                        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                        const wsService = new engine_server_1.WorkspaceService({ wsRoot });
                        const urlStub = sinon_1.default
                            .stub(wsService, "getTopLevelRemoteUrl")
                            .returns(Promise.resolve("git@github.com:foo/bar.git"));
                        const out = await (0, workspaceActivator_1.trackTopLevelRepoFound)({ wsService });
                        (0, testUtilsv2_1.expect)(out).toBeTruthy();
                        (0, testUtilsv2_1.expect)(lodash_1.default.omit(out, "path")).toEqual({
                            protocol: "git",
                            provider: "github.com",
                        });
                        // hashed path is same every time
                        const out2 = await (0, workspaceActivator_1.trackTopLevelRepoFound)({ wsService });
                        (0, testUtilsv2_1.expect)(out2).toBeTruthy();
                        (0, testUtilsv2_1.expect)(out).toEqual(out2);
                        urlStub.restore();
                    });
                });
                (0, mocha_1.describe)("AND GitLab", () => {
                    test("THEN correctly track top level repo info", async () => {
                        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                        const wsService = new engine_server_1.WorkspaceService({ wsRoot });
                        const urlStub = sinon_1.default
                            .stub(wsService, "getTopLevelRemoteUrl")
                            .returns(Promise.resolve("git@gitlab.com:foo/bar.git"));
                        const out = await (0, workspaceActivator_1.trackTopLevelRepoFound)({ wsService });
                        (0, testUtilsv2_1.expect)(out).toBeTruthy();
                        (0, testUtilsv2_1.expect)(lodash_1.default.omit(out, "path")).toEqual({
                            protocol: "git",
                            provider: "gitlab.com",
                        });
                        // hashed path is same every time
                        const out2 = await (0, workspaceActivator_1.trackTopLevelRepoFound)({ wsService });
                        (0, testUtilsv2_1.expect)(out2).toBeTruthy();
                        (0, testUtilsv2_1.expect)(out).toEqual(out2);
                        urlStub.restore();
                    });
                });
                (0, mocha_1.describe)("AND arbitrary provider", () => {
                    test("THEN correctly track top level repo info", async () => {
                        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                        const wsService = new engine_server_1.WorkspaceService({ wsRoot });
                        const urlStub = sinon_1.default
                            .stub(wsService, "getTopLevelRemoteUrl")
                            .returns(Promise.resolve("git@some.host:foo/bar.git"));
                        const out = await (0, workspaceActivator_1.trackTopLevelRepoFound)({ wsService });
                        (0, testUtilsv2_1.expect)(out).toBeTruthy();
                        (0, testUtilsv2_1.expect)(lodash_1.default.omit(out, "path")).toEqual({
                            protocol: "git",
                            provider: "some.host",
                        });
                        // hashed path is same every time
                        const out2 = await (0, workspaceActivator_1.trackTopLevelRepoFound)({ wsService });
                        (0, testUtilsv2_1.expect)(out2).toBeTruthy();
                        (0, testUtilsv2_1.expect)(out).toEqual(out2);
                        urlStub.restore();
                    });
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("GIVEN a workspace not tracked", {
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            test("THEN top level repo info is not tracked", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const wsService = new engine_server_1.WorkspaceService({ wsRoot });
                const urlStub = sinon_1.default
                    .stub(wsService, "getTopLevelRemoteUrl")
                    .returns(Promise.resolve(undefined));
                const out = await (0, workspaceActivator_1.trackTopLevelRepoFound)({ wsService });
                (0, testUtilsv2_1.expect)(out).toEqual(undefined);
                urlStub.restore();
            });
        });
    });
});
//# sourceMappingURL=workspaceActivator.test.js.map