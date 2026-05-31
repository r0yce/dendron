"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockDendronExtension = void 0;
const engine_server_1 = require("@dendronhq/engine-server");
const WSUtilsV2_1 = require("../WSUtilsV2");
/**
 * Mock version of IDendronExtension for testing purposes. If you require additional
 * functionality for your tests, either add it here, or extend this class for
 * your own testing scenario
 */
class MockDendronExtension {
    _engine;
    _context;
    _wsRoot;
    _vaults;
    noteRefCommentController;
    constructor({ engine, wsRoot, context, vaults, }) {
        this._engine = engine;
        this._context = context;
        this._wsRoot = wsRoot;
        this._vaults = vaults;
        this.noteRefCommentController = {};
    }
    get podsDir() {
        throw new Error("Method not implemented.");
    }
    get traitRegistrar() {
        throw new Error("Method not implemented.");
    }
    serverProcess;
    setEngine(_svc) {
        throw new Error("Method not implemented.");
    }
    fileWatcher;
    workspaceImpl;
    port;
    get context() {
        if (!this._context) {
            throw new Error("Context not initialized in MockDendronExtension");
        }
        return this._context;
    }
    serverWatcher;
    get type() {
        throw new Error("Method not implemented in MockDendronExtension");
    }
    getCommentThreadsState() {
        throw new Error("Method not implemented in MockDendronExtension.");
    }
    get wsUtils() {
        return new WSUtilsV2_1.WSUtilsV2(this);
    }
    get schemaSyncService() {
        throw new Error("Method not implemented in MockDendronExtension");
    }
    get workspaceService() {
        if (!this._wsRoot) {
            throw new Error("WSRoot not initialized in MockDendronExtension");
        }
        return new engine_server_1.WorkspaceService({
            wsRoot: this._wsRoot,
        });
    }
    get lookupControllerFactory() {
        throw new Error("Method not implemented in MockDendronExtension");
    }
    get noteLookupProviderFactory() {
        throw new Error("Method not implemented in MockDendronExtension");
    }
    get schemaLookupProviderFactory() {
        throw new Error("Method not implemented in MockDendronExtension.");
    }
    async activateWatchers() {
        return;
    }
    async deactivate() {
        return;
    }
    /**
     * Note: No-Op
     * @param _cb
     * @returns
     */
    pauseWatchers(cb) {
        return cb();
    }
    getClientAPIRootUrl() {
        throw new Error("Method not implemented in MockDendronExtension.");
    }
    getDWorkspace() {
        const ret = {
            wsRoot: this._wsRoot,
            vaults: this._vaults,
        };
        return ret;
    }
    getWorkspaceImplOrThrow() {
        throw new Error("Method not implemented in MockDendronExtension.");
    }
    getWorkspaceSettings() {
        throw new Error("Method not implemented in MockDendronExtension.");
    }
    getWorkspaceSettingsSync() {
        throw new Error("Method not implemented in MockDendronExtension.");
    }
    getDendronWorkspaceSettingsSync() {
        throw new Error("Method not implemented in MockDendronExtension.");
    }
    getWorkspaceSettingOrDefault() {
        throw new Error("Method not implemented in MockDendronExtension.");
    }
    setupViews(_context) {
        throw new Error("Method not implemented in MockDendronExtension.");
    }
    addDisposable(_disposable) {
        this._context?.subscriptions.push(_disposable);
    }
    /**
     * Note: trustedWorkspace is omitted
     * @returns
     */
    getEngine() {
        if (!this._engine) {
            throw new Error("Engine not initialized in MockDendronExtension");
        }
        return this._engine;
    }
    isActive() {
        return true;
    }
    async isActiveAndIsDendronNote(_fpath) {
        throw new Error("not implemented");
    }
    getWorkspaceConfig() {
        // TODO: the old implementation of this was wrong - it did not return WorkspaceConfiguration but a WorkspaceSettings object
        // since this doesn't seem to be used, just adding an exception here for future work
        throw Error("not implemented");
    }
}
exports.MockDendronExtension = MockDendronExtension;
//# sourceMappingURL=MockDendronExtension.js.map