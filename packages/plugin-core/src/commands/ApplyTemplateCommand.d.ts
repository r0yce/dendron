import { NoteProps } from "@dendronhq/common-all";
import { BasicCommand } from "./base";
type CommandInput = CommandOpts;
type CommandOpts = {
    templateNote: NoteProps;
    targetNote: NoteProps;
};
type CommandOutput = {
    updatedTargetNote?: NoteProps;
};
export declare class ApplyTemplateCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    sanityCheck(): Promise<"No document open" | "Please save the current document before applying a template" | undefined>;
    gatherInputs(): Promise<CommandInput | undefined>;
    execute(opts: CommandOpts): Promise<{
        updatedTargetNote: undefined;
    } | {
        updatedTargetNote: NoteProps;
    }>;
}
export {};
