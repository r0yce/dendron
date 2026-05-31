import { DEngineClient, DVault, DWorkspace, WorkspaceOpts } from "@dendronhq/common-all";
import { CreateEngineFunction, GenTestResults, RunEngineTestFunctionV4, SetupTestFunctionV4 } from ".";
import { PostSetupHookFunction, PreSetupHookFunction } from "./types";
type EngineOverride = {
    [P in keyof DEngineClient]: (opts: WorkspaceOpts) => DEngineClient[P];
};
export declare const createEngineFactoryFactory: ({ overrides, EngineClass, }: {
    EngineClass: any;
    overrides?: Partial<EngineOverride>;
}) => CreateEngineFunction;
export declare const createMockEngine: CreateEngineFunction;
export declare class TestPresetEntryV4 {
    preSetupHook: PreSetupHookFunction;
    postSetupHook: PostSetupHookFunction;
    testFunc: RunEngineTestFunctionV4;
    extraOpts: any;
    setupTest?: SetupTestFunctionV4;
    genTestResults?: GenTestResults;
    vaults: DVault[];
    workspaces: DWorkspace[];
    constructor(func: RunEngineTestFunctionV4, opts?: {
        preSetupHook?: PreSetupHookFunction;
        postSetupHook?: PostSetupHookFunction;
        extraOpts?: any;
        setupTest?: SetupTestFunctionV4;
        genTestResults?: GenTestResults;
        vaults?: DVault[];
        workspaces?: DWorkspace[];
    });
}
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
export declare function testAssertsInsideCallback(asserts: () => void, doneArg: any): void;
export {};
