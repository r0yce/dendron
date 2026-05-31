"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const PreviewLinkHandler_1 = require("../../components/views/PreviewLinkHandler");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const quickPick_1 = require("../../utils/quickPick");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const MockDendronExtension_1 = require("../MockDendronExtension");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const fs_extra_1 = __importDefault(require("fs-extra"));
const common_server_1 = require("@dendronhq/common-server");
const IPreviewLinkHandler_1 = require("../../components/views/IPreviewLinkHandler");
suite("PreviewLinkHandler", () => {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {
        noSetTimeout: true,
        beforeHook: () => { },
    });
    let testNoteAmbiguous;
    (0, testUtilsV3_1.describeMultiWS)("GIVEN onLinkClicked", {
        ctx,
        preSetupHook: async ({ vaults, wsRoot }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "target",
                vault: vaults[0],
                wsRoot,
                body: [
                    "Qui dicta nulla at atque qui voluptatem.",
                    "Harum qui quasi sint.",
                    "",
                    "## Nostrum",
                    "",
                    "Ut recusandae fuga recusandae nihil.",
                    "Illum nostrum id animi. ^nihil",
                ].join("\n"),
                props: {
                    id: "test-id",
                },
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "lorem",
                vault: vaults[0],
                wsRoot,
                body: "Est saepe ut et accusamus soluta id",
                props: {
                    id: "est",
                },
            });
            testNoteAmbiguous = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "lorem",
                vault: vaults[1],
                wsRoot,
                body: "Reprehenderit dolores pariatur",
                props: {
                    id: "reprehenderit",
                },
            });
        },
    }, () => {
        let note;
        (0, mocha_1.beforeEach)(async () => {
            const { engine, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            note = (await engine.findNotesMeta({ fname: "root", vault: vaults[0] }))[0];
            (0, testUtilsv2_1.expect)(note).toBeTruthy();
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(note);
        });
        (0, mocha_1.describe)("WHEN clicking on an wikilink", () => {
            test("THEN the clicked note is opened", async () => {
                const handler = new PreviewLinkHandler_1.PreviewLinkHandler(ExtensionProvider_1.ExtensionProvider.getExtension());
                const out = await handler.onLinkClicked({
                    data: {
                        href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/test-id#nostrum",
                        id: note.id,
                    },
                });
                (0, testUtilsv2_1.expect)(out).toEqual(IPreviewLinkHandler_1.LinkType.WIKI);
                (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith("target.md")).toBeTruthy();
            });
            (0, mocha_1.describe)("AND the link is to a header", () => {
                test("THEN the note is opened at that header", async () => {
                    const handler = new PreviewLinkHandler_1.PreviewLinkHandler(ExtensionProvider_1.ExtensionProvider.getExtension());
                    const out = await handler.onLinkClicked({
                        data: {
                            href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/test-id#nostrum",
                            id: note.id,
                        },
                    });
                    (0, testUtilsv2_1.expect)(out).toEqual(IPreviewLinkHandler_1.LinkType.WIKI);
                    (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith("target.md")).toBeTruthy();
                    (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.selection.active.line).toEqual(10);
                });
            });
            (0, mocha_1.describe)("AND the link is to a block anchor", () => {
                test("THEN the note is opened at that block", async () => {
                    const handler = new PreviewLinkHandler_1.PreviewLinkHandler(ExtensionProvider_1.ExtensionProvider.getExtension());
                    const out = await handler.onLinkClicked({
                        data: {
                            href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/test-id#^nihil",
                            id: note.id,
                        },
                    });
                    (0, testUtilsv2_1.expect)(out).toEqual(IPreviewLinkHandler_1.LinkType.WIKI);
                    (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith("target.md")).toBeTruthy();
                    (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.selection.active.line).toEqual(13);
                });
            });
            (0, mocha_1.describe)("AND if the link is to a missing note", () => {
                test("THEN nothing happens", async () => {
                    const handler = new PreviewLinkHandler_1.PreviewLinkHandler(ExtensionProvider_1.ExtensionProvider.getExtension());
                    const openWithDefaultApp = sinon_1.default.stub(PreviewLinkHandler_1.ShowPreviewAssetOpener, "openWithDefaultApp");
                    const out = await handler.onLinkClicked({
                        data: {
                            href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/does-not-exist",
                            id: note.id,
                        },
                    });
                    (0, testUtilsv2_1.expect)(out).toEqual(IPreviewLinkHandler_1.LinkType.UNKNOWN);
                    (0, testUtilsv2_1.expect)(openWithDefaultApp.called).toBeFalsy();
                });
            });
            (0, mocha_1.describe)("AND the link is ambiguous", () => {
                test("THEN it prompts for a note", async () => {
                    const showChooseNote = sinon_1.default
                        .stub(quickPick_1.QuickPickUtil, "showChooseNote")
                        .returns(Promise.resolve(testNoteAmbiguous));
                    const handler = new PreviewLinkHandler_1.PreviewLinkHandler(ExtensionProvider_1.ExtensionProvider.getExtension());
                    const out = await handler.onLinkClicked({
                        data: {
                            href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/lorem",
                            id: note.id,
                        },
                    });
                    (0, testUtilsv2_1.expect)(out).toEqual(IPreviewLinkHandler_1.LinkType.WIKI);
                    (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()
                        ?.document.getText()
                        .includes("Reprehenderit dolores pariatur")).toBeTruthy();
                    (0, testUtilsv2_1.expect)(showChooseNote.called).toBeTruthy();
                });
            });
        });
        (0, mocha_1.describe)("WHEN clicking on a web URL", () => {
            test("THEN opening is left to VSCode", async () => {
                const openWithDefaultApp = sinon_1.default.stub(PreviewLinkHandler_1.ShowPreviewAssetOpener, "openWithDefaultApp");
                const handler = new PreviewLinkHandler_1.PreviewLinkHandler(ExtensionProvider_1.ExtensionProvider.getExtension());
                const out = await handler.onLinkClicked({
                    data: {
                        href: "https://wiki.dendron.so/#getting-started",
                        id: note.id,
                    },
                });
                (0, testUtilsv2_1.expect)(out).toEqual(IPreviewLinkHandler_1.LinkType.WEBSITE);
                (0, testUtilsv2_1.expect)(openWithDefaultApp.called).toBeFalsy();
            });
        });
        (0, mocha_1.describe)("WHEN clicking on an asset inside a vault", () => {
            (0, mocha_1.before)(async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const assetsPath = path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]), "assets");
                await fs_extra_1.default.mkdir(assetsPath);
                await fs_extra_1.default.writeFile(path_1.default.join(assetsPath, "test.pdf"), "");
            });
            test("THEN it is opened with the default app", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const openWithDefaultApp = sinon_1.default.stub(PreviewLinkHandler_1.ShowPreviewAssetOpener, "openWithDefaultApp");
                const handler = new PreviewLinkHandler_1.PreviewLinkHandler(ExtensionProvider_1.ExtensionProvider.getExtension());
                const out = await handler.onLinkClicked({
                    data: {
                        href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/assets/test.pdf",
                        id: note.id,
                    },
                });
                (0, testUtilsv2_1.expect)(out).toEqual(IPreviewLinkHandler_1.LinkType.ASSET);
                (0, testUtilsv2_1.expect)(openWithDefaultApp.called).toBeTruthy();
                (0, testUtilsv2_1.expect)(openWithDefaultApp.calledWith(path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]), "assets", "test.pdf"))).toBeTruthy();
            });
        });
        (0, mocha_1.describe)("WHEN clicking on an asset with path relative to wsRoot", () => {
            (0, mocha_1.before)(async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                await fs_extra_1.default.writeFile(path_1.default.join(wsRoot, "test.pdf"), "");
            });
            test("THEN it is opened with the default app", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const openWithDefaultApp = sinon_1.default.stub(PreviewLinkHandler_1.ShowPreviewAssetOpener, "openWithDefaultApp");
                const handler = new PreviewLinkHandler_1.PreviewLinkHandler(ExtensionProvider_1.ExtensionProvider.getExtension());
                const out = await handler.onLinkClicked({
                    data: {
                        href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/test.pdf",
                        id: note.id,
                    },
                });
                (0, testUtilsv2_1.expect)(out).toEqual(IPreviewLinkHandler_1.LinkType.ASSET);
                (0, testUtilsv2_1.expect)(openWithDefaultApp.called).toBeTruthy();
                (0, testUtilsv2_1.expect)(openWithDefaultApp.calledWith(path_1.default.join(wsRoot, "test.pdf"))).toBeTruthy();
            });
        });
        (0, mocha_1.describe)("WHEN clicking on an asset with an absolute path", () => {
            let testDir;
            (0, mocha_1.before)(async () => {
                testDir = (0, common_server_1.tmpDir)().name;
                await fs_extra_1.default.writeFile(path_1.default.join(testDir, "test.pdf"), "");
            });
            test("THEN it is opened with the default app", async () => {
                const openWithDefaultApp = sinon_1.default.stub(PreviewLinkHandler_1.ShowPreviewAssetOpener, "openWithDefaultApp");
                const handler = new PreviewLinkHandler_1.PreviewLinkHandler(ExtensionProvider_1.ExtensionProvider.getExtension());
                const out = await handler.onLinkClicked({
                    data: {
                        href: `vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/${path_1.default.join(testDir, "test.pdf")}`,
                        id: note.id,
                    },
                });
                (0, testUtilsv2_1.expect)(out).toEqual(IPreviewLinkHandler_1.LinkType.ASSET);
                (0, testUtilsv2_1.expect)(openWithDefaultApp.called).toBeTruthy();
                // Added the "toLowerCase"s here because on Windows link handler
                // gets called with C:\ while testDir is c:\
                (0, testUtilsv2_1.expect)(openWithDefaultApp.args[0][0].toLowerCase()).toEqual(path_1.default.join(testDir, "test.pdf").toLowerCase());
            });
        });
        (0, mocha_1.describe)("WHEN opening a non-note text file", () => {
            (0, mocha_1.before)(async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                await fs_extra_1.default.writeFile(path_1.default.join(wsRoot, "test.py"), [
                    "print('hello world!')",
                    "print('hello from a test')",
                    "print('hi!') # ^target",
                    "print('hey!!!')",
                ].join("\n"));
            });
            test("THEN it is opened in the editor", async () => {
                const openWithDefaultApp = sinon_1.default.stub(PreviewLinkHandler_1.ShowPreviewAssetOpener, "openWithDefaultApp");
                const handler = new PreviewLinkHandler_1.PreviewLinkHandler(ExtensionProvider_1.ExtensionProvider.getExtension());
                const out = await handler.onLinkClicked({
                    data: {
                        href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/test.py",
                        id: note.id,
                    },
                });
                (0, testUtilsv2_1.expect)(out).toEqual(IPreviewLinkHandler_1.LinkType.TEXT);
                (0, testUtilsv2_1.expect)(openWithDefaultApp.called).toBeFalsy();
                (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith("test.py")).toBeTruthy();
            });
            (0, mocha_1.describe)("AND the file link is to a line", () => {
                test("THEN it is opened at that line", async () => {
                    const openWithDefaultApp = sinon_1.default.stub(PreviewLinkHandler_1.ShowPreviewAssetOpener, "openWithDefaultApp");
                    const handler = new PreviewLinkHandler_1.PreviewLinkHandler(ExtensionProvider_1.ExtensionProvider.getExtension());
                    const out = await handler.onLinkClicked({
                        data: {
                            href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/test.py#L2",
                            id: note.id,
                        },
                    });
                    (0, testUtilsv2_1.expect)(out).toEqual(IPreviewLinkHandler_1.LinkType.TEXT);
                    (0, testUtilsv2_1.expect)(openWithDefaultApp.called).toBeFalsy();
                    (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith("test.py")).toBeTruthy();
                    (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.selection.start.line).toEqual(1);
                });
            });
            (0, mocha_1.describe)("AND the file link is to an anchor", () => {
                test("THEN it is opened at that anchor", async () => {
                    const openWithDefaultApp = sinon_1.default.stub(PreviewLinkHandler_1.ShowPreviewAssetOpener, "openWithDefaultApp");
                    const handler = new PreviewLinkHandler_1.PreviewLinkHandler(ExtensionProvider_1.ExtensionProvider.getExtension());
                    const out = await handler.onLinkClicked({
                        data: {
                            href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/test.py#^target",
                            id: note.id,
                        },
                    });
                    (0, testUtilsv2_1.expect)(out).toEqual(IPreviewLinkHandler_1.LinkType.TEXT);
                    (0, testUtilsv2_1.expect)(openWithDefaultApp.called).toBeFalsy();
                    (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith("test.py")).toBeTruthy();
                    (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.selection.start.line).toEqual(2);
                });
            });
        });
    });
    (0, mocha_1.describe)(`extractNoteIdFromHref`, () => {
        (0, mocha_1.describe)(`WHEN id is present`, () => {
            (0, mocha_1.it)("AND with header anchor THEN extract id", () => {
                const linkHandler = new PreviewLinkHandler_1.PreviewLinkHandler(new MockDendronExtension_1.MockDendronExtension({}));
                const actual = linkHandler.extractNoteIdFromHref({
                    id: "id1",
                    href: "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/FSi3bKWQeQXYTjE1PoTB0#heading-2",
                });
                (0, testUtilsv2_1.expect)(actual).toEqual("FSi3bKWQeQXYTjE1PoTB0");
            });
            (0, mocha_1.it)("AND without the header anchor THEN extract id", () => {
                const linkHandler = new PreviewLinkHandler_1.PreviewLinkHandler(new MockDendronExtension_1.MockDendronExtension({}));
                const actual = linkHandler.extractNoteIdFromHref({
                    id: "id1",
                    href: "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/FSi3bKWQeQXYTjE1PoTB0",
                });
                (0, testUtilsv2_1.expect)(actual).toEqual("FSi3bKWQeQXYTjE1PoTB0");
            });
            (0, mocha_1.it)("AND is guid like", () => {
                // This shouldnt typically happen with the way we currently generate ids but we do
                // have some guid like ids in our test workspace right now so to make those
                // notes happy, and in case some older id generation used guid looking identifers.
                const linkHandler = new PreviewLinkHandler_1.PreviewLinkHandler(new MockDendronExtension_1.MockDendronExtension({}));
                const actual = linkHandler.extractNoteIdFromHref({
                    id: "id1",
                    href: "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/56497553-c195-4ec8-bc74-6a76462d9333",
                });
                (0, testUtilsv2_1.expect)(actual).toEqual("56497553-c195-4ec8-bc74-6a76462d9333");
            });
        });
        (0, mocha_1.it)(`WHEN id not present in href THEN default onto passed in id`, () => {
            const linkHandler = new PreviewLinkHandler_1.PreviewLinkHandler(new MockDendronExtension_1.MockDendronExtension({}));
            const actual = linkHandler.extractNoteIdFromHref({
                id: "id1",
                href: "http://localhost:3005/vscode/note-preview.html?ws=WS-VALUE&port=3005#head2",
            });
            (0, testUtilsv2_1.expect)(actual).toEqual("id1");
        });
    });
});
//# sourceMappingURL=PreviewLinkHandler.test.js.map