"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const RandomNote_1 = require("../../commands/RandomNote");
const constants_1 = require("../../constants");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
// common template function for RandomNoteCommand testing
function basicTest({ ctx, noteNames, validateFn, done, includePattern, excludePattern, }) {
    (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
            for (const name of noteNames) {
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault: engine_test_utils_1.TestEngineUtils.vault1(vaults),
                    wsRoot,
                    fname: name,
                    body: "",
                });
            }
        },
        onInit: async ({ wsRoot }) => {
            (0, testUtilsV3_1.withConfig)((config) => {
                const randomCfg = {};
                if (includePattern)
                    randomCfg.include = includePattern;
                if (excludePattern)
                    randomCfg.exclude = excludePattern;
                common_all_1.ConfigUtils.setCommandsProp(config, "randomNote", randomCfg);
                return config;
            }, { wsRoot });
            await new RandomNote_1.RandomNoteCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
            validateFn();
            done();
        },
    });
}
suite(constants_1.DENDRON_COMMANDS.RANDOM_NOTE.key, function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {});
    test("include pattern only", (done) => {
        const validateFn = function () {
            (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()
                ?.document.uri.path.split("/")
                .pop()
                .startsWith("alpha")).toBeTruthy();
        };
        basicTest({
            ctx,
            noteNames: ["alpha", "alpha.one", "alpha.two.1", "alpha.two.2", "beta"],
            validateFn,
            done,
            includePattern: ["alpha"],
            excludePattern: undefined,
        });
    });
    test("include pattern with exclude in sub-hierarchy", (done) => {
        const validateFn = function () {
            (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()
                ?.document.uri.path.split("/")
                .pop()
                .startsWith("alpha.one")).toBeTruthy();
        };
        basicTest({
            ctx,
            noteNames: ["alpha.one", "alpha.two.1", "alpha.two.2"],
            validateFn,
            done,
            includePattern: ["alpha"],
            excludePattern: ["alpha.two"],
        });
    });
    test("multiple include patterns", (done) => {
        const validateFn = function () {
            (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()
                ?.document.uri.path.split("/")
                .pop()
                .startsWith("alpha.two")).toBeTruthy();
        };
        basicTest({
            ctx,
            noteNames: ["alpha.one", "alpha.two"],
            validateFn,
            done,
            includePattern: ["alpha.zero", "alpha.two"],
            excludePattern: undefined,
        });
    });
    // If no include pattern is specified, then the set should include all notes.
    test("no include pattern", (done) => {
        const validateFn = function () {
            (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()
                ?.document.uri.path.split("/")
                .pop()
                .startsWith("root")).toBeTruthy();
        };
        basicTest({
            ctx,
            noteNames: [],
            validateFn,
            done,
            includePattern: undefined,
            excludePattern: undefined,
        });
    });
    test("exclude pattern only", (done) => {
        const validateFn = function () {
            const fileName = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()
                ?.document.uri.path.split("/")
                .pop();
            (0, testUtilsv2_1.expect)(fileName.startsWith("beta") || fileName.startsWith("root")).toBeTruthy();
        };
        basicTest({
            ctx,
            noteNames: ["alpha.one", "alpha.two", "beta.one", "beta.two"],
            validateFn,
            done,
            includePattern: undefined,
            excludePattern: ["alpha"],
        });
    });
    test("multi-level include pattern", (done) => {
        const validateFn = function () {
            (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()
                ?.document.uri.path.split("/")
                .pop()
                .startsWith("alpha.one")).toBeTruthy();
        };
        basicTest({
            ctx,
            noteNames: ["alpha.one.1", "alpha.one.2", "alpha.two.1", "alpha.two.one"],
            validateFn,
            done,
            includePattern: ["alpha.one"],
            excludePattern: undefined,
        });
    });
    test("include and exclude patterns are the same", (done) => {
        // No explicit validation, just ensure that an exception is not thrown.
        const validateFn = function () { };
        basicTest({
            ctx,
            noteNames: ["alpha.one.1", "alpha.one.2", "alpha.two.1", "alpha.two.one"],
            validateFn,
            done,
            includePattern: ["alpha.one"],
            excludePattern: ["alpha.one"],
        });
    });
});
//# sourceMappingURL=RandomNoteCommand.test.js.map