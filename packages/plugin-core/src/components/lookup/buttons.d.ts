import { LookupNoteType, LookupSelectionType } from "@dendronhq/common-all";
import { DendronBtn, LookupEffectType, LookupSplitType, LookupFilterType } from "./ButtonTypes";
import { DendronQuickPickerV2 } from "./types";
export type ButtonType = LookupEffectType | LookupNoteType | LookupSelectionType | LookupSplitType | LookupFilterType | "other";
export type ButtonCategory = "selection" | "note" | "split" | "filter" | "effect" | "other";
export type ButtonHandleOpts = {
    quickPick: DendronQuickPickerV2;
};
export declare class Selection2LinkBtn extends DendronBtn {
    static create(pressed?: boolean): Selection2LinkBtn;
}
export declare class SelectionExtractBtn extends DendronBtn {
    static create(opts: {
        pressed?: boolean;
        canToggle?: boolean;
    }): SelectionExtractBtn;
}
export declare class Selection2ItemsBtn extends DendronBtn {
    static create(opts: {
        pressed?: boolean;
        canToggle?: boolean;
    }): Selection2ItemsBtn;
}
export declare class JournalBtn extends DendronBtn {
    static create(opts?: {
        pressed?: boolean;
        canToggle?: boolean;
    }): JournalBtn;
}
export declare class ScratchBtn extends DendronBtn {
    static create(opts: {
        pressed?: boolean;
        canToggle?: boolean;
    }): ScratchBtn;
}
export declare class TaskBtn extends DendronBtn {
    static create(pressed?: boolean): TaskBtn;
}
export declare class HorizontalSplitBtn extends DendronBtn {
    static create(pressed?: boolean): HorizontalSplitBtn;
}
export declare class DirectChildFilterBtn extends DendronBtn {
    static create(pressed?: boolean): DirectChildFilterBtn;
}
export declare class MultiSelectBtn extends DendronBtn {
    static create(opts: {
        pressed?: boolean;
        canToggle?: boolean;
    }): MultiSelectBtn;
}
export declare class CopyNoteLinkBtn extends DendronBtn {
    static create(pressed?: boolean): CopyNoteLinkBtn;
}
export declare class VaultSelectButton extends DendronBtn {
    static create(opts: {
        pressed?: boolean;
        canToggle?: boolean;
    }): VaultSelectButton;
    get tooltip(): string;
}
export declare function createAllButtons(typesToTurnOn?: ButtonType[]): DendronBtn[];
