import { DEngineClient, NoteProps } from "@dendronhq/common-all";
import { BaseCommand, CommandCommonProps } from "./base";
type CommandOpts = {
    engine: DEngineClient;
    note?: NoteProps;
} & CommonOpts & CommandCommonProps;
type CommonOpts = {
    overwriteFields?: string[];
};
type CommandOutput = CommandCommonProps;
export declare class BackfillV2Command extends BaseCommand<CommandOpts, CommandOutput> {
    execute(opts: CommandOpts): Promise<CommandCommonProps>;
}
export {};
