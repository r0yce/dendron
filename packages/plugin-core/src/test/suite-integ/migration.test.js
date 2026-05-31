"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const logger_1 = require("../../logger");
const StartupUtils_1 = require("../../utils/StartupUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("MigrationService", function () {
    async function ranMigration(currentVersion, migrations) {
        const { wsRoot, config } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const wsService = new engine_server_1.WorkspaceService({ wsRoot });
        const out = await engine_server_1.MigrationService.applyMigrationRules({
            currentVersion,
            previousVersion: "0.62.2",
            migrations,
            dendronConfig: config,
            wsService,
            wsConfig: await ExtensionProvider_1.ExtensionProvider.getExtension().getWorkspaceSettings(),
            logger: logger_1.Logger,
        });
        return out.length !== 0;
    }
    (0, testUtilsV3_1.describeMultiWS)("GIVEN migration of semver 0.63.0", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        const dummyFunc = async ({ dendronConfig, wsConfig, }) => {
            return { data: { dendronConfig, wsConfig } };
        };
        const migrations = [
            {
                version: "0.63.0",
                changes: [
                    {
                        name: "test",
                        func: dummyFunc,
                    },
                ],
            },
        ];
        (0, mocha_1.describe)("WHEN current version is smaller than 0.63.0", () => {
            const currentVersion = "0.62.3";
            (0, mocha_1.test)("THEN migration should not run", async () => {
                const result = await ranMigration(currentVersion, migrations);
                (0, testUtilsv2_1.expect)(result).toBeFalsy();
            });
        });
        (0, mocha_1.describe)("WHEN current version is 0.63.0", () => {
            const currentVersion = "0.63.0";
            (0, mocha_1.test)("THEN migration should run", async () => {
                const result = await ranMigration(currentVersion, migrations);
                (0, testUtilsv2_1.expect)(result).toBeTruthy();
            });
        });
        (0, mocha_1.describe)("WHEN current version is larger than 0.63.0", () => {
            const currentVersion = "0.63.1";
            (0, mocha_1.test)("THEN migration should run", async () => {
                const result = await ranMigration(currentVersion, migrations);
                (0, testUtilsv2_1.expect)(result).toBeTruthy();
            });
        });
    });
});
suite("MigrationUtils", () => {
    (0, mocha_1.describe)("deepCleanObjBy", () => {
        (0, mocha_1.describe)("GIVEN _.isNull as predicate", () => {
            (0, mocha_1.describe)("WHEN an object has kvp that has null value", () => {
                (0, mocha_1.test)("THEN all kvp that has null value are omitted from object", () => {
                    const obj = { a: { b: null, c: "foo", d: null } };
                    const expected = { a: { c: "foo" } };
                    (0, testUtilsv2_1.expect)(engine_server_1.MigrationUtils.deepCleanObjBy(obj, lodash_1.default.isNull)).toEqual(expected);
                });
            });
            (0, mocha_1.describe)("WHEN an object has no kvp that has null value", () => {
                (0, mocha_1.test)("THEN nothing is omitted", () => {
                    const obj = { a: { b: "foo", c: "bar", d: "egg" } };
                    (0, testUtilsv2_1.expect)(engine_server_1.MigrationUtils.deepCleanObjBy(obj, lodash_1.default.isNull)).toEqual(obj);
                });
            });
        });
    });
});
suite("GIVEN upgrade", () => {
    (0, mocha_1.describe)("WHEN previous version was below 0.63.0", () => {
        (0, mocha_1.test)("THEN should show prompt", () => {
            const shouldShow = StartupUtils_1.StartupUtils.shouldShowManualUpgradeMessage({
                previousWorkspaceVersion: "0.62.0",
                currentVersion: "0.102.0",
            });
            (0, testUtilsv2_1.expect)(shouldShow).toBeTruthy();
        });
    });
    (0, mocha_1.describe)("WHEN previous version was above 0.63.0", () => {
        (0, mocha_1.test)("THEN should not show prompt", () => {
            const shouldShow = StartupUtils_1.StartupUtils.shouldShowManualUpgradeMessage({
                previousWorkspaceVersion: "0.100.0",
                currentVersion: "0.102.0",
            });
            (0, testUtilsv2_1.expect)(shouldShow).toBeFalsy();
        });
    });
});
//# sourceMappingURL=migration.test.js.map