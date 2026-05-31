"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const common_all_1 = require("@dendronhq/common-all");
const utils_1 = require("../../../../components/lookup/utils");
const mocha_1 = require("mocha");
const testUtilsv2_1 = require("../../../testUtilsv2");
let pickerValue;
(0, mocha_1.describe)(`filterPickerResults`, () => {
    const transformedQuery = ({ vaultName, wasMadeFromWikiLink, queryString, }) => {
        return {
            originalQuery: queryString || "f",
            wasMadeFromWikiLink: wasMadeFromWikiLink || false,
            queryString: queryString || "f",
            vaultName,
        };
    };
    const inputItem = async ({ fname, vaultName, isStub, }) => {
        const promise = common_test_utils_1.NoteTestUtilsV4.createNotePropsInput({
            noWrite: true,
            vault: {
                fsPath: "/tmp/vault1",
                name: vaultName || "vault1",
            },
            wsRoot: "/tmp/ws-root",
            fname,
        });
        const val = await promise;
        val.stub = isStub;
        return val;
    };
    (0, mocha_1.describe)(`WHEN simplest query possible`, () => {
        (0, mocha_1.it)(`THEN keep all results`, async () => {
            const inputs = [
                await inputItem({ fname: "f1", vaultName: "v1" }),
                await inputItem({ fname: "f2", vaultName: "v1" }),
                await inputItem({ fname: "f3", vaultName: "v2" }),
            ];
            const results = (0, utils_1.filterPickerResults)({
                itemsToFilter: inputs,
                transformedQuery: transformedQuery({
                    vaultName: undefined,
                    wasMadeFromWikiLink: false,
                    queryString: "f",
                }),
            });
            (0, testUtilsv2_1.expect)(results.length).toEqual(3);
        });
    });
    (0, mocha_1.describe)(`WHEN using dot at the end of the query. ['data.']`, () => {
        (0, mocha_1.it)(`THEN filter to items with children AND sort accordingly`, async () => {
            const inputs = [
                await inputItem({ fname: "data.stub", isStub: true }),
                // Pass in inputs in completely wrong order.
                await inputItem({ fname: "i.completely.do-not.belong" }),
                await inputItem({
                    fname: "i.have.no-data-children.hence-filter-me-out.data.",
                }),
                await inputItem({ fname: "level1.level2.data.integer.has-grandchild" }),
                await inputItem({ fname: "l1.l2.with-data.and-child.has-grandchild" }),
                await inputItem({ fname: "l1.l2.with-data.and-child" }),
                await inputItem({ fname: "l1.with-data.and-child" }),
                await inputItem({ fname: "l1.l2.l3.data.bool" }),
                await inputItem({ fname: "level1.level2.data.integer" }),
                await inputItem({ fname: "data.driven" }),
            ];
            const results = (0, utils_1.filterPickerResults)({
                itemsToFilter: inputs,
                transformedQuery: transformedQuery({
                    queryString: "data.",
                }),
            });
            const actual = results.map((item) => item.fname);
            const expected = [
                // 'data.' is at the highest level of hierarchy hence it comes up on top
                "data.driven",
                "level1.level2.data.integer",
                // idx of match is closer to beginning then the previous element. But hierarchy
                // of this element is more dug in hence sort order goes down.
                "l1.l2.l3.data.bool",
                // Non clean match of data we still keep it but lower it below all the clean
                // matches regardless of hierarchy depth.
                "l1.with-data.and-child",
                "l1.l2.with-data.and-child",
                // Now lastly come the nodes with grandchildren first with clean match, then
                // with partial match.
                "level1.level2.data.integer.has-grandchild",
                "l1.l2.with-data.and-child.has-grandchild",
                // And further down the stub note.
                "data.stub",
            ];
            (0, testUtilsv2_1.expect)(actual).toEqual(expected);
        });
    });
    (0, mocha_1.describe)(`WHEN query is made from wiki link`, () => {
        (0, mocha_1.it)(`THEN only keep results that match the transformed query exactly`, async () => {
            const inputs = [
                await inputItem({ fname: "f1" }),
                await inputItem({ fname: "f2" }),
            ];
            const results = (0, utils_1.filterPickerResults)({
                itemsToFilter: inputs,
                transformedQuery: transformedQuery({
                    wasMadeFromWikiLink: true,
                    queryString: "f1",
                }),
            });
            (0, testUtilsv2_1.expect)(results.length).toEqual(1);
            (0, testUtilsv2_1.expect)(results[0].fname).toEqual("f1");
        });
    });
    (0, mocha_1.describe)(`WHEN vault name is specified in the query`, () => {
        (0, mocha_1.it)(`THEN filter results to matching vault only.`, async () => {
            const inputs = [
                await inputItem({ fname: "f1", vaultName: "v1" }),
                await inputItem({ fname: "f2", vaultName: "v1" }),
                await inputItem({ fname: "f3", vaultName: "v2" }),
            ];
            const results = (0, utils_1.filterPickerResults)({
                itemsToFilter: inputs,
                transformedQuery: transformedQuery({ vaultName: "v1" }),
            });
            (0, testUtilsv2_1.expect)(results.length).toEqual(2);
            results.forEach((r) => {
                (0, testUtilsv2_1.expect)(r.vault.name).toEqual("v1");
            });
        });
    });
    pickerValue = "h1.v1";
    (0, mocha_1.describe)(`WHEN dot splitting is used by the query. pickerValue: '${pickerValue}'`, () => {
        let results;
        (0, mocha_1.beforeEach)(async () => {
            const inputs = [
                // Expected to be matched:
                await inputItem({ fname: "h1.h2.h3.v1" }),
                await inputItem({ fname: "h1.h3.v1" }),
                await inputItem({ fname: "h1.v1" }),
                // Out of order
                await inputItem({ fname: "v1.h2.h3.h1" }),
                await inputItem({ fname: "v1.h1" }),
            ];
            results = (0, utils_1.filterPickerResults)({
                itemsToFilter: inputs,
                // Note: using the actual method that generates transform string here.
                transformedQuery: common_all_1.NoteLookupUtils.transformQueryString({
                    query: pickerValue,
                }),
            });
        });
        ["h1.h2.h3.v1", "h1.h3.v1", "h1.v1"].forEach((fname) => {
            (0, mocha_1.it)(`THEN '${fname}' is to be kept`, () => {
                const actual = results
                    .filter((item) => item.fname === fname)
                    .map((item) => item.fname);
                (0, testUtilsv2_1.expect)(actual).toEqual([fname]);
            });
        });
        ["v1.h2.h3.h1", "v1.h1"].forEach((fname) => {
            (0, mocha_1.it)(`THEN '${fname}' is to be filtered out`, () => {
                (0, testUtilsv2_1.expect)(results.filter((item) => item.fname === fname).length).toEqual(0);
            });
        });
    });
    pickerValue = "h1.v1 GG";
    (0, mocha_1.describe)(`WHEN dot splitting with additional tokens are used by the query. pickerValue: '${pickerValue}'`, () => {
        let results;
        (0, mocha_1.beforeEach)(async () => {
            const inputs = [
                // Expected to be matched:
                await inputItem({ fname: "h1.h2.GG.h3.v1" }),
                await inputItem({ fname: "h1.h2.h3.v1.GG" }),
                await inputItem({ fname: "h1.h3.v1" }),
                await inputItem({ fname: "h1.v1 GG" }),
                // Out of order
                await inputItem({ fname: "v1.h2.h3.h1GG" }),
                await inputItem({ fname: "v1.h1GG" }),
            ];
            results = (0, utils_1.filterPickerResults)({
                itemsToFilter: inputs,
                // Note: using the actual method that generates transform string here.
                transformedQuery: common_all_1.NoteLookupUtils.transformQueryString({
                    query: pickerValue,
                }),
            });
        });
        ["h1.h2.GG.h3.v1", "h1.h2.h3.v1.GG", "h1.h3.v1", "h1.v1 GG"].forEach((fname) => {
            (0, mocha_1.it)(`THEN '${fname}' is to be kept.`, () => {
                (0, testUtilsv2_1.expect)(results.filter((item) => item.fname === fname).length).toEqual(1);
            });
        });
        ["v1.h2.h3.h1GG", "v1.h1GG"].forEach((fname) => {
            (0, mocha_1.it)(`THEN '${fname}' is to be filtered out.`, () => {
                (0, testUtilsv2_1.expect)(results.filter((item) => item.fname === fname).length).toEqual(0);
            });
        });
    });
});
//# sourceMappingURL=utils.test.js.map