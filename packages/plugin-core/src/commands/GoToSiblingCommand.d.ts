import { DEngineClient, NotePropsMeta } from "@dendronhq/common-all";
import { BasicCommand } from "./base";
type Direction = "next" | "prev";
type CommandOpts = {
    direction: Direction;
};
export { CommandOpts as GoToSiblingCommandOpts };
type CommandOutput = {
    msg: "ok" | "no_editor" | "no_siblings" | "other_error";
};
export declare class GoToSiblingCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<any>;
    execute(opts: CommandOpts): Promise<CommandOutput>;
    getActiveNote(engine: DEngineClient, fname: string): Promise<NotePropsMeta | null>;
    private canBeHandledAsJournalNote;
    private getSiblingForJournalNote;
    private getSiblingsForJournalNote;
    private getSibling;
    private getSiblings;
    private sortNotes;
    private getDateFromJournalNote;
}
