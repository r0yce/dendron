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
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const OpenLink_1 = require("../../commands/OpenLink");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("OpenLink", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {});
    test("error: cursor on non-link", (done) => {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: async ({ wsRoot, vaults }) => {
                engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
            },
            onInit: async () => {
                const cmd = new OpenLink_1.OpenLinkCommand();
                const { error } = await cmd.execute();
                (0, testUtilsv2_1.expect)(error.message).toEqual("no valid path or URL selected");
                done();
            },
        });
    });
    test("With an invalid character in the selection.", (done) => {
        let noteWithLink;
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: async ({ wsRoot, vaults }) => {
                noteWithLink = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "OpenLinkTest",
                    vault: vaults[0],
                    wsRoot,
                    body: "Here we have some example text to search for URLs within",
                });
            },
            onInit: async () => {
                // Open and select some text
                const editor = await WSUtils_1.WSUtils.openNote(noteWithLink);
                editor.selection = new vscode.Selection(7, 1, 7, 10);
                const cmd = new OpenLink_1.OpenLinkCommand();
                const { error } = await cmd.execute();
                (0, testUtilsv2_1.expect)(error.message).toEqual("no valid path or URL selected");
                done();
            },
        });
    });
    test("grab a URL under the cursor.", (done) => {
        let noteWithLink;
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: async ({ wsRoot, vaults }) => {
                noteWithLink = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "OpenLinkTest",
                    vault: vaults[0],
                    wsRoot,
                    body: "Here we have some example text to search for URLs within\n" +
                        "https://www.dendron.so/",
                });
            },
            onInit: async () => {
                // Open and select some text
                const editor = await WSUtils_1.WSUtils.openNote(noteWithLink);
                editor.selection = new vscode.Selection(8, 1, 8, 5);
                const cmd = new OpenLink_1.OpenLinkCommand();
                const avoidPopUp = sinon_1.default.stub(vscode.env, "openExternal");
                const text = await cmd.run();
                (0, testUtilsv2_1.expect)(text).toEqual({ filepath: "https://www.dendron.so/" });
                avoidPopUp.restore();
                done();
            },
        });
    });
    test("with a partially selected URL", (done) => {
        let noteWithLink;
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: async ({ wsRoot, vaults }) => {
                noteWithLink = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "OpenLinkTest",
                    vault: vaults[0],
                    wsRoot,
                    body: "Here we have some example text to search for URLs within\n" +
                        "check out [dendron](https://www.dendron.so/)",
                });
            },
            onInit: async () => {
                // Open and select some text
                const editor = await WSUtils_1.WSUtils.openNote(noteWithLink);
                editor.selection = new vscode.Selection(8, 15, 8, 25);
                const cmd = new OpenLink_1.OpenLinkCommand();
                const { error } = await cmd.execute();
                (0, testUtilsv2_1.expect)(error.message).toEqual("no valid path or URL selected");
                done();
            },
        });
    });
    // TODO
    test.skip("open in diff vault", (done) => {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: async ({ wsRoot, vaults }) => {
                engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
            },
            onInit: async ({ vaults, wsRoot }) => {
                const vault = vaults[1];
                const assetPath = path_1.default.join("assets", "foo.txt");
                const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
                fs_extra_1.default.ensureFileSync(path_1.default.join(vpath, assetPath));
                // TODO: write into the current note
                done();
            },
        });
    });
});
//# sourceMappingURL=OpenLink.test.js.map