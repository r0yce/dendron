import { PodItemV4 } from "@dendronhq/pods-core";
import { BaseCommand } from "./base";
import { IDendronExtension } from "../dendronExtensionInterface";
type CommandOpts = CommandInput & {
    noteByName: string;
    config: any;
};
type CommandInput = {
    podChoice: PodItemV4;
};
type CommandOutput = string;
export { CommandOpts as PublishPodCommandOpts };
export declare class PublishPodCommand extends BaseCommand<CommandOpts, CommandOutput, CommandInput> {
    key: string;
    private extension;
    constructor(ext: IDendronExtension);
    gatherInputs(): Promise<CommandInput | undefined>;
    enrichInputs(inputs: CommandInput): Promise<CommandOpts | undefined>;
    execute(opts: CommandOpts): Promise<string>;
    showResponse(resp: string): Promise<void>;
    addAnalyticsPayload(opts?: CommandOpts): {
        configured: boolean;
        podId?: never;
    } | {
        configured: boolean;
        podId: string;
    };
}
