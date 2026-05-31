import { DEngineClient, DVault, NoteProps, ValidateFnameResp } from "@dendronhq/common-all";
import { DoctorActionsEnum } from "@dendronhq/engine-server";
import { QuickPick } from "vscode";
import { DoctorBtn } from "../components/doctor/buttons";
import { DoctorScopeType } from "../components/doctor/types";
import { BasicCommand } from "./base";
import { IDendronExtension } from "../dendronExtensionInterface";
type Finding = {
    issue: string;
    fix?: string;
};
type IncompatibleExtensionInstallStatus = {
    id: string;
    installed: boolean;
};
type CommandOptsData = {
    installStatus?: IncompatibleExtensionInstallStatus[];
    note?: NoteProps;
};
type CommandOpts = {
    action: DoctorActionsEnum | PluginDoctorActionsEnum;
    scope: DoctorScopeType;
    data?: CommandOptsData;
};
type CommandOutput = {
    data: Finding[];
    extra: any;
};
type CreateQuickPickOpts = {
    title: string;
    placeholder: string;
    items: DoctorQuickInput[];
    /**
     * QuickPick.ignoreFocusOut prop
     */
    ignoreFocusOut?: boolean;
    nonInteractive?: boolean;
    buttons?: DoctorBtn[];
};
type DoctorQuickInput = {
    label: string;
    detail?: string;
    alwaysShow?: boolean;
};
type DoctorQuickPickItem = QuickPick<DoctorQuickInput>;
export declare enum PluginDoctorActionsEnum {
    FIND_INCOMPATIBLE_EXTENSIONS = "findIncompatibleExtensions",
    FIX_KEYBINDING_CONFLICTS = "fixKeybindingConflicts"
}
export declare class DoctorCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    private extension;
    constructor(ext: IDendronExtension);
    getHierarchy(): Promise<{
        hierarchy: string;
        vault: DVault;
    } | undefined>;
    createQuickPick(opts: CreateQuickPickOpts): DoctorQuickPickItem;
    onTriggerButton: (quickpick: DoctorQuickPickItem) => Promise<void>;
    gatherInputs(inputs: CommandOpts): Promise<CommandOpts | undefined>;
    showMissingNotePreview(candidates: NoteProps[]): Promise<void>;
    showBrokenLinkPreview(brokenLinks: {
        file: string;
        vault: string;
        links: {
            value: string;
            line: number;
            column: number;
        }[];
    }[], engine: DEngineClient): Promise<void>;
    showIncompatibleExtensionPreview(opts: {
        installStatus: IncompatibleExtensionInstallStatus[];
    }): Promise<{
        installStatus: IncompatibleExtensionInstallStatus[];
        contents: string;
    }>;
    showFixInvalidFileNamePreview(opts: {
        canRename: {
            cleanedFname: string;
            canRename: boolean;
            note: NoteProps;
            resp: ValidateFnameResp;
        }[];
        cantRename: {
            cleanedFname: string;
            canRename: boolean;
            note: NoteProps;
            resp: ValidateFnameResp;
        }[];
    }): Promise<void>;
    private reload;
    addAnalyticsPayload(opts: CommandOpts, out: CommandOutput): {
        action: DoctorActionsEnum | PluginDoctorActionsEnum;
        scope: DoctorScopeType;
    };
    execute(opts: CommandOpts): Promise<{
        data: Finding[];
        extra: any;
    }>;
    showResponse(findings: CommandOutput): Promise<void>;
}
export {};
