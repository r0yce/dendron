import { BasicCommand } from "./base";
import { CommandOutput as NoteLookupCommandOut } from "./NoteLookupCommand";
type CommandOpts = {
    noConfirm?: boolean | undefined;
};
type CommandOutput = NoteLookupCommandOut;
export declare class GoDownCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<any>;
    execute(opts: CommandOpts): Promise<NoteLookupCommandOut>;
}
export {};
