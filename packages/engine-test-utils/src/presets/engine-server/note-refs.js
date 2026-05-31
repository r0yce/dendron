"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const WILDCARD_LINK_V4 = new common_test_utils_1.TestPresetEntryV4(async ({}) => {
    // TODO: this isn't done
    return [];
}, {
    genTestResults: async ({ extra }) => {
        const { body } = extra;
        const out = await common_test_utils_1.AssertUtils.assertInString({
            body,
            match: ["journal1", "journal2", "journal3"],
            nomatch: ["journal0"],
        });
        return [{ actual: out, expected: true }];
    },
    preSetupHook: async ({ wsRoot, vaults }) => {
        await common_test_utils_1.NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            body: "journal0",
            fname: "journal.2020.07.01",
        });
        await common_test_utils_1.NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            body: "journal1",
            fname: "journal.2020.08.01",
        });
        await common_test_utils_1.NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            body: "journal2",
            fname: "journal.2020.08.02",
        });
        await common_test_utils_1.NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            body: "journal3",
            fname: "journal.2020.08.03",
        });
        const note = await common_test_utils_1.NoteTestUtilsV4.createNote({
            vault: vaults[0],
            wsRoot,
            props: {
                id: "id.journal",
            },
            body: "![[journal.2020.08.*]]",
            fname: "journal",
        });
        return { note };
    },
});
const NOTE_REF_PRESET = {
    WILDCARD_LINK_V4,
};
exports.default = NOTE_REF_PRESET;
//# sourceMappingURL=note-refs.js.map