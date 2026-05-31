"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Time = void 0;
const luxon_1 = require("luxon");
class Time {
    static now() {
        return luxon_1.DateTime.local();
    }
    static DateTime = luxon_1.DateTime;
}
exports.Time = Time;
//# sourceMappingURL=time.js.map