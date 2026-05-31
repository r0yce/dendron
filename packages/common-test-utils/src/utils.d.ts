import { DEngineClient, DEngineInitResp, NotePropsByIdDict, WorkspaceOpts } from "@dendronhq/common-all";
import { SetupHookFunction, TestResult } from "./types";
export declare const toPlainObject: <R>(value: unknown) => R;
export declare class AssertUtils {
    static assertInString({ body, match, nomatch, }: {
        body: string;
        match?: (string | RegExp)[];
        nomatch?: (string | RegExp)[];
    }): Promise<boolean>;
    /** Asserts that the gives strings appear the expected number of times in this string.
     *
     * parameters `match`, `fewerThan`, and `moreThan` should look like:
     *     [ [2, "Lorem ipsum"], [1, "foo bar"] ]
     *
     * @param match Must appear exactly this many times.
     * @param fewerThan Must appear fewer than this many times.
     * @param moreThan Must appear more than this many times.
     */
    static assertTimesInString({ body, match, fewerThan, moreThan, }: {
        body: string;
        match?: [number, string | RegExp][];
        fewerThan?: [number, string | RegExp][];
        moreThan?: [number, string | RegExp][];
    }): Promise<boolean>;
}
export declare class TestPresetEntry<TBeforeOpts, TAfterOpts = any, TResultsOpts = any> {
    label: string;
    beforeTestResults: (_opts: TBeforeOpts) => Promise<any>;
    /**
     * Run this before setting up workspace
     */
    preSetupHook: SetupHookFunction;
    /**
     * Run this before setting up hooks
     */
    postSetupHook: SetupHookFunction;
    after: (_opts: TAfterOpts) => Promise<any>;
    results: (_opts: TResultsOpts) => Promise<TestResult[]>;
    init: () => Promise<void>;
    notes: NotePropsByIdDict;
    constructor({ label, results, beforeTestResults, after, preSetupHook, postSetupHook, }: {
        label: string;
        preSetupHook?: SetupHookFunction;
        postSetupHook?: SetupHookFunction;
        beforeSetup?: (_opts: TBeforeOpts) => Promise<any>;
        beforeTestResults?: (_opts: TBeforeOpts) => Promise<any>;
        after?: (_opts: TAfterOpts) => Promise<any>;
        results: (_opts: TResultsOpts) => Promise<TestResult[]>;
    });
}
export declare function runMochaHarness<TOpts>(results: any, opts?: TOpts): Promise<void[]>;
export declare function runJestHarnessV2(results: any, expect: any): Promise<void[]>;
export type RunEngineTestFunctionOpts = {
    engine: DEngineClient;
    initResp: DEngineInitResp;
} & WorkspaceOpts;
export type RunEngineTestFunction = (opts: RunEngineTestFunctionOpts) => Promise<any>;
/**
 * Used to test a function. If this test is meant to be run
 * both for `mocha` and `jest`, return a `TestResult` object.
 * Otherwise, use the default assertion library of
 * your current test runner
 */
export type RunEngineTestFunctionV4<T = any, TExtra = any> = (opts: RunEngineTestFunctionOpts & {
    extra?: TExtra;
}) => Promise<TestResult[] | void | T>;
export type SetupTestFunctionV4 = (opts: RunEngineTestFunctionOpts & {
    extra?: any;
}) => Promise<any>;
export type GenTestResults = (opts: RunEngineTestFunctionOpts & {
    extra?: any;
}) => Promise<TestResult[]>;
export type CreateEngineFunction = (opts: WorkspaceOpts) => DEngineClient;
