import { BaseCommand } from "./base";
type CommandOpts = {
    src: string;
};
type CommandInput = {
    data: string;
};
type CommandOutput = void;
export { CommandOpts as RestoreVaultCommandOpts };
export declare class RestoreVaultCommand extends BaseCommand<CommandOpts, CommandOutput, CommandInput> {
    key: string;
    gatherInputs(): Promise<any>;
    enrichInputs(inputs: CommandInput): Promise<CommandOpts | undefined>;
    execute(opts: CommandOpts): Promise<void>;
}
