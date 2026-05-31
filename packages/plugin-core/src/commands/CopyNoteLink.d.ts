import { Disposable } from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandOutput = {
    link: string;
    type: string;
    anchorType?: string;
} | undefined;
export declare class CopyNoteLinkCommand extends BasicCommand<CommandOpts, CommandOutput> implements Disposable {
    static requireActiveWorkspace: boolean;
    key: string;
    private extension;
    private _onEngineNoteStateChangedDisposable;
    constructor(ext: IDendronExtension);
    sanityCheck(): Promise<"No document open" | undefined>;
    showFeedback(link: string): Promise<void>;
    private getUserLinkAnchorPreference;
    private createNonNoteFileLink;
    private createNoteLink;
    addAnalyticsPayload(_opts: CommandOpts, resp: CommandOutput): {
        type: string | undefined;
        anchorType: string | undefined;
    };
    private anchorType;
    execute(_opts: CommandOpts): Promise<{
        link: string;
        type: string;
        anchorType: string | undefined;
    } | undefined>;
    dispose(): void;
    private executeCopyNoteLink;
}
export {};
