"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssertionError = void 0;
exports.assertExists = assertExists;
exports.assert = assert;
const lodash_1 = __importDefault(require("lodash"));
class AssertionError extends Error {
}
exports.AssertionError = AssertionError;
function assertExists(val, msg) {
    if (lodash_1.default.isNull(val) || lodash_1.default.isUndefined(val)) {
        throw new AssertionError(msg);
    }
    // @ts-ignore
    return val;
}
function assert(statement, msg) {
    if (!statement) {
        throw new AssertionError(msg);
    }
    else {
        return true;
    }
}
//# sourceMappingURL=assert.js.map