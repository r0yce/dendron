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
const mocha_1 = require("mocha");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const SchemaSyncService_1 = require("../../services/SchemaSyncService");
const testUtilsv2_1 = require("../testUtilsv2");
const vscode = __importStar(require("vscode"));
const testUtilsV3_1 = require("../testUtilsV3");
suite("WHEN syncing schema", function () {
    let schemaSyncService;
    (0, mocha_1.describe)("AND file is not new", () => {
        (0, testUtilsV3_1.describeMultiWS)("AND edit is made", {
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            this.timeout(10e5);
            (0, mocha_1.before)(() => {
                schemaSyncService = new SchemaSyncService_1.SchemaSyncService(ExtensionProvider_1.ExtensionProvider.getExtension());
            });
            test("THEN don't change file", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                const { data: schema } = await ext.getEngine().getSchema("foo");
                await ExtensionProvider_1.ExtensionProvider.getWSUtils()
                    .openSchema(schema)
                    .then(async (editor) => {
                    await editor.edit((editBuilder) => {
                        /**
                         * Results in the following text
                         * - id: ch1
                         * 	children: [{pattern: one}]
                         * 	title: ch1
                         */
                        return editBuilder.insert(new vscode.Position(9, 15), "{pattern: one}");
                    });
                    return editor.document.save().then(async () => {
                        await schemaSyncService?.saveSchema({
                            uri: editor.document.uri,
                            isBrandNewFile: false,
                        });
                        // schema file wasn't edited in the process
                        (0, testUtilsv2_1.expect)(editor.document.isDirty).toBeFalsy();
                        (0, testUtilsv2_1.expect)(editor.document
                            .getText()
                            .indexOf("children: [{pattern: one}]")).toBeTruthy();
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=SchemaSyncService.test.js.map