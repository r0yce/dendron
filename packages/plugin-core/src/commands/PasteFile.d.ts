import { DendronError } from "@dendronhq/common-all";
import { BasicCommand } from "./base";
type CommandInput = {
    filePath: string;
};
type CommandOpts = CommandInput;
/**
 * fpath: full path to copied file
 */
type CommandOutput = {
    error?: DendronError;
    fpath?: string;
};
export declare class PasteFileCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<CommandInput | undefined>;
    execute(opts: CommandOpts): Promise<{
        error: DendronError<import("@dendronhq/common-all").StatusCodes | undefined>;
        fpath?: never;
    } | {
        fpath: string;
        error?: never;
    }>;
}
export {};
