"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateService = void 0;
const lodash_1 = __importDefault(require("lodash"));
const constants_1 = require("../constants");
let _StateService;
/**
 * @deprecated All state service logic will be consolidated to {@link MetadataService}.
 * Consider using it instead if you need to add a new state to track.
 * Keeps track of workspace state
 */
class StateService {
    globalState;
    workspaceState;
    constructor(opts) {
        this.globalState = opts.globalState;
        this.workspaceState = opts.workspaceState;
        _StateService = this;
    }
    /**
     * @deprecated
     */
    static instance() {
        if (!_StateService) {
            throw Error("StateService not initialized");
        }
        return _StateService;
    }
    /**
     * @deprecated
     * Previous global version
     * Get from {@link ExtensionGlobalState} (VSCode specific state)
     */
    getGlobalVersion() {
        return (this.globalState.get(constants_1.GLOBAL_STATE.VERSION) || "0.0.0");
    }
    /**
     * @deprecated
     * Previous workspace version
     * Get from {@link ExtensionWorkspaceState}  (VSCode specific store)
     */
    getWorkspaceVersion() {
        return this.workspaceState.get(constants_1.WORKSPACE_STATE.VERSION) || "0.0.0";
    }
    /**
     * @deprecated
     */
    setGlobalVersion(version) {
        return this.globalState.update(constants_1.GLOBAL_STATE.VERSION, version);
    }
    /**
     * @deprecated
     */
    setWorkspaceVersion(version) {
        return this.workspaceState.update(constants_1.WORKSPACE_STATE.VERSION, version);
    }
    /**
     * @deprecated
     */
    getActivationContext() {
        return (this.globalState.get(constants_1.GLOBAL_STATE.WORKSPACE_ACTIVATION_CONTEXT) ?? constants_1.WORKSPACE_ACTIVATION_CONTEXT.NORMAL);
    }
    /**
     * @deprecated
     */
    setActivationContext(context) {
        return this.globalState.update(constants_1.GLOBAL_STATE.WORKSPACE_ACTIVATION_CONTEXT, context);
    }
    getMRUGoogleDocs() {
        return this.globalState.get(constants_1.GLOBAL_STATE.MRUDocs);
    }
    updateMRUGoogleDocs(value) {
        return this.globalState.update(constants_1.GLOBAL_STATE.MRUDocs, value);
    }
    /**
     * @deprecated
     * added generic method for cases when the keys and values both are dynamic
     * eg: hierarchy destination for imported google doc.
     */
    getGlobalState(key) {
        return this.globalState.get(key);
    }
    /**
     * @deprecated
     */
    updateGlobalState(key, value) {
        return this.globalState.update(key, value);
    }
    resetGlobalState() {
        lodash_1.default.values(constants_1.GLOBAL_STATE).map((k) => {
            return this.globalState.update(k, undefined);
        });
    }
    /**
     * @deprecated
     */
    resetWorkspaceState() {
        lodash_1.default.keys(constants_1.WORKSPACE_STATE).map((k) => {
            this.workspaceState.update(k, undefined);
        });
    }
}
exports.StateService = StateService;
//# sourceMappingURL=stateService.js.map