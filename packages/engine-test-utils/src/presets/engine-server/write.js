"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENGINE_WRITE_PRESETS_MULTI = exports.ENGINE_WRITE_PRESETS = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const SCHEMAS = {
    ADD_NEW_SCHEMA: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const schemaModId = common_test_utils_1.SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.fname;
        const module = (await engine.getSchema(schemaModId)).data;
        const vault = vaults[0];
        const schema = common_all_1.SchemaUtils.createFromSchemaRaw({ id: "ch2", vault });
        common_all_1.DNodeUtils.addChild(module.root, schema);
        module.schemas[schema.id] = schema;
        await engine.writeSchema(module, { metaOnly: true });
        const resp = await engine.querySchema("*");
        const fooSchema = (await engine.getSchema("foo")).data;
        return [
            {
                actual: lodash_1.default.values(fooSchema.schemas).length,
                expected: 3,
            },
            {
                actual: resp.data.length,
                expected: 2,
                msg: "query should have same results",
            },
        ];
    }, {
        preSetupHook: utils_1.setupBasic,
    }),
    ADD_NEW_MODULE_NO_CHILD: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        const vault = vaults[0];
        const schemaModNew = await common_test_utils_1.SCHEMA_PRESETS_V4.SCHEMA_SIMPLE_OTHER_NO_CHILD.create({
            vault,
            wsRoot,
            noWrite: true,
        });
        await engine.writeSchema(schemaModNew);
        const schema = (await engine.getSchema("bar")).data;
        return [
            {
                actual: lodash_1.default.values(schema.schemas).length,
                expected: 1,
            },
        ];
    }, {
        preSetupHook: utils_1.setupBasic,
    }),
    ADD_NEW_MODULE: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        const vault = vaults[0];
        const schemaModNew = await common_test_utils_1.SCHEMA_PRESETS_V4.SCHEMA_SIMPLE_OTHER.create({
            vault,
            wsRoot,
            noWrite: true,
        });
        await engine.writeSchema(schemaModNew);
        const fooSchema = (await engine.getSchema("bar")).data;
        const barSchema = (await engine.getSchema("bar")).data;
        return [
            {
                actual: lodash_1.default.values(fooSchema.schemas).length,
                expected: 2,
            },
            {
                actual: lodash_1.default.values(barSchema.schemas).length,
                expected: 2,
            },
        ];
    }, {
        preSetupHook: utils_1.setupBasic,
    }),
};
const NOTES = {
    NOTE_NO_CHILDREN: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, wsRoot, engine }) => {
        const vault = vaults[0];
        const logger = engine.logger;
        const cachePath = path_1.default.join((0, common_server_1.vault2Path)({ wsRoot, vault }), common_all_1.CONSTANTS.DENDRON_CACHE_FILE);
        const notesCache = new engine_server_1.NotesFileSystemCache({ cachePath, logger });
        const keySet = notesCache.getCacheEntryKeys();
        const noteOld = (await engine.findNotes({
            fname: "foo",
            vault,
        }))[0];
        const cnote = lodash_1.default.clone(noteOld);
        cnote.body = "new body";
        await engine.writeNote(cnote);
        const noteNew = (await engine.findNotes({
            fname: "foo",
            vault,
        }))[0];
        await engine.init();
        return [
            {
                actual: lodash_1.default.trim(noteOld.body),
                expected: "foo body",
            },
            {
                actual: lodash_1.default.trim(noteNew.body),
                expected: "new body",
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
                expected: 2,
            },
        ];
    }, {
        preSetupHook: async ({ vaults, wsRoot }) => {
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE.create({ wsRoot, vault: vaults[0] });
        },
    }),
    NOTE_UPDATE_CHILDREN: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, wsRoot, engine }) => {
        const vault = vaults[0];
        const logger = engine.logger;
        const cachePath = path_1.default.join((0, common_server_1.vault2Path)({ wsRoot, vault }), common_all_1.CONSTANTS.DENDRON_CACHE_FILE);
        const notesCache = new engine_server_1.NotesFileSystemCache({ cachePath, logger });
        const keySet = notesCache.getCacheEntryKeys();
        const noteOld = (await engine.findNotes({
            fname: "foo",
            vault,
        }))[0];
        const cnote = lodash_1.default.clone(noteOld);
        cnote.children = ["random note"];
        await engine.writeNote(cnote);
        const noteNew = (await engine.findNotes({
            fname: "foo",
            vault,
        }))[0];
        await engine.init();
        return [
            {
                actual: noteOld.children[0],
                expected: "foo.ch1",
            },
            {
                actual: noteNew.children[0],
                expected: "random note",
            },
            {
                actual: keySet.size,
                expected: 4,
            },
            {
                actual: new engine_server_1.NotesFileSystemCache({
                    cachePath,
                    logger,
                }).getCacheEntryKeys().size,
                expected: 4,
            },
        ];
    }, {
        preSetupHook: utils_1.setupBasic,
    }),
    NOTE_WITH_TARGET: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, wsRoot, engine }) => {
        const vault = vaults[0];
        const notesInVaultBefore = await engine.findNotesMeta({ vault });
        const betaNoteBefore = await engine.getNoteMeta("beta");
        const betaBackLinksBefore = betaNoteBefore.data.links.filter((link) => link.type === "backlink");
        const note = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
            wsRoot,
            vault: vaults[0],
        });
        await engine.writeNote(note);
        // Alpha is written, updating backlinks for beta
        const notesInVaultAfter = await engine.findNotesMeta({ vault });
        const betaNoteAfter = await engine.getNoteMeta("beta");
        const betaBackLinksAfter = betaNoteAfter.data.links.filter((link) => link.type === "backlink");
        return [
            { actual: betaNoteBefore.data?.links.length, expected: 1 },
            { actual: betaBackLinksBefore.length, expected: 0 },
            { actual: lodash_1.default.size(notesInVaultBefore), expected: 2 },
            { actual: lodash_1.default.size(notesInVaultAfter), expected: 3 },
            { actual: betaNoteAfter.data?.links.length, expected: 2 },
            { actual: betaBackLinksAfter.length, expected: 1 },
        ];
    }, {
        preSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
                wsRoot,
                vault: vaults[0],
            });
        },
    }),
    UPDATE_NOTE_ADD_BACKLINK: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const vault = vaults[0];
        const notesInVaultBefore = await engine.findNotesMeta({ vault });
        const betaNoteBefore = await engine.getNoteMeta("beta");
        const betaBackLinksBefore = betaNoteBefore.data.links.filter((link) => link.type === "backlink");
        const fooNote = (await engine.getNote("foo")).data;
        fooNote.body = "[[beta]]";
        await engine.writeNote(fooNote);
        // Foo is updated, updating backlinks for beta
        const notesInVaultAfter = await engine.findNotesMeta({ vault });
        const betaNoteAfter = await engine.getNoteMeta("beta");
        const betaBackLinksAfter = betaNoteAfter.data.links.filter((link) => link.type === "backlink");
        return [
            { actual: betaNoteBefore.data?.links.length, expected: 2 },
            { actual: betaBackLinksBefore.length, expected: 1 },
            { actual: lodash_1.default.size(notesInVaultBefore), expected: 4 },
            { actual: lodash_1.default.size(notesInVaultAfter), expected: 4 },
            { actual: betaNoteAfter.data?.links.length, expected: 3 },
            { actual: betaBackLinksAfter.length, expected: 2 },
        ];
    }, {
        preSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
                wsRoot,
                vault: vaults[0],
            });
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                wsRoot,
                vault: vaults[0],
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "foo",
                vault: vaults[0],
                wsRoot,
            });
        },
    }),
    UPDATE_NOTE_REMOVE_BACKLINK: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const vault = vaults[0];
        const notesInVaultBefore = await engine.findNotesMeta({ vault });
        const betaNoteBefore = await engine.getNoteMeta("beta");
        const betaBackLinksBefore = betaNoteBefore.data.links.filter((link) => link.type === "backlink");
        const alphaNote = (await engine.getNote("alpha")).data;
        alphaNote.body = "test";
        await engine.writeNote(alphaNote);
        // Alpha is updated, updating backlinks for beta
        const notesInVaultAfter = await engine.findNotesMeta({ vault });
        const betaNoteAfter = await engine.getNoteMeta("beta");
        const betaBackLinksAfter = betaNoteAfter.data.links.filter((link) => link.type === "backlink");
        return [
            { actual: betaNoteBefore.data?.links.length, expected: 2 },
            { actual: betaBackLinksBefore.length, expected: 1 },
            { actual: lodash_1.default.size(notesInVaultBefore), expected: 4 },
            { actual: lodash_1.default.size(notesInVaultAfter), expected: 4 },
            { actual: betaNoteAfter.data?.links.length, expected: 1 },
            { actual: betaBackLinksAfter.length, expected: 0 },
        ];
    }, {
        preSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
                wsRoot,
                vault: vaults[0],
            });
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                wsRoot,
                vault: vaults[0],
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "foo",
                vault: vaults[0],
                wsRoot,
            });
        },
    }),
    UPDATE_NOTE_UPDATE_BACKLINK: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const vault = vaults[0];
        const notesInVaultBefore = await engine.findNotesMeta({ vault });
        const betaNoteBefore = await engine.getNoteMeta("beta");
        const betaBackLinksBefore = betaNoteBefore.data.links.filter((link) => link.type === "backlink");
        const fooNoteBefore = await engine.getNoteMeta("foo");
        const fooBackLinksBefore = fooNoteBefore.data.links.filter((link) => link.type === "backlink");
        const alphaNote = (await engine.getNote("alpha")).data;
        alphaNote.body = "[[foo]]";
        await engine.writeNote(alphaNote);
        // Alpha is updated, updating backlinks for beta and foo
        const notesInVaultAfter = await engine.findNotesMeta({ vault });
        const betaNoteAfter = await engine.getNoteMeta("beta");
        const betaBackLinksAfter = betaNoteAfter.data.links.filter((link) => link.type === "backlink");
        const fooNoteAfter = await engine.getNoteMeta("foo");
        const fooBackLinksAfter = fooNoteAfter.data.links.filter((link) => link.type === "backlink");
        return [
            { actual: betaNoteBefore.data?.links.length, expected: 2 },
            { actual: betaBackLinksBefore.length, expected: 1 },
            { actual: fooNoteBefore.data?.links.length, expected: 0 },
            { actual: fooBackLinksBefore.length, expected: 0 },
            { actual: lodash_1.default.size(notesInVaultBefore), expected: 4 },
            { actual: lodash_1.default.size(notesInVaultAfter), expected: 4 },
            { actual: betaNoteAfter.data?.links.length, expected: 1 },
            { actual: betaBackLinksAfter.length, expected: 0 },
            { actual: fooNoteAfter.data?.links.length, expected: 1 },
            { actual: fooBackLinksAfter.length, expected: 1 },
        ];
    }, {
        preSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
                wsRoot,
                vault: vaults[0],
            });
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                wsRoot,
                vault: vaults[0],
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "foo",
                vault: vaults[0],
                wsRoot,
            });
        },
    }),
    CUSTOM_ATT: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        const vault = vaults[0];
        const logger = engine.logger;
        const cachePath = path_1.default.join((0, common_server_1.vault2Path)({ wsRoot, vault }), common_all_1.CONSTANTS.DENDRON_CACHE_FILE);
        const notesCache = new engine_server_1.NotesFileSystemCache({ cachePath, logger });
        const keySet = notesCache.getCacheEntryKeys();
        const note = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_CUSTOM_ATT.create({
            wsRoot,
            vault,
            noWrite: true,
        });
        await engine.writeNote(note);
        const noteRoot = (await engine.findNotes({
            fname: note.fname,
            vault,
        }))[0];
        await engine.init();
        return [
            {
                actual: noteRoot.fname,
                expected: "foo",
            },
            {
                actual: noteRoot.custom,
                expected: { bond: 42 },
            },
            {
                actual: keySet.size,
                expected: 1,
            },
            {
                actual: new engine_server_1.NotesFileSystemCache({
                    cachePath,
                    logger,
                }).getCacheEntryKeys().size,
                expected: 2,
            },
        ];
    }),
    CUSTOM_ATT_ADD: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const note = (await engine.findNotes({
            fname: "foo",
            vault: vaults[0],
        }))[0];
        note.custom = { bond: 43 };
        await engine.writeNote(note);
        const newNote = (await engine.findNotes({
            fname: "foo",
            vault: vaults[0],
        }))[0];
        return [
            {
                actual: lodash_1.default.omit(newNote, "contentHash"),
                expected: lodash_1.default.omit(note, "contentHash"),
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
    NEW_DOMAIN: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const vault = vaults[0];
        const noteNew = common_all_1.NoteUtils.create({
            id: "bar",
            fname: "bar",
            created: 1,
            updated: 1,
            vault: vaults[0],
        });
        await engine.writeNote(noteNew);
        const resp = await engine.queryNotes({
            qs: "bar",
            originalQS: "bar",
            vault,
        });
        const note = resp[0];
        return [
            {
                actual: note,
                expected: (await engine.getNote(note.id)).data,
                msg: "bar should be written in engine",
            },
            {
                actual: common_all_1.DNodeUtils.isRoot((await engine.getNoteMeta(note.parent)).data),
                expected: true,
            },
        ];
    }),
    MATCH_SCHEMA: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const vault = vaults[0];
        const noteNew = common_all_1.NoteUtils.create({
            fname: "foo.ch1",
            created: 1,
            updated: 1,
            vault,
        });
        await engine.writeNote(noteNew);
        return [
            {
                actual: (await engine.findNotes({
                    fname: "foo.ch1",
                    vault,
                }))[0].schema,
                expected: {
                    moduleId: "foo",
                    schemaId: "ch1",
                },
            },
        ];
    }, {
        preSetupHook: async ({ vaults, wsRoot }) => {
            await common_test_utils_1.NoteTestUtilsV4.createSchema({
                fname: "foo",
                vault: vaults[0],
                wsRoot,
                modifier: (schema) => {
                    schema.schemas["ch1"] = common_all_1.SchemaUtils.createFromSchemaRaw({
                        id: "ch1",
                        vault: vaults[0],
                    });
                    common_all_1.DNodeUtils.addChild(schema.root, schema.schemas["ch1"]);
                    return schema;
                },
            });
        },
    }),
    MATCH_SCHEMA_UPDATE_NOTE: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const vault = vaults[0];
        const updatedNote = (await engine.findNotes({
            fname: "foo.ch1",
            vault,
        }))[0];
        updatedNote.body = "new body";
        // Note already exists, make sure schema is the same
        await engine.writeNote(updatedNote);
        return [
            {
                actual: (await engine.findNotes({
                    fname: "foo.ch1",
                    vault,
                }))[0].schema,
                expected: {
                    moduleId: "foo",
                    schemaId: "ch1",
                },
            },
            {
                actual: (await engine.findNotes({
                    fname: "foo.ch1",
                    vault,
                }))[0].body,
                expected: "new body",
            },
        ];
    }, {
        preSetupHook: async ({ vaults, wsRoot }) => {
            await common_test_utils_1.NoteTestUtilsV4.createSchema({
                fname: "foo",
                vault: vaults[0],
                wsRoot,
                modifier: (schema) => {
                    schema.schemas["ch1"] = common_all_1.SchemaUtils.createFromSchemaRaw({
                        id: "ch1",
                        vault: vaults[0],
                    });
                    common_all_1.DNodeUtils.addChild(schema.root, schema.schemas["ch1"]);
                    return schema;
                },
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "foo.ch1",
                vault: vaults[0],
                wsRoot,
            });
        },
    }),
    DOMAIN_STUB: new common_test_utils_1.TestPresetEntryV4(async ({ engine, vaults, wsRoot }) => {
        const note = await common_test_utils_1.NoteTestUtilsV4.createNote({
            fname: "bar.ch1",
            vault: vaults[0],
            wsRoot,
            noWrite: true,
        });
        await engine.writeNote(note);
        const vault = vaults[0];
        const root = (await engine.findNotes({
            fname: "root",
            vault,
        }))[0];
        const bar = (await engine.findNotesMeta({
            fname: "bar",
            vault,
        }))[0];
        const child = (await engine.findNotes({
            fname: "bar.ch1",
            vault,
        }))[0];
        return [
            {
                actual: lodash_1.default.size(root.children),
                expected: 1,
                msg: "root, foo, bar",
            },
            {
                actual: lodash_1.default.pick(bar, "stub"),
                expected: { stub: true },
                msg: "bar created as stub",
            },
            {
                actual: lodash_1.default.pick(child, ["fname", "stub"]),
                expected: { fname: "bar.ch1" },
                msg: "child is not stub",
            },
        ];
    }),
    GRANDCHILD_OF_ROOT_AND_CHILD_IS_STUB: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, wsRoot, engine }) => {
        const noteNew = common_all_1.NoteUtils.create({
            fname: "bond.ch1",
            created: 1,
            updated: 1,
            vault: vaults[0],
        });
        await engine.writeNote(noteNew);
        const checkVault = await common_test_utils_1.FileTestUtils.assertInVault({
            wsRoot,
            vault: vaults[0],
            match: ["bond.ch1.md"],
            nomatch: ["bond.md"],
        });
        return [
            {
                actual: checkVault,
                expected: true,
            },
        ];
    }),
    CHILD_OF_DOMAIN: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, wsRoot, engine }) => {
        const noteNew = common_all_1.NoteUtils.create({
            fname: "foo.ch2",
            vault: vaults[0],
        });
        await engine.writeNote(noteNew);
        const checkVault = await common_test_utils_1.FileTestUtils.assertInVault({
            wsRoot,
            vault: vaults[0],
            match: ["foo.md", "foo.ch2.md"],
        });
        return [
            {
                actual: checkVault,
                expected: true,
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
    GRANDCHILD_OF_DOMAIN_AND_CHILD_IS_STUB: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, wsRoot, engine }) => {
        const noteNew = common_all_1.NoteUtils.create({
            fname: "foo.ch2.gch1",
            vault: vaults[0],
        });
        await engine.writeNote(noteNew);
        const checkVault = await common_test_utils_1.FileTestUtils.assertInVault({
            wsRoot,
            vault: vaults[0],
            match: ["foo.md", "foo.ch2.gch1.md"],
            nomatch: ["foo.ch2.md"],
        });
        return [
            {
                actual: checkVault,
                expected: true,
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
    TITLE_MATCHES_TITLE_CASE: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, wsRoot, engine }) => {
        const vault = vaults[0];
        const noteA = await common_test_utils_1.NoteTestUtilsV4.createNote({
            fname: "Upper Upper",
            vault: vaults[0],
            wsRoot,
        });
        await engine.writeNote(noteA);
        const noteB = await common_test_utils_1.NoteTestUtilsV4.createNote({
            fname: "lower lower",
            vault: vaults[0],
            wsRoot,
        });
        await engine.writeNote(noteB);
        const noteC = await common_test_utils_1.NoteTestUtilsV4.createNote({
            fname: "lower Upper",
            vault: vaults[0],
            wsRoot,
        });
        await engine.writeNote(noteC);
        return [
            {
                actual: (await engine.findNotes({
                    fname: "Upper Upper",
                    vault,
                }))[0].title,
                expected: "Upper Upper",
            },
            {
                actual: (await engine.findNotes({
                    fname: "lower lower",
                    vault,
                }))[0].title,
                expected: "Lower Lower",
            },
            {
                actual: (await engine.findNotes({
                    fname: "lower Upper",
                    vault,
                }))[0].title,
                expected: "lower Upper",
            },
        ];
    }),
    TITLE_WITH_DASH: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, wsRoot, engine }) => {
        const vault = vaults[0];
        const noteA = await common_test_utils_1.NoteTestUtilsV4.createNote({
            fname: "foo-with-dash",
            vault: vaults[0],
            wsRoot,
        });
        // this should still only get last component
        const noteB = await common_test_utils_1.NoteTestUtilsV4.createNote({
            fname: "foo.foo-with-dash",
            vault: vaults[0],
            wsRoot,
        });
        await engine.writeNote(noteA);
        await engine.writeNote(noteB);
        return [
            {
                actual: (await engine.findNotes({
                    fname: "foo-with-dash",
                    vault,
                }))[0].title,
                expected: "Foo with Dash",
            },
            {
                actual: (await engine.findNotes({
                    fname: "foo.foo-with-dash",
                    vault,
                }))[0].title,
                expected: "Foo with Dash",
            },
        ];
    }),
};
const NOTES_MULTI = {
    NEW_DOMAIN: new common_test_utils_1.TestPresetEntryV4(async ({ vaults, engine }) => {
        const vault = vaults[1];
        const noteNew = common_all_1.NoteUtils.create({
            id: "bar",
            fname: "bar",
            created: 1,
            updated: 1,
            vault: vaults[1],
        });
        await engine.writeNote(noteNew);
        const resp = await engine.queryNotes({
            qs: "bar",
            originalQS: "bar",
            vault,
        });
        const note = resp[0];
        return [
            {
                actual: note,
                expected: (await engine.getNote(note.id)).data,
                msg: "bar should be written in engine",
            },
            {
                actual: common_all_1.DNodeUtils.isRoot((await engine.getNoteMeta(note.parent)).data),
                expected: true,
            },
        ];
    }),
    NEW_DOMAIN_WITH_FULL_PATH_VAULT: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
        const vault = { ...vaults[1] };
        vault.fsPath = path_1.default.join(wsRoot, vault.fsPath);
        const noteNew = common_all_1.NoteUtils.create({
            id: "bar",
            fname: "bar",
            created: 1,
            updated: 1,
            vault: vaults[1],
        });
        await engine.writeNote(noteNew);
        const resp = await engine.queryNotes({
            qs: "bar",
            originalQS: "bar",
            vault,
        });
        const note = resp[0];
        return [
            {
                actual: note,
                expected: (await engine.getNote(note.id)).data,
                msg: "bar should be written in engine",
            },
            {
                actual: common_all_1.DNodeUtils.isRoot((await engine.getNoteMeta(note.parent)).data),
                expected: true,
            },
        ];
    }),
    ID_UPDATED: new common_test_utils_1.TestPresetEntryV4(async ({ engine }) => {
        const fooNote = (await engine.getNote("foo")).data;
        const fooUpdated = { ...fooNote };
        fooUpdated.id = "updatedID";
        const changes = await engine.writeNote(fooUpdated, {
            overrideExisting: true,
        });
        const deletedFooNote = (await engine.getNoteMeta("foo")).data;
        const newFooNote = (await engine.getNoteMeta("updatedID")).data;
        const createEntries = (0, common_all_1.extractNoteChangeEntriesByType)(changes.data, "create");
        const deleteEntries = (0, common_all_1.extractNoteChangeEntriesByType)(changes.data, "delete");
        const updateEntries = (0, common_all_1.extractNoteChangeEntriesByType)(changes.data, "update");
        const updatedParent = updateEntries.find((entry) => entry.note.fname === "root");
        const updatedChild = updateEntries.find((entry) => entry.note.fname === "foo.ch1");
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
                actual: createEntries[0].note.fname,
                expected: "foo",
                msg: "new foo note is created.",
            },
            {
                actual: createEntries[0].note.id,
                expected: "updatedID",
                msg: "created foo note's id is updatedID",
            },
            {
                actual: deleteEntries[0].note.fname,
                expected: "foo",
                msg: "old foo note is deleted.",
            },
            {
                actual: deleteEntries[0].note.id,
                expected: "foo",
                msg: "deleted old foo note's id is foo.",
            },
            {
                actual: updatedParent?.note.children,
                expected: ["bar", "updatedID"],
                msg: "updatedID should be new child of root.",
            },
            {
                actual: updatedChild?.note.parent,
                expected: "updatedID",
                msg: "updated child's parent should be updatedID.",
            },
            {
                actual: deletedFooNote,
                expected: undefined,
                msg: "Foo should be deleted",
            },
            {
                actual: newFooNote?.id,
                expected: "updatedID",
                msg: "New Foo should be created",
            },
        ];
    }, {
        preSetupHook: utils_1.setupBasic,
    }),
    BODY_UPDATED: new common_test_utils_1.TestPresetEntryV4(async ({ engine }) => {
        const fooNote = (await engine.getNote("foo")).data;
        const fooUpdated = { ...fooNote };
        fooUpdated.body = "updatedBody";
        const changes = await engine.writeNote(fooUpdated);
        const createEntries = (0, common_all_1.extractNoteChangeEntriesByType)(changes.data, "create");
        const deleteEntries = (0, common_all_1.extractNoteChangeEntriesByType)(changes.data, "delete");
        const updateEntries = (0, common_all_1.extractNoteChangeEntriesByType)(changes.data, "update");
        return [
            {
                actual: updateEntries.length,
                expected: 1,
                msg: "1 update should happen.",
            },
            {
                actual: deleteEntries.length,
                expected: 0,
                msg: "0 delete should happen.",
            },
            {
                actual: createEntries.length,
                expected: 0,
                msg: "0 creates should happen.",
            },
            {
                actual: updateEntries[0].note.fname,
                expected: "foo",
                msg: "foo note is updated.",
            },
            {
                actual: updateEntries[0].note.body,
                expected: "updatedBody",
                msg: "updated foo note's body is updatedBody",
            },
        ];
    }, {
        preSetupHook: utils_1.setupBasic,
    }),
};
exports.ENGINE_WRITE_PRESETS = {
    NOTES,
    SCHEMAS,
};
exports.ENGINE_WRITE_PRESETS_MULTI = {
    NOTES: NOTES_MULTI,
    SCHEMAS: {},
};
//# sourceMappingURL=write.js.map