import { QuickInputButton, ThemeIcon } from "vscode";
import { DoctorQuickPickItem, DoctorScopeType } from "./types";
export type DoctorQuickPicker = DoctorQuickPickItem & {
    /**
     * Buttons control modifiers for doctor
     */
    buttons: DoctorBtn[];
    nonInteractive?: boolean;
};
export type ButtonType = DoctorScopeType;
export type ButtonHandleOpts = {
    quickPick: DoctorQuickPicker;
};
export type IDoctorQuickInputButton = QuickInputButton & {
    type: ButtonType;
    pressed: boolean;
};
type DoctorBtnConstructorOpts = {
    title: string;
    iconOff: string;
    iconOn: string;
    type: ButtonType;
    pressed?: boolean | undefined;
    canToggle?: boolean | undefined;
};
export declare class DoctorBtn implements IDoctorQuickInputButton {
    iconPathNormal: ThemeIcon;
    iconPathPressed: ThemeIcon;
    type: ButtonType;
    pressed: boolean;
    canToggle: boolean;
    title: string;
    opts: DoctorBtnConstructorOpts;
    constructor(opts: DoctorBtnConstructorOpts);
    clone(): DoctorBtn;
    onEnable(_opts: ButtonHandleOpts): Promise<void>;
    onDisable(_opts: ButtonHandleOpts): Promise<void>;
    get iconPath(): ThemeIcon;
    get tooltip(): string;
    toggle(): void;
}
export declare class ChangeScopeBtn extends DoctorBtn {
    static create(pressed?: boolean): ChangeScopeBtn;
}
export {};
