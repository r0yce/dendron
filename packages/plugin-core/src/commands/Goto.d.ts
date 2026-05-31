import { RespV3 } from "@dendronhq/common-all";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
import { GoToNoteCommandOutput, TargetKind } from "./GoToNoteInterface";
type CommandOpts = {};
type CommandOutput = RespV3<GoToNoteCommandOutput>;
/**
 * Go to the current link under cursor. This command will exhibit different behavior depending on the type of the link.
 * See [[dendron.ref.commands.goto]] for more details
 */
export declare class GotoCommand extends BasicCommand<CommandOpts, CommandOutput> {
    private _ext;
    key: string;
    constructor(_ext: IDendronExtension);
    addAnalyticsPayload(_opts?: CommandOpts, out?: RespV3<GoToNoteCommandOutput>): {
        kind?: never;
        type?: never;
    } | {
        kind: TargetKind;
        type: import("./GoToNoteInterface").GotoFileType;
    } | {
        kind: TargetKind;
        type?: never;
    };
    execute(): Promise<CommandOutput>;
    private goToNoteLink;
    private goToExternalLink;
    private openLink;
}
export {};
