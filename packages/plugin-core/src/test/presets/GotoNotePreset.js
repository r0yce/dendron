"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GOTO_NOTE_PRESETS = void 0;
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtilsV2_1 = require("../../WSUtilsV2");
const testUtils_1 = require("../testUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const vscode_1 = require("vscode");
const ANCHOR = new common_test_utils_1.TestPresetEntry({
    label: "anchor",
    preSetupHook: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        await common_test_utils_1.NoteTestUtilsV4.createNote({
            wsRoot,
            vault,
            fname: "alpha",
            body: [`# H1`, `# H2`, `# H3`, "", "Some Content"].join("\n"),
        });
    },
    results: async () => {
        const selection = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.selection;
        return [
            {
                actual: (0, testUtils_1.getActiveEditorBasename)(),
                expected: "alpha.md",
            },
            {
                actual: selection?.start.line,
                expected: 9,
            },
            {
                actual: selection?.start.character,
                expected: 0,
            },
        ];
    },
});
const ANCHOR_WITH_SPECIAL_CHARS = new common_test_utils_1.TestPresetEntry({
    label: "anchor with special chars",
    preSetupHook: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        const specialCharsHeader = `H3 &$!@`;
        await common_test_utils_1.NoteTestUtilsV4.createNote({
            wsRoot,
            vault,
            fname: "alpha",
            body: [
                `# H1`,
                `# H2`,
                `# ${specialCharsHeader}`,
                "",
                "Some Content",
            ].join("\n"),
        });
        return { specialCharsHeader };
    },
    results: async () => {
        const selection = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.selection;
        return [
            {
                actual: (0, testUtils_1.getActiveEditorBasename)(),
                expected: "alpha.md",
            },
            {
                actual: selection?.start.line,
                expected: 9,
            },
            {
                actual: selection?.start.character,
                expected: 0,
            },
        ];
    },
});
const LINK_TO_NOTE_IN_SAME_VAULT = new common_test_utils_1.TestPresetEntry({
    label: "WHEN link to note in same vault",
    preSetupHook: async (opts) => {
        await engine_test_utils_1.ENGINE_HOOKS.setupLinks(opts);
    },
    beforeTestResults: async ({ ext }) => {
        const { engine } = ext.getDWorkspace();
        const note = (await engine.getNote("alpha")).data;
        const editor = await new WSUtilsV2_1.WSUtilsV2(ext).openNote(note);
        editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection({
            line: 7,
            char: 23,
        });
    },
    results: async () => {
        return [
            {
                actual: (0, testUtils_1.getActiveEditorBasename)(),
                expected: "beta.md",
            },
        ];
    },
});
const LINK_IN_CODE_BLOCK = new common_test_utils_1.TestPresetEntry({
    label: "WHEN link in code block",
    preSetupHook: async ({ wsRoot, vaults }) => {
        await common_test_utils_1.NoteTestUtilsV4.createNote({
            fname: "test.target",
            vault: vaults[0],
            wsRoot,
            body: "In aut veritatis odit tempora aut ipsa quo.",
        });
        await common_test_utils_1.NoteTestUtilsV4.createNote({
            fname: "test.note",
            vault: vaults[0],
            wsRoot,
            body: [
                "```tsx",
                "const x = 1;",
                "// see [[test target|test.target]]",
                "const y = x + 1;",
                "```",
            ].join("\n"),
        });
    },
    beforeTestResults: async ({ ext }) => {
        const { engine } = ext.getDWorkspace();
        const note = (await engine.getNote("test.note")).data;
        const editor = await new WSUtilsV2_1.WSUtilsV2(ext).openNote(note);
        editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection({
            line: 9,
            char: 23,
        });
    },
    results: async () => {
        return [
            {
                actual: (0, testUtils_1.getActiveEditorBasename)(),
                expected: "test.target.md",
            },
        ];
    },
});
const LINK_TO_NOTE_WITH_URI_HTTP = new common_test_utils_1.TestPresetEntry({
    label: "WHEN uri is present",
    preSetupHook: async ({ wsRoot, vaults }) => {
        await common_test_utils_1.NoteTestUtilsV4.createNote({
            fname: "alpha",
            vault: vaults[0],
            wsRoot,
            custom: {
                uri: "http://example.com",
            },
        });
        await common_test_utils_1.NoteTestUtilsV4.createNote({
            fname: "beta",
            vault: vaults[0],
            wsRoot,
            body: "[[alpha]]",
        });
    },
    beforeTestResults: async ({ ext }) => {
        const { engine } = ext.getDWorkspace();
        const note = (await engine.getNote("beta")).data;
        const editor = await new WSUtilsV2_1.WSUtilsV2(ext).openNote(note);
        editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection({
            line: 7,
            char: 0,
        });
    },
    results: async () => {
        return [];
    },
});
const VALID_URL = new common_test_utils_1.TestPresetEntry({
    label: "WHEN cursor is on a valid url",
    preSetupHook: async ({ wsRoot, vaults }) => {
        await common_test_utils_1.NoteTestUtilsV4.createNote({
            fname: "test.note",
            vault: vaults[0],
            wsRoot,
            body: [
                "Here we have some example text to search for URLs within",
                "https://www.dendron.so/",
            ].join("\n"),
        });
    },
    beforeTestResults: async ({ ext }) => {
        const { engine } = ext.getDWorkspace();
        const note = (await engine.getNote("test.note")).data;
        const editor = await new WSUtilsV2_1.WSUtilsV2(ext).openNote(note);
        editor.selection = new vscode_1.Selection(8, 3, 8, 3);
    },
    results: async () => {
        return [];
    },
});
const PARTIAL_URL = new common_test_utils_1.TestPresetEntry({
    label: "WHEN selection includes non URL string",
    preSetupHook: async ({ wsRoot, vaults }) => {
        await common_test_utils_1.NoteTestUtilsV4.createNote({
            fname: "test.note",
            vault: vaults[0],
            wsRoot,
            body: [
                "URL with text around it",
                "check out [dendron](https://www.dendron.so/)",
            ].join("\n"),
        });
    },
    beforeTestResults: async ({ ext }) => {
        const { engine } = ext.getDWorkspace();
        const note = (await engine.getNote("test.note")).data;
        const editor = await new WSUtilsV2_1.WSUtilsV2(ext).openNote(note);
        editor.selection = new vscode_1.Selection(8, 15, 8, 25);
    },
    results: async () => {
        return [];
    },
});
const NO_LINK = new common_test_utils_1.TestPresetEntry({
    label: "WHEN there is no valid link under the cursor",
    preSetupHook: async (opts) => engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts),
    beforeTestResults: async ({ ext }) => {
        const { engine } = ext.getDWorkspace();
        const note = (await engine.getNote("foo")).data;
        const editor = await new WSUtilsV2_1.WSUtilsV2(ext).openNote(note);
        editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection({
            line: 8,
            char: 1,
        });
    },
    results: async () => {
        return [];
    },
});
exports.GOTO_NOTE_PRESETS = {
    ANCHOR,
    ANCHOR_WITH_SPECIAL_CHARS,
    LINK_TO_NOTE_IN_SAME_VAULT,
    LINK_IN_CODE_BLOCK,
    LINK_TO_NOTE_WITH_URI_HTTP,
    VALID_URL,
    PARTIAL_URL,
    NO_LINK,
};
//# sourceMappingURL=GotoNotePreset.js.map