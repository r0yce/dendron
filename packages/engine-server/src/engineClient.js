"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DendronEngineClient = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const SQLiteMetadataStore_1 = require("./drivers/SQLiteMetadataStore");
const utils_1 = require("./utils");
class DendronEngineClient {
    _onNoteChangedEmitter = new common_all_1.EventEmitter();
    _config;
    notes;
    noteFnames;
    wsRoot;
    ws;
    fuseEngine;
    api;
    vaults;
    history;
    logger;
    hooks;
    static create({ port, vaults, ws, history, logger, }) {
        const api = new common_all_1.DendronAPI({
            endpoint: common_all_1.APIUtils.getLocalEndpoint(lodash_1.default.isString(port) ? parseInt(port, 10) : port),
            apiPath: "api",
            logger,
        });
        return new DendronEngineClient({ api, vaults, ws, history });
    }
    static getPort({ wsRoot }) {
        const portFile = utils_1.EngineUtils.getPortFilePathForWorkspace({ wsRoot });
        if (!fs_extra_1.default.pathExistsSync(portFile)) {
            throw new common_all_1.DendronError({ message: "no port file" });
        }
        return lodash_1.default.toInteger(lodash_1.default.trim(fs_extra_1.default.readFileSync(portFile, { encoding: "utf8" })));
    }
    constructor({ api, vaults, ws, history, logger, }) {
        this.api = api;
        this.notes = {};
        this.noteFnames = {};
        this.vaults = vaults;
        this.wsRoot = ws;
        this.ws = ws;
        this.history = history;
        this.logger = logger || (0, common_server_1.createLogger)();
        const config = common_server_1.DConfig.readConfigSync(ws);
        this.fuseEngine = new common_all_1.FuseEngine({
            fuzzThreshold: common_all_1.ConfigUtils.getLookup(config).note.fuzzThreshold,
        });
        this.hooks = common_all_1.ConfigUtils.getWorkspace(config).hooks || {
            onCreate: [],
        };
        this._config = config;
    }
    /**
     * Event that fires upon the changing of note state in the engine after a set
     * of NoteProps has been changed AND those changes have been reflected on the
     * engine side. Note creation, deletion, and updates are all fired from this
     * event.
     */
    get onEngineNoteStateChanged() {
        return this._onNoteChangedEmitter.event;
    }
    dispose() {
        this._onNoteChangedEmitter.dispose();
    }
    /**
     * Load all nodes
     */
    async init() {
        const resp = await this.api.workspaceInit({
            uri: this.ws,
            config: { vaults: this.vaults },
        });
        if (resp.error && resp.error.severity !== common_all_1.ERROR_SEVERITY.MINOR) {
            return {
                data: resp.data,
                error: resp.error,
            };
        }
        if (!resp.data) {
            throw new common_all_1.DendronError({ message: "no data" });
        }
        const { notes, config } = resp.data;
        this._config = config;
        this.notes = notes;
        this.noteFnames = common_all_1.NoteFnameDictUtils.createNotePropsByFnameDict(this.notes);
        await this.fuseEngine.replaceNotesIndex(notes);
        return {
            error: resp.error,
            data: {
                notes,
                config,
                wsRoot: this.wsRoot,
                vaults: this.vaults,
            },
        };
    }
    /**
     * See {@link DStore.getNote}
     */
    async getNote(id) {
        if (this._config.dev?.enableEngineV3) {
            return this.api.noteGet({ id, ws: this.ws });
        }
        else {
            const maybeNote = this.notes[id];
            if (maybeNote) {
                return { data: lodash_1.default.cloneDeep(maybeNote) };
            }
            else {
                return {
                    error: common_all_1.DendronError.createFromStatus({
                        status: common_all_1.ERROR_STATUS.CONTENT_NOT_FOUND,
                        message: `NoteProps not found for key ${id}.`,
                        severity: common_all_1.ERROR_SEVERITY.MINOR,
                    }),
                };
            }
        }
    }
    async getNoteMeta(id) {
        if (this._config.dev?.enableEngineV3) {
            return this.api.noteGetMeta({ id, ws: this.ws });
        }
        else {
            return this.getNote(id);
        }
    }
    /**
     * See {@link DEngine.bulkGetNotes}
     * TODO: remove this.notes
     */
    async bulkGetNotes(ids) {
        if (this._config.dev?.enableEngineV3) {
            return this.api.noteBulkGet({ ids, ws: this.ws });
        }
        else {
            return {
                data: ids.map((id) => {
                    return lodash_1.default.cloneDeep(this.notes[id]);
                }),
            };
        }
    }
    /**
     * See {@link DEngine.bulkGetNotesMeta}
     * TODO: remove this.notes
     */
    async bulkGetNotesMeta(ids) {
        if (this._config.dev?.enableEngineV3) {
            return this.api.noteBulkGetMeta({ ids, ws: this.ws });
        }
        else {
            return this.bulkGetNotes(ids);
        }
    }
    /**
     * See {@link DStore.findNotes}
     */
    async findNotes(opts) {
        const resp = await this.api.noteFind({ ...opts, ws: this.ws });
        return resp.data;
    }
    /**
     * See {@link DStore.findNotesMeta}
     */
    async findNotesMeta(opts) {
        const resp = await this.api.noteFindMeta({ ...opts, ws: this.ws });
        return resp.data;
    }
    async bulkWriteNotes(opts) {
        const resp = await this.api.engineBulkAdd({ opts, ws: this.ws });
        const changed = resp.data;
        if (changed) {
            await this.refreshNotesV2(changed);
            this._onNoteChangedEmitter.fire(changed);
        }
        return resp;
    }
    async deleteNote(id, opts) {
        const ws = this.ws;
        const resp = await this.api.engineDelete({ id, opts, ws });
        if (!resp.data) {
            throw new common_all_1.DendronError({
                message: `Failed to delete note with id ${id}`,
                payload: resp.error,
            });
        }
        await this.refreshNotesV2(resp.data);
        if (resp.data !== undefined) {
            this._onNoteChangedEmitter.fire(resp.data);
        }
        return {
            data: resp.data,
        };
    }
    async deleteSchema(id, opts) {
        const ws = this.ws;
        const resp = await this.api.schemaDelete({ id, opts, ws });
        if (!resp?.data?.notes) {
            throw new common_all_1.DendronError({ message: "bad delete operation" });
        }
        const { notes } = resp.data;
        this.notes = notes;
        this.noteFnames = common_all_1.NoteFnameDictUtils.createNotePropsByFnameDict(this.notes);
        this.fuseEngine.replaceNotesIndex(notes);
        return {
            data: resp.data,
        };
    }
    async info() {
        const resp = await this.api.engineInfo();
        return resp;
    }
    async queryNotes(opts) {
        const { qs, onlyDirectChildren, vault, originalQS } = opts;
        let noteIndexProps;
        const config = common_server_1.DConfig.readConfigSync(this.wsRoot);
        if (config.workspace.metadataStore === "sqlite") {
            try {
                const resp = await SQLiteMetadataStore_1.SQLiteMetadataStore.search(qs);
                noteIndexProps = resp.hits;
                this.logger.debug({ ctx: "queryNote", query: resp.query });
            }
            catch (err) {
                fs_extra_1.default.appendFileSync("/tmp/out.log", "ERROR: unable to query note", {
                    encoding: "utf8",
                });
                noteIndexProps = [];
            }
        }
        else {
            noteIndexProps = await this.fuseEngine.queryNote({
                qs,
                onlyDirectChildren,
                originalQS,
            });
        }
        let noteProps = noteIndexProps.map((ent) => this.notes[ent.id]);
        // TODO: hack
        if (!lodash_1.default.isUndefined(vault)) {
            noteProps = noteProps.filter((ent) => common_all_1.VaultUtils.isEqual(vault, ent.vault, this.wsRoot));
        }
        return noteProps;
    }
    async renderNote(opts) {
        return this.api.noteRender({ ...opts, ws: this.ws });
    }
    async refreshNotesV2(notes) {
        if (lodash_1.default.isUndefined(notes)) {
            return;
        }
        const noteDicts = {
            notesById: this.notes,
            notesByFname: this.noteFnames,
        };
        notes.forEach((ent) => {
            const uri = common_all_1.NoteUtils.getURI({ note: ent.note, wsRoot: this.wsRoot });
            if (ent.status === "delete") {
                common_all_1.NoteDictsUtils.delete(ent.note, noteDicts);
                this.history?.add({ source: "engine", action: "delete", uri });
            }
            else {
                if (ent.status === "create") {
                    this.history?.add({ source: "engine", action: "create", uri });
                }
                if (ent.status === "update") {
                    // If the note id has changed, delete previous entry from dict before adding
                    if (ent.prevNote && ent.prevNote.id !== ent.note.id) {
                        common_all_1.NoteDictsUtils.delete(ent.prevNote, noteDicts);
                    }
                    ent.note.children = lodash_1.default.sortBy(ent.note.children, (id) => lodash_1.default.get(this.notes, id, lodash_1.default.find(notes, (ent) => ent.note.id === id)?.note || {
                        title: "foo",
                    }).title);
                }
                common_all_1.NoteDictsUtils.add(ent.note, noteDicts);
            }
        });
        this.fuseEngine.replaceNotesIndex(this.notes);
    }
    /** Renames the note.
     *
     *  WARNING: When doing bulk operations. Do not invoke multiple requests to this
     *  command in parallel, wait for a single call to finish before requesting another call.
     *  Otherwise some race condition starts to cause intermittent failures.
     *  */
    async renameNote(opts) {
        const resp = await this.api.engineRenameNote({ ...opts, ws: this.ws });
        if (resp.error || lodash_1.default.isUndefined(resp.data)) {
            throw resp.error;
        }
        await this.refreshNotesV2(resp.data);
        if (resp.data) {
            this._onNoteChangedEmitter.fire(resp.data);
        }
        return resp;
    }
    async sync() {
        const resp = await this.api.workspaceSync({ ws: this.ws });
        if (!resp.data) {
            throw new common_all_1.DendronError({ message: "no data", payload: resp });
        }
        const { notes, config } = resp.data;
        this.notes = notes;
        this.noteFnames = common_all_1.NoteFnameDictUtils.createNotePropsByFnameDict(this.notes);
        await this.fuseEngine.replaceNotesIndex(notes);
        return {
            error: resp.error,
            data: {
                notes,
                vaults: this.vaults,
                wsRoot: this.wsRoot,
                config,
            },
        };
    }
    async writeNote(note, opts) {
        const resp = await this.api.engineWrite({
            node: note,
            opts,
            ws: this.ws,
        });
        const changed = resp.data;
        if (resp.error) {
            return resp;
        }
        if (changed) {
            await this.refreshNotesV2(changed);
            this._onNoteChangedEmitter.fire(changed);
        }
        return resp;
    }
    // ~~~ schemas
    async getSchema(id) {
        return this.api.schemaRead({ id, ws: this.ws });
    }
    async querySchema(qs) {
        const out = await this.api.schemaQuery({ qs, ws: this.ws });
        return lodash_1.default.defaults(out, { data: [] });
    }
    async writeSchema(schema, opts) {
        this.logger.debug({
            ctx: "engineClient.writeSchema",
            schema: schema.fname,
            metaOnly: opts?.metaOnly,
        });
        return this.api.schemaWrite({ schema, ws: this.ws, opts });
    }
    async getNoteBlocks({ id, filterByAnchorType, }) {
        const out = await this.api.getNoteBlocks({
            id,
            filterByAnchorType,
            ws: this.ws,
        });
        return out;
    }
    async getDecorations(opts) {
        const out = await this.api.getDecorations({
            ...opts,
            ws: this.ws,
        });
        return out;
    }
}
exports.DendronEngineClient = DendronEngineClient;
//# sourceMappingURL=engineClient.js.map