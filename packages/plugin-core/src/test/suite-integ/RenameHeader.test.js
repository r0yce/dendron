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
const mocha_1 = require("mocha");
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const RenameHeader_1 = require("../../commands/RenameHeader");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
// TODO:
// In a reference range (start & end)
async function checkFile({ note, wsRoot, match, nomatch, }) {
    const body = await (0, common_server_1.note2String)({ note, wsRoot });
    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
        body,
        match,
        nomatch,
    })).toBeTruthy();
}
suite("RenameNote", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {});
    let target;
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a note, and another note that references it", {
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
            target = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "target",
                wsRoot,
                vault: vaults[0],
                body: "## header\n\n## dummy",
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "note-with-link-to-target",
                wsRoot,
                vault: vaults[0],
                body: "[[target]]",
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "another-note-with-link-to-target",
                wsRoot,
                vault: vaults[0],
                body: "[[target#dummy]]",
            });
        },
    }, () => {
        let sandbox;
        (0, mocha_1.beforeEach)(() => {
            sandbox = sinon_1.default.createSandbox();
        });
        (0, mocha_1.afterEach)(() => {
            sandbox.restore();
        });
        test("THEN, if the reference isn't pointing to the header being renamed, the note that is referencing isn't updated.", async () => {
            const editor = await WSUtils_1.WSUtils.openNote(target);
            editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
            sandbox
                .stub(vscode.window, "showInputBox")
                .returns(Promise.resolve("Foo Bar"));
            const out = (await new RenameHeader_1.RenameHeaderCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run({}));
            const updateResps = out.data?.filter((resp) => {
                return resp.status === "update";
            });
            // Only target note should be updated
            (0, testUtilsv2_1.expect)(updateResps?.length).toEqual(1);
            (0, testUtilsv2_1.expect)(updateResps[0].note.fname).toEqual("target");
        });
    });
    (0, mocha_1.describe)("using selection", () => {
        test("wikilink to other file", (done) => {
            let note;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-header",
                        wsRoot,
                        vault: vaults[0],
                        body: "## Lorem ipsum dolor amet",
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-link",
                        wsRoot,
                        vault: vaults[0],
                        body: "[[has-header#lorem-ipsum-dolor-amet]]",
                    });
                },
                onInit: async ({ engine, vaults }) => {
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
                    const prompt = sinon_1.default
                        .stub(vscode.window, "showInputBox")
                        .returns(Promise.resolve("Foo Bar"));
                    try {
                        await new RenameHeader_1.RenameHeaderCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run({});
                        const afterRename = (await engine.findNotes({ fname: "has-header", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRename.body,
                            match: ["## Foo Bar"],
                            nomatch: ["Lorem", "ipsum", "dolor", "amet"],
                        })).toBeTruthy();
                        const afterRenameLink = (await engine.findNotes({ fname: "has-link", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRenameLink.body,
                            match: ["[[has-header#foo-bar]]"],
                            nomatch: ["[[has-header#lorem-ipsum-dolor-amet]]"],
                        })).toBeTruthy();
                        done();
                    }
                    finally {
                        prompt.restore();
                    }
                },
            });
        });
        test("updates default alias", (done) => {
            let note;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-header",
                        wsRoot,
                        vault: vaults[0],
                        body: "## Lorem ipsum dolor amet",
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-link",
                        wsRoot,
                        vault: vaults[0],
                        body: "[[Lorem ipsum dolor amet|has-header#lorem-ipsum-dolor-amet]]",
                    });
                },
                onInit: async ({ engine, vaults }) => {
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
                    const prompt = sinon_1.default
                        .stub(vscode.window, "showInputBox")
                        .returns(Promise.resolve("Foo Bar"));
                    try {
                        await new RenameHeader_1.RenameHeaderCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run({});
                        const afterRename = (await engine.findNotes({ fname: "has-header", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRename.body,
                            match: ["## Foo Bar"],
                            nomatch: ["Lorem", "ipsum", "dolor", "amet"],
                        })).toBeTruthy();
                        const afterRenameLink = (await engine.findNotes({ fname: "has-link", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRenameLink.body,
                            match: ["[[Foo Bar|has-header#foo-bar]]"],
                            nomatch: [
                                "[[Lorem ipsum dolor amet|has-header#lorem-ipsum-dolor-amet]]",
                                "[[has-header#foo-bar]]",
                            ],
                        })).toBeTruthy();
                        done();
                    }
                    finally {
                        prompt.restore();
                    }
                },
            });
        });
        test("does not rename a wikilink to another header", (done) => {
            let note;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-header",
                        wsRoot,
                        vault: vaults[0],
                        body: "## Lorem ipsum dolor amet\n\n## Maxime Distinctio Officia",
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-link",
                        wsRoot,
                        vault: vaults[0],
                        body: "[[has-header#maxime-distinctio-officia]]",
                    });
                },
                onInit: async ({ engine, vaults }) => {
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
                    const prompt = sinon_1.default
                        .stub(vscode.window, "showInputBox")
                        .returns(Promise.resolve("Foo Bar"));
                    try {
                        await new RenameHeader_1.RenameHeaderCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run({});
                        const afterRename = (await engine.findNotes({ fname: "has-header", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRename.body,
                            match: ["## Foo Bar", "## Maxime Distinctio Officia"],
                            nomatch: ["Lorem", "ipsum", "dolor", "amet"],
                        })).toBeTruthy();
                        const afterRenameLink = (await engine.findNotes({ fname: "has-link", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRenameLink.body,
                            match: ["[[has-header#maxime-distinctio-officia]]"],
                            nomatch: ["[[has-header#foo-bar]]"],
                        })).toBeTruthy();
                        done();
                    }
                    finally {
                        prompt.restore();
                    }
                },
            });
        });
        test("wikilink to same file", (done) => {
            let note;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-link",
                        wsRoot,
                        vault: vaults[0],
                        body: [
                            "## Lorem ipsum dolor amet",
                            "",
                            "[[#lorem-ipsum-dolor-amet]]",
                        ].join("\n"),
                    });
                },
                onInit: async ({ engine, vaults, wsRoot }) => {
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
                    const prompt = sinon_1.default
                        .stub(vscode.window, "showInputBox")
                        .returns(Promise.resolve("Foo Bar"));
                    try {
                        await new RenameHeader_1.RenameHeaderCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run({});
                        const afterRename = (await engine.findNotes({ fname: "has-link", vault: vaults[0] }))[0];
                        await checkFile({
                            note: afterRename,
                            wsRoot,
                            nomatch: [
                                "Lorem",
                                "ipsum",
                                "dolor",
                                "amet",
                                "[[has-header#lorem-ipsum-dolor-amet]]",
                            ],
                            match: ["## Foo Bar", "[[#foo-bar]]"],
                        });
                        done();
                    }
                    finally {
                        prompt.restore();
                    }
                },
            });
        });
        test("with old header containing block anchor", (done) => {
            let note;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-header",
                        wsRoot,
                        vault: vaults[0],
                        body: "## Lorem ipsum dolor amet ^anchor",
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-link",
                        wsRoot,
                        vault: vaults[0],
                        body: "[[has-header#lorem-ipsum-dolor-amet]]",
                    });
                },
                onInit: async ({ engine, vaults }) => {
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
                    const prompt = sinon_1.default
                        .stub(vscode.window, "showInputBox")
                        .returns(Promise.resolve("Foo Bar"));
                    try {
                        await new RenameHeader_1.RenameHeaderCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run({});
                        const afterRename = (await engine.findNotes({ fname: "has-header", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRename.body,
                            match: ["## Foo Bar ^anchor"],
                            nomatch: ["Lorem", "ipsum", "dolor", "amet"],
                        })).toBeTruthy();
                        const afterRenameLink = (await engine.findNotes({ fname: "has-link", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRenameLink.body,
                            match: ["[[has-header#foo-bar]]"],
                            nomatch: ["[[has-header#lorem-ipsum-dolor-amet]]"],
                        })).toBeTruthy();
                        done();
                    }
                    finally {
                        prompt.restore();
                    }
                },
            });
        });
        test("with old header containing a wikilink", (done) => {
            let note;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-header",
                        wsRoot,
                        vault: vaults[0],
                        body: "## Lorem ipsum [[dolor|note.dolor]] amet ^anchor",
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-link",
                        wsRoot,
                        vault: vaults[0],
                        body: "[[has-header#lorem-ipsum-dolor-amet]]",
                    });
                },
                onInit: async ({ engine, vaults }) => {
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
                    const prompt = sinon_1.default
                        .stub(vscode.window, "showInputBox")
                        .returns(Promise.resolve("Foo Bar"));
                    try {
                        await new RenameHeader_1.RenameHeaderCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run({});
                        const afterRename = (await engine.findNotes({ fname: "has-header", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRename.body,
                            match: ["## Foo Bar ^anchor"],
                            nomatch: ["Lorem", "ipsum", "dolor", "amet"],
                        })).toBeTruthy();
                        const afterRenameLink = (await engine.findNotes({ fname: "has-link", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRenameLink.body,
                            match: ["[[has-header#foo-bar]]"],
                            nomatch: ["[[has-header#lorem-ipsum-dolor-amet]]"],
                        })).toBeTruthy();
                        done();
                    }
                    finally {
                        prompt.restore();
                    }
                },
            });
        });
        test("with new header containing a wikilink", (done) => {
            let note;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-header",
                        wsRoot,
                        vault: vaults[0],
                        body: "## Lorem ipsum dolor amet ^anchor",
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-link",
                        wsRoot,
                        vault: vaults[0],
                        body: "[[has-header#lorem-ipsum-dolor-amet]]",
                    });
                },
                onInit: async ({ engine, vaults }) => {
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
                    const prompt = sinon_1.default
                        .stub(vscode.window, "showInputBox")
                        .returns(Promise.resolve("Foo [[Bar|note.bar]] Baz"));
                    try {
                        await new RenameHeader_1.RenameHeaderCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run({});
                        const afterRename = (await engine.findNotes({ fname: "has-header", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRename.body,
                            match: ["## Foo [[Bar|note.bar]] Baz ^anchor"],
                            nomatch: ["Lorem", "ipsum", "dolor", "amet"],
                        })).toBeTruthy();
                        const afterRenameLink = (await engine.findNotes({ fname: "has-link", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRenameLink.body,
                            match: ["[[has-header#foo-bar-baz]]"],
                            nomatch: ["[[has-header#lorem-ipsum-dolor-amet]]"],
                        })).toBeTruthy();
                        done();
                    }
                    finally {
                        prompt.restore();
                    }
                },
            });
        });
        test("with a reference", (done) => {
            let note;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-header",
                        wsRoot,
                        vault: vaults[0],
                        body: "## Lorem ipsum dolor amet",
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-link",
                        wsRoot,
                        vault: vaults[0],
                        body: "![[has-header#lorem-ipsum-dolor-amet]]",
                    });
                },
                onInit: async ({ engine, vaults }) => {
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
                    const prompt = sinon_1.default
                        .stub(vscode.window, "showInputBox")
                        .returns(Promise.resolve("Foo Bar"));
                    try {
                        await new RenameHeader_1.RenameHeaderCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run({});
                        const afterRename = (await engine.findNotes({ fname: "has-header", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRename.body,
                            match: ["## Foo Bar"],
                            nomatch: ["Lorem", "ipsum", "dolor", "amet"],
                        })).toBeTruthy();
                        const afterRenameLink = (await engine.findNotes({ fname: "has-link", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRenameLink.body,
                            match: ["![[has-header#foo-bar]]"],
                            nomatch: ["![[has-header#lorem-ipsum-dolor-amet]]"],
                        })).toBeTruthy();
                        done();
                    }
                    finally {
                        prompt.restore();
                    }
                },
            });
        });
        test("with a reference range, header at the start", (done) => {
            let note;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-header",
                        wsRoot,
                        vault: vaults[0],
                        body: [
                            "## Lorem ipsum dolor amet",
                            "",
                            "middle",
                            "",
                            "## end",
                        ].join("\n"),
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-link",
                        wsRoot,
                        vault: vaults[0],
                        body: "![[has-header#lorem-ipsum-dolor-amet:#end]]",
                    });
                },
                onInit: async ({ engine, vaults }) => {
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
                    const prompt = sinon_1.default
                        .stub(vscode.window, "showInputBox")
                        .returns(Promise.resolve("Foo Bar"));
                    try {
                        await new RenameHeader_1.RenameHeaderCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run({});
                        const afterRename = (await engine.findNotes({ fname: "has-header", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRename.body,
                            match: ["## Foo Bar"],
                            nomatch: ["Lorem", "ipsum", "dolor", "amet"],
                        })).toBeTruthy();
                        const afterRenameLink = (await engine.findNotes({ fname: "has-link", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRenameLink.body,
                            match: ["![[has-header#foo-bar:#end]]"],
                            nomatch: [
                                "![[has-header#lorem-ipsum-dolor-amet:#end]]",
                                "![[has-header#foo-bar]]",
                            ],
                        })).toBeTruthy();
                        done();
                    }
                    finally {
                        prompt.restore();
                    }
                },
            });
        });
        test("with a reference range, header at the end", (done) => {
            let note;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-header",
                        wsRoot,
                        vault: vaults[0],
                        body: [
                            "## start",
                            "",
                            "middle",
                            "",
                            "## Lorem Ipsum Dolor Amet",
                        ].join("\n"),
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-link",
                        wsRoot,
                        vault: vaults[0],
                        body: "![[has-header#start:#lorem-ipsum-dolor-amet]]",
                    });
                },
                onInit: async ({ engine, vaults }) => {
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection({
                        line: 11,
                    });
                    const prompt = sinon_1.default
                        .stub(vscode.window, "showInputBox")
                        .returns(Promise.resolve("Foo Bar"));
                    try {
                        await new RenameHeader_1.RenameHeaderCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run({});
                        const afterRename = (await engine.findNotes({ fname: "has-header", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRename.body,
                            match: ["## Foo Bar"],
                            nomatch: ["Lorem", "ipsum", "dolor", "amet"],
                        })).toBeTruthy();
                        const afterRenameLink = (await engine.findNotes({ fname: "has-link", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRenameLink.body,
                            match: ["![[has-header#start:#foo-bar]]"],
                            nomatch: [
                                "![[has-header#start:#lorem-ipsum-dolor-amet]]",
                                "![[has-header#foo-bar]]",
                                "![[has-header#start]]",
                            ],
                        })).toBeTruthy();
                        done();
                    }
                    finally {
                        prompt.restore();
                    }
                },
            });
        });
        test("does not rename a reference range to another header", (done) => {
            let note;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-header",
                        wsRoot,
                        vault: vaults[0],
                        body: [
                            "## Lorem ipsum dolor amet",
                            "",
                            "## Maxime Distinctio Officia",
                            "",
                            "middle",
                            "",
                            "## end",
                        ].join("\n"),
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "has-link",
                        wsRoot,
                        vault: vaults[0],
                        body: "![[has-header#maxime-distinctio-officia:#end]]",
                    });
                },
                onInit: async ({ engine, vaults }) => {
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
                    const prompt = sinon_1.default
                        .stub(vscode.window, "showInputBox")
                        .returns(Promise.resolve("Foo Bar"));
                    try {
                        await new RenameHeader_1.RenameHeaderCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run({});
                        const afterRename = (await engine.findNotes({ fname: "has-header", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRename.body,
                            match: ["## Foo Bar"],
                            nomatch: ["Lorem", "ipsum", "dolor", "amet"],
                        })).toBeTruthy();
                        const afterRenameLink = (await engine.findNotes({ fname: "has-link", vault: vaults[0] }))[0];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: afterRenameLink.body,
                            match: ["![[has-header#maxime-distinctio-officia:#end]]"],
                            nomatch: [
                                "![[has-header#foo-bar:#end]]",
                                "![[has-header#foo-bar]]",
                            ],
                        })).toBeTruthy();
                        done();
                    }
                    finally {
                        prompt.restore();
                    }
                },
            });
        });
    });
});
//# sourceMappingURL=RenameHeader.test.js.map