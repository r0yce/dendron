"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const getSiteIndex_1 = require("../../../injection-providers/getSiteIndex");
const WorkspaceHelpers_1 = require("../../helpers/WorkspaceHelpers");
suite("GIVEN a workspace folder", () => {
    test("WHEN siteIndex is present in dendron.yml THEN return correct value", async () => {
        const wsRoot = await WorkspaceHelpers_1.WorkspaceHelpers.getWSRootForTest();
        const config = {
            publishing: {
                siteIndex: "dendron",
            },
        };
        await WorkspaceHelpers_1.WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
        const siteIndex = await (0, getSiteIndex_1.getSiteIndex)(wsRoot);
        assert_1.default.strictEqual(siteIndex, "dendron");
    });
    test("WHEN siteIndex is not present in dendron.yml THEN return the first value from siteHierarchies array", async () => {
        const wsRoot = await WorkspaceHelpers_1.WorkspaceHelpers.getWSRootForTest();
        const config = {
            publishing: {
                siteHierarchies: ["root"],
            },
        };
        await WorkspaceHelpers_1.WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
        const siteIndex = await (0, getSiteIndex_1.getSiteIndex)(wsRoot);
        assert_1.default.strictEqual(siteIndex, "root");
    });
});
//# sourceMappingURL=getSiteIndex.test.js.map