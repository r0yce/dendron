import { NoteProps } from "@dendronhq/common-all";
import { PodClassEntryV4, PodItemV4 } from "@dendronhq/pods-core";
import { BaseCommand } from "./base";
type CommandOutput = NoteProps[];
export type CommandInput = {
    podChoice: PodItemV4;
};
export type CommandOpts = CommandInput & {
    config: any;
};
export declare class ImportPodCommand extends BaseCommand<CommandOpts, CommandOutput, CommandInput> {
    pods: PodClassEntryV4[];
    key: string;
    constructor(_name?: string);
    gatherInputs(): Promise<{
        podChoice: import("../utils/pods").PodQuickPickItemV4;
    } | undefined>;
    enrichInputs(inputs: CommandInput): Promise<CommandOpts | undefined>;
    execute(opts: CommandOpts): Promise<NoteProps[]>;
    addAnalyticsPayload(opts?: CommandOpts, out?: NoteProps[]): {
        importCount: number | undefined;
        configured: boolean;
        podId?: never;
    } | {
        importCount: number | undefined;
        configured: boolean;
        podId: string;
    };
}
export {};
