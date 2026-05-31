"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const CreateNoteWithTraitCommand_1 = require("../../../../commands/CreateNoteWithTraitCommand");
const ExtensionProvider_1 = require("../../../../ExtensionProvider");
const vsCodeUtils_1 = require("../../../../vsCodeUtils");
const MockDendronExtension_1 = require("../../../MockDendronExtension");
const testUtilsv2_1 = require("../../../testUtilsv2");
const testUtilsV3_1 = require("../../../testUtilsV3");
const TestTrait_1 = require("./TestTrait");
suite("CreateNoteWithTraitCommand tests", () => {
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a Note Trait", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        timeout: 1e4,
    }, (ctx) => {
        (0, mocha_1.describe)(`WHEN creating a note with that trait applied`, () => {
            (0, mocha_1.beforeEach)(() => {
                vsCodeUtils_1.VSCodeUtils.closeAllEditors();
            });
            (0, mocha_1.afterEach)(() => {
                vsCodeUtils_1.VSCodeUtils.closeAllEditors();
            });
            test(`THEN expect the title to have been modified AND have the foo template applied`, async () => {
                const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const testTrait = new TestTrait_1.TestTrait("foo");
                const mockExtension = new MockDendronExtension_1.MockDendronExtension({
                    engine,
                    wsRoot,
                    context: ctx,
                    vaults,
                });
                const cmd = new CreateNoteWithTraitCommand_1.CreateNoteWithTraitCommand(mockExtension, "test-create-note-with-trait", testTrait);
                await cmd.execute({ fname: "test" });
                const expectedFName = path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]), "test.md");
                (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath).toEqual(expectedFName);
                const props = (await engine.findNotes({
                    fname: "test",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(props?.title).toEqual(testTrait.TEST_TITLE_MODIFIER);
                (0, testUtilsv2_1.expect)(props?.body).toEqual("foo body");
            });
            test(`WHEN cross vault template is given, THEN correct template should be applied`, async () => {
                const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const testTrait = new TestTrait_1.TestTrait("dendron://vault1/bar");
                const mockExtension = new MockDendronExtension_1.MockDendronExtension({
                    engine,
                    wsRoot,
                    context: ctx,
                    vaults,
                });
                const cmd = new CreateNoteWithTraitCommand_1.CreateNoteWithTraitCommand(mockExtension, "test-create-note-with-trait", testTrait);
                await cmd.execute({ fname: "xvault", vaultOverride: vaults[1] });
                const expectedFName = path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[1]), "xvault.md");
                (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath).toEqual(expectedFName);
                const props = (await engine.findNotes({
                    fname: "xvault",
                    vault: vaults[1],
                }))[0];
                (0, testUtilsv2_1.expect)(props?.title).toEqual(testTrait.TEST_TITLE_MODIFIER);
                (0, testUtilsv2_1.expect)(props?.body).toEqual("bar body");
            });
            test(`WHEN setVault is implemented, a new note should be created in the specified vault`, async () => {
                const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const testTrait = new TestTrait_1.TestTrait("dendron://vault1/bar");
                testTrait.OnCreate.setVault = () => common_all_1.VaultUtils.getName(vaults[2]);
                const mockExtension = new MockDendronExtension_1.MockDendronExtension({
                    engine,
                    wsRoot,
                    context: ctx,
                    vaults,
                });
                const cmd = new CreateNoteWithTraitCommand_1.CreateNoteWithTraitCommand(mockExtension, "test-create-note-with-trait", testTrait);
                await cmd.execute({ fname: "xvault", vaultOverride: vaults[1] });
                const expectedFName = path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[2]), "xvault.md");
                (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath).toEqual(expectedFName);
            });
        });
    });
});
//# sourceMappingURL=CreateNoteWithTraitCommand.test.js.map