"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const getVaults_1 = require("../../../injection-providers/getVaults");
const WorkspaceHelpers_1 = require("../../helpers/WorkspaceHelpers");
suite("GIVEN a workspace folder", () => {
    test("WHEN there's a single legacy (non self-contained) vault THEN the vault is returned correctly", async () => {
        const wsRoot = await WorkspaceHelpers_1.WorkspaceHelpers.getWSRootForTest();
        const config = {
            workspace: {
                vaults: [
                    {
                        fsPath: "test",
                        name: "test-name",
                    },
                ],
            },
        };
        await WorkspaceHelpers_1.WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
        const vaults = await (0, getVaults_1.getVaults)(wsRoot);
        assert_1.default.strictEqual(vaults.length, 1);
        (0, assert_1.default)(vaults[0].fsPath.endsWith("test"));
        (0, assert_1.default)(!vaults[0].selfContained);
        assert_1.default.strictEqual(vaults[0].name, "test-name");
    });
    test("WHEN there's a single self-contained vault THEN the vault is returned correctly", async () => {
        const wsRoot = await WorkspaceHelpers_1.WorkspaceHelpers.getWSRootForTest();
        const config = {
            workspace: {
                vaults: [
                    {
                        fsPath: "test",
                        selfContained: true,
                    },
                ],
            },
        };
        await WorkspaceHelpers_1.WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
        const vaults = await (0, getVaults_1.getVaults)(wsRoot);
        assert_1.default.strictEqual(vaults.length, 1);
        (0, assert_1.default)(vaults[0].fsPath.endsWith("test"));
        (0, assert_1.default)(vaults[0].selfContained);
    });
    test("WHEN there are multiple vaults THEN all vaults are returned correctly", async () => {
        const wsRoot = await WorkspaceHelpers_1.WorkspaceHelpers.getWSRootForTest();
        const config = {
            workspace: {
                vaults: [
                    {
                        fsPath: "test",
                        selfContained: true,
                    },
                    {
                        fsPath: "legacy",
                    },
                ],
            },
        };
        await WorkspaceHelpers_1.WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
        const vaults = await (0, getVaults_1.getVaults)(wsRoot);
        assert_1.default.strictEqual(vaults.length, 2);
        (0, assert_1.default)(vaults[0].fsPath.endsWith("test"));
        (0, assert_1.default)(vaults[0].selfContained);
        (0, assert_1.default)(vaults[1].fsPath.endsWith("legacy"));
        (0, assert_1.default)(!vaults[1].selfContained);
    });
});
//# sourceMappingURL=getVaults.test.js.map