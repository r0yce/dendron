"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteTestUtilsV4 = exports.TestNoteFactory = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
/**
 * Class for simplifying creation of multiple notes for tests by being
 * able to specify defaults upon construction.
 *
 * Example usage:
 * <pre>
 *    const noteFactory = TestNoteFactory.defaultUnitTestFactory();
 *
 *    const note = await noteFactory.createForFName("your-fname");
 * </pre>
 *
 * */
class TestNoteFactory {
    static DEFAULT_VAULT = { fsPath: "/tmp/ws/v1" };
    static DEFAULT_WS_ROOT = "/tmp/ws";
    _defaults;
    static defaultUnitTestFactory() {
        return new TestNoteFactory({
            vault: this.DEFAULT_VAULT,
            noWrite: true,
            wsRoot: this.DEFAULT_WS_ROOT,
        });
    }
    constructor(defaults) {
        this._defaults = {
            ...defaults,
        };
    }
    async createForFName(fname) {
        return NoteTestUtilsV4.createNote({
            fname,
            ...this._defaults,
        });
    }
    async createForFNameWithEngine(fname, props) {
        return NoteTestUtilsV4.createNoteWithEngine({
            fname,
            ...this._defaults,
            ...props,
        });
    }
    async createNoteInputWithFNames(fnames) {
        return Promise.all(fnames.map((name) => this.createNoteInputWithFName(name)));
    }
    createNoteInputWithFName(fname) {
        return NoteTestUtilsV4.createNotePropsInput({
            fname,
            ...this._defaults,
        });
    }
    async createForFNames(fnames) {
        return Promise.all(fnames.map((name) => this.createForFName(name)));
    }
}
exports.TestNoteFactory = TestNoteFactory;
class NoteTestUtilsV4 {
    static createSchema = async (opts) => {
        const { fname, vault, noWrite, wsRoot } = lodash_1.default.defaults(opts, {
            noWrite: false,
        });
        let schema = common_all_1.SchemaUtils.createModuleProps({ fname, vault });
        if (opts.modifier) {
            schema = opts.modifier(schema);
        }
        if (!noWrite) {
            const vpath = (0, common_server_1.resolvePath)(vault.fsPath, wsRoot);
            await (0, common_server_1.schemaModuleProps2File)(schema, vpath, fname);
        }
        return schema;
    };
    /**
     * By default, create note with following properties:
     *  - created & updated = 1
     *  - id = note.fname
     *  - body = ""
     * @param opts
     * @returns
     */
    static createNote = async (opts) => {
        const { fname, vault, props, body, genRandomId, noWrite, wsRoot, custom, stub, } = lodash_1.default.defaults(opts, { noWrite: false });
        /**
         * Make sure snapshots stay consistent
         */
        const defaultOpts = {
            created: 1,
            updated: 1,
            id: genRandomId ? (0, common_all_1.genUUID)() : fname,
        };
        const note = common_all_1.NoteUtils.create({
            ...defaultOpts,
            ...props,
            custom,
            fname,
            vault,
            body,
            stub,
        });
        if (!noWrite && !stub) {
            await (0, common_server_1.note2File)({ note, vault, wsRoot });
        }
        return note;
    };
    /** This is like `createNote`, except it will make sure the engine is updated with the note.
     *
     * Prefer this over `createNote` if you are creating a note when the engine is
     * already active. For example, when you are using `describeMultiWs` or
     * `describeSingleWs` where the engine is already active inside the block.
     *
     * Avoid using this to update an existing note, this may cause issues.
     */
    static async createNoteWithEngine(opts) {
        const note = await this.createNote({ ...opts, noWrite: true });
        note.contentHash = (0, common_all_1.genHash)(note.body);
        await opts.engine.writeNote(note, opts.engineWriteNoteOverride);
        return note;
    }
    static async createNotePropsInput(opts) {
        const noteProps = await this.createNote(opts);
        const props = {
            label: "default-label-val",
            ...opts,
            ...noteProps,
        };
        return {
            ...props,
        };
    }
    static async modifyNoteByPath(opts, cb) {
        const { fname, vault, wsRoot } = opts;
        const npath = path_1.default.join((0, common_server_1.vault2Path)({ vault, wsRoot }), fname + ".md");
        const resp = (0, common_server_1.file2Note)(npath, vault);
        if (common_all_1.ErrorUtils.isErrorResp(resp)) {
            throw resp.error;
        }
        const note = resp.data;
        const newNote = cb(note);
        return (0, common_server_1.note2File)({ note: newNote, vault, wsRoot });
    }
    static async modifySchemaByPath(opts, cb) {
        const { fname, vault, wsRoot } = opts;
        const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
        const npath = path_1.default.join(vpath, fname + ".schema.yml");
        const schema = await (0, common_server_1.file2Schema)(npath, wsRoot);
        const newSchema = cb(schema);
        return (0, common_server_1.schemaModuleProps2File)(newSchema, vpath, fname);
    }
    /**
     * Setup schema that references template that may or may not lie in same vault
     */
    static setupSchemaCrossVault = (opts) => {
        const { wsRoot, vault, template } = opts;
        return NoteTestUtilsV4.createSchema({
            fname: "food",
            wsRoot,
            vault,
            modifier: (schema) => {
                const schemas = [
                    common_all_1.SchemaUtils.createFromSchemaOpts({
                        id: "food",
                        parent: "root",
                        fname: "food",
                        children: ["ch2"],
                        vault,
                    }),
                    common_all_1.SchemaUtils.createFromSchemaRaw({
                        id: "ch2",
                        template,
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
    };
}
exports.NoteTestUtilsV4 = NoteTestUtilsV4;
//# sourceMappingURL=noteUtils.js.map