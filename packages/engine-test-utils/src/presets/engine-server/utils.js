"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENGINE_HOOKS_MULTI = exports.ENGINE_HOOKS = exports.ENGINE_HOOKS_BASE = exports.setupRefs = exports.setupLinksWithVaultBase = exports.setupMultiVaultSameFname = exports.setupLinksBase = exports.setupLinksMulti = exports.setupLinks = exports.setupEmpty = exports.setupSchemaPresetWithNamespaceTemplate = exports.setupSchemaPresetWithNamespaceTemplateMulti = exports.setupSchemaPresetWithNamespaceTemplateBase = exports.setupInlineSchema = exports.setupSchemaWithExpansion = exports.setupSchemaWithIncludeOfDiamond = exports.setupSchemaWithDiamondAndParentNamespace = exports.setupSchemaPreseet = exports.setupSchemaWithDiamondGrandchildren = exports.setupNoteRefRecursive = exports.setupBasicMulti = exports.setupJournals = exports.setupHierarchyForLookupTests = exports.setupBasic = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const common_server_1 = require("@dendronhq/common-server");
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
/**
 * Notes created:
 *   - vault1:
 *     - foo
 *     - foo.ch1
 *   - vault2:
 *     - bar
 */
const setupBasic = async ({ vaults, wsRoot, extra, }) => {
    const vault = vaults[0];
    // TODO: HACK
    let props;
    if (extra?.idv2) {
        props = { id: "foo-id" };
    }
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE.create({
        vault,
        wsRoot,
        props,
    });
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.create({
        vault,
        wsRoot,
    });
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE_OTHER.create({
        vault,
        wsRoot,
    });
    await common_test_utils_1.SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.create({ vault, wsRoot });
};
exports.setupBasic = setupBasic;
/**
 <pre>
 /vault1
 ├── bar.ch1.gch1.ggch1.md
 ├── bar.ch1.gch1.md
 ├── bar.ch1.md
 ├── bar.md
 ├── foo.ch1.gch1.ggch1.md
 ├── foo.ch1.gch1.md
 ├── foo.ch1.gch2.md
 ├── foo.ch1.md
 ├── foo.ch2.md
 ├── foo.md
 ├── root.md
 └── root.schema.yml

/vault2
 ├── root.md
 └── root.schema.yml

 /vault3
 ├── root.md
 └── root.schema.yml
</pre>
 * */
const setupHierarchyForLookupTests = async ({ vaults, wsRoot, }) => {
    const opts = {
        vault: vaults[0],
        wsRoot,
    };
    const fnames = [
        "foo",
        "foo.ch1",
        "foo.ch1.gch1",
        "foo.ch1.gch1.ggch1",
        "foo.ch1.gch2",
        "foo.ch2",
        "bar",
        "bar.ch1",
        "bar.ch1.gch1",
        "bar.ch1.gch1.ggch1",
        "goo.ends-with-ch1.no-ch1-by-itself",
    ];
    for (const fname of fnames) {
        await (0, common_test_utils_1.CreateNoteFactory)({ fname, body: `${fname} body` }).create(opts);
    }
};
exports.setupHierarchyForLookupTests = setupHierarchyForLookupTests;
const setupJournals = async ({ vaults, wsRoot, }) => {
    const vault = vaults[0];
    const names = [
        "daily",
        "daily.journal",
        "daily.journal.2020",
        "daily.journal.2020.07",
        "daily.journal.2020.07.01.one",
        "daily.journal.2020.07.05.two",
    ];
    return Promise.all(names.map((fname) => {
        return common_test_utils_1.NoteTestUtilsV4.createNote({
            wsRoot,
            vault,
            fname,
        });
    }));
};
exports.setupJournals = setupJournals;
// Workspace will look like:
// .
// ├── dendron.code-workspace
// ├── dendron.yml
// ├── vault1
// │   ├── foo.ch1.md
// │   ├── foo.md
// │   ├── foo.schema.yml
// │   ├── root.md
// │   └── root.schema.yml
// ├── vault2
// │   ├── bar.md
// │   ├── root.md
// │   └── root.schema.yml
// └── vault3
//     ├── root.md
//     └── root.schema.yml
const setupBasicMulti = async ({ vaults, wsRoot, }) => {
    const vault1 = lodash_1.default.find(vaults, { fsPath: "vault1" });
    const vault2 = lodash_1.default.find(vaults, { fsPath: "vault2" });
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE.create({
        vault: vault1,
        wsRoot,
    });
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.create({
        vault: vault1,
        wsRoot,
    });
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE_OTHER.create({
        vault: vault2,
        wsRoot,
    });
    await common_test_utils_1.SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.create({ vault: vault1, wsRoot });
};
exports.setupBasicMulti = setupBasicMulti;
/**
 *
 * - foo
 * ```
 * ![[foo.one]]
 * ```
 *
 * - foo.one
 * ```
 * # Foo.One
 * ![[foo.two]]
 * Regular wikilink: [[foo.two]]
 * ```
 *
 * - foo.two
 * ```
 * # Foo.Two
 * blah
 * ```
 *
 *
 */
