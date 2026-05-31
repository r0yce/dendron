import { Conflict, NoteProps, PodConflictResolveOpts } from "@dendronhq/common-all";
import { PodItemV4 } from "@dendronhq/pods-core";
import { ProgressLocation, QuickPickItem, window } from "vscode";
import { GLOBAL_STATE } from "../constants";
export type PodQuickPickItemV4 = QuickPickItem & PodItemV4;
export declare const showPodQuickPickItemsV4: (podItem: PodItemV4[]) => Thenable<PodQuickPickItemV4 | undefined>;
export declare const launchGoogleOAuthFlow: (id?: string) => Promise<void>;
export declare const showDocumentQuickPick: (docs: string[]) => Promise<{
    label: string;
} | undefined>;
export declare const showInputBox: (options: any, title?: string) => Promise<string | undefined>;
export declare const updateGlobalState: (opts: {
    key: GLOBAL_STATE;
    value: any;
}) => Promise<void>;
export declare const getGlobalState: (key: GLOBAL_STATE) => Promise<string | undefined>;
export declare const openFileInEditor: (note: NoteProps) => Promise<void>;
export declare const getSelectionFromQuickpick: (pagesMap: string[]) => Promise<string | undefined>;
export declare const withProgressOpts: {
    withProgress: typeof window.withProgress;
    location: ProgressLocation;
    showMessage: typeof window.showInformationMessage;
};
export declare const handleConflict: (conflict: Conflict, conflictResolveOpts: PodConflictResolveOpts) => Promise<string | undefined>;
