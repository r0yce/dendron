"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode_1 = __importDefault(require("vscode"));
const RegisterNoteTraitCommand_1 = require("../../../../commands/RegisterNoteTraitCommand");
const ExtensionProvider_1 = require("../../../../ExtensionProvider");
const vsCodeUtils_1 = require("../../../../vsCodeUtils");
const testUtilsv2_1 = require("../../../testUtilsv2");
const testUtilsV3_1 = require("../../../testUtilsV3");
suite("RegisterNoteTraitCommand tests", () => {
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a new Note Trait", {}, () => {
        (0, mocha_1.describe)(`WHEN registering a new note trait`, () => {
            (0, mocha_1.beforeEach)(async () => {
                await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
            });
            (0, mocha_1.afterEach)(async () => {
                await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
            });
            const traitId = "new-test-trait";
            test(`THEN expect the note trait editor to be visible`, async () => {
                const registerCommand = sinon_1.default.stub(vscode_1.default.commands, "registerCommand");
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const cmd = new RegisterNoteTraitCommand_1.RegisterNoteTraitCommand();
                await cmd.execute({
                    traitId,
                });
                (0, testUtilsv2_1.expect)(registerCommand.calledOnce).toBeTruthy();
                (0, testUtilsv2_1.expect)(registerCommand.args[0][0]).toEqual("dendron.customCommand.new-test-trait");
                (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath).toEqual(path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_USER_NOTE_TRAITS_BASE, `${traitId}.js`));
                registerCommand.restore();
            });
        });
    });
});
//# sourceMappingURL=RegisterNoteTraitCommand.test.js.map