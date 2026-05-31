import { PodClassEntryV4, PodItemV4 } from "@dendronhq/pods-core";
import { BaseCommand } from "./base";
import { IDendronExtension } from "../dendronExtensionInterface";
type CommandOutput = void;
type CommandInput = {
    podChoice: PodItemV4;
    quiet?: boolean;
};
type CommandOpts = CommandInput & {
    config: any;
};
export declare class ExportPodCommand extends BaseCommand<CommandOpts, CommandOutput, CommandInput> {
    pods: PodClassEntryV4[];
    key: string;
    private extension;
    constructor(ext: IDendronExtension, _name?: string);
    gatherInputs(): Promise<CommandInput | undefined>;
    enrichInputs(inputs: CommandInput): Promise<CommandOpts | undefined>;
    execute(opts: CommandOpts): Promise<void>;
    addAnalyticsPayload(opts?: CommandOpts): {
        configured: boolean;
        podId?: never;
    } | {
        configured: boolean;
        podId: string;
    };
}
export {};
