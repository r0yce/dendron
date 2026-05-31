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
const pods_core_1 = require("@dendronhq/pods-core");
const path_1 = __importDefault(require("path"));
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
const vscode = __importStar(require("vscode"));
const PublishPod_1 = require("../../commands/PublishPod");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("PublishV2", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {
        beforeHook: () => { },
    });
    test("basic", (done) => {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: async ({ wsRoot, vaults }) => {
                await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
            },
            onInit: async ({ vaults, wsRoot }) => {
                const vault = vaults[0];
                const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
                const fpath = path_1.default.join(vpath, "foo.md");
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(fpath));
                // when a user runs publish pod, they are presented with a list of pods
                // to execute
                // this mocks that command so that Markdown is the only option
                const cmd = new PublishPod_1.PublishPodCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                const podChoice = (0, pods_core_1.podClassEntryToPodItemV4)(pods_core_1.MarkdownPublishPod);
                cmd.gatherInputs = async () => {
                    return { podChoice };
                };
                // this runs the command
                const out = await cmd.run();
                (0, testUtilsv2_1.expect)(out?.endsWith("foo body")).toBeTruthy();
                done();
            },
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN publishing pod with required args", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        ctx,
    }, () => {
        test("THEN show error when required arg not present", (done) => {
            // You can access the workspace inside the test like this:
            const cmd = new PublishPod_1.PublishPodCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            const podChoice = (0, pods_core_1.podClassEntryToPodItemV4)(pods_core_1.AirtablePublishPod);
            cmd.gatherInputs = async () => {
                return { podChoice };
            };
            cmd.run().then(() => {
                (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith("config.publish.yml")).toBeTruthy();
                done();
            });
        });
    });
    // TODO
    test.skip("note ref", (done) => {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: async ({ wsRoot, vaults }) => {
                engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_NOTE_REF_TARGET.create({
                    vault: vaults[0],
                    wsRoot,
                });
                await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_NOTE_REF_LINK.create({
                    vault: vaults[0],
                    wsRoot,
                });
            },
            onInit: async ({ vaults, wsRoot }) => {
                const vault = vaults[0];
                const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
                const refTargetFname = common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_NOTE_REF_LINK.fname;
                const fpath = path_1.default.join(vpath, `${refTargetFname}.md`);
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(fpath));
                const cmd = new PublishPod_1.PublishPodCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                const podChoice = (0, pods_core_1.podClassEntryToPodItemV4)(pods_core_1.MarkdownPublishPod);
                cmd.gatherInputs = async () => {
                    return { podChoice };
                };
                const out = (await cmd.run());
                (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                    body: out,
                    match: common_test_utils_1.NOTE_BODY_PRESETS_V4.NOTE_REF_TARGET_BODY.split("\n"),
                })).toBeTruthy();
                done();
            },
        });
    });
});
//# sourceMappingURL=PublishPod.test.js.map