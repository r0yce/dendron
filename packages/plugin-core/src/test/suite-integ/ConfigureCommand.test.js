"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const ConfigureCommand_1 = require("../../commands/ConfigureCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const mocha_1 = require("mocha");
suite("ConfigureCommand", function () {
    (0, testUtilsV3_1.describeSingleWS)("WHEN run", {}, () => {
        (0, mocha_1.before)(async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            await new ConfigureCommand_1.ConfigureCommand(ext).run();
        });
        test("THEN opens the configuration file", () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.toLowerCase()).toEqual(path_1.default.join(wsRoot, "dendron.yml").toLowerCase());
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN there are multiple config files inside the workspace", {
        // Self contained workspace with multiple vaults will have a config file in each vault
        selfContained: true,
    }, () => {
        (0, mocha_1.before)(async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            await new ConfigureCommand_1.ConfigureCommand(ext).run();
        });
        test("THEN opens the configuration file", () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.toLowerCase()).toEqual(path_1.default.join(wsRoot, "dendron.yml").toLowerCase());
        });
    });
});
//# sourceMappingURL=ConfigureCommand.test.js.map