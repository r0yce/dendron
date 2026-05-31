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
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const mocha_1 = require("mocha");
const vscode = __importStar(require("vscode"));
const NoteLookupCommand_1 = require("../../commands/NoteLookupCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("Scratch Notes", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {});
    (0, mocha_1.describe)("single", () => {
        test("basic", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                postSetupHook: async ({ wsRoot, vaults }) => {
                    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE.create({
                        vault: vaults[0],
                        wsRoot,
                    });
                },
                onInit: async ({ vaults }) => {
                    const vault = vaults[0];
                    const fname = common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE.fname;
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const note = (await engine.findNotesMeta({ fname, vault }))[0];
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    const SIMPLE_SELECTION = new vscode.Selection(7, 0, 7, 12);
                    editor.selection = SIMPLE_SELECTION;
                    await new NoteLookupCommand_1.NoteLookupCommand().run({
                        selectionType: common_all_1.LookupSelectionTypeEnum.selection2link,
                        noteType: common_all_1.LookupNoteTypeEnum.scratch,
                        noConfirm: true,
                    });
                    const scratchNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
                    (0, testUtilsv2_1.expect)(scratchNote.fname.startsWith("scratch")).toBeTruthy();
                    done();
                },
            });
        });
        test("domainAsNamespace", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                modConfigCb: (config) => {
                    common_all_1.ConfigUtils.setScratchProps(config, "addBehavior", common_all_1.NoteAddBehaviorEnum.childOfDomainNamespace);
                    return config;
                },
                postSetupHook: async ({ wsRoot, vaults }) => {
                    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD.create({
                        vault: vaults[0],
                        wsRoot,
                    });
                },
                onInit: async ({ vaults, engine }) => {
                    const vault = vaults[0];
                    const { fname, selection } = common_test_utils_1.NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD;
                    const note = (await engine.findNotesMeta({ fname, vault }))[0];
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = new vscode.Selection(...selection);
                    await new NoteLookupCommand_1.NoteLookupCommand().run({
                        selectionType: common_all_1.LookupSelectionTypeEnum.selection2link,
                        noteType: common_all_1.LookupNoteTypeEnum.scratch,
                        noConfirm: true,
                    });
                    const scratchNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
                    (0, testUtilsv2_1.expect)(scratchNote.fname.startsWith("pro.foo.scratch")).toBeTruthy();
                    done();
                },
            });
        });
    });
    (0, mocha_1.describe)("multi", () => {
        test("basic, multi", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                postSetupHook: async ({ wsRoot, vaults }) => {
                    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE.create({
                        vault: vaults[1],
                        wsRoot,
                    });
                },
                onInit: async ({ vaults }) => {
                    const vault = vaults[1];
                    const fname = common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE.fname;
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const note = (await engine.findNotesMeta({ fname, vault }))[0];
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    const SIMPLE_SELECTION = new vscode.Selection(7, 0, 7, 12);
                    editor.selection = SIMPLE_SELECTION;
                    await new NoteLookupCommand_1.NoteLookupCommand().run({
                        selectionType: common_all_1.LookupSelectionTypeEnum.selection2link,
                        noteType: common_all_1.LookupNoteTypeEnum.scratch,
                        noConfirm: true,
                    });
                    const scratchNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
                    (0, testUtilsv2_1.expect)(scratchNote.fname.startsWith("scratch")).toBeTruthy();
                    done();
                },
            });
        });
        test("domainAsNamespace", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                modConfigCb: (config) => {
                    common_all_1.ConfigUtils.setScratchProps(config, "addBehavior", common_all_1.NoteAddBehaviorEnum.childOfDomainNamespace);
                    return config;
                },
                postSetupHook: async ({ wsRoot, vaults }) => {
                    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD.create({
                        vault: vaults[1],
                        wsRoot,
                    });
                },
                onInit: async ({ vaults, engine }) => {
                    const vault = vaults[1];
                    const { fname, selection } = common_test_utils_1.NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD;
                    const note = (await engine.findNotesMeta({ fname, vault }))[0];
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = new vscode.Selection(...selection);
                    await new NoteLookupCommand_1.NoteLookupCommand().run({
                        selectionType: common_all_1.LookupSelectionTypeEnum.selection2link,
                        noteType: common_all_1.LookupNoteTypeEnum.scratch,
                        noConfirm: true,
                    });
                    const scratchNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
                    (0, testUtilsv2_1.expect)(scratchNote.fname.startsWith("pro.foo.scratch")).toBeTruthy();
                    done();
                },
            });
        });
    });
});
//# sourceMappingURL=LookupScratch.test.js.map