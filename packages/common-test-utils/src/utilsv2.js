"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestPresetEntryV4 = exports.createMockEngine = exports.createEngineFactoryFactory = void 0;
exports.testAssertsInsideCallback = testAssertsInsideCallback;
const lodash_1 = __importDefault(require("lodash"));
const createEngineFactoryFactory = ({ overrides, EngineClass, }) => {
    const createEngine = (opts) => {
        const engine = new EngineClass();
        lodash_1.default.map(overrides || {}, (method, key) => {
            // @ts-ignore
            engine[key] = method(opts);
        });
        return engine;
    };
    return createEngine;
};
exports.createEngineFactoryFactory = createEngineFactoryFactory;
class MockEngineClass {
    // eslint-disable-next-line no-empty-function
    async init() { }
}
exports.createMockEngine = (0, exports.createEngineFactoryFactory)({
    EngineClass: MockEngineClass,
});
class TestPresetEntryV4 {
    preSetupHook;
    postSetupHook;
    testFunc;
    extraOpts;
    setupTest;
    genTestResults;
    vaults;
    workspaces;
    constructor(func, opts) {
        const { preSetupHook, postSetupHook, extraOpts, setupTest, genTestResults, } = opts || {};
        this.preSetupHook = preSetupHook || (async () => { });
        this.postSetupHook = postSetupHook || (async () => { });
        this.testFunc = lodash_1.default.bind(func, this);
        this.extraOpts = extraOpts;
        this.setupTest = setupTest;
        this.genTestResults = lodash_1.default.bind(genTestResults || (async () => []), this);
        this.workspaces = opts?.workspaces || [];
        this.vaults = opts?.vaults || [
            { fsPath: "vault1" },
            { fsPath: "vault2" },
            {
                name: "vaultThree",
                fsPath: "vault3",
            },
        ];
    }
}
exports.TestPresetEntryV4 = TestPresetEntryV4;
/**
 * If you need to do assert/expect verification inside a callback, then use this
 * method to wrap any assert calls. Otherwise, any assert failures will result
 * in a failed promise instead of an exception, which will cause the test to
 * hang until the test timeout instead of failing immediately with the right
 * error message.
 * @param asserts a function containing your assert/expect statements that you
 * want to test in your test case
 * @param doneArg a jest or mocha done argument
 */
function testAssertsInsideCallback(asserts, doneArg) {
    try {
        asserts();
        doneArg();
    }
    catch (err) {
        doneArg(err);
    }
}
//# sourceMappingURL=utilsv2.js.map