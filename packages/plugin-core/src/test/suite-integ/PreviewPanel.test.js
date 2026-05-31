"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const mocha_1 = require("mocha");
const PreviewViewFactory_1 = require("../../components/views/PreviewViewFactory");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const path_1 = __importDefault(require("path"));
async function makeTestNote({ previewPanel, body, genRandomId = true, }) {
    const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
    const note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
        engine,
        wsRoot,
        genRandomId,
        vault: vaults[0],
        fname: "preview-test-image",
        body,
    });
    const { rewriteImageUrls } = previewPanel.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
    const newNote = rewriteImageUrls(note);
    // The function shouldn't modify the existing note
    (0, testUtilsv2_1.expect)(newNote !== note).toBeTruthy();
    return newNote;
}
suite("GIVEN PreviewPanel", function () {
    (0, testUtilsV3_1.describeSingleWS)("WHEN opening a note", {}, () => {
        let previewPanel;
        (0, mocha_1.before)(async () => {
            const { engine, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const note = (await engine.findNotes({ fname: "root", vault: vaults[0] }))[0];
            (0, testUtilsv2_1.expect)(note).toBeTruthy();
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(note);
            previewPanel = PreviewViewFactory_1.PreviewPanelFactory.create(ExtensionProvider_1.ExtensionProvider.getExtension()); // overriding the type here to get the function to expose internals
            previewPanel.show(note);
        });
        (0, mocha_1.describe)("AND note has block anchor", () => {
            (0, mocha_1.test)("Block anchor is not converted to plain text", async () => {
                const note = await makeTestNote({
                    previewPanel,
                    body: "Lorem ipsum ^anchor",
                });
                (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                    body: note.body,
                    match: ["^anchor"],
                })).toBeTruthy();
            });
        });
        (0, mocha_1.describe)("and note has images", () => {
            (0, mocha_1.describe)("AND image starts with a forward slash", () => {
                (0, mocha_1.test)("THEN URL is correctly rewritten", async () => {
                    const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const note = await makeTestNote({
                        previewPanel,
                        body: "![](/assets/image.png)",
                    });
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body: note.body,
                        match: [
                            "https://file",
                            "vscode",
                            path_1.default.posix.join(common_all_1.VaultUtils.getRelPath(vaults[0]), "assets", "image.png"),
                        ],
                    })).toBeTruthy();
                });
            });
            (0, mocha_1.describe)("AND image starts without a forward slash", () => {
                (0, mocha_1.test)("THEN URL is correctly rewritten", async () => {
                    const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const note = await makeTestNote({
                        previewPanel,
                        body: "![](assets/image.png)",
                    });
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body: note.body,
                        match: [
                            "https://file",
                            "vscode",
                            path_1.default.posix.join(common_all_1.VaultUtils.getRelPath(vaults[0]), "assets", "image.png"),
                        ],
                    })).toBeTruthy();
                });
            });
            (0, mocha_1.describe)("AND image URI is encoded", () => {
                (0, mocha_1.test)("THEN URL is correctly rewritten", async () => {
                    const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const note = await makeTestNote({
                        previewPanel,
                        body: "![](assets/Pasted%20image%20%CE%B1.png)",
                    });
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body: note.body,
                        match: [
                            "https://file",
                            "vscode",
                            path_1.default.posix.join(common_all_1.VaultUtils.getRelPath(vaults[0]), "assets", 
                            // `makeTestNote()` will invoke `rewriteImageUrls()`
                            //  in which `makeImageUrlFullPath()` will expectedly decode "Pasted%20image%20%CE%B1.png"
                            //    to "Pasted image α.png",
                            //  then `panel.webview.asWebviewUri` encodes it back to "Pasted%20image%20%CE%B1.png".
                            "Pasted%20image%20%CE%B1.png"),
                        ],
                    })).toBeTruthy();
                });
            });
            (0, mocha_1.describe)("AND image is an absolute path", () => {
                (0, mocha_1.test)("THEN URL is correctly rewritten", async () => {
                    const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const note = await makeTestNote({
                        previewPanel,
                        body: `![](${path_1.default.join(wsRoot, "image.png").normalize()})`,
                    });
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body: note.body,
                        match: ["https://file", "vscode", "image.png"],
                    })).toBeTruthy();
                });
            });
            (0, mocha_1.describe)("AND image is a URL", () => {
                (0, mocha_1.test)("THEN URL is NOT rewritten", async () => {
                    const note = await makeTestNote({
                        previewPanel,
                        body: `![](https://org-dendron-public-assets.s3.amazonaws.com/images/rfc-35-template-1.png)`,
                    });
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body: note.body,
                        match: [
                            "https://org-dendron-public-assets.s3.amazonaws.com/images/rfc-35-template-1.png",
                        ],
                        nomatch: ["vscode", "https://file"],
                    })).toBeTruthy();
                });
            });
            (0, mocha_1.describe)("AND the note is updated", () => {
                (0, mocha_1.test)("THEN the output also updates", async () => {
                    const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    let note = await makeTestNote({
                        previewPanel,
                        body: `![](https://org-dendron-public-assets.s3.amazonaws.com/images/rfc-35-template-1.png)`,
                        genRandomId: false,
                    });
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body: note.body,
                        match: [
                            "https://org-dendron-public-assets.s3.amazonaws.com/images/rfc-35-template-1.png",
                        ],
                        nomatch: ["vscode", "https://file"],
                    })).toBeTruthy();
                    // with genRandomId: false, the new note will have the same ID and will update the pervious one
                    note = await makeTestNote({
                        previewPanel,
                        body: `![](/assets/image.png)`,
                        genRandomId: false,
                    });
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body: note.body,
                        nomatch: [
                            "https://org-dendron-public-assets.s3.amazonaws.com/images/rfc-35-template-1.png",
                        ],
                        match: [
                            "https://file",
                            "vscode",
                            path_1.default.posix.join(common_all_1.VaultUtils.getRelPath(vaults[0]), "assets", "image.png"),
                        ],
                    })).toBeTruthy();
                });
            });
        });
    });
});
//# sourceMappingURL=PreviewPanel.test.js.map