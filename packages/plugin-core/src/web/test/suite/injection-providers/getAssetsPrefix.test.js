"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const getAssetsPrefix_1 = require("../../../injection-providers/getAssetsPrefix");
const WorkspaceHelpers_1 = require("../../helpers/WorkspaceHelpers");
suite("GIVEN a workspace folder", () => {
    test("WHEN assetsPrefix is present in dendron.yml THEN return correct value", async () => {
        const wsRoot = await WorkspaceHelpers_1.WorkspaceHelpers.getWSRootForTest();
        const config = {
            publishing: {
                assetsPrefix: "/testing-workspace",
            },
        };
        await WorkspaceHelpers_1.WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
        const assetsPrefix = await (0, getAssetsPrefix_1.getAssetsPrefix)(wsRoot);
        assert_1.default.strictEqual(assetsPrefix, "/testing-workspace");
    });
    test("WHEN assetsPrefix is not present in dendron.yml THEN return empty value", async () => {
        const wsRoot = await WorkspaceHelpers_1.WorkspaceHelpers.getWSRootForTest();
        const config = {
            publishing: {},
        };
        await WorkspaceHelpers_1.WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
        const assetsPrefix = await (0, getAssetsPrefix_1.getAssetsPrefix)(wsRoot);
        assert_1.default.strictEqual(assetsPrefix, "");
    });
});
//# sourceMappingURL=getAssetsPrefix.test.js.map