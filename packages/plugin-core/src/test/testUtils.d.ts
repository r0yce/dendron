import { DNodePropsQuickInputV2 } from "@dendronhq/common-all";
import { HistoryEventAction } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import { DendronBtn } from "../components/lookup/ButtonTypes";
import { DendronQuickPickerV2 } from "../components/lookup/types";
export declare function getActiveEditorBasename(): string;
export declare function createMockConfig(settings: any): vscode.WorkspaceConfiguration;
type QuickPickOpts = Partial<{
    value: string;
    selectedItems: DNodePropsQuickInputV2[];
    canSelectMany: boolean;
    buttons: DendronBtn[];
}>;
export declare function createMockQuickPick({ value, selectedItems, canSelectMany, buttons, }: QuickPickOpts): DendronQuickPickerV2;
export declare function onWSInit(cb: Function): void;
export declare function onExtension({ action, cb, }: {
    action: HistoryEventAction;
    cb: Function;
}): void;
export declare function onWatcher({ action, cb, }: {
    action: HistoryEventAction;
    cb: Function;
}): void;
export {};
