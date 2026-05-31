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
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const mocha_1 = require("mocha");
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const Goto_1 = require("../../commands/Goto");
const GoToNoteInterface_1 = require("../../commands/GoToNoteInterface");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const GotoNotePreset_1 = require("../presets/GotoNotePreset");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const executeGotoCmd = async (ext) => {
    // return vscode.commands.executeCommand(DENDRON_COMMANDS.GOTO.key);
    return new Goto_1.GotoCommand(ext).execute();
};
/* Before each candidate */
// const ext = ExtensionProvider.getExtension();
// vscode.commands.executeCommand(DENDRON_COMMANDS.GOTO.key);
suite("GotoNote", function () {
    (0, mocha_1.describe)("WHEN note link is selected", () => {
        (0, testUtilsV3_1.describeMultiWS)(GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.label, {
            preSetupHook: GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.preSetupHook,
        }, () => {
            test("THEN goto note", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.beforeTestResults({ ext });
                await executeGotoCmd(ext);
                await (0, common_test_utils_1.runMochaHarness)(GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.results);
            });
        });
        (0, testUtilsV3_1.describeMultiWS)(GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_TO_NOTE_IN_SAME_VAULT.label, {
            preSetupHook: GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_TO_NOTE_IN_SAME_VAULT.preSetupHook,
        }, () => {
            test("THEN goto note", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_TO_NOTE_IN_SAME_VAULT.beforeTestResults({
                    ext,
                });
                await executeGotoCmd(ext);
                await (0, common_test_utils_1.runMochaHarness)(GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_TO_NOTE_IN_SAME_VAULT.results);
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN link to note with uri http", {
            preSetupHook: GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_TO_NOTE_WITH_URI_HTTP.preSetupHook,
        }, () => {
            test("THEN goto note", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_TO_NOTE_WITH_URI_HTTP.beforeTestResults({
                    ext,
                });
                const cmd = new Goto_1.GotoCommand(ext);
                const openLinkMethod = sinon_1.default.stub(cmd, "openLink");
                await cmd.execute();
                (0, testUtilsv2_1.expect)(openLinkMethod.calledOnce).toBeTruthy();
            });
        });
    });
    (0, mocha_1.describe)("WHEN external link is selected", () => {
        (0, testUtilsV3_1.describeMultiWS)(GotoNotePreset_1.GOTO_NOTE_PRESETS.VALID_URL.label, {
            preSetupHook: GotoNotePreset_1.GOTO_NOTE_PRESETS.VALID_URL.preSetupHook,
        }, () => {
            test("THEN goto the external link", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await GotoNotePreset_1.GOTO_NOTE_PRESETS.VALID_URL.beforeTestResults({ ext });
                /* Prevent the test to actually open the link */
                const avoidPopUp = sinon_1.default.stub(vscode.env, "openExternal");
                const { data } = await executeGotoCmd(ext);
                (0, testUtilsv2_1.expect)(data).toContain({
                    kind: GoToNoteInterface_1.TargetKind.LINK,
                    fullPath: "https://www.dendron.so/",
                    fromProxy: false,
                });
                avoidPopUp.restore();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)(GotoNotePreset_1.GOTO_NOTE_PRESETS.PARTIAL_URL.label, {
            preSetupHook: GotoNotePreset_1.GOTO_NOTE_PRESETS.PARTIAL_URL.preSetupHook,
        }, () => {
            test("THEN error message should show up", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await GotoNotePreset_1.GOTO_NOTE_PRESETS.PARTIAL_URL.beforeTestResults({ ext });
                const { error } = (await executeGotoCmd(ext));
                (0, testUtilsv2_1.expect)(error?.message).toEqual("no valid path or URL selected");
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)(GotoNotePreset_1.GOTO_NOTE_PRESETS.NO_LINK.label, { preSetupHook: GotoNotePreset_1.GOTO_NOTE_PRESETS.NO_LINK.preSetupHook }, () => {
        test("THEN error message should show up", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            await GotoNotePreset_1.GOTO_NOTE_PRESETS.NO_LINK.beforeTestResults({ ext });
            const { error } = (await executeGotoCmd(ext));
            (0, testUtilsv2_1.expect)(error?.message).toEqual("no valid path or URL selected");
        });
    });
});
//# sourceMappingURL=Goto.test.js.map