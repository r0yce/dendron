"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeUtils = exports.milliseconds = exports.nanosToMillis = exports.nanos = void 0;
const error_1 = require("./error");
const NANOS_IN_SECOND = 1000000000;
const NANOS_IN_MILLI_SEC = 1000000;
/** Return current nanoseconds. */
const nanos = () => {
    const hrTime = process.hrtime();
    return hrTime[0] * NANOS_IN_SECOND + hrTime[1];
};
exports.nanos = nanos;
/** Converts the given nano seconds to milliseconds */
const nanosToMillis = (nanos) => {
    return nanos / NANOS_IN_MILLI_SEC;
};
exports.nanosToMillis = nanosToMillis;
/**
 * Returns a number representing the milliseconds elapsed
 * between 1 January 1970 00:00:00 UTC and the given date */
const milliseconds = () => {
    return new Date().getTime();
};
exports.milliseconds = milliseconds;
class TimeUtils {
    static async sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ sleep: ms });
            }, ms);
        });
    }
    static async awaitWithLimit(opts, cb) {
        let timeout = false;
        const resp = await Promise.race([
            (async () => {
                await TimeUtils.sleep(opts.limitMs);
                timeout = true;
            })(),
            cb(),
        ]);
        if (timeout) {
            return {
                error: error_1.ErrorFactory.createInvalidStateError({
                    message: "cb took too long",
                }),
            };
        }
        return { data: resp };
    }
}
exports.TimeUtils = TimeUtils;
//# sourceMappingURL=timing.js.map