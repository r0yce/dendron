"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const NoteLookupCommand_1 = require("../../commands/NoteLookupCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("Journal Notes", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {});
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
                    await WSUtils_1.WSUtils.openNote(note);
                    await new NoteLookupCommand_1.NoteLookupCommand().run({
                        noteType: common_all_1.LookupNoteTypeEnum.journal,
                        noConfirm: true,
                    });
                    const newNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
                    (0, testUtilsv2_1.expect)(newNote.fname.startsWith(`${fname}.journal`)).toBeTruthy();
                    // The note title should be in the format yyyy-MM-dd
                    (0, testUtilsv2_1.expect)(/\d{4}-\d{2}-\d{2}$/g.test(newNote.title)).toBeTruthy();
                    // TODO: traits isn't exposed in newNote props here because in the test
                    //we extract noteProps via `getNoteFromTextEditor` instead of the
                    //engine. So for now, test via the raw traitIds that should have been
                    //added to the note.
                    const traits = newNote.traitIds;
                    (0, testUtilsv2_1.expect)(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();
                    done();
                },
            });
        });
        test("basic, with template", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                postSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS_MULTI.setupSchemaPresetWithNamespaceTemplateMulti({
                        wsRoot,
                        vaults,
                    });
                },
                onInit: async ({ vaults }) => {
                    const vault = vaults[1];
                    const fname = "daily";
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const note = (await engine.findNotesMeta({ fname, vault }))[0];
                    await WSUtils_1.WSUtils.openNote(note);
                    await new NoteLookupCommand_1.NoteLookupCommand().run({
                        noteType: common_all_1.LookupNoteTypeEnum.journal,
                        noConfirm: true,
                    });
                    const newNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
                    (0, testUtilsv2_1.expect)(newNote.fname.startsWith(`${fname}.journal`)).toBeTruthy();
                    await (0, common_test_utils_1.runJestHarnessV2)([
                        {
                            actual: lodash_1.default.trim(newNote.body),
                            expected: "Template text",
                        },
                    ], testUtilsv2_1.expect);
                    done();
                },
            });
        });
        // test("domainAsNamespace", function (done) {
        //   runLegacyMultiWorkspaceTest({
        //     ctx,
        //     configOverride: {
        //       "dendron.defaultScratchAddBehavior": "childOfDomainNamespace",
        //     },
        //     postSetupHook: async ({ wsRoot, vaults }) => {
        //       await NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD.create({
        //         vault: vaults[1],
        //         wsRoot,
        //       });
        //     },
        //     onInit: async ({ vaults }) => {
        //       const vault = vaults[1];
        //       const {
        //         fname,
        //         selection,
        //       } = NOTE_PRESETS_V4.NOTE_DOMAIN_NAMESPACE_CHILD;
        //       const editor = await getNoteFromFname({ fname, vault });
        //       editor.selection = new vscode.Selection(...selection);
        //       await new LookupCommand().execute({
        //         selectionType: "selection2link",
        //         noteType: "scratch",
        //         flavor: "note",
        //         noConfirm: true,
        //       });
        //       const scratchNote = getNoteFromTextEditor();
        //       expect(scratchNote.fname.startsWith("pro.scratch")).toBeTruthy();
        //       done();
        //     },
        //   });
        // });
    });
});
//# sourceMappingURL=LookupJournal.test.js.map