import { InputArgCommand } from "./base";
import { CommandOutput as NoteLookupOutput } from "./NoteLookupCommand";
type CommandOpts = string & {};
type CommandOutput = {
    lookup: Promise<NoteLookupOutput | undefined>;
};
export declare class CreateNoteCommand extends InputArgCommand<CommandOpts, CommandOutput> {
    key: string;
    execute(opts: CommandOpts): Promise<{
        lookup: Promise<NoteLookupOutput | undefined>;
    }>;
}
export {};
