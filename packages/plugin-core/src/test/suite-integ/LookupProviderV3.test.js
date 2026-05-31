"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const vscode_1 = require("vscode");
const NoteLookupCommand_1 = require("../../commands/NoteLookupCommand");
const utils_1 = require("../../components/lookup/utils");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtilsV2_1 = require("../../WSUtilsV2");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
(0, mocha_1.suite)("LookupProviderV3 utility methods:", () => {
    (0, mocha_1.describe)(`shouldBubbleUpCreateNew`, () => {
        (0, mocha_1.describe)(`WHEN no special characters and no exact matches`, () => {
            let querystring;
            let numberOfExactMatches;
            (0, mocha_1.beforeEach)(() => {
                querystring = "simple-query-no-special-chars";
                numberOfExactMatches = 0;
            });
            (0, mocha_1.it)(`AND bubble up is omitted THEN bubble up`, () => {
                (0, testUtilsv2_1.expect)((0, utils_1.shouldBubbleUpCreateNew)({ querystring, numberOfExactMatches })).toBeTruthy();
                (0, testUtilsv2_1.expect)((0, utils_1.shouldBubbleUpCreateNew)({
                    querystring,
                    numberOfExactMatches,
                    bubbleUpCreateNew: undefined,
                })).toBeTruthy();
            });
            (0, mocha_1.it)("AND bubble up is set to false THEN do NOT bubble up", () => {
                const actual = (0, utils_1.shouldBubbleUpCreateNew)({
                    querystring,
                    numberOfExactMatches,
                    bubbleUpCreateNew: false,
                });
                (0, testUtilsv2_1.expect)(actual).toBeFalsy();
            });
            (0, mocha_1.it)("AND bubble up is set to true THEN bubble up", () => {
                const actual = (0, utils_1.shouldBubbleUpCreateNew)({
                    querystring,
                    numberOfExactMatches,
                    bubbleUpCreateNew: true,
                });
                (0, testUtilsv2_1.expect)(actual).toBeTruthy();
            });
        });
        (0, mocha_1.it)(`WHEN special char is used THEN do NOT bubble up`, () => {
            const actual = (0, utils_1.shouldBubbleUpCreateNew)({
                querystring: "query with space",
                numberOfExactMatches: 0,
            });
            (0, testUtilsv2_1.expect)(actual).toBeFalsy();
        });
        (0, mocha_1.it)(`WHEN number of exact matches is more than 0 THEN do NOT bubble up`, () => {
            const actual = (0, utils_1.shouldBubbleUpCreateNew)({
                querystring: "query-val",
                numberOfExactMatches: 1,
            });
            (0, testUtilsv2_1.expect)(actual).toBeFalsy();
        });
    });
    (0, mocha_1.describe)(`sortBySimilarity`, () => {
        (0, mocha_1.it)("WHEN notes out of order THEN sort by similarity", async () => {
            const noteFactory = common_test_utils_1.TestNoteFactory.defaultUnitTestFactory();
            const notes = [
                await noteFactory.createForFName("pkg.hi.components"),
                await noteFactory.createForFName("pkg.hi.arch"),
                await noteFactory.createForFName("pkg.hi.quickstart"),
            ];
            const sorted = (0, utils_1.sortBySimilarity)(notes, "pkg.hi.arc");
            (0, testUtilsv2_1.expect)(sorted.map((sorted) => sorted.fname)).toEqual([
                "pkg.hi.arch",
                "pkg.hi.quickstart",
                "pkg.hi.components",
            ]);
        });
    });
});
(0, mocha_1.suite)("selection2Items", () => {
    let active;
    (0, testUtilsV3_1.describeMultiWS)("GIVEN an active note with selection that contains wikilinks", {
        preSetupHook: async ({ vaults, wsRoot }) => {
            await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ vaults, wsRoot });
            active = await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: engine_test_utils_1.TestEngineUtils.vault1(vaults),
                wsRoot,
                fname: "active",
                body: "[[dendron.ginger]]\n[[dendron.dragonfruit]]\n[[dendron.clementine]]",
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: engine_test_utils_1.TestEngineUtils.vault1(vaults),
                wsRoot,
                fname: "active-ambiguous",
                body: "[[pican]]",
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: engine_test_utils_1.TestEngineUtils.vault1(vaults),
                wsRoot,
                fname: "active-dedupe",
                body: "[[dendron.ginger]]\n\n[[Ginger|dendron.ginger]]\n\n[[Lots of Ginger|dendron.ginger]]\n\n",
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                genRandomId: true,
                vault: engine_test_utils_1.TestEngineUtils.vault2(vaults),
                wsRoot,
                fname: "pican",
                body: "",
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                genRandomId: true,
                vault: engine_test_utils_1.TestEngineUtils.vault3(vaults),
                wsRoot,
                fname: "pican",
                body: "",
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: engine_test_utils_1.TestEngineUtils.vault1(vaults),
                wsRoot,
                fname: "dendron.ginger",
                body: "",
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: engine_test_utils_1.TestEngineUtils.vault1(vaults),
                wsRoot,
                fname: "dendron.dragonfruit",
                body: "",
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: engine_test_utils_1.TestEngineUtils.vault1(vaults),
                wsRoot,
                fname: "dendron.clementine",
                body: "",
            });
        },
    }, () => {
        test("THEN quickpick is populated with normal query results.", async () => {
            const editor = await WSUtilsV2_1.WSUtilsV2.instance().openNote(active);
            editor.selection = new vscode_1.Selection(7, 0, 10, 0);
            const cmd = new NoteLookupCommand_1.NoteLookupCommand();
            const gatherOut = await cmd.gatherInputs({
                noConfirm: true,
                initialValue: "",
            });
            const enrichOut = await cmd.enrichInputs(gatherOut);
            const expectedItemLabels = [
                "root",
                "root",
                "root",
                "active-ambiguous",
                "active-dedupe",
                "active",
                "bar",
                "foo",
                "pican",
                "dendron",
                "pican",
            ];
            (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined(gatherOut.quickpick.itemsFromSelection)).toBeTruthy();
            const actualItemLabels = enrichOut?.selectedItems.map((item) => item.label);
            (0, testUtilsv2_1.expect)(expectedItemLabels.sort()).toEqual(actualItemLabels?.sort());
            cmd.cleanUp();
        });
    });
});
(0, mocha_1.suite)("onAccept", () => {
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a note with invalid name that already exists", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: vaults[0],
                wsRoot,
                fname: "foo. bar.baz",
                body: "note with invalid name",
                genRandomId: true,
            });
        },
        timeout: 5e3,
    }, () => {
        test("THEN accept lookup", async () => {
            await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
            const cmd = new NoteLookupCommand_1.NoteLookupCommand();
            const { provider } = await cmd.gatherInputs();
            const note = (await ExtensionProvider_1.ExtensionProvider.getEngine().findNotes({
                fname: "foo. bar.baz",
            }))[0];
            const item = {
                ...note,
                label: "foo. bar.baz",
                detail: "",
                alwaysShow: true,
            };
            const out = provider.shouldRejectItem({ item });
            (0, testUtilsv2_1.expect)(out.shouldReject).toBeFalsy();
            cmd.cleanUp();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a new item with invalid name", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN reject lookup", async () => {
            await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
            const cmd = new NoteLookupCommand_1.NoteLookupCommand();
            const { provider } = await cmd.gatherInputs();
            const { vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: vaults[0],
                wsRoot,
                fname: "foo. bar.baz",
                body: "note with invalid name",
                genRandomId: true,
            });
            const item = {
                ...note,
                label: "Create New",
                detail: "Note does not exist. Create?",
                alwaysShow: true,
            };
            const out = provider.shouldRejectItem({ item });
            (0, testUtilsv2_1.expect)(out.shouldReject).toBeTruthy();
            (0, testUtilsv2_1.expect)(out.reason).toBeTruthy();
            cmd.cleanUp();
        });
    });
});
//# sourceMappingURL=LookupProviderV3.test.js.map