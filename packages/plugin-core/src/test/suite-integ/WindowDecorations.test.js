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
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const fs_extra_1 = require("fs-extra");
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const windowDecorations_1 = require("../../features/windowDecorations");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtils_1 = require("../../WSUtils");
const WSUtilsV2_1 = require("../../WSUtilsV2");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
/** Check if the ranges decorated by `decorations` contains `text` */
function isTextDecorated(text, decorations, document) {
    for (const decoration of decorations) {
        if (document.getText(decoration.range) === text)
            return true;
    }
    return false;
}
async function getNote(opts) {
    const { engine, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
    const { fname } = opts;
    const note = (await engine.findNotesMeta({ fname, vault: vaults[0] }))[0];
    const editor = await new WSUtilsV2_1.WSUtilsV2(ExtensionProvider_1.ExtensionProvider.getExtension()).openNote(note);
    return { note, editor };
}
function getDecorations({ allDecorations, decorationType, }) {
    return allDecorations.get(decorationType);
}
function checkDecoration({ text, document, decorations, }) {
    (0, testUtilsv2_1.expect)(isTextDecorated(text, decorations, document)).toBeTruthy();
}
suite("GIVEN a text document with decorations", function () {
    const CREATED = "1625648278263";
    const UPDATED = "1625758878263";
    const FNAME = "bar";
    this.timeout(5e3);
    (0, mocha_1.describe)("AND GIVEN links ", () => {
        function checkTimestampsDecorated({ decorations, document, }) {
            const { allDecorations } = decorations;
            const timestampDecorations = getDecorations({
                allDecorations,
                decorationType: windowDecorations_1.EDITOR_DECORATION_TYPES.timestamp,
            });
            (0, testUtilsv2_1.expect)(timestampDecorations.length).toEqual(2);
            // check that the decorations are at the right locations
            checkDecoration({
                text: CREATED,
                decorations: timestampDecorations,
                document,
            });
            checkDecoration({
                text: UPDATED,
                decorations: timestampDecorations,
                document,
            });
        }
        (0, testUtilsV3_1.describeMultiWS)("", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "withHeader",
                    vault: vaults[0],
                    wsRoot,
                    body: "## ipsam adipisci",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "tags.bar",
                    vault: vaults[0],
                    wsRoot,
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: FNAME,
                    body: [
                        "Ut incidunt id commodi. ^anchor-1",
                        "",
                        "* Et repudiandae optio ut suscipit illum hic vel.",
                        "* Aut suscipit veniam nobis veniam reiciendis. ^anchor-2",
                        "  * Sit sed accusamus saepe voluptatem sint animi quis animi. ^anchor-3",
                        "* Dolores suscipit maiores nulla accusamus est.",
                        "",
                        "#foo",
                        "#bar",
                        "#foo",
                        "[[root]]",
                        "",
                        "@Hamilton.Margaret",
                        "",
                        "[[with alias|root]]",
                        "",
                        "![[root.*#head]]",
                        "",
                        "[[withHeader#ipsam-adipisci]]",
                        "[[withHeader#does-not-exist]]",
                        "",
                        "[[does.not.exist]]",
                        "",
                        "[[/test.txt]]",
                        "[[/test.txt#L3]]",
                    ].join("\n"),
                    props: {
                        created: lodash_1.default.toInteger(CREATED),
                        updated: lodash_1.default.toInteger(UPDATED),
                        tags: ["foo", "bar"],
                    },
                    vault: vaults[0],
                    wsRoot,
                });
                await (0, fs_extra_1.writeFile)(path_1.default.join(wsRoot, "test.txt"), "et\nnam\nvelit\nlaboriosam\n");
            },
        }, () => {
            // TODO: this is currently a regression from refactoring engine
            test.skip("THEN links are decorated", async () => {
                const { editor } = await getNote({ fname: FNAME });
                const document = editor.document;
                const decorations = (await (0, windowDecorations_1.updateDecorations)(editor));
                const { allDecorations } = decorations;
                checkTimestampsDecorated({ decorations, document });
                const blockAnchorDecorations = allDecorations.get(windowDecorations_1.EDITOR_DECORATION_TYPES.blockAnchor);
                (0, testUtilsv2_1.expect)(blockAnchorDecorations.length).toEqual(3);
                // check that the decorations are at the right locations
                (0, testUtilsv2_1.expect)(isTextDecorated("^anchor-1", blockAnchorDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("^anchor-2", blockAnchorDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("^anchor-3", blockAnchorDecorations, document)).toBeTruthy();
                const wikilinkDecorations = getDecorations({
                    allDecorations,
                    decorationType: windowDecorations_1.EDITOR_DECORATION_TYPES.wikiLink,
                });
                (0, testUtilsv2_1.expect)(wikilinkDecorations.length).toEqual(8);
                (0, testUtilsv2_1.expect)(isTextDecorated("[[root]]", wikilinkDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("[[with alias|root]]", wikilinkDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("#bar", wikilinkDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("![[root.*#head]]", wikilinkDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("[[withHeader#ipsam-adipisci]]", wikilinkDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("[[/test.txt]]", wikilinkDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("[[/test.txt#L3]]", wikilinkDecorations, document)).toBeTruthy();
                const aliasDecorations = allDecorations.get(windowDecorations_1.EDITOR_DECORATION_TYPES.alias);
                (0, testUtilsv2_1.expect)(aliasDecorations.length).toEqual(1);
                (0, testUtilsv2_1.expect)(isTextDecorated("with alias", aliasDecorations, document)).toBeTruthy();
                const brokenWikilinkDecorations = allDecorations.get(windowDecorations_1.EDITOR_DECORATION_TYPES.brokenWikilink);
                (0, testUtilsv2_1.expect)(brokenWikilinkDecorations.length).toEqual(5);
                (0, testUtilsv2_1.expect)(isTextDecorated("[[does.not.exist]]", brokenWikilinkDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("[[withHeader#does-not-exist]]", brokenWikilinkDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("@Hamilton.Margaret", brokenWikilinkDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("#foo", brokenWikilinkDecorations, document)).toBeTruthy();
                return;
            });
        });
    });
    (0, mocha_1.describe)("AND GIVEN task notes", () => {
        (0, testUtilsV3_1.describeMultiWS)("", {
            preSetupHook: async ({ vaults, wsRoot }) => {
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "with.all",
                    vault: vaults[0],
                    wsRoot,
                    custom: {
                        status: "done",
                        owner: "grace",
                        priority: "H",
                        due: "2021.10.29",
                        tags: "foo",
                    },
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "without.status",
                    vault: vaults[0],
                    wsRoot,
                    custom: {
                        owner: "grace",
                        priority: "high",
                        tags: ["foo", "bar"],
                    },
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "without.due",
                    vault: vaults[0],
                    wsRoot,
                    custom: {
                        status: "",
                        priority: "low",
                    },
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "not.a.task",
                    vault: vaults[0],
                    wsRoot,
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: FNAME,
                    body: [
                        "* [[with.all]]",
                        "* foo [[without.status]] bar",
                        "",
                        "[[without.due]]",
                        "",
                        "[[not.a.task]]",
                        "",
                    ].join("\n"),
                    vault: vaults[0],
                    wsRoot,
                });
            },
        }, () => {
            test("THEN task notes are highlighted", async () => {
                const { editor } = await getNote({ fname: FNAME });
                const document = editor.document;
                const { allDecorations } = (await (0, windowDecorations_1.updateDecorations)(editor));
                const taskDecorations = allDecorations.get(windowDecorations_1.EDITOR_DECORATION_TYPES.taskNote);
                taskDecorations?.sort((decoration) => decoration.range.start.line); // for easier testing
                (0, testUtilsv2_1.expect)(taskDecorations.length).toEqual(3);
                // check that the decorations are at the right locations
                (0, testUtilsv2_1.expect)(isTextDecorated("[[with.all]]", taskDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("[[without.status]]", taskDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("[[without.due]]", taskDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(taskDecorations[0].renderOptions?.before?.contentText).toEqual("[ ] ");
                (0, testUtilsv2_1.expect)(taskDecorations[0].renderOptions?.after?.contentText).toEqual(" priority:low");
                (0, testUtilsv2_1.expect)(taskDecorations[1].renderOptions?.before?.contentText).toEqual("[x] ");
                (0, testUtilsv2_1.expect)(taskDecorations[1].renderOptions?.after?.contentText).toEqual(" due:2021.10.29 @grace priority:high #foo");
                (0, testUtilsv2_1.expect)(taskDecorations[2].renderOptions?.before?.contentText).toBeFalsy();
                (0, testUtilsv2_1.expect)(taskDecorations[2].renderOptions?.after?.contentText).toEqual(" @grace priority:high #foo #bar");
            });
        });
    });
    (0, mocha_1.describe)("AND GIVEN file with wikilinks to itself", () => {
        (0, testUtilsV3_1.describeMultiWS)("", {
            preSetupHook: async ({ vaults, wsRoot }) => {
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: FNAME,
                    body: [
                        "Ut incidunt id commodi. ^anchor-1",
                        "",
                        "[[#^anchor-1]]",
                        "[[#^anchor-not-exists]]",
                        "![[#^anchor-1]]",
                        "![[#^anchor-not-exists]]",
                        "![[#^anchor-1:#*]]",
                        "![[#^anchor-not-exists]]",
                        "[[#^begin]]",
                        "[[#^end]]",
                        "![[#^begin]]",
                        "![[#^end]]",
                        "![[#^begin:#^end]]",
                        "![[#^anchor-1:#^end]]",
                        "![[#^begin:#^anchor-1]]",
                    ].join("\n"),
                    vault: vaults[0],
                    wsRoot,
                });
            },
        }, () => {
            test("THEN links are highlighted", async () => {
                const { editor } = await getNote({ fname: FNAME });
                const document = editor.document;
                const { allDecorations } = (await (0, windowDecorations_1.updateDecorations)(editor));
                const wikilinkDecorations = allDecorations
                    .get(windowDecorations_1.EDITOR_DECORATION_TYPES.wikiLink)
                    .concat(allDecorations.get(windowDecorations_1.EDITOR_DECORATION_TYPES.noteRef));
                (0, testUtilsv2_1.expect)(wikilinkDecorations.length).toEqual(10);
                const shouldBeDecorated = [
                    "[[#^anchor-1]]",
                    "![[#^anchor-1]]",
                    "![[#^anchor-1:#*]]",
                    "[[#^begin]]",
                    "[[#^end]]",
                    "![[#^begin]]",
                    "![[#^end]]",
                    "![[#^begin:#^end]]",
                    "![[#^anchor-1:#^end]]",
                    "![[#^begin:#^anchor-1]]",
                ];
                shouldBeDecorated.forEach((text) => {
                    (0, testUtilsv2_1.expect)(isTextDecorated(text, wikilinkDecorations, document)).toBeTruthy();
                });
                const brokenWikilinkDecorations = allDecorations
                    .get(windowDecorations_1.EDITOR_DECORATION_TYPES.brokenWikilink)
                    .concat(allDecorations.get(windowDecorations_1.EDITOR_DECORATION_TYPES.brokenNoteRef));
                (0, testUtilsv2_1.expect)(brokenWikilinkDecorations.length).toEqual(3);
                (0, testUtilsv2_1.expect)(isTextDecorated("[[#^anchor-not-exists]]", brokenWikilinkDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("![[#^anchor-not-exists]]", brokenWikilinkDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("![[#^anchor-not-exists]]", brokenWikilinkDecorations, document)).toBeTruthy();
            });
        });
    });
    (0, mocha_1.describe)("AND given wildcard references", () => {
        (0, testUtilsV3_1.describeMultiWS)("", {
            preSetupHook: async ({ vaults, wsRoot }) => {
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: FNAME,
                    body: ["![[foo.bar.*]]"].join("\n"),
                    vault: vaults[0],
                    wsRoot,
                });
            },
        }, () => {
            test("THEN links are highlighted", async () => {
                const { editor } = await getNote({ fname: FNAME });
                const document = editor.document;
                const { allDecorations } = (await (0, windowDecorations_1.updateDecorations)(editor));
                const wikilinkDecorations = (allDecorations.get(windowDecorations_1.EDITOR_DECORATION_TYPES.wikiLink) || []).concat(allDecorations.get(windowDecorations_1.EDITOR_DECORATION_TYPES.noteRef) || []);
                (0, testUtilsv2_1.expect)(wikilinkDecorations.length).toEqual(1);
                (0, testUtilsv2_1.expect)(isTextDecorated("![[foo.bar.*]]", wikilinkDecorations, document)).toBeTruthy();
            });
        });
    });
    (0, mocha_1.describe)("AND for long notes", () => {
        const FNAME = "test.note";
        const repeat = 228;
        (0, testUtilsV3_1.describeMultiWS)("", {
            preSetupHook: async ({ vaults, wsRoot }) => {
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: FNAME,
                    body: lodash_1.default.repeat("[[does.not.exist]] #does.not.exist\n", repeat),
                    vault: vaults[0],
                    wsRoot,
                });
            },
        }, () => {
            test("THEN only the visible range should be decorated", async () => {
                const { editor } = await getNote({ fname: FNAME });
                const document = editor.document;
                const { allDecorations } = (await (0, windowDecorations_1.updateDecorations)(editor));
                // This note is really long, so not all links in it will be decorated (there are repeat * 2 many links)
                const brokenWikilinkDecorations = allDecorations.get(windowDecorations_1.EDITOR_DECORATION_TYPES.brokenWikilink);
                (0, testUtilsv2_1.expect)(brokenWikilinkDecorations.length < repeat * 2).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("[[does.not.exist]]", brokenWikilinkDecorations, document)).toBeTruthy();
                (0, testUtilsv2_1.expect)(isTextDecorated("#does.not.exist", brokenWikilinkDecorations, document)).toBeTruthy();
            });
        });
    });
    (0, mocha_1.describe)("AND WHEN disabled", () => {
        (0, testUtilsV3_1.describeMultiWS)("", {
            modConfigCb: (config) => {
                config.workspace.enableEditorDecorations = false;
                return config;
            },
            preSetupHook: async ({ vaults, wsRoot }) => {
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: FNAME,
                    body: "[[does.not.exist]] #does.not.exist\n",
                    vault: vaults[0],
                    wsRoot,
                });
            },
        }, () => {
            test("THEN decorations are not displayed ", async () => {
                const { editor } = await getNote({ fname: FNAME });
                const { allDecorations, allWarnings } = (await (0, windowDecorations_1.updateDecorations)(editor));
                (0, testUtilsv2_1.expect)(allDecorations).toBeFalsy();
                (0, testUtilsv2_1.expect)(allWarnings).toBeFalsy();
            });
        });
    });
    (0, mocha_1.describe)("AND GIVEN warnings in document", () => {
        // SKIP. Notes without frontmatter should no longer exist in the engine
        testUtilsV3_1.describeMultiWS.skip("AND WHEN missing frontmatter", {
            preSetupHook: async ({ vaults, wsRoot }) => {
                const note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: FNAME,
                    vault: vaults[0],
                    wsRoot,
                });
                // Empty out the note, getting rid of the frontmatter
                const path = common_all_1.NoteUtils.getFullPath({ note, wsRoot });
                await (0, fs_extra_1.writeFile)(path, "foo bar");
            },
        }, () => {
            test("THEN show frontmatter missing warning", async () => {
                const { editor } = await getNote({ fname: FNAME });
                const { allWarnings } = (await (0, windowDecorations_1.updateDecorations)(editor));
                (0, testUtilsv2_1.expect)(allWarnings.length).toEqual(1);
                (0, testUtilsv2_1.expect)(common_test_utils_1.AssertUtils.assertInString({
                    body: allWarnings[0].message,
                    match: ["frontmatter", "missing"],
                }));
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("AND WHEN bad note id", {
            preSetupHook: async ({ vaults, wsRoot }) => {
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: FNAME,
                    vault: vaults[0],
                    wsRoot,
                    props: {
                        id: "-foo",
                    },
                });
            },
        }, () => {
            test("THEN show frontmatter missing warning", async () => {
                const { editor } = await getNote({ fname: FNAME });
                const { allWarnings } = (await (0, windowDecorations_1.updateDecorations)(editor));
                (0, testUtilsv2_1.expect)(allWarnings.length).toEqual(1);
                (0, testUtilsv2_1.expect)(common_test_utils_1.AssertUtils.assertInString({
                    body: allWarnings[0].message,
                    match: ["id", "bad"],
                }));
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("AND WHEN note id is missing", {
            preSetupHook: async ({ vaults, wsRoot }) => {
                const note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: FNAME,
                    vault: vaults[0],
                    wsRoot,
                });
                // Rewrite the file to have id missing in frontmatter
                const path = common_all_1.NoteUtils.getFullPath({ note, wsRoot });
                await (0, fs_extra_1.writeFile)(path, ["---", "updated: 234", "created: 123", "---"].join("\n"));
            },
        }, () => {
            test("THEN show frontmatter missing warning", async () => {
                const { editor } = await getNote({ fname: FNAME });
                const { allWarnings } = (await (0, windowDecorations_1.updateDecorations)(editor));
                (0, testUtilsv2_1.expect)(allWarnings.length).toEqual(1);
                (0, testUtilsv2_1.expect)(common_test_utils_1.AssertUtils.assertInString({
                    body: allWarnings[0].message,
                    match: ["id", "missing"],
                }));
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("AND frontmatter is not visible", {}, () => {
            (0, mocha_1.before)(async () => {
                const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                    fname: "foo",
                    vault: vaults[0],
                    wsRoot,
                    engine,
                });
                // Rewrite the file to have id missing in frontmatter
                const path = common_all_1.NoteUtils.getFullPath({ note, wsRoot });
                await (0, fs_extra_1.writeFile)(path, ["---", "updated: 234", "created: 123", "---"]
                    .join("\n")
                    .concat("\n".repeat(200)));
                const editor = await WSUtils_1.WSUtils.openNote(note);
                editor.revealRange(new vscode.Range(200, 0, 200, 0));
            });
            test("THEN still warns for frontmatter issues", async () => {
                const { allWarnings } = (await (0, windowDecorations_1.updateDecorations)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow()));
                (0, testUtilsv2_1.expect)(allWarnings.length).toEqual(1);
                (0, testUtilsv2_1.expect)(common_test_utils_1.AssertUtils.assertInString({
                    body: allWarnings[0].message,
                    match: ["id", "missing"],
                }));
            });
            (0, testUtilsV3_1.runTestButSkipForWindows)()("", () => {
                test("THEN don't warn for schemas", async () => {
                    const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const schema = (await engine.getSchema("root")).data;
                    const schemaFile = path_1.default.join(wsRoot, schema.vault.fsPath, `${schema.fname}.schema.yml`);
                    const schemaURI = vscode.Uri.parse(schemaFile);
                    const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(schemaURI);
                    const { allDecorations, allWarnings } = (await (0, windowDecorations_1.updateDecorations)(editor));
                    (0, testUtilsv2_1.expect)(allWarnings).toEqual(undefined);
                    (0, testUtilsv2_1.expect)(allDecorations).toEqual(undefined);
                });
            });
        });
    });
});
// eslint-disable-next-line func-names
function checkRanges(range, startLine, startChar, endLine, endChar) {
    (0, testUtilsv2_1.expect)(range?.start.line).toEqual(startLine);
    (0, testUtilsv2_1.expect)(range?.start.character).toEqual(startChar);
    (0, testUtilsv2_1.expect)(range?.end.line).toEqual(endLine);
    (0, testUtilsv2_1.expect)(range?.end.character).toEqual(endChar);
    return true;
}
suite("mergeOverlappingRanges", () => {
    (0, mocha_1.describe)("GIVEN a single range", () => {
        test("THEN that range is returned", () => {
            const ranges = vsCodeUtils_1.VSCodeUtils.mergeOverlappingRanges([
                new vscode.Range(0, 0, 5, 0),
            ]);
            (0, testUtilsv2_1.expect)(ranges.length).toEqual(1);
            (0, testUtilsv2_1.expect)(checkRanges(ranges[0], 0, 0, 5, 0)).toBeTruthy();
        });
    });
    (0, mocha_1.describe)("GIVEN two ranges", () => {
        (0, mocha_1.describe)("AND ranges are NOT overlapping", () => {
            test("THEN both ranges are returned", () => {
                const ranges = vsCodeUtils_1.VSCodeUtils.mergeOverlappingRanges([
                    new vscode.Range(0, 0, 5, 0),
                    new vscode.Range(8, 0, 12, 0),
                ]);
                (0, testUtilsv2_1.expect)(ranges.length).toEqual(2);
                (0, testUtilsv2_1.expect)(checkRanges(ranges[0], 0, 0, 5, 0)).toBeTruthy();
                (0, testUtilsv2_1.expect)(checkRanges(ranges[1], 8, 0, 12, 0)).toBeTruthy();
            });
        });
        (0, mocha_1.describe)("AND ranges are overlapping", () => {
            test("THEN ranges are merged", () => {
                const ranges = vsCodeUtils_1.VSCodeUtils.mergeOverlappingRanges([
                    new vscode.Range(0, 0, 5, 0),
                    new vscode.Range(4, 0, 12, 0),
                ]);
                (0, testUtilsv2_1.expect)(ranges.length).toEqual(1);
                (0, testUtilsv2_1.expect)(checkRanges(ranges[0], 0, 0, 12, 0)).toBeTruthy();
            });
        });
        (0, mocha_1.describe)("AND ranges are just touching", () => {
            test("THEN both ranges are returned", () => {
                const ranges = vsCodeUtils_1.VSCodeUtils.mergeOverlappingRanges([
                    new vscode.Range(0, 0, 5, 0),
                    new vscode.Range(5, 0, 12, 0),
                ]);
                (0, testUtilsv2_1.expect)(ranges.length).toEqual(1);
                (0, testUtilsv2_1.expect)(checkRanges(ranges[0], 0, 0, 12, 0)).toBeTruthy();
            });
        });
    });
});
suite("GIVEN NoteReference", () => {
    const FNAME = "bar";
    (0, testUtilsV3_1.describeMultiWS)("", {
        timeout: 10e10,
        preSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "withHeader",
                vault: vaults[0],
                wsRoot,
                body: "## ipsam adipisci",
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: FNAME,
                body: ["![[withHeader#ipsam-adipisci]]"].join("\n"),
                vault: vaults[0],
                wsRoot,
            });
        },
        modConfigCb: (config) => {
            config.dev = { enableExperimentalInlineNoteRef: true };
            return config;
        },
    }, () => {
        test("THEN COMMENT is created for controller ", async () => {
            const { editor } = await getNote({ fname: FNAME });
            await (0, windowDecorations_1.updateDecorations)(editor);
            const inlineNoteRefs = ExtensionProvider_1.ExtensionProvider.getCommentThreadsState().inlineNoteRefs;
            const docKey = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor().document.uri.toString();
            const lastNoteRefThreadMap = inlineNoteRefs.get(docKey);
            (0, testUtilsv2_1.expect)(lastNoteRefThreadMap.size).toEqual(1);
        });
    });
});
//# sourceMappingURL=WindowDecorations.test.js.map