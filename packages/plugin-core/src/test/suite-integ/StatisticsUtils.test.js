"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const mocha_1 = require("mocha");
const testUtilsv2_1 = require("../testUtilsv2");
suite("StatisticsUtils", function () {
    (0, mocha_1.describe)("stddev", () => {
        (0, mocha_1.describe)("given an array of numbers", () => {
            test("correctly outputs standard deviation", () => {
                const arr = [1, 2, 3, 4, 5];
                const expected = Math.sqrt(2);
                const actual = common_all_1.StatisticsUtils.stddev(arr);
                (0, testUtilsv2_1.expect)(actual).toEqual(expected);
                const arr2 = [1, 2, 3, 4, 5, 6];
                const expected2 = Math.sqrt(17.5 / 6);
                const actual2 = common_all_1.StatisticsUtils.stddev(arr2);
                (0, testUtilsv2_1.expect)(actual2).toEqual(expected2);
            });
        });
    });
    (0, mocha_1.describe)("median", () => {
        (0, mocha_1.describe)("given an array of number", () => {
            test("correctly outputs median value", () => {
                const arr = [1, 2, 3, 4, 5];
                const expected = 3;
                const actual = common_all_1.StatisticsUtils.median(arr);
                (0, testUtilsv2_1.expect)(actual).toEqual(expected);
                const arr2 = [1, 2, 3, 4, 5, 6];
                const expected2 = 3.5;
                const actual2 = common_all_1.StatisticsUtils.median(arr2);
                (0, testUtilsv2_1.expect)(actual2).toEqual(expected2);
            });
        });
    });
    (0, mocha_1.describe)("isNonEmptyArray", () => {
        (0, mocha_1.describe)("given a non empty array", () => {
            test("type guard correctly infers that an array is a NonEmptyArray", () => {
                const arr = [1, 2, 3];
                (0, testUtilsv2_1.expect)(common_all_1.StatisticsUtils.isNonEmptyArray(arr)).toBeTruthy();
            });
        });
        (0, mocha_1.describe)("given an empty array", () => {
            test("type guard correctly infers that an array is not a NonEmptyArray", () => {
                const arr = [];
                (0, testUtilsv2_1.expect)(common_all_1.StatisticsUtils.isNonEmptyArray(arr)).toBeFalsy();
            });
        });
    });
});
//# sourceMappingURL=StatisticsUtils.test.js.map