"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const mocha_1 = require("mocha");
const vscode_1 = __importDefault(require("vscode"));
const ExtensionProvider_1 = require("../../../../ExtensionProvider");
const CommandRegistrar_1 = require("../../../../services/CommandRegistrar");
const MockDendronExtension_1 = require("../../../MockDendronExtension");
const testUtilsv2_1 = require("../../../testUtilsv2");
const testUtilsV3_1 = require("../../../testUtilsV3");
suite("CommandRegistrar tests", () => {
    (0, mocha_1.describe)(`GIVEN a Command Registrar`, () => {
        const traitId = (0, common_all_1.genUUID)();
        const trait = {
            id: traitId,
        };
        (0, testUtilsV3_1.describeSingleWS)("WHEN registering a command for a new trait", {}, (ctx) => {
            let _registrar;
            (0, mocha_1.afterEach)(() => {
                _registrar?.unregisterTrait(trait);
            });
            test("THEN the command has been registered", async () => {
                const { engine, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const mockExtension = new MockDendronExtension_1.MockDendronExtension({
                    engine,
                    wsRoot,
                    context: ctx,
                });
                _registrar = new CommandRegistrar_1.CommandRegistrar(mockExtension);
                const expectedCmdName = _registrar.CUSTOM_COMMAND_PREFIX + traitId;
                const cmd = _registrar.registerCommandForTrait(trait);
                (0, testUtilsv2_1.expect)(cmd).toEqual(expectedCmdName);
                (0, testUtilsv2_1.expect)(_registrar.registeredCommands[traitId]).toEqual(expectedCmdName);
                const allCmds = await vscode_1.default.commands.getCommands(true);
                (0, testUtilsv2_1.expect)(allCmds.includes(expectedCmdName)).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN unregistering a command", {}, (ctx) => {
            let _registrar;
            test("THEN the command has been unregistered", async () => {
                const { engine, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const mockExtension = new MockDendronExtension_1.MockDendronExtension({
                    engine,
                    wsRoot,
                    context: ctx,
                });
                _registrar = new CommandRegistrar_1.CommandRegistrar(mockExtension);
                const expectedCmdName = _registrar.CUSTOM_COMMAND_PREFIX + traitId;
                _registrar.registerCommandForTrait(trait);
                _registrar.unregisterTrait(trait);
                (0, testUtilsv2_1.expect)(_registrar.registeredCommands[expectedCmdName]).toBeFalsy();
                const allCmds = await vscode_1.default.commands.getCommands();
                (0, testUtilsv2_1.expect)(allCmds.includes(expectedCmdName)).toBeFalsy();
            });
        });
    });
});
//# sourceMappingURL=CommandRegistrar.test.js.map