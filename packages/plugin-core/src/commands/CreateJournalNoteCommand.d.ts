import { BasicCommand } from "./base";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import { CommandRunOpts as NoteLookupRunOpts } from "./NoteLookupCommand";
import { IDendronExtension } from "../dendronExtensionInterface";
type CommandOpts = NoteLookupRunOpts;
type CommandOutput = void;
export { CommandOpts as CreateJournalNoteOpts };
export declare class CreateJournalNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    private extension;
    constructor(ext: IDendronExtension);
    createLookupController(): ILookupControllerV3;
    execute(opts: CommandOpts): Promise<void>;
}
