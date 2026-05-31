"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineAPIService = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
class EngineAPIService {
    _internalEngine;
    _engineEventEmitter;
    _trustedWorkspace = true;
    static createEngine({ port, enableWorkspaceTrust, vaults, wsRoot, }) {
        const history = engine_server_1.HistoryService.instance();
        const api = new common_all_1.DendronAPI({
            endpoint: common_all_1.APIUtils.getLocalEndpoint(lodash_1.default.isString(port) ? parseInt(port, 10) : port),
            apiPath: "api",
        });
        const newClientBase = new engine_server_1.DendronEngineClient({
            api,
            vaults,
            ws: wsRoot,
            history,
        });
        const newSvc = new EngineAPIService({
            engineClient: newClientBase,
            engineEvents: newClientBase,
        });
        if (enableWorkspaceTrust !== undefined) {
            newSvc._trustedWorkspace = enableWorkspaceTrust;
        }
        return newSvc;
    }
    constructor({ engineClient, engineEvents, }) {
        this._internalEngine = engineClient;
        this._engineEventEmitter = engineEvents;
    }
    get onEngineNoteStateChanged() {
        return this._engineEventEmitter.onEngineNoteStateChanged;
    }
    dispose() {
        this._engineEventEmitter.dispose();
    }
    get trustedWorkspace() {
        return this._trustedWorkspace;
    }
    set trustedWorkspace(value) {
        this._trustedWorkspace = value;
    }
    get wsRoot() {
        return this._internalEngine.wsRoot;
    }
    set wsRoot(arg) {
        this._internalEngine.wsRoot = arg;
    }
    get vaults() {
        return this._internalEngine.vaults;
    }
    set vaults(arg) {
        this._internalEngine.vaults = arg;
    }
    get hooks() {
        return this._internalEngine.hooks;
    }
    set hooks(arg) {
        this._internalEngine.hooks = arg;
    }
    get engineEventEmitter() {
        return this._engineEventEmitter;
    }
    /**
     * See {@link IEngineAPIService.getNote}
     */
    async getNote(id) {
        return this._internalEngine.getNote(id);
    }
    /**
     * See {@link IEngineAPIService.getNote}
     */
    async getNoteMeta(id) {
        return this._internalEngine.getNoteMeta(id);
    }
    /**
     * See {@link IEngineAPIService.bulkGetNotes}
     */
    async bulkGetNotes(ids) {
        return this._internalEngine.bulkGetNotes(ids);
    }
    /**
     * See {@link IEngineAPIService.bulkGetNotesMeta}
     */
    async bulkGetNotesMeta(ids) {
        return this._internalEngine.bulkGetNotesMeta(ids);
    }
    /**
     * See {@link IEngineAPIService.findNotes}
     */
    async findNotes(opts) {
        return this._internalEngine.findNotes(opts);
    }
    /**
     * See {@link IEngineAPIService.findNotesMeta}
     */
    async findNotesMeta(opts) {
        return this._internalEngine.findNotesMeta(opts);
    }
    async bulkWriteNotes(opts) {
        return this._internalEngine.bulkWriteNotes(opts);
    }
    writeNote(note, opts) {
        if (!this._trustedWorkspace) {
            if (!opts) {
                opts = { runHooks: false };
            }
            else {
                opts.runHooks = false;
            }
        }
        return this._internalEngine.writeNote(note, opts);
    }
    writeSchema(schema, opts) {
        return this._internalEngine.writeSchema(schema, opts);
    }
    init() {
        // this.setupEngineAnalyticsTracking();
        return this._internalEngine.init();
    }
    deleteNote(id, opts) {
        return this._internalEngine.deleteNote(id, opts);
    }
    deleteSchema(id, opts) {
        return this._internalEngine.deleteSchema(id, opts);
    }
    info() {
        return this._internalEngine.info();
    }
    getSchema(qs) {
        return this._internalEngine.getSchema(qs);
    }
    querySchema(qs) {
        return this._internalEngine.querySchema(qs);
    }
    queryNotes(opts) {
        return this._internalEngine.queryNotes(opts);
    }
    renameNote(opts) {
        return this._internalEngine.renameNote(opts);
    }
    renderNote(opts) {
        return this._internalEngine.renderNote(opts);
    }
    getNoteBlocks(opts) {
        return this._internalEngine.getNoteBlocks(opts);
    }
    getDecorations(opts) {
        return this._internalEngine.getDecorations(opts);
    }
}
exports.EngineAPIService = EngineAPIService;
//# sourceMappingURL=EngineAPIService.js.map