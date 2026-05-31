"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const getSiteUrl_1 = require("../../../injection-providers/getSiteUrl");
const WorkspaceHelpers_1 = require("../../helpers/WorkspaceHelpers");
suite("GIVEN a workspace folder", () => {
    test("WHEN siteUrl is present in dendron.yml THEN return correct value", async () => {
        const wsRoot = await WorkspaceHelpers_1.WorkspaceHelpers.getWSRootForTest();
        const config = {
            publishing: {
                siteUrl: "https://foo.com",
            },
        };
        await WorkspaceHelpers_1.WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
        const siteUrl = await (0, getSiteUrl_1.getSiteUrl)(wsRoot);
        assert_1.default.strictEqual(siteUrl, "https://foo.com");
    });
    test("WHEN siteUrl is not present in dendron.yml THEN return empty value", async () => {
        const wsRoot = await WorkspaceHelpers_1.WorkspaceHelpers.getWSRootForTest();
        const config = {
            publishing: {},
        };
        await WorkspaceHelpers_1.WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
        const siteUrl = await (0, getSiteUrl_1.getSiteUrl)(wsRoot);
        assert_1.default.strictEqual(siteUrl, "");
    });
});
//# sourceMappingURL=getSiteUrl.test.js.map