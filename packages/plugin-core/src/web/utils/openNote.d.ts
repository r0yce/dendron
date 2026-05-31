import { DNoteAnchorBasic, DVault } from "@dendronhq/common-all";
import { ViewColumn } from "vscode";
import { URI } from "vscode-uri";
export declare function openNote({ wsRoot, fname, vault, anchor, column, }: {
    wsRoot: URI;
    fname: string;
    vault: DVault;
    anchor?: DNoteAnchorBasic;
    column?: ViewColumn;
}): Promise<void>;
