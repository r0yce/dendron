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
Object.defineProperty(exports, "__esModule", { value: true });
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const vscode = __importStar(require("vscode"));
const CreateScratchNoteCommand_1 = require("../../commands/CreateScratchNoteCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("CreateScratchNoteCommand", function () {
    (0, testUtilsV3_1.describeMultiWS)("GIVEN command executed", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN scratch note with correct name created.", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const wsUtils = ext.wsUtils;
            const cmd = new CreateScratchNoteCommand_1.CreateScratchNoteCommand(ext);
            const { engine } = ext.getDWorkspace();
            const note = (await engine.getNoteMeta("foo")).data;
            await wsUtils.openNote(note);
            await cmd.run({ noConfirm: true });
            const activeNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
            (0, testUtilsv2_1.expect)(activeNote.fname.startsWith("scratch.")).toBeTruthy();
        });
        test("THEN selection2link is applied.", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const wsUtils = ext.wsUtils;
            const cmd = new CreateScratchNoteCommand_1.CreateScratchNoteCommand(ext);
            const { engine } = ext.getDWorkspace();
            const note = (await engine.getNoteMeta("foo")).data;
            const fooNoteEditor = await wsUtils.openNote(note);
            fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
            await cmd.run({ noConfirm: true });
            const activeNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
            (0, testUtilsv2_1.expect)(activeNote.fname.endsWith(".foo-body")).toBeTruthy();
            const changedFooNoteText = fooNoteEditor.document.getText();
            (0, testUtilsv2_1.expect)(changedFooNoteText.endsWith(".foo-body]]\n"));
        });
    });
});
//# sourceMappingURL=CreateScratchNoteCommand.test.js.map