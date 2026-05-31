"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const logger_1 = require("../../logger");
const testUtilsv2_1 = require("../testUtilsv2");
suite("logger tests", () => {
    (0, mocha_1.describe)(`tryExtractFullPath tests`, () => {
        (0, mocha_1.it)(`WHEN payload has full path THEN extract it`, () => {
            const inputPayload = {
                error: {
                    payload: '"{\\"fullPath\\":\\"/tmp/full-path-val\\"}"',
                },
            };
            // @ts-ignore
            const actual = logger_1.Logger.tryExtractFullPath(inputPayload);
            (0, testUtilsv2_1.expect)(actual).toEqual("/tmp/full-path-val");
        });
        (0, mocha_1.it)("WHEN payload does not have full path THEN do NOT throw", () => {
            const inputPayload = {
                error: {
                    payload: '"{\\"noFullPath\\":\\"/tmp/full-path-val\\"}"',
                },
            };
            // @ts-ignore
            const actual = logger_1.Logger.tryExtractFullPath(inputPayload);
            (0, testUtilsv2_1.expect)(actual).toEqual(undefined);
        });
    });
});
//# sourceMappingURL=logger.test.js.map