const setupNoteRefRecursive = async ({ vaults, wsRoot, extra, }) => {
    const vault = vaults[0];
    // TODO: HACK
    let props;
    if (extra?.idv2) {
        props = { id: "foo-id" };
    }
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE.create({
        vault,
        wsRoot,
        body: "![[foo.one]]",
        props,
    });
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        vault,
        fname: "foo.one",
        body: ["# Foo.One", `![[foo.two]]`, `Regular wikilink: [[foo.two]]`].join("\n"),
        wsRoot,
        props: {
            id: "foo.one-id",
        },
    });
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        vault,
        fname: "foo.two",
        body: ["# Foo.Two", `blah`].join("\n"),
        wsRoot,
    });
};
exports.setupNoteRefRecursive = setupNoteRefRecursive;
/**
 * Diamond schema is laid out such that:
 *    bar
 *   /   \
 * ch1   ch2
 *   \   /
 *    gch
 * */
const setupSchemaWithDiamondGrandchildren = async (opts) => {
    await (0, exports.setupBasic)(opts);
    const { wsRoot, vaults } = opts;
    const vault = vaults[0];
    common_test_utils_1.NoteTestUtilsV4.createSchema({
        fname: "bar",
        wsRoot,
        vault,
        modifier: (schema) => {
            const schemas = [
                common_all_1.SchemaUtils.createFromSchemaOpts({
                    id: "bar",
                    parent: "root",
                    fname: "bar",
                    children: ["ch1", "ch2"],
                    vault,
                }),
                common_all_1.SchemaUtils.createFromSchemaRaw({
                    id: "ch1",
                    children: ["gch"],
                    vault,
                }),
                common_all_1.SchemaUtils.createFromSchemaRaw({
                    id: "ch2",
                    children: ["gch"],
                    vault,
                }),
                common_all_1.SchemaUtils.createFromSchemaRaw({
                    id: "gch",
                    template: { id: "template.gch", type: "note" },
                    vault,
                }),
            ];
            schemas.map((s) => {
                schema.schemas[s.id] = s;
            });
            return schema;
        },
    });
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        wsRoot,
        body: "gch template",
        fname: "template.gch",
        vault,
    });
};
exports.setupSchemaWithDiamondGrandchildren = setupSchemaWithDiamondGrandchildren;
const setupSchemaPreseet = async (opts) => {
    await (0, exports.setupBasic)(opts);
    const { wsRoot, vaults } = opts;
    const vault = vaults[0];
    common_test_utils_1.NoteTestUtilsV4.createSchema({
        fname: "bar",
        wsRoot,
        vault,
        modifier: (schema) => {
            const schemas = [
                common_all_1.SchemaUtils.createFromSchemaOpts({
                    id: "bar",
                    parent: "root",
                    fname: "bar",
                    children: ["ch1", "ch2"],
                    vault,
                }),
                common_all_1.SchemaUtils.createFromSchemaRaw({
                    id: "ch1",
                    template: { id: "bar.template.ch1", type: "note" },
                    vault,
                }),
                common_all_1.SchemaUtils.createFromSchemaRaw({
                    id: "ch2",
                    template: { id: "bar.template.ch2", type: "note" },
                    namespace: true,
                    vault,
                }),
            ];
            schemas.map((s) => {
                schema.schemas[s.id] = s;
            });
            return schema;
        },
    });
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        wsRoot,
        body: "ch1 template",
        fname: "bar.template.ch1",
        props: { tags: "tag-foo" },
        vault,
    });
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        wsRoot,
        body: "ch2 template",
        fname: "bar.template.ch2",
        vault,
    });
};
exports.setupSchemaPreseet = setupSchemaPreseet;
/**
 * Diamond schema is laid out such that:
 *    bar
 *   /   \
 * ch1   ch2 (namespace: true)
 *   \   /
 *    gch
 * */
