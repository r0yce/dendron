"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLogger = setLogger;
exports.getLogger = getLogger;
exports.configureLogger = configureLogger;
const common_server_1 = require("@dendronhq/common-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
let L;
function setLogger({ logPath, logLvl, }) {
    const logLevel = logLvl || process.env.LOG_LEVEL || "debug";
    // @ts-ignore
    L = (0, common_server_1.createLogger)("dendron.server", logPath, { lvl: logLevel });
    return L;
}
function getLogger() {
    if (!L) {
        const logPath = process.env.LOG_DST || "stdout";
        L = configureLogger({ logPath });
    }
    return L;
}
function configureLogger(opts) {
    const { logPath, logLvl } = lodash_1.default.defaults(opts, { logPath: "stdout" });
    if (logPath !== "stdout") {
        if (fs_extra_1.default.existsSync(logPath)) {
            try {
                fs_extra_1.default.moveSync(logPath, `${logPath}.old`, { overwrite: true });
            }
            catch (err) { }
        }
        fs_extra_1.default.ensureFileSync(logPath);
    }
    return setLogger({ logPath, logLvl });
}
//# sourceMappingURL=core.js.map