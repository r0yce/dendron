import { PodClassEntryV4, PodExportScope } from "@dendronhq/pods-core";
import { BaseCommand, CodeCommandInstance } from "../base";
type CommandOutput = void;
type CommandInput = CodeCommandInstance;
type CommandOpts = CodeCommandInstance;
type GatherOpts = {
    podId: string;
    exportScope?: PodExportScope;
};
/**
 * Command that will find the appropriate export command to run, and then run
 * it. This is the UI entry point for all export pod functionality.
 */
export declare class ExportPodV2Command extends BaseCommand<CommandOpts, CommandOutput, CommandInput, GatherOpts> {
    pods: PodClassEntryV4[];
    key: string;
    constructor(_name?: string);
    /**
     * Get from the user which
     * @returns a CommandInput for a Pod Export Command to run in turn, or
     * undefined if the user didn't select anything.
     */
    gatherInputs(args?: GatherOpts): Promise<CommandInput | undefined>;
    /**
     * no-op
     */
    enrichInputs(inputs: CommandInput): Promise<CommandOpts | undefined>;
    execute(opts: CommandOpts): Promise<void>;
    addAnalyticsPayload(opts: CommandOpts): {
        configured: boolean;
        pod: string;
    };
}
export {};
