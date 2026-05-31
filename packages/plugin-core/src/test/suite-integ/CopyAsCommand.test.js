"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pods_core_1 = require("@dendronhq/pods-core");
const mocha_1 = require("mocha");
const sinon_1 = __importDefault(require("sinon"));
const CopyAsCommand_1 = require("../../commands/CopyAsCommand");
const PodControls_1 = require("../../components/pods/PodControls");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const WSUtilsV2_1 = require("../../WSUtilsV2");
const testUtilsV3_1 = require("../testUtilsV3");
const testUtilsv2_1 = require("../testUtilsv2");
const PodCommandFactory_1 = require("../../components/pods/PodCommandFactory");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const vscode_1 = require("vscode");
suite("CopyAsCommand", function () {
    (0, mocha_1.describe)("GIVEN CopyAs command is run", () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN the format selected is JSON", { timeout: 5e3 }, () => {
            test("THEN json formatted note must be copied to clipboard", async () => {
                const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const targetNote = (await engine.findNotes({ fname: "root" }))[0];
                await WSUtilsV2_1.WSUtilsV2.instance().openNote(targetNote);
                const factorySpy = sinon_1.default.spy(PodCommandFactory_1.PodCommandFactory, "createPodCommandForStoredConfig");
                const cmd = new CopyAsCommand_1.CopyAsCommand();
                sinon_1.default
                    .stub(PodControls_1.PodUIControls, "promptToSelectCopyAsFormat")
                    .resolves(pods_core_1.CopyAsFormat.JSON);
                await cmd.run();
                const out = factorySpy.returnValues[0];
                (0, testUtilsv2_1.expect)(out.key).toEqual("dendron.jsonexportv2");
            });
            test("AND NO note is open THEN throw error", async () => {
                await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
                const windowSpy = sinon_1.default.spy(vscode_1.window, "showErrorMessage");
                const cmd = new CopyAsCommand_1.CopyAsCommand();
                await cmd.run();
                const errorMsg = windowSpy.getCall(0).args[0];
                (0, testUtilsv2_1.expect)(errorMsg).toEqual("you must have a note open to execute this command");
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN the format selected is Markdown", { timeout: 5e3 }, () => {
            test("THEN markdown formatted note must be copied to clipboard", async () => {
                const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const targetNote = (await engine.findNotes({ fname: "root" }))[0];
                await WSUtilsV2_1.WSUtilsV2.instance().openNote(targetNote);
                const factorySpy = sinon_1.default.spy(PodCommandFactory_1.PodCommandFactory, "createPodCommandForStoredConfig");
                const cmd = new CopyAsCommand_1.CopyAsCommand();
                sinon_1.default
                    .stub(PodControls_1.PodUIControls, "promptToSelectCopyAsFormat")
                    .resolves(pods_core_1.CopyAsFormat.MARKDOWN);
                await cmd.run();
                const out = factorySpy.returnValues[0];
                (0, testUtilsv2_1.expect)(out.key).toEqual("dendron.markdownexportv2");
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN the Markdown format is provided in keybinding args", { timeout: 5e3 }, () => {
            test("THEN markdown formatted note must be copied to clipboard", async () => {
                const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const targetNote = (await engine.findNotes({ fname: "root" }))[0];
                await WSUtilsV2_1.WSUtilsV2.instance().openNote(targetNote);
                const factorySpy = sinon_1.default.spy(PodCommandFactory_1.PodCommandFactory, "createPodCommandForStoredConfig");
                const cmd = new CopyAsCommand_1.CopyAsCommand();
                await cmd.gatherInputs(pods_core_1.CopyAsFormat.MARKDOWN);
                const out = factorySpy.returnValues[0];
                (0, testUtilsv2_1.expect)(out.key).toEqual("dendron.markdownexportv2");
            });
        });
    });
});
//# sourceMappingURL=CopyAsCommand.test.js.map