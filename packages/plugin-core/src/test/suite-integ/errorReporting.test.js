"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const testUtilsv2_1 = require("../testUtilsv2");
suite("WHEN a stack trace is sent to sentry", () => {
    test("THEN rewriteFilename() correctly strips down and rewrites the file names", () => {
        // A selection of real stack traces from sentry
        (0, testUtilsv2_1.expect)((0, common_server_1.rewriteFilename)("/Users/test_user/code_dendron/dendron/packages/plugin-core/out/src/_extension.js")).toEqual("app:///packages/plugin-core/out/src/_extension.js");
        (0, testUtilsv2_1.expect)((0, common_server_1.rewriteFilename)("c:\\Users\\some_username\\.vscode\\extensions\\dendron.dendron-0.79.0\\dist\\server.js")).toEqual("app:///dist/server.js");
        (0, testUtilsv2_1.expect)((0, common_server_1.rewriteFilename)("/Users/another_username/.vscode/extensions/dendron.dendron-0.79.0/dist/extension.js")).toEqual("app:///dist/extension.js");
        (0, testUtilsv2_1.expect)((0, common_server_1.rewriteFilename)("/home/username/.vscode-insiders/extensions/dendron.dendron-0.79.0/dist/extension.js")).toEqual("app:///dist/extension.js");
        (0, testUtilsv2_1.expect)((0, common_server_1.rewriteFilename)("/Users/user.test/.vscode-insiders/extensions/dendron.nightly-0.79.4/dist/extension.js")).toEqual("app:///dist/extension.js");
    });
    test("THEN isBadErrorThatShouldBeSampled() correctly detects errors we want sample", () => {
        const error = new Error("ENOENT: no such file or directory, open '/Users/someone/some/path/to/dendron.yml'");
        (0, testUtilsv2_1.expect)((0, common_server_1.isBadErrorThatShouldBeSampled)(error)).toBeTruthy();
        (0, testUtilsv2_1.expect)((0, common_server_1.isBadErrorThatShouldBeSampled)((0, common_all_1.error2PlainObject)(error))).toBeTruthy();
        (0, testUtilsv2_1.expect)((0, common_server_1.isBadErrorThatShouldBeSampled)(new Error("some other error"))).toBeFalsy();
    });
});
//# sourceMappingURL=errorReporting.test.js.map