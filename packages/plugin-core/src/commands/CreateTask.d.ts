import { NoteAddBehaviorEnum } from "@dendronhq/common-all";
import { BasicCommand } from "./base";
import { CommandOutput as NoteLookupOutput } from "./NoteLookupCommand";
type CommandOpts = {};
type CommandOutput = {
    lookup: Promise<NoteLookupOutput | undefined>;
    addBehavior: NoteAddBehaviorEnum;
};
export { CommandOpts as CreateTaskOpts };
export declare class CreateTaskCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    /**
     * Returns all vaults added
     * @param opts
     * @returns
     */
    execute(opts: CommandOpts): Promise<{
        lookup: Promise<NoteLookupOutput | undefined>;
        addBehavior: NoteAddBehaviorEnum;
    }>;
    addAnalyticsPayload(_opts: CommandOpts, res: CommandOutput): {
        addBehavior: NoteAddBehaviorEnum;
    };
}
