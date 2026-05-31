"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleLogger = void 0;
/**
 * Simple DLogger implementation that just logs to console. Works universally on
 * all platforms.
 */
class ConsoleLogger {
    name;
    level;
    debug(msg) {
        console.log(msg);
    }
    info(msg) {
        console.log(msg);
    }
    error(msg) {
        console.log(msg);
    }
}
exports.ConsoleLogger = ConsoleLogger;
//# sourceMappingURL=ConsoleLogger.js.map