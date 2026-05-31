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
const ExtensionProvider_1 = require("../../ExtensionProvider");
const testUtilsV3_1 = require("../testUtilsV3");
const WSUtilsV2_1 = require("../../WSUtilsV2");
const DeleteCommand_1 = require("../../commands/DeleteCommand");
const sinon_1 = __importDefault(require("sinon"));
const testUtilsv2_1 = require("../testUtilsv2");
const common_all_1 = require("@dendronhq/common-all");
const vscode = __importStar(require("vscode"));
const vscode_uri_1 = require("vscode-uri");
suite("Delete Command", function () {
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a note open in text editor and Delete Command is run", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        timeout: 1e6,
    }, () => {
        test("WHEN selected proceed to delete THEN delete the note", async () => {
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const deleteCmd = new DeleteCommand_1.DeleteCommand();
            sinon_1.default.stub(deleteCmd, "promptConfirmation").resolves(true);
            const note = (await engine.findNotesMeta({ fname: "bar" }))[0];
            await WSUtilsV2_1.WSUtilsV2.instance().openNote(note);
            const resp = await deleteCmd.execute();
            (0, testUtilsv2_1.expect)(resp?.error).toEqual(undefined);
            const noteAfterDelete = await engine.findNotesMeta({ fname: "bar" });
            (0, testUtilsv2_1.expect)(noteAfterDelete).toEqual([]);
        });
        test("WHEN noConfirm: true is sent via keyvinding args THEN delete the note", async () => {
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const deleteCmd = new DeleteCommand_1.DeleteCommand();
            const note = (await engine.findNotesMeta({ fname: "foo.ch1" }))[0];
            await WSUtilsV2_1.WSUtilsV2.instance().openNote(note);
            const resp = await deleteCmd.execute({ noConfirm: true });
            (0, testUtilsv2_1.expect)(resp?.error).toEqual(undefined);
            const noteAfterDelete = await engine.findNotesMeta({
                fname: "foo.ch1",
            });
            (0, testUtilsv2_1.expect)(noteAfterDelete).toEqual([]);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN Delete Command is run from Explorer Menu for a note", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        timeout: 1e6,
    }, () => {
        test("THEN delete the note", async () => {
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultPath = common_all_1.VaultUtils.getRelPath(vaults[0]);
            const barUri = vscode_uri_1.Utils.joinPath(vscode.Uri.file(wsRoot), vaultPath, "bar.md");
            const deleteCmd = new DeleteCommand_1.DeleteCommand();
            sinon_1.default.stub(deleteCmd, "promptConfirmation").resolves(true);
            await engine.findNotesMeta({ fname: "bar" });
            const resp = await deleteCmd.execute(barUri);
            (0, testUtilsv2_1.expect)(resp?.error).toEqual(undefined);
            const noteAfterDelete = await engine.findNotesMeta({ fname: "bar" });
            (0, testUtilsv2_1.expect)(noteAfterDelete).toEqual([]);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN Delete Command is run from Tree View Context Menu for a note", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        timeout: 1e6,
    }, () => {
        test("THEN delete the note", async () => {
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const deleteCmd = new DeleteCommand_1.DeleteCommand();
            sinon_1.default.stub(deleteCmd, "promptConfirmation").resolves(true);
            const note = (await engine.findNotesMeta({ fname: "bar" }))[0];
            const resp = await deleteCmd.execute(note.id);
            (0, testUtilsv2_1.expect)(resp?.error).toEqual(undefined);
            const noteAfterDelete = await engine.findNotesMeta({ fname: "bar" });
            (0, testUtilsv2_1.expect)(noteAfterDelete).toEqual([]);
        });
    });
});
//# sourceMappingURL=DeleteCommand.test.js.map