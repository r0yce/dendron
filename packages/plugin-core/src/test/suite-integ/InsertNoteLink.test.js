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
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const mocha_1 = require("mocha");
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const InsertNoteLink_1 = require("../../commands/InsertNoteLink");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("InsertNoteLink", function () {
    let ctx;
    ctx = (0, testUtilsV3_1.setupBeforeAfter)(this);
    (0, mocha_1.describe)("basic", () => {
        test("basic", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ engine }) => {
                    const note = (await engine.getNote("foo")).data;
                    await WSUtils_1.WSUtils.openNote(note);
                    const cmd = new InsertNoteLink_1.InsertNoteLinkCommand();
                    sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                        notes: [note],
                    }));
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    editor.selection = new vscode.Selection(10, 0, 10, 12);
                    await cmd.run();
                    const body = editor.document.getText();
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({ body, match: ["[[foo]]"] })).toBeTruthy();
                    done();
                },
            });
        });
        test("basic multiselect", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ engine }) => {
                    const foo = (await engine.getNote("foo")).data;
                    const fooCh1 = (await engine.getNote("foo.ch1")).data;
                    await WSUtils_1.WSUtils.openNote(fooCh1);
                    const cmd = new InsertNoteLink_1.InsertNoteLinkCommand();
                    sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                        notes: [foo, fooCh1],
                    }));
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    editor.selection = new vscode.Selection(10, 0, 10, 12);
                    await cmd.run({ multiSelect: true });
                    const body = editor.document.getText();
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body,
                        match: ["[[foo]]", "[[foo.ch1]]"],
                    })).toBeTruthy();
                    done();
                },
            });
        });
    });
    (0, mocha_1.describe)("alias modes", () => {
        test("snippet", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
                onInit: async ({ engine }) => {
                    const note = (await engine.getNote("foo")).data;
                    const cmd = new InsertNoteLink_1.InsertNoteLinkCommand();
                    sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                        notes: [note],
                    }));
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    editor.selection = new vscode.Selection(10, 0, 10, 12);
                    await cmd.run({ aliasMode: "snippet" });
                    const body = editor.document.getText();
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({ body, match: ["[[alias|foo]]"] })).toBeTruthy();
                    const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
                    (0, testUtilsv2_1.expect)(text).toEqual("alias");
                    done();
                },
            });
        });
        test("snippet multiSelect", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
                onInit: async ({ engine }) => {
                    const foo = (await engine.getNote("foo")).data;
                    const fooCh1 = (await engine.getNote("foo.ch1")).data;
                    await WSUtils_1.WSUtils.openNote(fooCh1);
                    const cmd = new InsertNoteLink_1.InsertNoteLinkCommand();
                    sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                        notes: [foo, fooCh1],
                    }));
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    editor.selection = new vscode.Selection(10, 0, 10, 12);
                    await cmd.run({ multiSelect: true, aliasMode: "snippet" });
                    const body = editor.document.getText();
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body,
                        match: ["[[alias|foo]]", "[[alias|foo.ch1]]"],
                    })).toBeTruthy();
                    const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
                    (0, testUtilsv2_1.expect)(text).toEqual("alias");
                    done();
                },
            });
        });
        test("selection", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
                onInit: async ({ engine }) => {
                    const foo = (await engine.getNote("foo")).data;
                    const fooCh1 = (await engine.getNote("foo.ch1")).data;
                    await WSUtils_1.WSUtils.openNote(fooCh1);
                    const cmd = new InsertNoteLink_1.InsertNoteLinkCommand();
                    sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                        notes: [foo],
                    }));
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    editor.selection = new vscode.Selection(7, 0, 7, 12);
                    await cmd.run({ aliasMode: "selection" });
                    const body = editor.document.getText();
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body,
                        match: ["[[foo.ch1 body|foo]]"],
                    })).toBeTruthy();
                    done();
                },
            });
        });
        test("selection multiSelect", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
                onInit: async ({ engine }) => {
                    const foo = (await engine.getNote("foo")).data;
                    const fooCh1 = (await engine.getNote("foo.ch1")).data;
                    await WSUtils_1.WSUtils.openNote(fooCh1);
                    const cmd = new InsertNoteLink_1.InsertNoteLinkCommand();
                    sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                        notes: [foo, fooCh1],
                    }));
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    editor.selection = new vscode.Selection(7, 0, 7, 12);
                    await cmd.run({ multiSelect: true, aliasMode: "selection" });
                    const body = editor.document.getText();
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body,
                        match: ["[[foo.ch1 body|foo]]", "[[foo.ch1 body|foo.ch1]]"],
                    })).toBeTruthy();
                    done();
                },
            });
        });
        test("title", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
                onInit: async ({ engine }) => {
                    const foo = (await engine.getNote("foo")).data;
                    const fooCh1 = (await engine.getNote("foo.ch1")).data;
                    await WSUtils_1.WSUtils.openNote(fooCh1);
                    const cmd = new InsertNoteLink_1.InsertNoteLinkCommand();
                    sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                        notes: [foo],
                    }));
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    editor.selection = new vscode.Selection(10, 0, 10, 12);
                    await cmd.run({ aliasMode: "title" });
                    const body = editor.document.getText();
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({ body, match: ["[[Foo|foo]]"] })).toBeTruthy();
                    done();
                },
            });
        });
        test("title multiSelect", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
                onInit: async ({ engine }) => {
                    const foo = (await engine.getNote("foo")).data;
                    const fooCh1 = (await engine.getNote("foo.ch1")).data;
                    await WSUtils_1.WSUtils.openNote(fooCh1);
                    const cmd = new InsertNoteLink_1.InsertNoteLinkCommand();
                    sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                        notes: [foo, fooCh1],
                    }));
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    editor.selection = new vscode.Selection(10, 0, 10, 12);
                    await cmd.run({ multiSelect: true, aliasMode: "title" });
                    const body = editor.document.getText();
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body,
                        match: ["[[Foo|foo]]", "[[Ch1|foo.ch1]]"],
                    })).toBeTruthy();
                    done();
                },
            });
        });
        test("prompt", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
                onInit: async ({ engine }) => {
                    const foo = (await engine.getNote("foo")).data;
                    const fooCh1 = (await engine.getNote("foo.ch1")).data;
                    await WSUtils_1.WSUtils.openNote(fooCh1);
                    const cmd = new InsertNoteLink_1.InsertNoteLinkCommand();
                    sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                        notes: [foo],
                    }));
                    sinon_1.default.stub(cmd, "promptForAlias").resolves("user input");
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    editor.selection = new vscode.Selection(10, 0, 10, 12);
                    await cmd.run({ aliasMode: "prompt" });
                    const body = editor.document.getText();
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body,
                        match: ["[[user input|foo]]"],
                    })).toBeTruthy();
                    done();
                },
            });
        });
        test("prompt multiSelect", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
                onInit: async ({ engine }) => {
                    const foo = (await engine.getNote("foo")).data;
                    const fooCh1 = (await engine.getNote("foo.ch1")).data;
                    await WSUtils_1.WSUtils.openNote(fooCh1);
                    const cmd = new InsertNoteLink_1.InsertNoteLinkCommand();
                    sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                        notes: [foo, fooCh1],
                    }));
                    sinon_1.default
                        .stub(cmd, "promptForAlias")
                        .onFirstCall()
                        .resolves("input 1")
                        .onSecondCall()
                        .resolves("input 2");
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    editor.selection = new vscode.Selection(10, 0, 10, 12);
                    await cmd.run({ multiSelect: true, aliasMode: "prompt" });
                    const body = editor.document.getText();
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body,
                        match: ["[[input 1|foo]]", "[[input 2|foo.ch1]]"],
                    })).toBeTruthy();
                    done();
                },
            });
        });
        test("none", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
                onInit: async ({ engine }) => {
                    const foo = (await engine.getNote("foo")).data;
                    const fooCh1 = (await engine.getNote("foo.ch1")).data;
                    await WSUtils_1.WSUtils.openNote(fooCh1);
                    const cmd = new InsertNoteLink_1.InsertNoteLinkCommand();
                    sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                        notes: [foo],
                    }));
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    editor.selection = new vscode.Selection(10, 0, 10, 12);
                    await cmd.run({ aliasMode: "none" });
                    const body = editor.document.getText();
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({ body, match: ["[[foo]]"] })).toBeTruthy();
                    done();
                },
            });
        });
        test("none multiSelect", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
                onInit: async ({ engine }) => {
                    const foo = (await engine.getNote("foo")).data;
                    const fooCh1 = (await engine.getNote("foo.ch1")).data;
                    await WSUtils_1.WSUtils.openNote(fooCh1);
                    const cmd = new InsertNoteLink_1.InsertNoteLinkCommand();
                    sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                        notes: [foo, fooCh1],
                    }));
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    editor.selection = new vscode.Selection(10, 0, 10, 12);
                    await cmd.run({ multiSelect: true, aliasMode: "none" });
                    const body = editor.document.getText();
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body,
                        match: ["[[foo]]", "[[foo.ch1]]"],
                    })).toBeTruthy();
                    done();
                },
            });
        });
    });
});
//# sourceMappingURL=InsertNoteLink.test.js.map