const setupSchemaWithDiamondAndParentNamespace = async (opts) => {
    await (0, exports.setupBasic)(opts);
    const { wsRoot, vaults } = opts;
    const vault1 = vaults[0];
    const withDiamond = path_1.default.join((0, common_server_1.resolvePath)(vault1.fsPath, wsRoot), "withDiamond.schema.yml");
    fs.writeFileSync(withDiamond, `
version: 1
schemas:
  - id: withDiamond
    children:
      - ch1
      - ch2
    title: withDiamond
    parent: root
  - id: ch1
    children:
      - gch
  - id: ch2
    namespace: true
    children:
      - gch
  - id: gch
    template: template.test
`);
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        wsRoot,
        body: "Template text",
        fname: "template.test",
        vault: vault1,
    });
};
exports.setupSchemaWithDiamondAndParentNamespace = setupSchemaWithDiamondAndParentNamespace;
/**
 * Sets up schema which includes a schema that has Diamond grandchildren
 *
 * */
const setupSchemaWithIncludeOfDiamond = async (opts) => {
    await (0, exports.setupBasic)(opts);
    const { wsRoot, vaults } = opts;
    const vault1 = vaults[0];
    const withDiamond = path_1.default.join((0, common_server_1.resolvePath)(vault1.fsPath, wsRoot), "withDiamond.schema.yml");
    fs.writeFileSync(withDiamond, `
version: 1
schemas:
  - id: withDiamond
    children:
      - ch1
      - ch2
    title: withDiamond
    parent: root
  - id: ch1
    children:
      - gch
  - id: ch2
    children:
      - gch
  - id: gch
    template: template.test
`);
    const includesDiamondPath = path_1.default.join((0, common_server_1.resolvePath)(vault1.fsPath, wsRoot), "includesDiamond.schema.yml");
    fs.writeFileSync(includesDiamondPath, `
version: 1

imports:
  - withDiamond

schemas:
  - id: includesDiamond
    parent: root
    namespace: true
    children:
      - a-ch1
      - a-ch2
  - id: a-ch1
    children:
      - withDiamond.gch
  - id: a-ch2
    children:
      - withDiamond.gch
`);
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        wsRoot,
        body: "Template text",
        fname: "template.test",
        vault: vault1,
    });
};
exports.setupSchemaWithIncludeOfDiamond = setupSchemaWithIncludeOfDiamond;
/**
 * Sets up workspace which has a schema that uses YAML expansion syntax ('<<' type of expansion). */
