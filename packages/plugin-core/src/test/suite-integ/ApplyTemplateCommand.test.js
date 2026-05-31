"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const sinon_1 = __importDefault(require("sinon"));
const ApplyTemplateCommand_1 = require("../../commands/ApplyTemplateCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const WSUtilsV2_1 = require("../../WSUtilsV2");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
// these tests can run longer than the default 2s timeout;
const timeout = 5e3;
async function executeTemplateApply({ templateNote, targetNote, }) {
    const cmd = new ApplyTemplateCommand_1.ApplyTemplateCommand();
    const stub = sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
        templateNote,
        targetNote,
    }));
    const resp = await cmd.run();
    const updatedTargetNote = resp?.updatedTargetNote;
    return {
        stub,
        templateNote,
        updatedTargetNote,
    };
}
function createTemplateNote({ body, custom }) {
    const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
    const engine = ext.getEngine();
    const vault = engine.vaults[0];
    const wsRoot = engine.wsRoot;
    return common_test_utils_1.NoteTestUtilsV4.createNote({
        body,
        fname: "templates.foo",
        vault,
        wsRoot,
        custom,
    });
}
async function runTemplateTest({ templateNote, targetNote: _targetNote, }) {
    const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
    const engine = ext.getEngine();
    const targetNote = _targetNote || (await engine.getNote("foo")).data;
    // note needs to be open, otherwise, command will throw an error
    await WSUtilsV2_1.WSUtilsV2.instance().openNote(targetNote);
    const { updatedTargetNote } = await executeTemplateApply({
        templateNote,
        targetNote,
    });
    return { updatedTargetNote, body: updatedTargetNote.body };
}
const basicPreset = engine_test_utils_1.ENGINE_HOOKS.setupBasic;
suite("ApplyTemplate", function () {
    (0, testUtilsV3_1.describeMultiWS)("WHEN ApplyTemplate run with regular template", {
        preSetupHook: basicPreset,
        timeout: 1e4,
    }, () => {
        test("THEN apply template", async () => {
            const templateNote = await createTemplateNote({
                body: "template text",
            });
            const { body } = await runTemplateTest({ templateNote });
            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({ body, match: ["template text"] })).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN ApplyTemplate run with note with no body", {
        preSetupHook: basicPreset,
        timeout: 1e6,
    }, () => {
        test("THEN apply template", async () => {
            const templateNote = await createTemplateNote({
                body: "template text",
            });
            const { vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getEngine();
            const targetNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "beta",
                body: "",
                vault: vaults[0],
                wsRoot,
            });
            const { body } = await runTemplateTest({ templateNote, targetNote });
            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                body,
                match: ["template text"],
            })).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN ApplyTemplate run with template with frontmatter", {
        preSetupHook: basicPreset,
        timeout,
    }, () => {
        test("THEN apply frontmatter ", async () => {
            const templateNote = await createTemplateNote({
                body: "hello {{ fm.name }}",
                custom: { name: "john" },
            });
            const { body, updatedTargetNote } = await runTemplateTest({
                templateNote,
            });
            (0, testUtilsv2_1.expect)(updatedTargetNote.custom?.name).toEqual("john");
            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                body,
                match: ["hello john"],
            })).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN the target note already contains a template variable in the frontmatter", {}, () => {
        test("THEN the existing variable value in the target note should be used", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const engine = ext.getEngine();
            const vault = engine.vaults[0];
            const wsRoot = engine.wsRoot;
            const targetNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                wsRoot,
                vault,
                fname: "target-note",
                custom: { foo: "original value" },
            });
            const templateNote = await createTemplateNote({
                body: "{{ fm.foo }}",
                custom: { foo: "template value" },
            });
            const { body, updatedTargetNote } = await runTemplateTest({
                targetNote,
                templateNote,
            });
            (0, testUtilsv2_1.expect)(updatedTargetNote.custom?.foo).toEqual("original value");
            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                body,
                match: ["original value"],
            })).toBeTruthy();
        });
    });
});
//# sourceMappingURL=ApplyTemplateCommand.test.js.map