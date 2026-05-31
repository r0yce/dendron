"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const common_all_1 = require("@dendronhq/common-all");
const sinon_1 = __importDefault(require("sinon"));
const RunMigrationCommand_1 = require("../../commands/RunMigrationCommand");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const common_server_1 = require("@dendronhq/common-server");
const ExtensionProvider_1 = require("../../ExtensionProvider");
suite("RunMigrationCommand", function () {
    (0, testUtilsV3_1.describeMultiWS)("GIVEN Code workspace", {
        modConfigCb: (config) => {
            lodash_1.default.unset(config.commands, "lookup");
            return config;
        },
        workspaceType: common_all_1.WorkspaceType.CODE,
    }, () => {
        test("THEN migration runs as expected", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new RunMigrationCommand_1.RunMigrationCommand(ext);
            (0, testUtilsv2_1.expect)(ext.type).toEqual(common_all_1.WorkspaceType.CODE);
            // testing for explicitly delete key.
            const { wsRoot } = ext.getDWorkspace();
            const rawConfig = common_server_1.DConfig.getRaw(wsRoot);
            (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined(rawConfig.commands?.lookup)).toBeTruthy();
            sinon_1.default.stub(cmd, "gatherInputs").resolves({ version: "0.83.0" });
            const out = await cmd.run();
            (0, testUtilsv2_1.expect)(out.length).toEqual(1);
            (0, testUtilsv2_1.expect)(out[0].data.version === "0.83.0");
            (0, testUtilsv2_1.expect)(out[0].data.wsConfig).toNotEqual(undefined);
            const config = ext.getDWorkspace().config;
            const lookupConfig = common_all_1.ConfigUtils.getLookup(config);
            (0, testUtilsv2_1.expect)(lookupConfig.note.selectionMode).toEqual("extract");
        });
    });
    (0, testUtilsV3_1.runTestButSkipForWindows)()("", () => {
        (0, testUtilsV3_1.describeMultiWS)("GIVEN Native workspace", {
            modConfigCb: (config) => {
                lodash_1.default.unset(config.commands, "lookup");
                return config;
            },
            workspaceType: common_all_1.WorkspaceType.NATIVE,
        }, () => {
            test("THEN migration runs as expected without looking for workspace config.", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                const cmd = new RunMigrationCommand_1.RunMigrationCommand(ext);
                (0, testUtilsv2_1.expect)(ext.type).toEqual(common_all_1.WorkspaceType.NATIVE);
                // testing for explicitly delete key.
                const { wsRoot } = ext.getDWorkspace();
                const rawConfig = common_server_1.DConfig.getRaw(wsRoot);
                (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined(rawConfig.commands?.lookup)).toBeTruthy();
                sinon_1.default.stub(cmd, "gatherInputs").resolves({ version: "0.83.0" });
                const out = await cmd.run();
                (0, testUtilsv2_1.expect)(out.length).toEqual(1);
                (0, testUtilsv2_1.expect)(out[0].data.version === "0.83.0");
                // test if no wsConfig was passed to migration
                (0, testUtilsv2_1.expect)(out[0].data.wsConfig).toEqual(undefined);
                // test for existence of default key in the place where it was deleted.
                const config = ext.getDWorkspace().config;
                const lookupConfig = common_all_1.ConfigUtils.getLookup(config);
                (0, testUtilsv2_1.expect)(lookupConfig.note.selectionMode).toEqual("extract");
            });
        });
    });
});
//# sourceMappingURL=RunMigrationCommand.test.js.map