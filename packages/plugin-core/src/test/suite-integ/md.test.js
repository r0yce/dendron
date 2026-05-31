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
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const vscode = __importStar(require("vscode"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const md_1 = require("../../utils/md");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("WHEN getReferenceAtPosition", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this);
    const activeNoteName = "active";
    (0, testUtilsV3_1.describeMultiWS)("AND WHEN header anchor is present", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            return common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: activeNoteName,
                vault: vaults[0],
                wsRoot,
                body: "[[foo#foo1]]",
            });
        },
        ctx,
    }, () => {
        test("THEN initializes correctly", async () => {
            // You can access the workspace inside the test like this:
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const activeNote = (await engine.getNoteMeta(activeNoteName)).data;
            const editor = await WSUtils_1.WSUtils.openNote(activeNote);
            const position = new vscode.Position(7, 0);
            const reference = await (0, md_1.getReferenceAtPosition)({
                document: editor.document,
                position,
                wsRoot,
                vaults,
            });
            (0, testUtilsv2_1.expect)(reference).toEqual({
                anchorEnd: undefined,
                anchorStart: {
                    type: "header",
                    value: "foo1",
                },
                label: "",
                range: new vscode.Range(new vscode.Position(7, 0), new vscode.Position(7, 12)),
                ref: "foo",
                refText: "foo#foo1",
                refType: "wiki",
                vaultName: undefined,
            });
            return;
        });
    });
});
//# sourceMappingURL=md.test.js.map