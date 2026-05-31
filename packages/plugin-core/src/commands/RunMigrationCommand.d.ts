import { MigrationChangeSetStatus } from "@dendronhq/engine-server";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
type CommandOpts = {
    version: string;
};
type CommandInput = {
    version: string;
};
type CommandOutput = MigrationChangeSetStatus[];
export declare class RunMigrationCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    private extension;
    constructor(ext: IDendronExtension);
    gatherInputs(opts?: CommandInput): Promise<CommandInput | undefined>;
    execute(opts: CommandOpts): Promise<CommandOutput>;
}
export {};
