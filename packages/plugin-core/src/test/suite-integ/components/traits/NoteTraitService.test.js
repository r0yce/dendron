"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const sinon_1 = __importDefault(require("sinon"));
const vscode_1 = __importDefault(require("vscode"));
const ExtensionProvider_1 = require("../../../../ExtensionProvider");
const CommandRegistrar_1 = require("../../../../services/CommandRegistrar");
const NoteTraitManager_1 = require("../../../../services/NoteTraitManager");
const MockDendronExtension_1 = require("../../../MockDendronExtension");
const testUtilsv2_1 = require("../../../testUtilsv2");
const testUtilsV3_1 = require("../../../testUtilsV3");
const UserDefinedTraitV1_1 = require("../../../../traits/UserDefinedTraitV1");
const path = __importStar(require("path"));
//TODO: Expand coverage once other methods of NoteTraitManager are implemented
suite("NoteTraitManager tests", () => {
    const createContext = {
        clipboard: "clipboard-text",
        currentNoteName: "current.note.name",
    };
    (0, mocha_1.describe)(`GIVEN a NoteTraitManager`, () => {
        const TRAIT_ID = "test-trait";
        const trait = {
            id: TRAIT_ID,
        };
        (0, testUtilsV3_1.describeSingleWS)("WHEN registering a new trait", {}, (ctx) => {
            let registrar;
            (0, mocha_1.afterEach)(() => {
                if (registrar) {
                    registrar.unregisterTrait(trait);
                }
            });
            test(`THEN expect the trait to be found by the manager`, () => {
                const registerCommand = sinon_1.default.stub(vscode_1.default.commands, "registerCommand");
                const { wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const mockExtension = new MockDendronExtension_1.MockDendronExtension({
                    engine,
                    wsRoot,
                    context: ctx,
                });
                registrar = new CommandRegistrar_1.CommandRegistrar(mockExtension);
                const traitManager = new NoteTraitManager_1.NoteTraitManager(wsRoot, registrar);
                const resp = traitManager.registerTrait(trait);
                (0, testUtilsv2_1.expect)(resp.error).toBeFalsy();
                (0, testUtilsv2_1.expect)(registerCommand.calledOnce).toBeTruthy();
                (0, testUtilsv2_1.expect)(registerCommand.args[0][0]).toEqual("dendron.customCommand.test-trait");
                registerCommand.restore();
            });
        });
    });
    (0, mocha_1.describe)(`GIVEN a user defined trait in a JS file`, () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN registering the trait", {}, () => {
            let trait;
            (0, mocha_1.beforeEach)(async () => {
                trait = new UserDefinedTraitV1_1.UserDefinedTraitV1("foo", path.resolve(__dirname, "../../../../../../src/test/suite-integ/components/traits/testJSTraits/UserTestTrait.js"));
                await trait.initialize();
            });
            test(`THEN setNameModifier can be properly invoked AND context props can be accessed`, () => {
                const nameModifierResp = trait.OnWillCreate.setNameModifier(createContext);
                (0, testUtilsv2_1.expect)(nameModifierResp.name).toEqual("clipboard-text");
                (0, testUtilsv2_1.expect)(nameModifierResp.promptUserForModification).toBeTruthy();
            });
            test(`THEN setTitle can be properly invoked AND context props can be accessed`, () => {
                const modifiedTitle = trait.OnCreate.setTitle(createContext);
                (0, testUtilsv2_1.expect)(modifiedTitle).toEqual("current.note.name");
            });
            test(`THEN setTemplate can be properly invoked`, () => {
                (0, testUtilsv2_1.expect)(trait.OnCreate.setTemplate()).toEqual("foo");
            });
        });
    });
    (0, mocha_1.describe)(`GIVEN a user defined trait with invalid JS`, () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN registering the trait", {}, (ctx) => {
            let registrar;
            let trait;
            (0, mocha_1.afterEach)(() => {
                if (registrar && trait) {
                    registrar.unregisterTrait(trait);
                }
            });
            test(`THEN registration fails and a helpful error message is provided`, async () => {
                const { wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const mockExtension = new MockDendronExtension_1.MockDendronExtension({
                    engine,
                    wsRoot,
                    context: ctx,
                });
                registrar = new CommandRegistrar_1.CommandRegistrar(mockExtension);
                trait = new UserDefinedTraitV1_1.UserDefinedTraitV1("foo", path.resolve(__dirname, "../../../../../../src/test/suite-integ/components/traits/testJSTraits/InvalidTestTrait.js"));
                await trait.initialize();
                const traitManager = new NoteTraitManager_1.NoteTraitManager(wsRoot, registrar);
                const resp = traitManager.registerTrait(trait);
                (0, testUtilsv2_1.expect)(resp.error).toBeTruthy();
                // The Invalid JS is inside the setNameModifier function, so expect it
                // to be in the error message.
                (0, testUtilsv2_1.expect)(resp.error?.message.includes("OnWillCreate.setNameModifier"));
                (0, testUtilsv2_1.expect)(resp.error?.innerError).toBeTruthy();
            });
        });
    });
    (0, mocha_1.describe)(`GIVEN a user defined trait with module requires`, () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN registering the trait", {}, (ctx) => {
            let registrar;
            let trait;
            (0, mocha_1.afterEach)(() => {
                if (registrar && trait) {
                    registrar.unregisterTrait(trait);
                }
            });
            test(`THEN registration succeeds and lodash and luxon modules can be invoked`, async () => {
                const { wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const mockExtension = new MockDendronExtension_1.MockDendronExtension({
                    engine,
                    wsRoot,
                    context: ctx,
                });
                registrar = new CommandRegistrar_1.CommandRegistrar(mockExtension);
                trait = new UserDefinedTraitV1_1.UserDefinedTraitV1("foo", path.resolve(__dirname, "../../../../../../src/test/suite-integ/components/traits/testJSTraits/TestTraitUsingModules.js"));
                await trait.initialize();
                const traitManager = new NoteTraitManager_1.NoteTraitManager(wsRoot, registrar);
                const resp = traitManager.registerTrait(trait);
                (0, testUtilsv2_1.expect)(resp.error).toBeFalsy();
                // setTitle uses lodash
                (0, testUtilsv2_1.expect)(trait.OnCreate.setTitle(createContext)).toEqual(2);
                // setTemplate uses luxon
                (0, testUtilsv2_1.expect)(trait.OnCreate.setTemplate().startsWith("2022-01-01")).toBeTruthy();
            });
        });
    });
});
//# sourceMappingURL=NoteTraitService.test.js.map