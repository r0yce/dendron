"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const mocha_1 = require("mocha");
const sinon_1 = __importDefault(require("sinon"));
const ShowLegacyPreview_1 = require("../../commands/ShowLegacyPreview");
const md_1 = require("../../utils/md");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("ShowLegacyPreview", function () {
    let ctx;
    ctx = (0, testUtilsV3_1.setupBeforeAfter)(this);
    (0, mocha_1.test)("ok: show legacy preview when installed ", (done) => {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
            onInit: async ({ engine }) => {
                const note = (await engine.getNoteMeta("foo")).data;
                await WSUtils_1.WSUtils.openNote(note);
                sinon_1.default.stub(md_1.MarkdownUtils, "hasLegacyPreview").returns(true);
                const showLegacyPreview = sinon_1.default.stub(md_1.MarkdownUtils, "showLegacyPreview");
                await new ShowLegacyPreview_1.ShowLegacyPreviewCommand().execute();
                (0, testUtilsv2_1.expect)(showLegacyPreview.called).toBeTruthy();
                done();
            },
        });
    });
});
//# sourceMappingURL=ShowLegacyPreview.test.js.map