const setupSchemaWithExpansion = async (opts) => {
    await (0, exports.setupBasic)(opts);
    const { wsRoot, vaults } = opts;
    const vault1 = vaults[0];
    const withExpansion = path_1.default.join((0, common_server_1.resolvePath)(vault1.fsPath, wsRoot), "withExpansion.schema.yml");
    fs.writeFileSync(withExpansion, `
_anchors:
  projects: &projects
    title: projects
    parent: root
    template: templates.projects
    
version: 1
imports: []

schemas:
  - <<: *projects
    id: proj
  - <<: *projects
    id: op
`);
    const inlineSchemaPath = path_1.default.join((0, common_server_1.resolvePath)(vault1.fsPath, wsRoot), "includesExpansion.schema.yml");
    fs.writeFileSync(inlineSchemaPath, `
version: 1

imports:
  - withExpansion

schemas:
  - id: includer
    parent: root
    namespace: true
    children:
      - withExpansion.proj
`);
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        wsRoot,
        body: "Template text",
        fname: "templates.projects",
        vault: vault1,
    });
};
exports.setupSchemaWithExpansion = setupSchemaWithExpansion;
const setupInlineSchema = async (opts) => {
    await (0, exports.setupBasic)(opts);
    const { wsRoot, vaults } = opts;
    const vault1 = vaults[0];
    const inlineSchemaPath = path_1.default.join((0, common_server_1.resolvePath)(vault1.fsPath, wsRoot), "inlined.schema.yml");
    fs.writeFileSync(inlineSchemaPath, `
version: 1
imports: 
  - foo
schemas:
  - id: plain_schema
    parent: root
    children:
      - plain_schema_child
      - daily
  - id: daily
    parent: root
    children:
      - id: journal
        children:
          - pattern: "[0-2][0-9][0-9][0-9]"
            title: year
            id: year_id
            children:
              - pattern: "[0-1][0-9]"
                children:
                  - pattern: "[0-3][0-9]"
                    title: day
                    template:
                      id: templates.day
                      type: note
  - id: id_with_imported_child
    children:
      - foo.foo
  - id: with_child_that_has_untyped_template
    children:
      - pattern: has_untyped_template
        template: templates.untyped
  - id: plain_schema_child
    template: templates.example
`);
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        wsRoot,
        body: "Template text",
        fname: "templates.day",
        vault: vault1,
    });
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        wsRoot,
        body: "Template text",
        fname: "templates.example",
        vault: vault1,
    });
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        wsRoot,
        body: "Untyped template",
        fname: "templates.untyped",
        vault: vault1,
    });
};
exports.setupInlineSchema = setupInlineSchema;
const setupSchemaPresetWithNamespaceTemplateBase = async (opts) => {
    await (0, exports.setupBasic)(opts);
    const { wsRoot, vaults } = opts;
    const vault1 = vaults[0];
    const vault2 = vaults[1];
    common_test_utils_1.NoteTestUtilsV4.createSchema({
        fname: "journal",
        wsRoot,
        vault: vault1,
        modifier: (schema) => {
            const schemas = [
                common_all_1.SchemaUtils.createFromSchemaOpts({
                    id: "daily",
                    parent: "root",
                    fname: "daily",
                    children: ["journal"],
                    vault: vault1,
                }),
                common_all_1.SchemaUtils.createFromSchemaRaw({
                    id: "journal",
                    children: ["year"],
                    vault: vault1,
                }),
                common_all_1.SchemaUtils.createFromSchemaRaw({
                    id: "year",
                    pattern: "[0-2][0-9][0-9][0-9]",
                    children: ["month"],
                    vault: vault1,
                }),
                common_all_1.SchemaUtils.createFromSchemaRaw({
                    id: "month",
                    pattern: "[0-9][0-9]",
                    children: ["day"],
                    vault: vault1,
                }),
                common_all_1.SchemaUtils.createFromSchemaRaw({
                    id: "day",
                    pattern: "[0-9][0-9]",
                    namespace: true,
                    template: {
                        id: "journal.template",
                        type: "note",
                    },
                    vault: vault2,
                }),
            ];
            schemas.map((s) => {
                schema.schemas[s.id] = s;
            });
            return schema;
        },
    });
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        wsRoot,
        body: "Journal",
        fname: "daily",
        vault: vault2,
    });
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        wsRoot,
        body: "Template text",
        fname: "journal.template",
        vault: vault2,
    });
};
exports.setupSchemaPresetWithNamespaceTemplateBase = setupSchemaPresetWithNamespaceTemplateBase;
const setupSchemaPresetWithNamespaceTemplateMulti = async (opts) => {
    return (0, exports.setupSchemaPresetWithNamespaceTemplateBase)(opts);
};
exports.setupSchemaPresetWithNamespaceTemplateMulti = setupSchemaPresetWithNamespaceTemplateMulti;
const setupSchemaPresetWithNamespaceTemplate = async (opts) => {
    const vault = opts.vaults[0];
    return (0, exports.setupSchemaPresetWithNamespaceTemplateBase)({
        ...opts,
        vaults: [vault, vault],
    });
};
exports.setupSchemaPresetWithNamespaceTemplate = setupSchemaPresetWithNamespaceTemplate;
const setupEmpty = async ({ vaults, wsRoot }) => {
    const vault = vaults[0];
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_EMPTY.create({
        vault,
        wsRoot,
    });
};
exports.setupEmpty = setupEmpty;
const setupLinks = async ({ vaults, wsRoot }) => {
    return (0, exports.setupLinksBase)({ wsRoot, vaults: [vaults[0], vaults[0]] });
};
exports.setupLinks = setupLinks;
const setupLinksMulti = async ({ vaults, wsRoot, }) => {
    return (0, exports.setupLinksBase)({ wsRoot, vaults });
};
exports.setupLinksMulti = setupLinksMulti;
const setupLinksBase = async ({ vaults, wsRoot, }) => {
    const vault1 = vaults[0];
    const vault2 = vaults[1];
    // create note with wikilink
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
        vault: vault1,
        wsRoot,
    });
    // create note with relative wikilink
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
        vault: vault2,
        wsRoot,
    });
    // create note with labeld wikilink
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        wsRoot,
        body: "[[some label|beta]]",
        fname: "omega",
        vault: vault1,
    });
};
exports.setupLinksBase = setupLinksBase;
/** Creates 2 notes with same fname in 2 different vaults, and a note named
 * "test" in second vault with both valid and invalid wikilinks.
 *
 * See [[scratch.2021.07.15.205433.inconsistent-ref-and-link-behavior]] for the
 * invalid behaviors that this is intended to test for. The only difference is
 * that vaultThree is the real vault and vault3 is the bad one.
 *
 * @returns the test note with the wikilinks.
 */
