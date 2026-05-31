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
const sinon_1 = __importDefault(require("sinon"));
const PasteLink_1 = require("../../commands/PasteLink");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const utils = __importStar(require("../../utils"));
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
// Avoid https://minaluke.medium.com/how-to-stub-spy-a-default-exported-function-a2dc1b580a6b
// function fakeDefaultExport(moduleRelativePath: string, stubs: any) {
//   if (require.cache[require.resolve(moduleRelativePath)]) {
//     delete require.cache[require.resolve(moduleRelativePath)];
//   }
//   Object.keys(stubs).forEach(dependencyRelativePath => {
//     require.cache[require.resolve(dependencyRelativePath)] = {
//       exports: stubs[dependencyRelativePath],
//     } as any;
//   });
//   return require(moduleRelativePath);
// };
const DEFAULT_OPENGRAPH_RESPONSE_SUCCESS = {
    error: false,
    result: { ogTitle: "Dendron Home" },
};
const DEFAULT_OPENGRAPH_RESPONSE_FAIL = { error: true };
const OPENGRAPH_RESPONSE_SUCCESS_NOTTRIMMED = {
    error: false,
    result: { ogTitle: "\n \t Dendron Home \n \t " },
};
// TODO: issues with stubbing proprty using sinon
suite("pasteLink", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this);
    (0, testUtilsV3_1.describeMultiWS)("WHEN pasting regular link", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        ctx,
    }, () => {
        test("THEN gets link with metadata", async () => {
            // You can access the workspace inside the test like this:
            const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const note = (await engine.getNoteMeta("foo")).data;
            await WSUtils_1.WSUtils.openNote(note);
            utils.clipboard.writeText("https://dendron.so");
            sinon_1.default
                .stub(utils, "getOpenGraphMetadata")
                .returns(Promise.resolve(DEFAULT_OPENGRAPH_RESPONSE_SUCCESS));
            const formattedLink = await new PasteLink_1.PasteLinkCommand().run();
            (0, testUtilsv2_1.expect)(formattedLink).toEqual(`[Dendron Home](https://dendron.so)`);
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN pasting link without trimmed title", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        ctx,
    }, () => {
        test("THEN trims link title", async () => {
            // You can access the workspace inside the test like this:
            const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const note = (await engine.getNoteMeta("foo")).data;
            await WSUtils_1.WSUtils.openNote(note);
            utils.clipboard.writeText("https://dendron.so");
            sinon_1.default
                .stub(utils, "getOpenGraphMetadata")
                .returns(Promise.resolve(OPENGRAPH_RESPONSE_SUCCESS_NOTTRIMMED));
            const formattedLink = await new PasteLink_1.PasteLinkCommand().run();
            (0, testUtilsv2_1.expect)(formattedLink).toEqual(`[Dendron Home](https://dendron.so)`);
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN pasting link without connection", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        ctx,
    }, () => {
        test("THEN gets raw link", async () => {
            // You can access the workspace inside the test like this:
            const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const note = (await engine.getNoteMeta("foo")).data;
            await WSUtils_1.WSUtils.openNote(note);
            utils.clipboard.writeText("https://dendron.so");
            sinon_1.default
                .stub(utils, "getOpenGraphMetadata")
                .returns(Promise.resolve(DEFAULT_OPENGRAPH_RESPONSE_FAIL));
            const formattedLink = await new PasteLink_1.PasteLinkCommand().run();
            (0, testUtilsv2_1.expect)(formattedLink).toEqual(`<https://dendron.so>`);
        });
    });
});
//# sourceMappingURL=PasteLink.test.js.map