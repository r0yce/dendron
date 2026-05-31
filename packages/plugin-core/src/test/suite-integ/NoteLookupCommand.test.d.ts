import { DendronQuickPickerV2 } from "../../components/lookup/types";
export declare function expectQuickPick(quickPick: DendronQuickPickerV2 | undefined): {
    toIncludeFname: (fname: string) => void;
    toNotIncludeFname: (fname: string) => void;
    toBeEmpty(): void;
};
