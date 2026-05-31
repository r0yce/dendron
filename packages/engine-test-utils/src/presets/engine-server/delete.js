"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENGINE_DELETE_PRESETS = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_server_1 = require("@dendronhq/engine-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const SCHEMAS = {
    BASIC: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        const vault = vaults[0];
        const schemaId = common_test_utils_1.SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.fname;
        const beforeSchema = (await engine.getSchema(schemaId)).data;
        await engine.deleteSchema(schemaId);
        const afterSchema = (await engine.getSchema(schemaId)).data;
        return [
            { actual: lodash_1.default.size(beforeSchema.schemas), expected: 2 },
            { actual: afterSchema, expected: undefined },
            {
                actual: await common_test_utils_1.FileTestUtils.assertInVault({
                    vault,
                    wsRoot,
                    nomatch: [`${schemaId}.schema.yml`],
                }),
                expected: true,
            },
        ];
    }, {
        preSetupHook: utils_1.setupBasic,
    }),
};
const NOTES = {
    GRANDCHILD_WITH_ALL_STUB_PARENTS: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        const vault = vaults[0];
        const logger = engine.logger;
        const cachePath = path_1.default.join((0, common_server_1.vault2Path)({ wsRoot, vault }), common_all_1.CONSTANTS.DENDRON_CACHE_FILE);
        const notesCache = new engine_server_1.NotesFileSystemCache({ cachePath, logger });
        const keySet = notesCache.getCacheEntryKeys();
        const fooChildNote = (await engine.findNotesMeta({ fname: "foo.ch1", vault }))[0];
        const resp = await engine.deleteNote(fooChildNote.id);
        const changed = resp.data;
        await engine.init();
        return [
            {
                actual: await common_test_utils_1.EngineTestUtilsV4.checkVault({
                    wsRoot,
                    vault,
                    nomatch: ["foo"],
                }),
                expected: true,
            },
            {
                actual: lodash_1.default.find(changed, (ent) => ent.status === "delete" && ent.note.fname === "foo.ch1"),
                expected: true,
            },
            {
                actual: lodash_1.default.find(changed, (ent) => ent.status === "delete" && ent.note.fname === "foo"),
                expected: true,
            },
            {
                actual: lodash_1.default.find(changed, (ent) => ent.status === "update" && ent.note.fname === "root"),
                expected: true,
            },
            {
                actual: keySet.size,
                expected: 2,
            },
            {
                actual: new engine_server_1.NotesFileSystemCache({
                    cachePath,
                    logger,
                }).getCacheEntryKeys().size,
                expected: 1,
            },
        ];
    }, {
        preSetupHook: async ({ vaults, wsRoot }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "foo.ch1",
                vault: vaults[0],
                wsRoot,
                body: "",
            });
        },
    }),
    NOTE_NO_CHILDREN: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        const vault = vaults[0];
        const logger = engine.logger;
        const notesInVaultBefore = await engine.findNotesMeta({ vault });
        const cachePath = path_1.default.join((0, common_server_1.vault2Path)({ wsRoot, vault }), common_all_1.CONSTANTS.DENDRON_CACHE_FILE);
        const notesCache = new engine_server_1.NotesFileSystemCache({ cachePath, logger });
        const keySet = notesCache.getCacheEntryKeys();
        const fooChildNote = (await engine.findNotesMeta({ fname: "foo.ch1", vault }))[0];
        const resp = await engine.deleteNote(fooChildNote.id);
        // Foo's child should be deleted, leaving behind foo and 3 root notes
        const notesInVaultAfter = await engine.findNotesMeta({ vault });
        const fooNote = (await engine.findNotesMeta({ fname: "foo", vault }))[0];
        const changed = resp.data;
        const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
        await engine.init();
        return [
            { actual: changed[0].note.id, expected: "foo" },
            { actual: lodash_1.default.size(notesInVaultBefore), expected: 3 },
            { actual: lodash_1.default.size(notesInVaultAfter), expected: 2 },
            { actual: fooNote.children, expected: [] },
            {
                actual: lodash_1.default.includes(fs_extra_1.default.readdirSync(vpath), "foo.ch1.md"),
                expected: false,
            },
            {
                actual: keySet.size,
                expected: 3,
            },
            {
                actual: new engine_server_1.NotesFileSystemCache({
                    cachePath,
                    logger,
                }).getCacheEntryKeys().size,
                expected: 2,
            },
        ];
    }, {
        preSetupHook: async ({ vaults, wsRoot }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "foo",
                vault: vaults[0],
                wsRoot,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "foo.ch1",
                vault: vaults[0],
                wsRoot,
                body: "",
            });
        },
    }),
    NOTE_WITH_TARGET: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const vault = vaults[0];
        const notesInVaultBefore = await engine.findNotesMeta({ vault });
        const betaNoteBefore = await engine.getNoteMeta("beta");
        const betaBackLinksBefore = betaNoteBefore.data.links.filter((link) => link.type === "backlink");
        await engine.deleteNote("alpha");
        // Alpha be deleted, leaving behind beta and 3 root notes
        const notesInVaultAfter = await engine.findNotesMeta({ vault });
        const betaNoteAfter = await engine.getNoteMeta("beta");
        const betaBackLinksAfter = betaNoteAfter.data.links.filter((link) => link.type === "backlink");
        return [
            { actual: betaNoteBefore.data?.links.length, expected: 2 },
            { actual: betaBackLinksBefore.length, expected: 1 },
            { actual: lodash_1.default.size(notesInVaultBefore), expected: 3 },
            { actual: lodash_1.default.size(notesInVaultAfter), expected: 2 },
            { actual: betaNoteAfter.data?.links.length, expected: 1 },
            { actual: betaBackLinksAfter.length, expected: 0 },
        ];
    }, {
        preSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                wsRoot,
                vault: vaults[0],
            });
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
                wsRoot,
                vault: vaults[0],
            });
        },
    }),
    DOMAIN_CHILDREN: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        const vault = vaults[0];
        const notesInVaultBefore = await engine.findNotesMeta({ vault });
        const noteToDelete = (await engine.findNotesMeta({ fname: "foo", vault }))[0];
        const resp = await engine.deleteNote(noteToDelete?.id);
        const createEntries = (0, common_all_1.extractNoteChangeEntriesByType)(resp.data, "create");
        const deleteEntries = (0, common_all_1.extractNoteChangeEntriesByType)(resp.data, "delete");
        const updateEntries = (0, common_all_1.extractNoteChangeEntriesByType)(resp.data, "update");
        const notesInVaultAfter = await engine.findNotesMeta({ vault });
        const fooNote = (await engine.findNotesMeta({ fname: "foo", vault }))[0];
        const fooChild = (await engine.findNotesMeta({ fname: "foo.ch1", vault }))[0];
        const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
        return [
            {
                actual: updateEntries.length,
                expected: 2,
                msg: "2 updates should happen.",
            },
            {
                actual: deleteEntries.length,
                expected: 1,
                msg: "1 delete should happen.",
            },
            {
                actual: createEntries.length,
                expected: 1,
                msg: "1 create should happen.",
            },
            {
                actual: lodash_1.default.size(notesInVaultBefore),
                expected: 3,
                msg: "Before as root, foo, and foo.ch1",
            },
            {
                actual: lodash_1.default.size(notesInVaultAfter),
                expected: 3,
                msg: "same number of notes as before",
            },
            {
                actual: fooNote.stub,
                expected: true,
                msg: "foo should be a stub",
            },
            {
                actual: fooChild.parent,
                expected: fooNote.id,
                msg: "foo's child should have updated parent id",
            },
            {
                actual: lodash_1.default.includes(fs_extra_1.default.readdirSync(vpath), "foo.md"),
                expected: false,
                msg: "note should be deleted",
            },
        ];
    }, {
        preSetupHook: async ({ vaults, wsRoot }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "foo",
                vault: vaults[0],
                wsRoot,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "foo.ch1",
                vault: vaults[0],
                wsRoot,
                body: "",
            });
        },
    }),
    DOMAIN_NO_CHILDREN: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        const vault = vaults[0];
        const notesInVaultBefore = await engine.findNotesMeta({ vault });
        const logger = engine.logger;
        const cachePath = path_1.default.join((0, common_server_1.vault2Path)({ wsRoot, vault }), common_all_1.CONSTANTS.DENDRON_CACHE_FILE);
        const notesCache = new engine_server_1.NotesFileSystemCache({ cachePath, logger });
        const keySet = notesCache.getCacheEntryKeys();
        const noteToDelete = (await engine.findNotesMeta({ fname: "foo", vault }))[0];
        const resp = await engine.deleteNote(noteToDelete?.id);
        const changed = resp.data;
        const notesInVaultAfter = await engine.findNotesMeta({ vault });
        const fooNote = (await engine.findNotesMeta({ fname: "foo", vault }))[0];
        const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
        await engine.init();
        return [
            {
                actual: changed[0].note.fname,
                expected: "root",
                msg: "root updated",
            },
            {
                actual: changed[0].note.children,
                expected: [],
                msg: "root does not have children",
            },
            {
                actual: lodash_1.default.size(notesInVaultBefore),
                expected: 2,
                msg: "Before has root and foo",
            },
            {
                actual: lodash_1.default.size(notesInVaultAfter),
                expected: 1,
                msg: "After has root",
            },
            { actual: fooNote, expected: undefined },
            {
                actual: lodash_1.default.includes(fs_extra_1.default.readdirSync(vpath), "foo.md"),
                expected: false,
            },
            {
                actual: keySet.size,
                expected: 2,
            },
            {
                actual: new engine_server_1.NotesFileSystemCache({
                    cachePath,
                    logger,
                }).getCacheEntryKeys().size,
                expected: 1,
            },
        ];
    }, {
        preSetupHook: async ({ vaults, wsRoot }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "foo",
                vault: vaults[0],
                wsRoot,
            });
        },
    }),
    STALE_CACHE_ENTRY: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        const vault = vaults[0];
        const logger = engine.logger;
        const cachePath = path_1.default.join((0, common_server_1.vault2Path)({ wsRoot, vault }), common_all_1.CONSTANTS.DENDRON_CACHE_FILE);
        const notesCache = new engine_server_1.NotesFileSystemCache({ cachePath, logger });
        // Create random note and write to cache
        const staleNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
            fname: "my-new-note",
            wsRoot,
            vault: vaults[0],
            noWrite: true,
        });
        const cacheEntry = (0, engine_server_1.createCacheEntry)({
            noteProps: staleNote,
            hash: "123123",
        });
        notesCache.set(staleNote.fname, cacheEntry);
        notesCache.writeToFileSystem();
        const keySet = notesCache.getCacheEntryKeys();
        // Should remove random note from cache
        await engine.init();
        return [
            {
                actual: keySet.size,
                expected: 5,
            },
            {
                actual: keySet.has("my-new-note"),
                expected: true,
            },
            {
                actual: new engine_server_1.NotesFileSystemCache({
                    cachePath,
                    logger,
                }).getCacheEntryKeys().size,
                expected: 4,
            },
            {
                actual: new engine_server_1.NotesFileSystemCache({ cachePath, logger })
                    .getCacheEntryKeys()
                    .has("my-new-note"),
                expected: false,
            },
        ];
    }, {
        preSetupHook: async (opts) => {
            await utils_1.ENGINE_HOOKS.setupBasic(opts);
        },
    }),
    MULTIPLE_DELETES: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        const vault = vaults[0];
        const notesInVaultBefore = await engine.findNotesMeta({ vault });
        const logger = engine.logger;
        const cachePath = path_1.default.join((0, common_server_1.vault2Path)({ wsRoot, vault }), common_all_1.CONSTANTS.DENDRON_CACHE_FILE);
        const notesCache = new engine_server_1.NotesFileSystemCache({ cachePath, logger });
        const keySet = notesCache.getCacheEntryKeys();
        const fooChildNote = (await engine.findNotesMeta({ fname: "foo.ch1", vault }))[0];
        const resp = await engine.deleteNote(fooChildNote.id);
        const changed = resp.data;
        const fooNote = (await engine.findNotesMeta({ fname: "foo", vault }))[0];
        const resp2 = await engine.deleteNote(fooNote.id);
        const changed2 = resp2.data;
        const notesInVaultAfter = await engine.findNotesMeta({ vault });
        await engine.init();
        return [
            {
                actual: lodash_1.default.size(notesInVaultBefore),
                expected: 3,
                msg: "Before has root, foo, and foo.ch1",
            },
            {
                actual: lodash_1.default.size(notesInVaultAfter),
                expected: 1,
                msg: "After has root",
            },
            {
                actual: lodash_1.default.find(changed, (ent) => ent.status === "delete" && ent.note.fname === "foo.ch1"),
                expected: true,
            },
            {
                actual: lodash_1.default.find(changed2, (ent) => ent.status === "delete" && ent.note.fname === "foo"),
                expected: true,
            },
            {
                actual: keySet.size,
                expected: 3,
            },
            {
                actual: new engine_server_1.NotesFileSystemCache({
                    cachePath,
                    logger,
                }).getCacheEntryKeys().size,
                expected: 1,
            },
        ];
    }, {
        preSetupHook: async ({ vaults, wsRoot }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "foo",
                vault: vaults[0],
                wsRoot,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "foo.ch1",
                vault: vaults[0],
                wsRoot,
                body: "",
            });
        },
    }),
};
exports.ENGINE_DELETE_PRESETS = {
    NOTES,
    SCHEMAS,
};
//# sourceMappingURL=delete.js.map