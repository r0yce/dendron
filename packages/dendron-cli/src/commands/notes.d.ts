import { DendronError, DEngineClient, NoteProps } from "@dendronhq/common-all";
import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
import { SetupEngineResp } from "./utils";
type CommandCLIOpts = {
    wsRoot: string;
    vault?: string;
    enginePort?: number;
    query?: string;
    cmd: NoteCommands;
    output?: NoteCLIOutput;
    fname?: string;
    destFname?: string;
    destVaultName?: string;
    newEngine?: boolean;
    body?: string;
};
export declare enum NoteCLIOutput {
    JSON = "json",
    MARKDOWN_GFM = "md_gfm",
    MARKDOWN_DENDRON = "md_dendron"
}
type CommandOpts = CommandCLIOpts & SetupEngineResp & CommandCommonProps;
type CommandOutput = {
    data: any;
    error?: DendronError;
};
export type NoteCommandData = {
    /**
     * String output
     */
    stringOutput: string;
    notesOutput: NoteProps[];
};
export declare enum NoteCommands {
    /**
     * Like lookup, but only look for notes.
     * Returns a list of notes
     */
    LOOKUP = "lookup",
    /**
     * Get note by id.
     */
    GET = "get",
    /**
     * Find note by note properties.
     */
    FIND = "find",
    /**
     * Find or create a note. Uses old engineV2/storeV2
     */
    LOOKUP_LEGACY = "lookup_legacy",
    /**
     * Delete note by fname and vault.
     */
    DELETE = "delete",
    /**
     * Move a note to another vault, or rename a note within a workspace.
     */
    MOVE = "move",
    /**
     * Create or update a note by fname and vault.
     */
    WRITE = "write"
}
export { CommandOpts as NoteCLICommandOpts };
export declare class NoteCLICommand extends CLICommand<CommandOpts, CommandOutput> {
    constructor();
    buildArgs(args: yargs.Argv): void;
    enrichArgs(args: CommandCLIOpts): Promise<{
        data: {
            wsRoot: string;
            engine: DEngineClient;
            port: number;
            server: import("@dendronhq/api-server").Server;
            serverSockets?: Set<import("net").Socket>;
            vault?: string;
            enginePort?: number;
            query?: string;
            cmd: NoteCommands;
            output?: NoteCLIOutput;
            fname?: string;
            destFname?: string;
            destVaultName?: string;
            newEngine?: boolean;
            body?: string;
        };
    }>;
    execute(opts: CommandOpts): Promise<{
        data: NoteCommandData;
        error?: never;
    } | {
        error: DendronError<import("@dendronhq/common-all").StatusCodes | undefined>;
        data: undefined;
    } | {
        data: {
            payload: string;
            rawData: import("@dendronhq/common-all").RespV3SuccessResp<import("@dendronhq/common-all").NoteChangeEntry[]>;
            status: string;
        };
        error?: never;
    } | {
        data: {
            payload: string;
            rawData: import("@dendronhq/common-all").RenameNoteResp;
            status?: never;
        };
        error?: never;
    }>;
}
