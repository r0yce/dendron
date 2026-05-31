"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestPresetEntry = exports.AssertUtils = exports.toPlainObject = void 0;
exports.runMochaHarness = runMochaHarness;
exports.runJestHarnessV2 = runJestHarnessV2;
const assert_1 = __importDefault(require("assert"));
const lodash_1 = __importDefault(require("lodash"));
const toPlainObject = (value) => value !== undefined ? JSON.parse(JSON.stringify(value)) : value;
exports.toPlainObject = toPlainObject;
class AssertUtils {
    static async assertInString({ body, match, nomatch, }) {
        await this.assertTimesInString({
            body,
            // match must appear more than 0 times (at least once) in the body
            moreThan: match?.map((v) => [0, v]),
            // nomatch must appear fewer than 1 times (never) in the body
            fewerThan: nomatch?.map((v) => [1, v]),
        });
        return true;
    }
    /** Asserts that the gives strings appear the expected number of times in this string.
     *
     * parameters `match`, `fewerThan`, and `moreThan` should look like:
     *     [ [2, "Lorem ipsum"], [1, "foo bar"] ]
     *
     * @param match Must appear exactly this many times.
     * @param fewerThan Must appear fewer than this many times.
     * @param moreThan Must appear more than this many times.
     */
    static async assertTimesInString({ body, match, fewerThan, moreThan, }) {
        function countMatches(match) {
            if (typeof match === "string") {
                match = lodash_1.default.escapeRegExp(match);
            }
            const matches = body.match(new RegExp(match, "g")) || [];
            return matches.length;
        }
        await Promise.all((match || []).map(([count, match]) => {
            const foundCount = countMatches(match);
            if (foundCount != count) {
                throw Error(`${match} found ${foundCount} times, expected equal to ${count} in ${body}`);
            }
            return true;
        }));
        await Promise.all((fewerThan || []).map(([count, match]) => {
            const foundCount = countMatches(match);
            if (foundCount >= count) {
                throw Error(`${match} found ${foundCount} times, expected fewer than ${count} in ${body}`);
            }
            return true;
        }));
        await Promise.all((moreThan || []).map(([count, match]) => {
            const foundCount = countMatches(match);
            if (foundCount <= count) {
                throw Error(`${match} found ${foundCount} times, expected more than ${count} in ${body}`);
            }
            return true;
        }));
        return true;
    }
}
exports.AssertUtils = AssertUtils;
class TestPresetEntry {
    label;
    beforeTestResults;
    /**
     * Run this before setting up workspace
     */
    preSetupHook;
    /**
     * Run this before setting up hooks
     */
    postSetupHook;
    after;
    results;
    init;
    notes = {};
    constructor({ label, results, beforeTestResults, after, preSetupHook, postSetupHook, }) {
        this.label = label;
        this.results = results;
        this.beforeTestResults = beforeTestResults || (async () => { });
        this.preSetupHook = preSetupHook || (async () => { });
        this.postSetupHook = postSetupHook || (async () => { });
        this.after = after || (async () => { });
        this.init = async () => { };
        this.preSetupHook = lodash_1.default.bind(this.preSetupHook, this);
    }
}
exports.TestPresetEntry = TestPresetEntry;
async function runMochaHarness(results, opts) {
    return lodash_1.default.map(await results(opts), (ent) => assert_1.default.deepStrictEqual(ent.actual, ent.expected));
}
async function runJestHarnessV2(results, expect) {
    return lodash_1.default.map(await results, (ent) => {
        if (lodash_1.default.isBoolean(ent.expected) && ent.expected === true) {
            expect(ent.actual).toBeTruthy();
        }
        else {
            expect(ent.actual).toEqual(ent.expected);
        }
    });
}
//# sourceMappingURL=utils.js.map