const setupMultiVaultSameFname = async ({ vaults, wsRoot, }) => {
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        fname: "eggs",
        vault: vaults[0],
        body: "vault 0",
        wsRoot,
        props: { id: "eggs-vault-0" },
    });
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        fname: "eggs",
        vault: vaults[1],
        body: "vault 1",
        wsRoot,
        props: { id: "eggs-vault-1" },
    });
    return common_test_utils_1.NoteTestUtilsV4.createNote({
        fname: "test",
        vault: vaults[1],
        body: [
            "[[eggs]]", // 7
            "[[dendron://vault1/eggs]]", // 8
            "[[dendron://vault2/eggs]]", // 9
            "[[dendron://vaultThree/eggs]]", // 10
            "[[dendron://vault3/eggs]]", // 11
            "",
            "the test note",
        ].join("\n"),
        wsRoot,
    });
};
exports.setupMultiVaultSameFname = setupMultiVaultSameFname;
const setupLinksWithVaultBase = async ({ vaults, wsRoot, }) => {
    await (0, exports.setupLinksBase)({ vaults, wsRoot });
};
exports.setupLinksWithVaultBase = setupLinksWithVaultBase;
const setupRefs = async ({ vaults, wsRoot }) => {
    const vault = vaults[0];
    // create note with note reference
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_NOTE_REF_SIMPLE.create({
        vault,
        wsRoot,
    });
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_NOTE_REF_SIMPLE_TARGET.create({
        vault,
        wsRoot,
    });
    // create note with block reference
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_BLOCK_REF_SIMPLE.create({
        vault,
        wsRoot,
    });
    // create note with block range reference
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_BLOCK_RANGE_REF_SIMPLE.create({
        vault,
        wsRoot,
    });
    // create note with reference offset
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_REF_OFFSET.create({
        vault,
        wsRoot,
    });
    // create note with wildcard child reference
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_WILDCARD_CHILD_REF.create({
        vault,
        wsRoot,
    });
    // create note with wildcard header reference
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_WILDCARD_HEADER_REF.create({
        vault,
        wsRoot,
    });
    // create note with complex wildcard reference
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_WILDCARD_COMPLEX.create({
        vault,
        wsRoot,
    });
    // create note with fm variables
    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_FM_VARIABLES.create({
        vault,
        wsRoot,
    });
};
exports.setupRefs = setupRefs;
exports.ENGINE_HOOKS_BASE = {
    WITH_LINKS: exports.setupLinksBase,
};
exports.ENGINE_HOOKS = {
    setupBasic: exports.setupBasic,
    setupHierarchyForLookupTests: exports.setupHierarchyForLookupTests,
    setupSchemaPreseet: exports.setupSchemaPreseet,
    setupSchemaWithDiamondGrandchildren: exports.setupSchemaWithDiamondGrandchildren,
    setupSchemaWithIncludeOfDiamond: exports.setupSchemaWithIncludeOfDiamond,
    setupSchemaWithDiamondAndParentNamespace: exports.setupSchemaWithDiamondAndParentNamespace,
    setupSchemaPresetWithNamespaceTemplate: exports.setupSchemaPresetWithNamespaceTemplate,
    setupInlineSchema: exports.setupInlineSchema,
    setupSchemaWithExpansion: exports.setupSchemaWithExpansion,
    setupNoteRefRecursive: exports.setupNoteRefRecursive,
    setupJournals: exports.setupJournals,
    setupEmpty: exports.setupEmpty,
    setupLinks: exports.setupLinks,
    setupRefs: exports.setupRefs,
};
exports.ENGINE_HOOKS_MULTI = {
    setupBasicMulti: exports.setupBasicMulti,
    setupLinksMulti: exports.setupLinksMulti,
    setupSchemaPresetWithNamespaceTemplateMulti: exports.setupSchemaPresetWithNamespaceTemplateMulti,
    setupMultiVaultSameFname: exports.setupMultiVaultSameFname,
};
//# sourceMappingURL=utils.js.map