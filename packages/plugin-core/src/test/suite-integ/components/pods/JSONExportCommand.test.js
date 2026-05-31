"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pods_core_1 = require("@dendronhq/pods-core");
const mocha_1 = require("mocha");
const JSONExportPodCommand_1 = require("../../../../commands/pods/JSONExportPodCommand");
const ExtensionProvider_1 = require("../../../../ExtensionProvider");
const testUtilsv2_1 = require("../../../testUtilsv2");
const testUtilsV3_1 = require("../../../testUtilsV3");
suite("JSONExportPodCommand", function () {
    (0, mocha_1.describe)("GIVEN a JSONExportPodCommand is ran with Vault scope", () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN the destination is clipboard", {}, () => {
            test("THEN multi notes export error message must be displayed", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                const cmd = new JSONExportPodCommand_1.JSONExportPodCommand(ext);
                await (0, testUtilsv2_1.expect)(async () => cmd.gatherInputs({
                    exportScope: pods_core_1.PodExportScope.Vault,
                    destination: "clipboard",
                })).toThrow("Multi Note Export cannot have clipboard as destination. Please configure your destination by using Dendron: Configure Export Pod V2 command");
            });
        });
    });
});
//# sourceMappingURL=JSONExportCommand.test.js.map