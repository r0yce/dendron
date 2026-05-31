"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expect = expect;
const assert_1 = __importDefault(require("assert"));
const lodash_1 = __importDefault(require("lodash"));
function safeStringify(obj) {
    try {
        return JSON.stringify(obj);
    }
    catch (err) {
        return `failed_to_stringify_obj`;
    }
}
function expect(value) {
    return {
        /**
         * NOTE: This method currently only works for checking object properties.
         *
         * Such as:
         * var object = { 'user': 'fred', 'age': 40 };
         * _.isMatch(object, { 'age': 40 });
         * // => true
         * _.isMatch(object, { 'age': 36 });
         * // => false
         * */
        toContain: (value2) => {
            assert_1.default.ok(lodash_1.default.isMatch(value, value2), `Object:'${safeStringify(value)}' does NOT contain: '${safeStringify(value2)}'`);
        },
        toEqual: (value2) => {
            assert_1.default.deepStrictEqual(value, value2);
        },
        toNotEqual: (value2) => {
            assert_1.default.notDeepStrictEqual(value, value2);
        },
        toBeTruthy: () => {
            assert_1.default.ok(value);
        },
        toBeFalsy: () => {
            assert_1.default.ok(lodash_1.default.isUndefined(value) || !value);
        },
        /**
         *  Pass examples:
         *  <pre>
         *  await expect(() => { throw new Error(); }).toThrow(); // Passes exception thrown
         *  await expect(() => { throw new Error(`hi world`); }).toThrow(`hi`); // Passes regex matches
         *  </pre>
         *
         *  Failure examples:
         *  <pre>
         *  await expect(() => {  }).toThrow(); // Fails (no exception thrown)
         *  await expect(() => { throw new Error(`hi`); }).toThrow(`hi world`); // Fails regex does not match
         *  </pre>
         * */
        toThrow: async (regex) => {
            let threwException = false;
            try {
                await value();
            }
            catch (err) {
                threwException = true;
                if (regex)
                    if (err instanceof Error) {
                        if (err.message === undefined) {
                            assert_1.default.fail(`Regex '${regex}' was specified but thrown error did not have a message`);
                        }
                        const matchArr = err.message.match(regex);
                        assert_1.default.ok(matchArr !== null, `Thrown exception message did NOT match regex:'${regex}' ErrorMessage:'${err.message}'`);
                    }
                    else {
                        assert_1.default.fail(`Regex '${regex}' was specified but non Error type was thrown.`);
                    }
            }
            (0, assert_1.default)(threwException, `Expected exception to be thrown. None were thrown.`);
        },
    };
}
//# sourceMappingURL=expect.js.map