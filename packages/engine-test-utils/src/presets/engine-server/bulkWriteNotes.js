"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENGINE_BULK_WRITE_NOTES_PRESETS = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const SCHEMAS = {};
const NOTES = {
    BASIC: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const vault = vaults[0];
        const orig = lodash_1.default.size(await engine.findNotesMeta({ vault }));
        const note1 = common_all_1.NoteUtils.create({
            id: "bar1",
            fname: "bar1",
            created: 1,
            updated: 1,
            vault,
        });
        const note2 = common_all_1.NoteUtils.create({
            id: "bar2",
            fname: "bar2",
            created: 1,
            updated: 1,
            vault,
        });
        const rootNote = (await engine.findNotes({ fname: "root", vault }))[0];
        await engine.bulkWriteNotes({ notes: [note1, note2] });
        const barNote = (await engine.getNoteMeta("bar1")).data;
        return [
            {
                actual: lodash_1.default.size(await engine.findNotesMeta({ vault })),
                expected: orig + 2,
                msg: "should be 2 more notes",
            },
            {
                expected: barNote.id,
                actual: note1.id,
            },
            {
                expected: barNote.fname,
                actual: note1.fname,
            },
            {
                expected: barNote.vault,
                actual: note1.vault,
            },
            {
                expected: barNote.parent,
                actual: rootNote.id,
            },
        ];
    }),
};
exports.ENGINE_BULK_WRITE_NOTES_PRESETS = {
    NOTES,
    SCHEMAS,
};
//# sourceMappingURL=bulkWriteNotes.js.map