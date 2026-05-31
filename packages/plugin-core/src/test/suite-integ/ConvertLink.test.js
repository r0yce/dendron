"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const unified_1 = require("@dendronhq/unified");
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const sinon_1 = __importDefault(require("sinon"));
const vscode_1 = __importDefault(require("vscode"));
const ConvertLink_1 = require("../../commands/ConvertLink");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const md_1 = require("../../utils/md");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const getReference = async ({ editor, position, }) => {
    const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
    const out = await (0, md_1.getReferenceAtPosition)({
        document: editor.document,
        position,
        wsRoot,
        vaults,
    });
    if (!out) {
        throw new Error("ref should be truthy");
    }
    return out;
};
suite("ConvertLink", function () {
    let activeNote;
    let activeNoteCreateOpts;
    let anotherNote;
    const noAliasBrokenLinkPosition = new vscode_1.default.Position(7, 0);
    const aliasBrokenLinkPosition = new vscode_1.default.Position(8, 0);
    (0, testUtilsV3_1.describeMultiWS)("GIVEN note with broken links", {
        preSetupHook: async (opts) => {
            const { vaults, wsRoot } = opts;
            activeNoteCreateOpts = {
                fname: "active",
                vault: vaults[0],
                wsRoot,
                body: [
                    "[[foo.bar.broken.link]]", // link 7
                    "[[broken link|foo.bar.broken.link]]", // line 8
                ].join("\n"),
                genRandomId: true,
            };
            activeNote = await common_test_utils_1.NoteTestUtilsV4.createNote(activeNoteCreateOpts);
            anotherNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "another",
                vault: vaults[0],
                wsRoot,
                genRandomId: true,
            });
        },
    }, () => {
        let sandbox;
        (0, mocha_1.beforeEach)(async () => {
            sandbox = sinon_1.default.createSandbox();
            activeNote = await common_test_utils_1.NoteTestUtilsV4.createNote(activeNoteCreateOpts);
            await WSUtils_1.WSUtils.openNote(activeNote);
        });
        (0, mocha_1.afterEach)(async () => {
            sandbox.restore();
            await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
        });
        test("WHEN broken link with no alias, THEN doesn't show option to use alias text.", async () => {
            const editor = vscode_1.default.window.activeTextEditor;
            const cmd = new ConvertLink_1.ConvertLinkCommand();
            const reference = await getReference({
                editor,
                position: noAliasBrokenLinkPosition,
            });
            const { options, parsedLink } = cmd.prepareBrokenLinkConvertOptions(reference);
            (0, testUtilsv2_1.expect)(parsedLink.alias).toBeFalsy();
            (0, testUtilsv2_1.expect)(lodash_1.default.findIndex(options, (option) => {
                return option.label === "Alias";
            })).toEqual(-1);
        });
        test("WHEN alias option selected, THEN converts broken link to plain alias text", async () => {
            const editor = vscode_1.default.window.activeTextEditor;
            editor.selection = new vscode_1.default.Selection(aliasBrokenLinkPosition, aliasBrokenLinkPosition);
            const cmd = new ConvertLink_1.ConvertLinkCommand();
            const reference = await getReference({
                editor,
                position: aliasBrokenLinkPosition,
            });
            sandbox.stub(cmd, "promptBrokenLinkConvertOptions").resolves({
                option: {
                    label: "Alias",
                },
                parsedLink: unified_1.LinkUtils.parseLinkV2({
                    linkString: reference.refText,
                    explicitAlias: true,
                }),
            });
            const gatherOut = await cmd.gatherInputs();
            (0, testUtilsv2_1.expect)(gatherOut.text).toEqual("broken link");
        });
        test("WHEN note name option selected, THEN converts broken link to note name text", async () => {
            const editor = vscode_1.default.window.activeTextEditor;
            editor.selection = new vscode_1.default.Selection(aliasBrokenLinkPosition, aliasBrokenLinkPosition);
            const cmd = new ConvertLink_1.ConvertLinkCommand();
            const reference = await getReference({
                editor,
                position: aliasBrokenLinkPosition,
            });
            sandbox.stub(cmd, "promptBrokenLinkConvertOptions").resolves({
                option: {
                    label: "Note name",
                },
                parsedLink: unified_1.LinkUtils.parseLinkV2({
                    linkString: reference.refText,
                    explicitAlias: true,
                }),
            });
            const gatherOut = await cmd.gatherInputs();
            (0, testUtilsv2_1.expect)(gatherOut.text).toEqual("link");
        });
        test("WHEN hierarchy option selected, THEN converts broken link to hierarchy text", async () => {
            const editor = vscode_1.default.window.activeTextEditor;
            editor.selection = new vscode_1.default.Selection(aliasBrokenLinkPosition, aliasBrokenLinkPosition);
            const cmd = new ConvertLink_1.ConvertLinkCommand();
            const reference = await getReference({
                editor,
                position: aliasBrokenLinkPosition,
            });
            sandbox.stub(cmd, "promptBrokenLinkConvertOptions").resolves({
                option: {
                    label: "Hierarchy",
                },
                parsedLink: unified_1.LinkUtils.parseLinkV2({
                    linkString: reference.refText,
                    explicitAlias: true,
                }),
            });
            const gatherOut = await cmd.gatherInputs();
            (0, testUtilsv2_1.expect)(gatherOut.text).toEqual("foo.bar.broken.link");
        });
        test("WHEN prompt option selected, THEN prompts for user input and converts broken link to user input", async () => {
            const editor = vscode_1.default.window.activeTextEditor;
            editor.selection = new vscode_1.default.Selection(aliasBrokenLinkPosition, aliasBrokenLinkPosition);
            const cmd = new ConvertLink_1.ConvertLinkCommand();
            const reference = await getReference({
                editor,
                position: aliasBrokenLinkPosition,
            });
            sandbox.stub(cmd, "promptBrokenLinkConvertOptions").resolves({
                option: {
                    label: "Prompt",
                },
                parsedLink: unified_1.LinkUtils.parseLinkV2({
                    linkString: reference.refText,
                    explicitAlias: true,
                }),
            });
            sandbox.stub(cmd, "promptBrokenLinkUserInput").resolves("user input");
            const gatherOut = await cmd.gatherInputs();
            (0, testUtilsv2_1.expect)(gatherOut.text).toEqual("user input");
        });
        test("WHEN change destination option selected, THEN prompts lookup for new destination and converts broken link to new link", async () => {
            const editor = vscode_1.default.window.activeTextEditor;
            editor.selection = new vscode_1.default.Selection(aliasBrokenLinkPosition, aliasBrokenLinkPosition);
            const cmd = new ConvertLink_1.ConvertLinkCommand();
            const reference = await getReference({
                editor,
                position: aliasBrokenLinkPosition,
            });
            sandbox.stub(cmd, "promptBrokenLinkConvertOptions").resolves({
                option: {
                    label: "Change destination",
                },
                parsedLink: unified_1.LinkUtils.parseLinkV2({
                    linkString: reference.refText,
                    explicitAlias: true,
                }),
            });
            sandbox.stub(cmd, "lookupNewDestination").resolves({
                selectedItems: [
                    {
                        ...anotherNote,
                        label: "another",
                    },
                ],
                onAcceptHookResp: [],
            });
            const gatherOut = await cmd.gatherInputs();
            (0, testUtilsv2_1.expect)(gatherOut.text).toEqual("[[Another|another]]");
        });
    });
    const userTagPosition = new vscode_1.default.Position(7, 0);
    const userWikiLinkPosition = new vscode_1.default.Position(8, 0);
    const hashTagPosition = new vscode_1.default.Position(9, 0);
    const tagWikiLinkPosition = new vscode_1.default.Position(10, 0);
    const regularWikiLinkPosition = new vscode_1.default.Position(11, 0);
    const plainTextPosition = new vscode_1.default.Position(12, 0);
    (0, testUtilsV3_1.describeMultiWS)("GIVEN note with valid links", {
        preSetupHook: async (opts) => {
            const { vaults, wsRoot } = opts;
            activeNoteCreateOpts = {
                fname: "active",
                vault: vaults[0],
                wsRoot,
                body: [
                    "@timothy", // link 7
                    "[[user.timothy]]", // line 8
                    "#foo", // line 9
                    "[[tags.foo]]", // line 10
                    "[[root]]", // line 11
                    "plaintext", // line 12
                ].join("\n"),
                genRandomId: true,
            };
            activeNote = await common_test_utils_1.NoteTestUtilsV4.createNote(activeNoteCreateOpts);
            anotherNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "another",
                vault: vaults[0],
                wsRoot,
                genRandomId: true,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "user.timothy",
                vault: vaults[0],
                wsRoot,
                genRandomId: true,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "tags.foo",
                vault: vaults[0],
                wsRoot,
                genRandomId: true,
            });
        },
    }, () => {
        let sandbox;
        (0, mocha_1.beforeEach)(async () => {
            sandbox = sinon_1.default.createSandbox();
            activeNote = await common_test_utils_1.NoteTestUtilsV4.createNote(activeNoteCreateOpts);
            await WSUtils_1.WSUtils.openNote(activeNote);
        });
        (0, mocha_1.afterEach)(async () => {
            sandbox.restore();
            await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
        });
        test("WHEN usertag, THEN convert to correct wikilink", async () => {
            const editor = vscode_1.default.window.activeTextEditor;
            editor.selection = new vscode_1.default.Selection(userTagPosition, userTagPosition);
            const cmd = new ConvertLink_1.ConvertLinkCommand();
            sandbox.stub(cmd, "promptConfirmation").resolves(true);
            const gatherOut = await cmd.gatherInputs();
            (0, testUtilsv2_1.expect)(gatherOut.text).toEqual("[[user.timothy]]");
        });
        test("WHEN wikilink with user.* hierarchy, THEN convert to usertag", async () => {
            const editor = vscode_1.default.window.activeTextEditor;
            editor.selection = new vscode_1.default.Selection(userWikiLinkPosition, userWikiLinkPosition);
            const cmd = new ConvertLink_1.ConvertLinkCommand();
            sandbox.stub(cmd, "promptConfirmation").resolves(true);
            const gatherOut = await cmd.gatherInputs();
            (0, testUtilsv2_1.expect)(gatherOut.text).toEqual("@timothy");
        });
        test("WHEN hashtag, THEN convert to correct wikilink", async () => {
            const editor = vscode_1.default.window.activeTextEditor;
            editor.selection = new vscode_1.default.Selection(hashTagPosition, hashTagPosition);
            const cmd = new ConvertLink_1.ConvertLinkCommand();
            sandbox.stub(cmd, "promptConfirmation").resolves(true);
            const gatherOut = await cmd.gatherInputs();
            (0, testUtilsv2_1.expect)(gatherOut.text).toEqual("[[tags.foo]]");
        });
        test("WHEN wikilink with tags.* hierarchy, THEN convert to hashtag", async () => {
            const editor = vscode_1.default.window.activeTextEditor;
            editor.selection = new vscode_1.default.Selection(tagWikiLinkPosition, tagWikiLinkPosition);
            const cmd = new ConvertLink_1.ConvertLinkCommand();
            sandbox.stub(cmd, "promptConfirmation").resolves(true);
            const gatherOut = await cmd.gatherInputs();
            (0, testUtilsv2_1.expect)(gatherOut.text).toEqual("#foo");
        });
        test("WHEN regular valid link, THEN raise error", async () => {
            const editor = vscode_1.default.window.activeTextEditor;
            editor.selection = new vscode_1.default.Selection(regularWikiLinkPosition, regularWikiLinkPosition);
            const cmd = new ConvertLink_1.ConvertLinkCommand();
            try {
                await cmd.gatherInputs();
            }
            catch (error) {
                (0, testUtilsv2_1.expect)(error).toBeTruthy();
            }
        });
        test("WHEN plaintext, THEN raise error", async () => {
            const editor = vscode_1.default.window.activeTextEditor;
            editor.selection = new vscode_1.default.Selection(plainTextPosition, plainTextPosition);
            const cmd = new ConvertLink_1.ConvertLinkCommand();
            try {
                await cmd.gatherInputs();
            }
            catch (error) {
                (0, testUtilsv2_1.expect)(error).toBeTruthy();
            }
        });
    });
});
//# sourceMappingURL=ConvertLink.test.js.map