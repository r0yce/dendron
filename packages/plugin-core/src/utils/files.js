"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginFileUtils = void 0;
const open_1 = __importDefault(require("open"));
const common_all_1 = require("@dendronhq/common-all");
const logger_1 = require("../logger");
class PluginFileUtils {
    /** Opens the given file with the default app.
     *
     * Logs if opening the file with the default app failed.
     */
    static async openWithDefaultApp(filePath) {
        await (0, open_1.default)(filePath).catch((err) => {
            const error = common_all_1.DendronError.createFromStatus({
                status: common_all_1.ERROR_STATUS.UNKNOWN,
                innerError: err,
            });
            logger_1.Logger.warn({ ctx: "PluginFileUtils.openWithDefaultApp", error });
        });
    }
}
exports.PluginFileUtils = PluginFileUtils;
//# sourceMappingURL=files.js.map