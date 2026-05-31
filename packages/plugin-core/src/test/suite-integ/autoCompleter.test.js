"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const autoCompleter_1 = require("../../utils/autoCompleter");
const mocha_1 = require("mocha");
const expect_1 = require("../expect");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const LANGUAGE_FNAMES = [
    "languages.python.data",
    "languages.python.data.string",
    "languages.with-data.make-sense",
    "languages.python.data.string",
    "languages.python.machine-learning.pandas",
    "languages.python.data.bool",
    "languages.python.data",
    "languages.python",
    "languages.with-data",
    // Note that this one starts with 'langrel' instead of language.
    "langrel.hello-world",
];
(0, mocha_1.describe)(`Auto Completer tests.`, () => {
    const noteFactory = common_test_utils_1.TestNoteFactory.defaultUnitTestFactory();
    (0, mocha_1.describe)(`getNewQuickPickValue`, () => {
        (0, mocha_1.describe)(`WHEN we are at the first value of dropdown`, () => {
            (0, mocha_1.it)("THEN we should do partial completion", async () => {
                const quickPick = vsCodeUtils_1.VSCodeUtils.createQuickPick();
                const items = await noteFactory.createNoteInputWithFNames(LANGUAGE_FNAMES);
                quickPick.items = items;
                quickPick.activeItems = [items[0]];
                quickPick.value = "languages.pyt";
                const actual = autoCompleter_1.AutoCompleter.getAutoCompletedValue(quickPick);
                (0, expect_1.expect)(actual).toEqual("languages.python");
            });
            (0, mocha_1.it)("AND we have multiple files with same name at the top THEN allow partial completion", async () => {
                // This happens when we have multiple file names in different vaults
                const fnames = [
                    "languages",
                    "languages",
                    "languages.python.data",
                    "languages.python.data.string",
                    "languages.with-data.make-sense",
                ];
                const quickPick = vsCodeUtils_1.VSCodeUtils.createQuickPick();
                const items = await noteFactory.createNoteInputWithFNames(fnames);
                quickPick.items = items;
                quickPick.activeItems = [items[0]];
                quickPick.value = "languages";
                const actual = autoCompleter_1.AutoCompleter.getAutoCompletedValue(quickPick);
                (0, expect_1.expect)(actual).toEqual("languages.python");
            });
        });
        (0, mocha_1.describe)(`WHEN we are at subsequent value of dropdown`, () => {
            (0, mocha_1.it)("THEN we should do full completion", async () => {
                const quickPick = vsCodeUtils_1.VSCodeUtils.createQuickPick();
                const items = await noteFactory.createNoteInputWithFNames(LANGUAGE_FNAMES);
                quickPick.items = items;
                quickPick.activeItems = [items[2]];
                quickPick.value = "languages.pyt";
                const actual = autoCompleter_1.AutoCompleter.getAutoCompletedValue(quickPick);
                (0, expect_1.expect)(actual).toEqual("languages.with-data.make-sense");
            });
        });
    });
    (0, mocha_1.describe)(`autoCompleteNoteLookup`, () => {
        (0, mocha_1.describe)(`GIVEN "language" file name input:`, () => {
            function testWithLanguageInput(input, expected, activeItemValue) {
                if (activeItemValue === undefined) {
                    activeItemValue = input;
                }
                const actual = autoCompleter_1.AutoCompleter.autoCompleteNoteLookup(input, activeItemValue, LANGUAGE_FNAMES);
                (0, expect_1.expect)(actual).toEqual(expected);
            }
            (0, mocha_1.describe)(`WHEN active item is specified`, () => {
                (0, mocha_1.it)(`AND there is a match with input THEN return active item`, () => {
                    testWithLanguageInput("mach", "languages.python.machine-learning.pandas", "languages.python.machine-learning.pandas");
                });
                (0, mocha_1.it)("AND there is NO match with the input THEN return active item", () => {
                    testWithLanguageInput("data", "languages.python.machine-learning.pandas", "languages.python.machine-learning.pandas");
                });
            });
            (0, mocha_1.describe)(`Testing prefix auto completion (digging into hierarchy):`, () => {
                [
                    ["lang", "languages"],
                    ["languages", "languages.python"],
                    ["languages.py", "languages.python"],
                    ["languages.python", "languages.python.data"],
                    ["languages.python.da", "languages.python.data"],
                    // This is an important test case since it goes from first filename result to
                    // second top pick file name result.
                    ["languages.python.data", "languages.python.data.string"],
                ].forEach((testCase) => {
                    const input = testCase[0];
                    const expected = testCase[1];
                    (0, mocha_1.it)(`WHEN '${input}' THEN expect: '${expected}'`, () => {
                        testWithLanguageInput(input, expected);
                    });
                });
            });
            (0, mocha_1.describe)(`Testing completion within the note`, () => {
                (0, mocha_1.it)(`WHEN matching 'pyth' THEN we should prepend the beginning of top pick`, () => {
                    testWithLanguageInput("pyth", "languages.pyth");
                });
            });
            (0, mocha_1.describe)(`Testing unmatched`, () => {
                (0, mocha_1.it)("WHEN unmatched is attempted to auto complete THEN top pick return", () => {
                    testWithLanguageInput("i-dont-match", "languages.python.data");
                });
            });
            (0, mocha_1.describe)(`Testing query characters`, () => {
                (0, mocha_1.it)("WHEN query characters are used THEN return top pick", () => {
                    testWithLanguageInput("pyt hon", "languages.python.data");
                });
            });
        });
        (0, mocha_1.describe)(`GIVEN empty file name input`, () => {
            (0, mocha_1.it)(`WHEN auto complete is used with empty file names THEN return current value`, () => {
                (0, expect_1.expect)(autoCompleter_1.AutoCompleter.autoCompleteNoteLookup("hello", "hello", [])).toEqual("hello");
            });
        });
    });
});
//# sourceMappingURL=autoCompleter.test.js.map