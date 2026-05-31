import { Location } from "vscode";
import { BasicCommand } from "./base";
type CommandOpts = {
    location: Location;
    text: string;
};
type CommandOutput = void;
export declare class ConvertCandidateLinkCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(_opts: CommandOpts): Promise<CommandOpts>;
    execute(_opts: CommandOpts): Promise<void>;
}
export {};
