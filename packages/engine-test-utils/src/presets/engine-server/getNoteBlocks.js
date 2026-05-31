"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENGINE_GET_NOTE_BLOCKS_PRESETS = void 0;
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const runGetNoteBlocks = async ({ engine, vaults, note, filterByAnchorType, cb, }) => {
    if (lodash_1.default.isUndefined(note))
        note = (await engine.findNotes({
            fname: "test",
            vault: vaults[0],
        }))[0];
    const out = await engine.getNoteBlocks({
        id: note.id,
        filterByAnchorType,
    });
    return cb(out);
};
const preSetupHook = async ({ vaults, wsRoot }, { noteBody, fname }) => {
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        vault: vaults[0],
        wsRoot,
        fname: fname || "test",
        body: noteBody,
    });
};
const NOTES = {
    PARAGRAPHS: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        return runGetNoteBlocks({
            engine,
            wsRoot,
            vaults,
            cb: ({ data }) => {
                return [
                    {
                        actual: data?.length,
                        expected: 3,
                    },
                ];
            },
        });
    }, {
        preSetupHook: (opts) => preSetupHook(opts, {
            noteBody: [
                "Et et quam culpa.",
                "",
                "Cumque molestiae qui deleniti.",
                "Eius odit commodi harum.",
                "",
                "Sequi ut non delectus tempore.",
            ].join("\n"),
        }),
    }),
    LIST: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        return runGetNoteBlocks({
            engine,
            wsRoot,
            vaults,
            cb: ({ data }) => {
                return [
                    {
                        actual: data?.length,
                        expected: 5,
                    },
                ];
            },
        });
    }, {
        preSetupHook: (opts) => preSetupHook(opts, {
            noteBody: [
                "Et et quam culpa.",
                "",
                "* Cumque molestiae qui deleniti.",
                "* Eius odit commodi harum.",
                "",
                "Sequi ut non delectus tempore.",
            ].join("\n"),
        }),
    }),
    NESTED_LIST: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        return runGetNoteBlocks({
            engine,
            wsRoot,
            vaults,
            cb: ({ data }) => {
                return [
                    {
                        actual: data?.length,
                        expected: 8,
                    },
                ];
            },
        });
    }, {
        preSetupHook: (opts) => preSetupHook(opts, {
            noteBody: [
                "Et et quam culpa.",
                "",
                "* Cumque molestiae qui deleniti.",
                "* Eius odit commodi harum.",
                "  * Sequi ut non delectus tempore.",
                "  * In delectus quam sunt unde.",
                "* Quasi ex debitis aut sed.",
                "",
                "Perferendis officiis ut non.",
            ].join("\n"),
        }),
    }),
    TABLE: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        return runGetNoteBlocks({
            engine,
            wsRoot,
            vaults,
            cb: ({ data }) => {
                return [
                    {
                        actual: data?.length,
                        expected: 3,
                    },
                ];
            },
        });
    }, {
        preSetupHook: (opts) => preSetupHook(opts, {
            noteBody: [
                "Et et quam culpa.",
                "",
                "| Sapiente | accusamus |",
                "|----------|-----------|",
                "| Laborum  | libero    |",
                "| Ullam    | optio     |",
                "",
                "Sequi ut non delectus tempore.",
            ].join("\n"),
        }),
    }),
    EXISTING_ANCHORS: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        return runGetNoteBlocks({
            engine,
            wsRoot,
            vaults,
            cb: ({ data }) => {
                return [
                    {
                        actual: data?.length,
                        expected: 7,
                    },
                    { actual: data[0].anchor?.value, expected: "et-et-quam-culpa" },
                    { actual: data[1].anchor?.value, expected: "paragraph" },
                    { actual: data[2].anchor?.value, expected: "item1" },
                    { actual: data[3].anchor?.value, expected: "item2" },
                    { actual: data[4].anchor?.value, expected: "item3" },
                    { actual: data[5].anchor?.value, expected: "list" },
                    { actual: data[6].anchor?.value, expected: "table" },
                ];
            },
        });
    }, {
        preSetupHook: (opts) => preSetupHook(opts, {
            noteBody: [
                "# Et et quam culpa. ^header",
                "",
                "Ullam vel eius reiciendis. ^paragraph",
                "",
                "* Cumque molestiae qui deleniti. ^item1",
                "* Eius odit commodi harum. ^item2",
                "  * Sequi ut non delectus tempore. ^item3",
                "",
                "^list",
                "",
                "| Sapiente | accusamus |",
                "|----------|-----------|",
                "| Laborum  | libero    |",
                "| Ullam    | optio     | ^table",
            ].join("\n"),
        }),
    }),
    HEADERS_ONLY: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        return runGetNoteBlocks({
            engine,
            wsRoot,
            vaults,
            filterByAnchorType: "header",
            cb: ({ data }) => {
                return [
                    {
                        actual: data?.length,
                        expected: 1,
                    },
                    { actual: data[0].anchor?.value, expected: "et-et-quam-culpa" },
                ];
            },
        });
    }, {
        preSetupHook: (opts) => preSetupHook(opts, {
            noteBody: [
                "# Et et quam culpa.",
                "",
                "Ullam vel eius reiciendis. ^paragraph",
                "",
                "* Cumque molestiae qui deleniti. ^item1",
                "* Eius odit commodi harum. ^item2",
                "  * Sequi ut non delectus tempore. ^item3",
                "",
                "^list",
                "",
                "| Sapiente | accusamus |",
                "|----------|-----------|",
                "| Laborum  | libero    |",
                "| Ullam    | optio     | ^table",
            ].join("\n"),
        }),
    }),
    BLOCK_ANCHORS_ONLY: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        return runGetNoteBlocks({
            engine,
            wsRoot,
            vaults,
            filterByAnchorType: "block",
            cb: ({ data }) => {
                return [
                    {
                        actual: data?.length,
                        expected: 6,
                    },
                    { actual: data[0].anchor?.value, expected: "paragraph" },
                    { actual: data[1].anchor?.value, expected: "item1" },
                    { actual: data[2].anchor?.value, expected: "item2" },
                    { actual: data[3].anchor?.value, expected: "item3" },
                    { actual: data[4].anchor?.value, expected: "list" },
                    { actual: data[5].anchor?.value, expected: "table" },
                ];
            },
        });
    }, {
        preSetupHook: (opts) => preSetupHook(opts, {
            noteBody: [
                "# Et et quam culpa.",
                "",
                "Ullam vel eius reiciendis. ^paragraph",
                "",
                "* Cumque molestiae qui deleniti. ^item1",
                "* Eius odit commodi harum. ^item2",
                "  * Sequi ut non delectus tempore. ^item3",
                "",
                "^list",
                "",
                "| Sapiente | accusamus |",
                "|----------|-----------|",
                "| Laborum  | libero    |",
                "| Ullam    | optio     | ^table",
            ].join("\n"),
        }),
    }),
    HEADER: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        return runGetNoteBlocks({
            engine,
            wsRoot,
            vaults,
            cb: ({ data }) => {
                return [
                    {
                        actual: data?.length,
                        expected: 4,
                    },
                    {
                        actual: data[0].anchor?.value,
                        expected: "et-et-quam-culpa",
                    },
                    {
                        actual: data[2].anchor?.value,
                        expected: "eius-odit-commodi-harum",
                    },
                ];
            },
        });
    }, {
        preSetupHook: (opts) => preSetupHook(opts, {
            noteBody: [
                "# Et et quam culpa. ^anchor",
                "",
                "Cumque molestiae qui deleniti.",
                "",
                "# Eius odit commodi harum.",
                "",
                "Sequi ut non delectus tempore.",
            ].join("\n"),
        }),
    }),
};
exports.ENGINE_GET_NOTE_BLOCKS_PRESETS = {
    // use the below to test a specific test
    NOTES: { NOTE_REF: NOTES["HEADERS_ONLY"] },
    //NOTES,
    SCHEMAS: {},
};
//# sourceMappingURL=getNoteBlocks.js.map