"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEngine = exports.DendronEngineV2 = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const lodash_1 = __importDefault(require("lodash"));
const _1 = require(".");
const storev2_1 = require("./drivers/file/storev2");
const unified_1 = require("@dendronhq/unified");
const hooks_1 = require("./topics/hooks");
function createRenderedCache(config, logger) {
    const ctx = "createRenderedCache";
    const maxPreviewsCached = common_all_1.ConfigUtils.getWorkspace(config).maxPreviewsCached;
    if (maxPreviewsCached && maxPreviewsCached > 0) {
        logger.info({
            ctx,
            msg: `Creating rendered preview cache set to hold maximum of '${maxPreviewsCached}' items.`,
        });
        return new common_all_1.LruCache({ maxItems: maxPreviewsCached });
    }
    else {
        // This is most likely to happen if the user were to set incorrect configuration
        // value for maxPreviewsCached, we don't want to crash initialization due to
        // not being able to cache previews. Hence we will log an error and not use
        // the preview cache.
        logger.error({
            ctx,
            msg: `Did not find valid maxPreviewsCached (value was '${maxPreviewsCached}')
        in configuration. When specified th value must be a number greater than 0. Using null cache.`,
        });
        return new common_all_1.NullCache();
    }
}
class DendronEngineV2 {
    wsRoot;
    store;
    logger;
    fuseEngine;
    hooks;
    _vaults;
    renderedCache;
    schemas;
    constructor(props) {
        this.wsRoot = props.wsRoot;
        this.logger = props.logger;
        this.fuseEngine = new common_all_1.FuseEngine({
            fuzzThreshold: common_all_1.ConfigUtils.getLookup(props.config).note.fuzzThreshold,
        });
        this._vaults = props.vaults;
        this.store = props.createStore(this);
        const hooks = common_all_1.ConfigUtils.getWorkspace(props.config).hooks || {
            onCreate: [],
        };
        this.hooks = hooks;
        this.renderedCache = createRenderedCache(props.config, this.logger);
        this.schemas = {};
    }
    static create({ wsRoot, logger }) {
        const LOGGER = logger || (0, common_server_1.createLogger)();
        const { error, data: config } = common_server_1.DConfig.readConfigAndApplyLocalOverrideSync(wsRoot);
        if (error) {
            LOGGER.error((0, common_all_1.stringifyError)(error));
        }
        return new DendronEngineV2({
            wsRoot,
            vaults: common_all_1.ConfigUtils.getVaults(config),
            forceNew: true,
            createStore: (engine) => new storev2_1.FileStorage({
                engine,
                logger: LOGGER,
                config,
            }),
            mode: "fuzzy",
            logger: LOGGER,
            config,
        });
    }
    /**
     * @deprecated
     * For accessing a specific note by id, see {@link DendronEngineV2.getNote}.
     * If you need all notes, avoid modifying any note as this will cause unintended changes on the store side
     */
    get notes() {
        return this.store.notes;
    }
    /**
     * @deprecated see {@link DendronEngineV2.findNotes}
     */
    get noteFnames() {
        return this.store.noteFnames;
    }
    get vaults() {
        return this._vaults;
    }
    set vaults(vaults) {
        this._vaults = vaults;
        this.store.vaults = vaults;
    }
    /**
     * Does not throw error but returns it
     */
    async init() {
        const ctx = "Engine:init";
        const defaultResp = {
            notes: {},
            schemas: {},
            wsRoot: this.wsRoot,
            vaults: this.vaults,
            config: common_all_1.ConfigUtils.genDefaultConfig(),
        };
        const perf = new common_all_1.PerformanceTimer({ timerName: "EngineInit" });
        perf.before("total");
        perf.before("storeInit");
        try {
            this.logger.info({ ctx, msg: "enter" });
            const { data, error: storeError } = await this.store.init();
            perf.after("storeInit");
            if (lodash_1.default.isUndefined(data)) {
                this.logger.error({ ctx, msg: "store init error", error: storeError });
                perf.after("total");
                return {
                    data: defaultResp,
                    error: common_all_1.DendronError.createFromStatus({
                        status: common_all_1.ERROR_STATUS.UNKNOWN,
                        severity: common_all_1.ERROR_SEVERITY.FATAL,
                    }),
                };
            }
            const { notes, schemas } = data;
            perf.before("updateIndexNote");
            await this.updateIndex("note");
            perf.after("updateIndexNote");
            // Set schemas locally in the engine:
            this.schemas = schemas;
            perf.before("updateIndexSchema");
            await this.updateIndex("schema");
            perf.after("updateIndexSchema");
            this.logger.info({ ctx, msg: "updated index" });
            const hookErrors = [];
            this.hooks.onCreate = this.hooks.onCreate.filter((hook) => {
                const { valid, error } = hooks_1.HookUtils.validateHook({
                    hook,
                    wsRoot: this.wsRoot,
                });
                if (!valid && error) {
                    this.logger.error({ msg: "bad hook", hook, error });
                    hookErrors.push(error);
                }
                return valid;
            });
            this.logger.info({ ctx, msg: "initialize hooks" });
            const allErrors = (lodash_1.default.isUndefined(storeError) ? [] : [storeError]).concat(hookErrors);
            let error;
            switch (lodash_1.default.size(allErrors)) {
                case 0: {
                    break;
                }
                case 1: {
                    error = new common_all_1.DendronError(allErrors[0]);
                    break;
                }
                default:
                    error = new common_all_1.DendronCompositeError(allErrors);
            }
            this.logger.info({ ctx: "init:ext", error, storeError, hookErrors });
            perf.after("total");
            // Log if in dev/perf mode (the caller will also surface it)
            if (process.env.DENDRON_PERF === "1") {
                this.logger.info({ ctx, msg: "perf-report", report: perf.report() });
            }
            return {
                error,
                data: {
                    notes,
                    wsRoot: this.wsRoot,
                    vaults: this.vaults,
                    config: common_server_1.DConfig.readConfigSync(this.wsRoot),
                },
            };
        }
        catch (error) {
            perf.after("total");
            this.logger.error({
                ctx,
                msg: "caught error",
                error: (0, common_all_1.error2PlainObject)(error),
            });
            const { message, stack, status } = error;
            const payload = { message, stack };
            return {
                data: defaultResp,
                error: common_all_1.DendronError.createPlainError({
                    payload,
                    message,
                    status,
                    severity: common_all_1.ERROR_SEVERITY.FATAL,
                }),
            };
        }
    }
    /**
     * See {@link DEngine.getNote}
     */
    async getNote(id) {
        return this.store.getNote(id);
    }
    async getNoteMeta(id) {
        return this.getNote(id);
    }
    async bulkGetNotes(ids) {
        return {
            data: ids.map((id) => {
                return this.notes[id];
            }),
        };
    }
    async bulkGetNotesMeta(ids) {
        return this.bulkGetNotes(ids);
    }
    /**
     * See {@link DEngine.findNotes}
     */
    async findNotes(opts) {
        return this.store.findNotes(opts);
    }
    /**
     * See {@link DEngine.findNotesMeta}
     */
    async findNotesMeta(opts) {
        return this.findNotes(opts);
    }
    async bulkWriteNotes(opts) {
        const changed = await this.store.bulkWriteNotes(opts);
        this.fuseEngine.replaceNotesIndex(this.notes);
        return changed;
    }
    async deleteNote(id, opts) {
        try {
            const note = this.notes[id];
            const changed = await this.store.deleteNote(id, opts);
            const noteChangeEntry = lodash_1.default.find(changed, (ent) => ent.note.id === id);
            if (noteChangeEntry.status === "delete") {
                await this.fuseEngine.removeNoteFromIndex(note);
            }
            return {
                data: changed,
            };
        }
        catch (err) {
            return {
                data: [],
                error: err,
            };
        }
    }
    async deleteSchema(id, opts) {
        const data = (await this.store.deleteSchema(id, opts));
        // deleted schema might affect notes
        await this.updateIndex("note");
        await this.updateIndex("schema");
        return data;
        // FIXM:E not performant
        // const smod = this.schemas[id];
        // await this.fuseEngine.removeSchemaFromIndex(smod);
        // return {
        //   data: undefined,
        //   error: null,
        // };
    }
    async getSchema(id) {
        const maybeSchema = await this.store.getSchema(id);
        if (!maybeSchema.data) {
            return {
                error: common_all_1.DendronError.createFromStatus({
                    status: common_all_1.ERROR_STATUS.CONTENT_NOT_FOUND,
                    message: `SchemaModuleProps not found for key ${id}.`,
                    severity: common_all_1.ERROR_SEVERITY.MINOR,
                }),
            };
        }
        return maybeSchema;
    }
    async info() {
        const version = common_server_1.NodeJSUtils.getVersionFromPkg();
        if (!version) {
            return {
                data: undefined,
                error: common_all_1.DendronError.createPlainError({
                    message: "Unable to read Dendron version",
                }),
            };
        }
        return {
            data: {
                version,
            },
        };
    }
    async querySchema(queryString) {
        const ctx = "querySchema";
        let items = [];
        const results = await this.fuseEngine.querySchema({ qs: queryString });
        items = results.map((ent) => this.schemas[ent.id]).filter(common_all_1.isNotUndefined);
        // if (queryString === "") {
        //   items = [this.schemas.root];
        // } else if (queryString === "*") {
        //   items = _.values(this.schemas);
        // } else {
        //   const results = this.schemaIndex.search(queryString);
        //   items = _.map(results, (resp) => this.schemas[resp.item.id]);
        // }
        this.logger.info({ ctx, msg: "exit" });
        return {
            data: items,
        };
    }
    async queryNotes(opts) {
        const ctx = "Engine:queryNotes";
        const { qs, vault, onlyDirectChildren, originalQS } = opts;
        // Need to ignore this because the engine stringifies this property, so the types are incorrect.
        // @ts-ignore
        if (vault?.selfContained === "true" || vault?.selfContained === "false")
            vault.selfContained = vault.selfContained === "true";
        const items = this.fuseEngine.queryNote({
            qs,
            onlyDirectChildren,
            originalQS,
        });
        if (items.length === 0) {
            return [];
        }
        this.logger.info({ ctx, msg: "exit" });
        let notes = items.map((ent) => this.notes[ent.id]);
        if (!lodash_1.default.isUndefined(vault)) {
            notes = notes.filter((ent) => {
                return common_all_1.VaultUtils.isEqual(vault, ent.vault, this.wsRoot);
            });
        }
        return notes;
    }
    async renderNote({ id, note, flavor, dest, }) {
        const ctx = "DendronEngineV2:renderNote";
        // If provided, we render the given note entirely. Otherwise find the note in workspace.
        if (!note) {
            note = this.notes[id];
        }
        // If note was not provided and we couldn't find it, we can't render.
        if (!note) {
            return {
                error: common_all_1.DendronError.createFromStatus({
                    status: common_all_1.ERROR_STATUS.INVALID_STATE,
                    message: `${id} does not exist`,
                    code: common_all_1.StatusCodes.BAD_REQUEST,
                }),
            };
        }
        const cachedPreview = this.renderedCache.get(id);
        if (cachedPreview) {
            if (this.isCachedPreviewUpToDate(cachedPreview, note)) {
                this.logger.info({ ctx, id, msg: `Will use cached rendered preview.` });
                // Cached preview updated time is the same as note.updated time.
                // Hence we can skip re-rendering and return the cached version of preview.
                return { data: cachedPreview.data };
            }
        }
        this.logger.info({
            ctx,
            id,
            msg: `Did not find usable cached rendered preview. Starting to render.`,
        });
        const beforeRenderMillis = (0, common_all_1.milliseconds)();
        // Either we don't have have the cached preview or the version that is
        // cached has gotten stale, hence we will re-render the note and cache
        // the new value.
        let data;
        try {
            data = await this._renderNote({
                note,
                flavor: flavor || unified_1.ProcFlavor.PREVIEW,
                dest: dest || common_all_1.DendronASTDest.HTML,
            });
        }
        catch (error) {
            return {
                error: new common_all_1.DendronError({
                    message: `Unable to render note ${note.fname} in ${common_all_1.VaultUtils.getName(note.vault)}`,
                    payload: error,
                }),
            };
        }
        this.renderedCache.set(id, {
            updated: note.updated,
            contentHash: note.contentHash,
            data,
        });
        const duration = (0, common_all_1.milliseconds)() - beforeRenderMillis;
        this.logger.info({ ctx, id, duration, msg: `Render preview finished.` });
        if (common_all_1.NoteUtils.isFileId(note.id)) {
            // Dummy note, we should remove it once we're done rendering
            this.store.deleteNote(note.id);
        }
        return { data };
    }
    isCachedPreviewUpToDate(cachedPreview, note) {
        // Most of the times the preview is going to be invalidated by users making changes to
        // the note itself, hence before going through the trouble of checking whether linked
        // reference notes have been updated we should do the super cheap check to see
        // whether the note itself has invalidated the preview.
        if (note.contentHash !== cachedPreview.contentHash) {
            return false;
        }
        // TODO: Add another check to see if backlinks have changed
        const visitedIds = new Set();
        return this._isCachedPreviewUpToDate({
            note,
            noteDicts: {
                notesById: this.notes,
                notesByFname: this.noteFnames,
            },
            visitedIds,
            latestUpdated: cachedPreview.updated,
        });
    }
    /**
     * Check if there exists a note reference that is newer than the provided "latestUpdated"
     * This is used to determine if a cached preview is up-to-date
     *
     * Preview note tree includes links whose content is rendered in the rootNote preview,
     * particularly the reference links (![[ref-link-example]]).
     */
    _isCachedPreviewUpToDate({ note, latestUpdated, noteDicts, visitedIds, }) {
        if (note.updated > latestUpdated) {
            return false;
        }
        // Mark the visited nodes so we don't end up recursively spinning if there
        // are cycles in our preview tree such as [[foo]] -> [[!bar]] -> [[!foo]]
        if (visitedIds.has(note.id)) {
            return true;
        }
        else {
            visitedIds.add(note.id);
        }
        const linkedRefNotes = note.links
            .filter((link) => link.type === "ref")
            .filter((link) => link.to && link.to.fname)
            .map((link) => {
            const pointTo = link.to;
            // When there is a vault specified in the link we want to respect that
            // specification, otherwise we will map by just the file name.
            const maybeVault = pointTo.vaultName
                ? common_all_1.VaultUtils.getVaultByName({
                    vname: pointTo.vaultName,
                    vaults: this.vaults,
                })
                : undefined;
            return common_all_1.NoteDictsUtils.findByFname({
                fname: pointTo.fname,
                noteDicts,
                vault: maybeVault,
            })[0];
        })
            // Filter out broken links (pointing to non existent files)
            .filter((refNote) => refNote !== undefined);
        for (const linkedNote of linkedRefNotes) {
            // Recurse into each child reference linked note.
            if (!this._isCachedPreviewUpToDate({
                note: linkedNote,
                noteDicts,
                visitedIds,
                latestUpdated,
            })) {
                return false;
            }
        }
        return true;
    }
    async _renderNote({ note, flavor, dest, }) {
        let proc;
        const config = common_server_1.DConfig.readConfigSync(this.wsRoot);
        const noteCacheForRenderDict = await (0, unified_1.getParsingDependencyDicts)(note, this, config, this.vaults);
        if (dest === common_all_1.DendronASTDest.HTML) {
            proc = unified_1.MDUtilsV5.procRehypeFull({
                noteToRender: note,
                noteCacheForRenderDict,
                fname: note.fname,
                vault: note.vault,
                config,
                vaults: this._vaults,
                wsRoot: this.wsRoot,
            }, { flavor });
        }
        else {
            proc = unified_1.MDUtilsV5.procRemarkFull({
                noteToRender: note,
                noteCacheForRenderDict,
                fname: note.fname,
                vault: note.vault,
                dest,
                config,
                vaults: this._vaults,
                wsRoot: this.wsRoot,
            }, { flavor });
        }
        const payload = await proc.process(common_all_1.NoteUtils.serialize(note));
        const renderedNote = payload.toString();
        return renderedNote;
    }
    async refreshNotesV2(notes) {
        await Promise.all(notes.map(async (ent) => {
            if (ent.status === "delete") {
                common_all_1.NoteDictsUtils.delete(ent.note, {
                    notesById: this.notes,
                    notesByFname: this.noteFnames,
                });
            }
            else {
                await _1.EngineUtils.refreshNoteLinksAndAnchors({
                    note: ent.note,
                    engine: this,
                    config: common_server_1.DConfig.readConfigSync(this.wsRoot),
                });
                this.store.updateNote(ent.note);
            }
        }));
        this.fuseEngine.replaceNotesIndex(this.notes);
    }
    async renameNote(opts) {
        try {
            const resp = await this.store.renameNote(opts);
            await this.refreshNotesV2(resp);
            return {
                data: resp,
            };
        }
        catch (err) {
            let error = err;
            if (err instanceof common_all_1.DendronError)
                error = (0, common_all_1.error2PlainObject)(err);
            if (lodash_1.default.isUndefined(err.message))
                err.message = "rename error";
            return { error };
        }
    }
    async updateIndex(mode) {
        if (mode === "schema") {
            this.fuseEngine.replaceSchemaIndex(this.schemas);
        }
        else {
            this.fuseEngine.replaceNotesIndex(this.notes);
        }
    }
    async writeNote(note, opts) {
        const out = await this.store.writeNote(note, opts);
        this.fuseEngine.replaceNotesIndex(this.notes);
        return out;
    }
    async writeSchema(schema, opts) {
        const out = this.store.writeSchema(schema, opts);
        await this.updateIndex("schema");
        return out;
    }
    async getNoteBlocks(opts) {
        const note = this.notes[opts.id];
        try {
            if (lodash_1.default.isUndefined(note))
                throw common_all_1.DendronError.createFromStatus({
                    status: common_all_1.ERROR_STATUS.INVALID_STATE,
                    message: `${opts.id} does not exist`,
                });
            const blocks = await unified_1.RemarkUtils.extractBlocks({
                note,
                config: common_server_1.DConfig.readConfigSync(this.wsRoot, true),
            });
            if (opts.filterByAnchorType) {
                lodash_1.default.remove(blocks, (block) => block.anchor?.type !== opts.filterByAnchorType);
            }
            return { data: blocks };
        }
        catch (err) {
            return {
                error: err,
            };
        }
    }
    async getDecorations(opts) {
        const note = this.notes[opts.id];
        try {
            if (lodash_1.default.isUndefined(note))
                throw common_all_1.DendronError.createFromStatus({
                    status: common_all_1.ERROR_STATUS.INVALID_STATE,
                    message: `${opts.id} does not exist`,
                });
            // Very weirdly, these range numbers turn into strings when getting called in through the API.
            // Not sure if I'm missing something.
            opts.ranges = opts.ranges.map((item) => {
                return {
                    text: item.text,
                    range: (0, common_all_1.newRange)(lodash_1.default.toNumber(item.range.start.line), lodash_1.default.toNumber(item.range.start.character), lodash_1.default.toNumber(item.range.end.line), lodash_1.default.toNumber(item.range.end.character)),
                };
            });
            const config = common_server_1.DConfig.readConfigSync(this.wsRoot, true);
            const { allDecorations: decorations, allDiagnostics: diagnostics, allErrors: errors, } = await (0, unified_1.runAllDecorators)({ ...opts, note, engine: this, config });
            let error;
            if (errors && errors.length > 1)
                error = new common_all_1.DendronCompositeError(errors);
            else if (errors && errors.length === 1)
                error = errors[0];
            return {
                data: {
                    decorations,
                    diagnostics,
                },
                error,
            };
        }
        catch (err) {
            return {
                error: err,
                data: {},
            };
        }
    }
}
exports.DendronEngineV2 = DendronEngineV2;
const createEngine = ({ wsRoot }) => {
    const engine = DendronEngineV2.create({ wsRoot });
    return engine;
};
exports.createEngine = createEngine;
//# sourceMappingURL=enginev2.js.map