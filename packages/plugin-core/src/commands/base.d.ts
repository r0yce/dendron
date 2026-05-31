import { DLogger } from "@dendronhq/common-server";
import { window } from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { IBaseCommand } from "../types";
export type CodeCommandConstructor = {
    new (extension: IDendronExtension): CodeCommandInstance;
    requireActiveWorkspace: boolean;
};
export type CodeCommandInstance = {
    key: string;
    run: (opts?: any) => Promise<void>;
};
export type AnalyticProps = {
    props?: any;
};
/** Anything other than `undefined` is an error and will stop the command. "cancel" will stop the command without displaying an error. */
export type SanityCheckResults = undefined | string | "cancel";
/**
 * Base class for all Dendron Plugin Commands.
 *
 *
 * Generics:
 *   - TOpts: passed into {@link BaseCommand.execute}
 *   - TOut: returned by {@link BaseCommand.execute}
 *   - TGatherOutput: returned by {@link BaseCommand.gatherInputs}
 *   - TRunOpts: passed into {@link BaseCommand.run}
 */
export declare abstract class BaseCommand<TOpts, TOut = any, TGatherOutput = TOpts, TRunOpts = TOpts> implements IBaseCommand<TOpts, TOut, TGatherOutput, TRunOpts> {
    L: DLogger;
    constructor(_name?: string);
    addAnalyticsPayload?(opts?: TOpts, out?: TOut): any;
    static showInput: typeof window.showInputBox;
    /**
     * Does this command require an active workspace in order to function
     */
    static requireActiveWorkspace: boolean;
    abstract key: string;
    skipAnalytics?: boolean;
    gatherInputs(_opts?: TRunOpts): Promise<TGatherOutput | undefined>;
    abstract enrichInputs(inputs: TGatherOutput): Promise<TOpts | undefined>;
    abstract execute(opts?: TOpts): Promise<TOut>;
    showResponse(_resp: TOut): Promise<void>;
    /** Check for errors and stop execution if needed, runs before `gatherInputs`. */
    sanityCheck(_opts?: Partial<TRunOpts>): Promise<SanityCheckResults>;
    protected mergeInputs(opts: TOpts, args?: Partial<TRunOpts>): TOpts;
    run(args?: Partial<TRunOpts>): Promise<TOut | undefined>;
}
/**
 * Command with no enriched inputs
 */
export declare abstract class BasicCommand<TOpts, TOut = any, TRunOpts = TOpts> extends BaseCommand<TOpts, TOut, TOpts, TRunOpts> {
    enrichInputs(inputs: TOpts): Promise<TOpts>;
}
/** This command passes the output of `gatherOpts`/`enrichOpts` directly to `execute`.
 *
 * The regular command class tries to merge the inputs from `gatherOpts` and `enrichOpts` together, which
 * will break your code if you use any `TOpts` that is not a basic js object.
 *
 * This is especially useful for commands that accept input directly from VSCode, like {@link ShowPreviewCommand}
 */
export declare abstract class InputArgCommand<TOpts, TOut = any> extends BasicCommand<TOpts, TOut, TOpts> {
    gatherInputs(opts?: TOpts): Promise<TOpts | undefined>;
    protected mergeInputs(opts: TOpts, _args?: Partial<TOpts>): TOpts;
}
