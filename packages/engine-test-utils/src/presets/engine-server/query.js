"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENGINE_QUERY_PRESETS = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const utils_1 = require("./utils");
const SCHEMAS = {
    STAR_QUERY: new common_test_utils_1.TestPresetEntryV4(async ({ engine }) => {
        const { data } = await engine.querySchema("*");
        return [
            {
                actual: data.length,
                expected: 2,
            },
        ];
    }, {
        preSetupHook: utils_1.setupBasic,
    }),
    SIMPLE: new common_test_utils_1.TestPresetEntryV4(async ({ engine }) => {
        const sid = common_test_utils_1.SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.fname;
        const { data } = await engine.querySchema(sid);
        const expectedSchema = (await engine.getSchema(sid)).data;
        const fooSchema = lodash_1.default.find(data, { fname: sid });
        return [
            {
                actual: fooSchema,
                expected: expectedSchema,
            },
        ];
    }, {
        preSetupHook: utils_1.setupBasic,
    }),
};
const NOTES = {
    EMPTY_QS: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const vault = vaults[0];
        const data = await engine.queryNotes({
            qs: "",
            originalQS: "",
            vault,
        });
        const expectedNote = (await engine.findNotes({
            fname: "root",
            vault,
        }))[0];
        const matchNote = lodash_1.default.find(data, { id: expectedNote?.id });
        return [
            {
                actual: matchNote,
                expected: expectedNote,
            },
        ];
    }, {
        preSetupHook: utils_1.setupBasic,
    }),
    // Querying for non-existing note should return empty []
    MISSING_QUERY: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const data = await engine.queryNotes({
            qs: "bar",
            originalQS: "bar",
            vault: vaults[0],
        });
        return [
            {
                actual: data,
                expected: [],
            },
        ];
    }, {
        preSetupHook: utils_1.setupEmpty,
    }),
    STAR_QUERY: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const vault = vaults[0];
        const data = await engine.queryNotes({
            qs: "*",
            originalQS: "*",
            vault,
        });
        return [
            {
                actual: data?.length,
                expected: 4,
            },
        ];
    }, {
        preSetupHook: utils_1.setupBasic,
    }),
    DOMAIN_QUERY_WITH_SCHEMA: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const vault = vaults[0];
        const fname = common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE.fname;
        const data = await engine.queryNotes({
            qs: fname,
            originalQS: fname,
            vault,
        });
        const expectedNote = (await engine.findNotes({
            fname,
            vault,
        }))[0];
        return [
            {
                actual: data ? data[0] : undefined,
                expected: expectedNote,
            },
            {
                actual: data ? data[0].schema : undefined,
                expected: {
                    moduleId: common_test_utils_1.SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.fname,
                    schemaId: common_test_utils_1.SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.fname,
                },
            },
        ];
    }, {
        preSetupHook: utils_1.setupBasic,
    }),
    CHILD_QUERY_WITH_SCHEMA: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const vault = vaults[0];
        const fname = common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.fname;
        const data = await engine.queryNotes({
            qs: fname,
            originalQS: fname,
            vault,
        });
        const expectedNote = (await engine.findNotes({
            fname,
            vault,
        }))[0];
        const matchNote = lodash_1.default.find(data, { id: expectedNote?.id });
        return [
            {
                actual: matchNote,
                expected: expectedNote,
            },
            {
                actual: matchNote?.schema,
                expected: {
                    moduleId: common_test_utils_1.SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.fname,
                    schemaId: common_all_1.DNodeUtils.basename(common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.fname),
                },
            },
        ];
    }, {
        preSetupHook: utils_1.setupBasic,
    }),
};
exports.ENGINE_QUERY_PRESETS = {
    NOTES,
    SCHEMAS,
};
//# sourceMappingURL=query.js.map