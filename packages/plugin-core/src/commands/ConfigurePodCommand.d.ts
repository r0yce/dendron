import { PodClassEntryV4 } from "@dendronhq/pods-core";
import { BasicCommand } from "./base";
import { IDendronExtension } from "../dendronExtensionInterface";
type CommandOutput = void;
type CommandInput = {
    podClass: PodClassEntryV4;
};
type CommandOpts = CommandInput;
export declare class ConfigurePodCommand extends BasicCommand<CommandOpts, CommandOutput> {
    pods: PodClassEntryV4[];
    private extension;
    key: string;
    constructor(ext: IDendronExtension, _name?: string);
    gatherInputs(): Promise<CommandInput | undefined>;
    execute(opts: CommandOpts): Promise<void>;
}
export {};
