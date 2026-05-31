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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeTestUtilsV2 = exports.EngineTestUtilsV2 = exports.EngineTestUtilsV3 = exports.EngineTestUtilsV4 = void 0;
exports.filterDotFiles = filterDotFiles;
exports.getLogFilePath = getLogFilePath;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
__exportStar(require("./fileUtils"), exports);
__exportStar(require("./noteUtils"), exports);
__exportStar(require("./presets"), exports);
__exportStar(require("./types"), exports);
__exportStar(require("./utils"), exports);
__exportStar(require("./utilsv2"), exports);
function filterDotFiles(filenames) {
    return filenames.filter((filename) => !/(^|\/)\.[^\/\.]/g.test(filename));
}
function getLogFilePath(_name) {
    // Placing these in the system temp directory proved difficult, as we both
    // want to generate paths here and pass them from npm in the various LOG_DST
    // environment variables. There's no consistent environment variable we can
    // use for this:
    //
    // * TMPDIR is set for some POSIX-likes, e.g. macOS, but not Linux.
    // * TEMP is set on Windows.
    // @ts-ignore
    //const rootDir = path.dirname(path.dirname(path.dirname(__dirname)));
    //return path.join(rootDir, "logs", `${name}.log`);
    return "stdout";
}
class EngineTestUtilsV4 {
    /**
     * Setup a workspace with three vaults
     * The third vault has a different path than name
     */
    static async setupWS(opts) {
        const wsRoot = opts?.wsRoot || (0, common_server_1.tmpDir)().name;
        const defaultVaults = opts?.singleVault
            ? ["vault1"]
            : ["vault1", "vault2", "vault3"];
        const setupVaultsOpts = opts?.setupVaultsOpts ||
            defaultVaults.map((ent) => ({
                vault: {
                    fsPath: ent,
                    name: ent === "vault3" ? "vaultThree" : undefined,
                },
                preSetupHook: async ({ vpath, vault, wsRoot }) => {
                    const rootModule = common_all_1.SchemaUtils.createRootModule({
                        created: 1,
                        updated: 1,
                        vault,
                    });
                    await (0, common_server_1.schemaModuleOpts2File)(rootModule, vpath, "root");
                    const rootNote = await common_all_1.NoteUtils.createRoot({
                        created: 1,
                        updated: 1,
                        vault,
                    });
                    await (0, common_server_1.note2File)({ note: rootNote, vault, wsRoot });
                },
            }));
        const vaults = await Promise.all(setupVaultsOpts.flatMap((ent) => {
            return this.setupVault({ ...ent, wsRoot });
        }));
        vaults.map((ent) => {
            if (lodash_1.default.isUndefined(ent.name)) {
                delete ent.name;
            }
        });
        return { wsRoot, vaults };
    }
    static async setupVault(opts) {
        const { wsRoot, vault } = opts;
        const vpath = (0, common_server_1.resolvePath)(vault.fsPath, wsRoot);
        fs_extra_1.default.ensureDirSync(vpath);
        if (opts.preSetupHook) {
            await opts.preSetupHook({ wsRoot, vault, vpath });
        }
        return opts.vault;
    }
    /**
     * Check disk for note
     * @param opts
     * @returns
     */
    static checkVault(opts) {
        const { match, nomatch } = opts;
        const vpath = (0, common_server_1.vault2Path)(opts);
        const content = fs_extra_1.default.readdirSync(vpath).join("\n");
        return utils_1.AssertUtils.assertInString({ body: content, match, nomatch });
    }
}
exports.EngineTestUtilsV4 = EngineTestUtilsV4;
/**
 * Legacy Multi-vault setup
 */
