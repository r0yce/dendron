import { DendronError } from "@dendronhq/common-all";
import { ParseLinkV2Resp } from "@dendronhq/unified";
import { QuickPickItem, Range } from "vscode";
import { NoteLookupProviderSuccessResp } from "../components/lookup/LookupProviderV3Interface";
import { getReferenceAtPositionResp } from "../utils/md";
import { BasicCommand } from "./base";
type CommandOpts = {
    range: Range;
    text: string;
};
type CommandOutput = void;
export declare class ConvertLinkCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    static noAvailableOperationError(): DendronError<import("@dendronhq/common-all").StatusCodes | undefined>;
    static noVaultError(): DendronError<import("@dendronhq/common-all").StatusCodes | undefined>;
    static noLinkError(): DendronError<import("@dendronhq/common-all").StatusCodes | undefined>;
    static noTextError(): DendronError<import("@dendronhq/common-all").StatusCodes | undefined>;
    prepareBrokenLinkConvertOptions(reference: getReferenceAtPositionResp): {
        options: QuickPickItem[];
        parsedLink: ParseLinkV2Resp;
    };
    promptBrokenLinkConvertOptions(reference: getReferenceAtPositionResp): Promise<{
        option: QuickPickItem | undefined;
        parsedLink: ParseLinkV2Resp;
    }>;
    lookupNewDestination(): Promise<NoteLookupProviderSuccessResp | undefined>;
    promptBrokenLinkUserInput(): Promise<string | undefined>;
    prepareBrokenLinkOperation(opts: {
        option: QuickPickItem | undefined;
        parsedLink: ParseLinkV2Resp;
        reference: getReferenceAtPositionResp;
    }): Promise<string | undefined>;
    promptConfirmation(opts: {
        title: string;
        noConfirm?: boolean;
    }): Promise<boolean>;
    prepareValidLinkOperation(reference: getReferenceAtPositionResp): Promise<{
        range: Range;
        text: string;
    }>;
    gatherInputs(): Promise<CommandOpts>;
    execute(opts: CommandOpts): Promise<void>;
}
export {};
