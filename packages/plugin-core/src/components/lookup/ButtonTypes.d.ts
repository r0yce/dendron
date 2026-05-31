import { LookupNoteType, LookupSelectionType } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { QuickInputButton, ThemeIcon } from "vscode";
export type LookupFilterType = "directChildOnly";
export declare enum LookupEffectTypeEnum {
    "copyNoteLink" = "copyNoteLink",
    "copyNoteRef" = "copyNoteRef",
    "multiSelect" = "multiSelect"
}
export declare enum LookupSplitTypeEnum {
    "horizontal" = "horizontal"
}
export type LookupSplitType = "horizontal";
export type LookupEffectType = "copyNoteLink" | "copyNoteRef" | "multiSelect";
export type LookupNoteExistBehavior = "open" | "overwrite";
export type LookupSelectVaultType = "selectVault";
export type ButtonType = LookupEffectType | LookupNoteType | LookupSelectionType | LookupSplitType | LookupFilterType | LookupSelectVaultType;
export type ButtonCategory = "selection" | "note" | "split" | "filter" | "effect" | "selectVault";
export declare function getButtonCategory(button: DendronBtn): ButtonCategory;
export type IDendronQuickInputButton = QuickInputButton & {
    type: ButtonType;
    description: string;
    pressed: boolean;
};
type DendronBtnCons = {
    title: string;
    description: string;
    iconOff: string;
    iconOn: string;
    type: ButtonType;
    pressed?: boolean | undefined;
    canToggle?: boolean | undefined;
};
export declare class DendronBtn implements IDendronQuickInputButton {
    iconPathNormal: ThemeIcon;
    iconPathPressed: ThemeIcon;
    type: ButtonType;
    description: string;
    private _pressed;
    canToggle: boolean;
    title: string;
    opts: DendronBtnCons;
    get pressed(): boolean;
    set pressed(isPressed: boolean);
    onLookup: (_payload: any) => Promise<void>;
    constructor(opts: DendronBtnCons);
    clone(): DendronBtn;
    get iconPath(): vscode.ThemeIcon;
    get tooltip(): string;
    toggle(): void;
}
export {};
