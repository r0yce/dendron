"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DendronBaseWorkspace = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const logger_1 = require("../logger");
class DendronBaseWorkspace {
    wsRoot;
    type = common_all_1.WorkspaceType.NATIVE;
    logUri;
    assetUri;
    _engine;
    constructor({ wsRoot, logUri, assetUri, }) {
        this.wsRoot = wsRoot;
        this.logUri = logUri;
        this.assetUri = assetUri;
    }
    // TODO: optimize to not read every time
    get config() {
        const { data, error } = common_server_1.DConfig.readConfigAndApplyLocalOverrideSync(this.wsRoot);
        if (error) {
            logger_1.Logger.error({ error });
        }
        return data;
    }
    // TODO: optimize to not read every time
    get vaults() {
        return common_all_1.ConfigUtils.getVaults(this.config);
    }
    get engine() {
        if (!this._engine) {
            throw new common_all_1.DendronError({ message: "no engine set" });
        }
        return this._engine;
    }
    set engine(engine) {
        this._engine = engine;
    }
}
exports.DendronBaseWorkspace = DendronBaseWorkspace;
//# sourceMappingURL=baseWorkspace.js.map