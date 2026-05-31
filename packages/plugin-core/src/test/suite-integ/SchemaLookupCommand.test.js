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
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const SchemaLookupCommand_1 = require("../../commands/SchemaLookupCommand");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("SchemaLookupCommand", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {});
    (0, mocha_1.describe)("basics", () => {
        test("lookup existing schema", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async () => {
                    const cmd = new SchemaLookupCommand_1.SchemaLookupCommand();
                    await cmd.run({ noConfirm: true, initialValue: "foo" });
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                    (0, testUtilsv2_1.expect)(editor).toBeTruthy();
                    const fileName = editor.document.fileName;
                    const basename = path_1.default.basename(fileName, ".yml");
                    (0, testUtilsv2_1.expect)(basename).toEqual("foo.schema");
                    cmd.cleanUp();
                    done();
                },
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN performing a multilevel schema lookup", {
            postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
            ctx,
        }, () => {
            test("THEN proper information message is shown", async () => {
                const windowSpy = sinon_1.default.spy(vscode.window, "showInformationMessage");
                const cmd = new SchemaLookupCommand_1.SchemaLookupCommand();
                await cmd.run({ noConfirm: true, initialValue: "foo.test" });
                const infoMsg = windowSpy.getCall(0).args[0];
                (0, testUtilsv2_1.expect)(infoMsg).toEqual("It looks like you are trying to create a multi-level [schema](https://wiki.dendron.so/notes/c5e5adde-5459-409b-b34d-a0d75cbb1052.html). This is not supported. If you are trying to create a note instead, run the `> Note Lookup` command or click on `Note Lookup`");
                cmd.cleanUp();
            });
        });
        (0, mocha_1.describe)("updateItems", () => {
            test("star query", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                    },
                    onInit: async () => {
                        const cmd = new SchemaLookupCommand_1.SchemaLookupCommand();
                        const { quickpick } = (await cmd.run({
                            noConfirm: true,
                            initialValue: "*",
                        }));
                        (0, testUtilsv2_1.expect)(quickpick.selectedItems.length).toEqual(2);
                        cmd.cleanUp();
                        done();
                    },
                });
            });
        });
        test("lookup new schema", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async () => {
                    const cmd = new SchemaLookupCommand_1.SchemaLookupCommand();
                    await cmd.run({ noConfirm: true, initialValue: "baz" });
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                    (0, testUtilsv2_1.expect)(editor).toBeTruthy();
                    const fileName = editor.document.fileName;
                    const basename = path_1.default.basename(fileName, ".yml");
                    (0, testUtilsv2_1.expect)(basename).toEqual("baz.schema");
                    done();
                },
            });
        });
        test("lookup new schema assumes vault of open note", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ engine }) => {
                    const cmd = new SchemaLookupCommand_1.SchemaLookupCommand();
                    const fooNote = (await engine.getNoteMeta("foo")).data;
                    await WSUtils_1.WSUtils.openNote(fooNote);
                    await cmd.run({ noConfirm: true, initialValue: "baz" });
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                    (0, testUtilsv2_1.expect)(editor).toBeTruthy();
                    const fileName = editor.document.fileName;
                    const basename = path_1.default.basename(fileName, ".yml");
                    (0, testUtilsv2_1.expect)(basename).toEqual("baz.schema");
                    const bazSchemaModule = (await engine.getSchema("baz")).data;
                    (0, testUtilsv2_1.expect)(bazSchemaModule?.vault.fsPath).toEqual(fooNote.vault.fsPath);
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("picker items populated with existing schemas", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ engine }) => {
                    const cmd = new SchemaLookupCommand_1.SchemaLookupCommand();
                    const gatherOut = await cmd.gatherInputs({
                        noConfirm: true,
                    });
                    const enrichOut = await cmd.enrichInputs(gatherOut);
                    const selectedItems = enrichOut?.quickpick.selectedItems;
                    const selectedItemIds = selectedItems?.map((item) => item.id);
                    (0, testUtilsv2_1.expect)(selectedItemIds).toEqual(lodash_1.default.map((await engine.querySchema("*")).data, (schema) => schema.fname));
                    cmd.cleanUp();
                    done();
                },
            });
        });
    });
});
//# sourceMappingURL=SchemaLookupCommand.test.js.map