class EngineTestUtilsV3 {
    static async setupWS(opts) {
        const wsRoot = (0, common_server_1.tmpDir)().name;
        const vaults = await this.setupVaults({ ...opts, wsRoot });
        return { wsRoot, vaults };
    }
    static async setupVaults(opts) {
        const { vaults } = lodash_1.default.defaults(opts, {
            vaults: [
                [(0, common_server_1.tmpDir)().name, "main"],
                [(0, common_server_1.tmpDir)().name, "other"],
            ].map(([vpath, vname]) => {
                return {
                    fsPath: path_1.default.relative(opts.wsRoot, vpath),
                    name: vname,
                };
            }),
        });
        //     {
        //       fsPath: tmpDir().name,
        //       name: "main",
        //     },
        //     {
        //       fsPath: tmpDir().name,
        //       name: "other",
        //     },
        //   ],
        // });
        const cb = [opts.initVault1, opts.initVault2];
        await Promise.all(vaults.map(async (ent, idx) => {
            const { fsPath } = ent;
            return EngineTestUtilsV2.setupVault({
                ...opts,
                vaultDir: path_1.default.join(opts.wsRoot, fsPath),
                initDirCb: cb[idx],
            });
        }));
        return vaults;
    }
}
exports.EngineTestUtilsV3 = EngineTestUtilsV3;
class EngineTestUtilsV2 {
    static async setupWS(opts) {
        const { initDirCb, withAssets, withGit } = lodash_1.default.defaults(opts, {
            withAssets: true,
            withGit: true,
        });
        let wsRoot = opts.wsRoot ? opts.wsRoot : (0, common_server_1.tmpDir)().name;
        let vaultDir = opts.vaultDir ? opts.vaultDir : path_1.default.join(wsRoot, "vault");
        await fs_extra_1.default.ensureDir(vaultDir);
        await EngineTestUtilsV2.setupVault({
            vaultDir,
            initDirCb,
            withAssets,
            withGit,
        });
        let vaults = [vaultDir];
        return {
            wsRoot,
            vaults,
        };
    }
    static async setupVault(opts) {
        const { withAssets, withGit } = opts;
        let vaultDir = opts.vaultDir ? opts.vaultDir : (0, common_server_1.tmpDir)().name;
        if (opts?.initDirCb) {
            await opts.initDirCb(vaultDir);
        }
        if (withAssets) {
            const assetsDir = path_1.default.join(vaultDir, "assets");
            await fs_extra_1.default.ensureDir(assetsDir);
            await fs_extra_1.default.ensureFile(path_1.default.join(assetsDir, "foo.jpg"));
        }
        if (withGit) {
            fs_extra_1.default.ensureDirSync(path_1.default.join(vaultDir, ".git"));
        }
        return vaultDir;
    }
}
exports.EngineTestUtilsV2 = EngineTestUtilsV2;
// === Legacy, deprecate
class NodeTestUtilsV2 {
    static createNoteProps = async (opts) => {
        const { rootName, vaultPath, props } = opts;
        const vault = { fsPath: vaultPath };
        const foo = common_all_1.NoteUtils.create({
            fname: `${rootName}`,
            id: `${rootName}`,
            created: 1,
            updated: 1,
            children: ["ch1"],
            ...props,
            vault,
        });
        const ch1 = common_all_1.NoteUtils.create({
            fname: `${rootName}.ch1`,
            id: `${rootName}.ch1`,
            created: 1,
            updated: 1,
            vault,
            ...props,
        });
        await (0, common_server_1.note2File)({
            note: foo,
            vault: { fsPath: vaultPath },
            wsRoot: "fake_root",
        });
        await (0, common_server_1.note2File)({
            note: ch1,
            vault: { fsPath: vaultPath },
            wsRoot: "fake_root",
        });
        return { foo, ch1 };
    };
    static createNote = async (opts) => {
        const cleanOpts = lodash_1.default.defaults(opts, {
            withBody: true,
            noteProps: [],
        });
        const defaultOpts = {
            created: 1,
            updated: 1,
        };
        const n = cleanOpts.noteProps;
        const body = cleanOpts.withBody ? n.fname + " body" : "";
        const vault = { fsPath: cleanOpts.vaultDir };
        const _n = common_all_1.NoteUtils.create({ ...defaultOpts, body, ...n, vault });
        await (0, common_server_1.note2File)({
            note: _n,
            vault: { fsPath: cleanOpts.vaultDir },
            wsRoot: "fake_root",
        });
        return _n;
    };
    static createNotes = async (opts) => {
        const cleanOpts = lodash_1.default.defaults(opts, {
            withBody: true,
            noteProps: [],
        });
        const vault = { fsPath: cleanOpts.vaultPath };
        const defaultOpts = {
            created: 1,
            updated: 1,
        };
        const rootNote = await common_all_1.NoteUtils.createRoot({
            ...defaultOpts,
            vault,
        });
        const out = {
            root: rootNote,
        };
        await Promise.all(cleanOpts.noteProps.map(async (n) => {
            const body = cleanOpts.withBody ? n.fname + " body" : "";
            const _n = common_all_1.NoteUtils.create({ ...defaultOpts, body, ...n, vault });
            common_all_1.DNodeUtils.addChild(rootNote, _n);
            if (cleanOpts.vaultPath) {
                await (0, common_server_1.note2File)({
                    note: _n,
                    vault: { fsPath: cleanOpts.vaultPath },
                    wsRoot: "fake_root",
                });
            }
            out[_n.id] = _n;
            return;
        }));
        await (0, common_server_1.note2File)({
            note: rootNote,
            vault: { fsPath: cleanOpts.vaultPath },
            wsRoot: "fake_root",
        });
        return out;
    };
    static createSchema = async (opts) => {
        const { vaultDir, schemas, fname } = opts;
        const schema = common_all_1.SchemaUtils.createModuleProps({
            fname,
            vault: { fsPath: vaultDir },
        });
        schemas.forEach((s) => {
            schema.schemas[s.id] = s;
        });
        await (0, common_server_1.schemaModuleProps2File)(schema, vaultDir, fname);
        return schema;
    };
    static createSchemas = async (opts) => {
        const cleanOpts = lodash_1.default.defaults(opts, {
            schemaMO: [],
        });
        const { vaultPath, schemaMO } = cleanOpts;
        const vault = { fsPath: vaultPath };
        const rootModule = common_all_1.SchemaUtils.createRootModule({
            created: 1,
            updated: 1,
            vault,
        });
        await (0, common_server_1.schemaModuleOpts2File)(rootModule, vaultPath, "root");
        await Promise.all(schemaMO.map(async (ent) => {
            const [module, fname] = ent;
            if (vaultPath) {
                await (0, common_server_1.schemaModuleOpts2File)(module, vaultPath, fname);
            }
        }));
    };
    static createSchemaModuleOpts = async (opts) => {
        const { vaultDir, rootName, rootOpts } = opts;
        const vault = { fsPath: vaultDir };
        const schema = common_all_1.SchemaUtils.createFromSchemaOpts({
            fname: `${rootName}`,
            id: `${rootName}`,
            parent: "root",
            created: 1,
            updated: 1,
            children: ["ch1"],
            vault,
            ...rootOpts,
        });
        const ch1 = common_all_1.SchemaUtils.createFromSchemaOpts({
            fname: `${rootName}`,
            vault,
            id: "ch1",
            created: 1,
            updated: 1,
        });
        common_all_1.DNodeUtils.addChild(schema, ch1);
        const schemaModuleProps = [
            [
                common_all_1.SchemaUtils.createModule({
                    version: 1,
                    schemas: [schema, ch1],
                }),
                `${rootName}`,
            ],
        ];
        await Promise.all(schemaModuleProps.map((ent) => {
            const [module, fname] = ent;
            return (0, common_server_1.schemaModuleOpts2File)(module, vaultDir, fname);
        }));
        return schemaModuleProps[0][0];
    };
    static normalizeNote({ note }) {
        return {
            ...lodash_1.default.omit(note, ["body", "parent", "id", "vault"]),
            body: lodash_1.default.trim(note.body),
        };
    }
    static normalizeNotes(notes) {
        if (!lodash_1.default.isArray(notes)) {
            notes = lodash_1.default.values(notes);
        }
        return notes.map((note) => {
            return NodeTestUtilsV2.normalizeNote({ note });
            //return { ..._.omit(note, ["body", "parent", "id"]), body: _.trim(note.body) };
        });
    }
}
exports.NodeTestUtilsV2 = NodeTestUtilsV2;
//# sourceMappingURL=index.js.map