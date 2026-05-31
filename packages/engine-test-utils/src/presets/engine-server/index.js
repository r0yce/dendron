"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENGINE_PRESETS_MULTI = exports.ENGINE_PRESETS = exports.getPresetGroup = exports.getPresetMulti = exports.getPreset = exports.ENGINE_SERVER = exports.ENGINE_CONFIG_PRESETS = exports.ENGINE_WRITE_PRESETS = exports.ENGINE_QUERY_PRESETS = exports.ENGINE_RENAME_PRESETS = exports.ENGINE_HOOKS_MULTI = exports.ENGINE_HOOKS_BASE = exports.ENGINE_HOOKS = void 0;
const config_1 = require("./config");
Object.defineProperty(exports, "ENGINE_CONFIG_PRESETS", { enumerable: true, get: function () { return config_1.ENGINE_CONFIG_PRESETS; } });
const delete_1 = require("./delete");
const info_1 = require("./info");
const init_1 = require("./init");
const getNoteBlocks_1 = require("./getNoteBlocks");
const note_refs_1 = __importDefault(require("./note-refs"));
const query_1 = require("./query");
Object.defineProperty(exports, "ENGINE_QUERY_PRESETS", { enumerable: true, get: function () { return query_1.ENGINE_QUERY_PRESETS; } });
const rename_1 = require("./rename");
Object.defineProperty(exports, "ENGINE_RENAME_PRESETS", { enumerable: true, get: function () { return rename_1.ENGINE_RENAME_PRESETS; } });
const bulkWriteNotes_1 = require("./bulkWriteNotes");
const render_1 = require("./render");
const write_1 = require("./write");
Object.defineProperty(exports, "ENGINE_WRITE_PRESETS", { enumerable: true, get: function () { return write_1.ENGINE_WRITE_PRESETS; } });
const lodash_1 = __importDefault(require("lodash"));
var utils_1 = require("./utils");
Object.defineProperty(exports, "ENGINE_HOOKS", { enumerable: true, get: function () { return utils_1.ENGINE_HOOKS; } });
Object.defineProperty(exports, "ENGINE_HOOKS_BASE", { enumerable: true, get: function () { return utils_1.ENGINE_HOOKS_BASE; } });
Object.defineProperty(exports, "ENGINE_HOOKS_MULTI", { enumerable: true, get: function () { return utils_1.ENGINE_HOOKS_MULTI; } });
exports.ENGINE_SERVER = {
    NOTE_REF: note_refs_1.default,
    ENGINE_WRITE_PRESETS: write_1.ENGINE_WRITE_PRESETS,
    ENGINE_INIT_PRESETS: init_1.ENGINE_INIT_PRESETS,
    ENGINE_DELETE_PRESETS: delete_1.ENGINE_DELETE_PRESETS,
    ENGINE_INFO_PRESETS: info_1.ENGINE_INFO_PRESETS,
    ENGINE_RENAME_PRESETS: rename_1.ENGINE_RENAME_PRESETS,
    ENGINE_GET_NOTE_BLOCKS_PRESETS: getNoteBlocks_1.ENGINE_GET_NOTE_BLOCKS_PRESETS,
    ENGINE_QUERY_PRESETS: query_1.ENGINE_QUERY_PRESETS,
    ENGINE_BULK_WRITE_NOTES_PRESETS: bulkWriteNotes_1.ENGINE_BULK_WRITE_NOTES_PRESETS,
    ENGINE_RENDER_PRESETS: render_1.ENGINE_RENDER_PRESETS,
};
/**
 *
 @example
 *  test("", async () => {
 *    const TestCase= getPreset({presets: ENGINE_PRESETS, nodeType, presetName: "init", key: 'BAD_SCHEMA'})
 *    const { testFunc, ...opts } = TestCase;;
 *    await runEngineTestV5(testFunc, { ...opts, expect });
 *});
 * @param param0
 * @returns
 */
const getPreset = ({ presets, presetName, nodeType, key, }) => {
    const ent = lodash_1.default.find(presets, { name: presetName });
    // @ts-ignore
    const out = lodash_1.default.get(ent.presets[nodeType], key);
    if (!out) {
        throw Error(`no key ${key} found in ${presetName}`);
    }
    return out;
};
exports.getPreset = getPreset;
const getPresetMulti = ({ presets, presetName, nodeType, key, }) => {
    const ent = lodash_1.default.find(presets, { name: presetName });
    // @ts-ignore
    const out = lodash_1.default.get(ent.presets[nodeType], key);
    if (!out) {
        throw Error(`no key ${key} found in ${presetName}`);
    }
    return out;
};
exports.getPresetMulti = getPresetMulti;
const getPresetGroup = ({ presets, presetName, nodeType, }) => {
    const ent = lodash_1.default.find(presets, { name: presetName });
    // @ts-ignore
    return ent.presets[nodeType];
};
exports.getPresetGroup = getPresetGroup;
// ^iygzn9r2758w
exports.ENGINE_PRESETS = [
    { name: "write", presets: exports.ENGINE_SERVER.ENGINE_WRITE_PRESETS },
    {
        name: "bulkWriteNotes",
        presets: exports.ENGINE_SERVER.ENGINE_BULK_WRITE_NOTES_PRESETS,
    },
    { name: "delete", presets: exports.ENGINE_SERVER.ENGINE_DELETE_PRESETS },
    { name: "rename", presets: exports.ENGINE_SERVER.ENGINE_RENAME_PRESETS },
    { name: "init", presets: exports.ENGINE_SERVER.ENGINE_INIT_PRESETS },
    { name: "query", presets: exports.ENGINE_SERVER.ENGINE_QUERY_PRESETS },
    { name: "info", presets: exports.ENGINE_SERVER.ENGINE_INFO_PRESETS },
    {
        name: "getNoteBlocks",
        presets: exports.ENGINE_SERVER.ENGINE_GET_NOTE_BLOCKS_PRESETS,
    },
    { name: "render", presets: exports.ENGINE_SERVER.ENGINE_RENDER_PRESETS },
];
exports.ENGINE_PRESETS_MULTI = [
    { name: "write", presets: write_1.ENGINE_WRITE_PRESETS_MULTI },
    { name: "delete", presets: exports.ENGINE_SERVER.ENGINE_DELETE_PRESETS },
    { name: "rename", presets: exports.ENGINE_SERVER.ENGINE_RENAME_PRESETS },
    { name: "init", presets: exports.ENGINE_SERVER.ENGINE_INIT_PRESETS },
    { name: "query", presets: exports.ENGINE_SERVER.ENGINE_QUERY_PRESETS },
];
//# sourceMappingURL=index.js.map