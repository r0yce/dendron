import { DVault, NoteProps } from "@dendronhq/common-all";
import { URI } from "vscode-uri";
/**
 * Return hash of written file - this is the vscode version of note2File of common-server
 */
export declare function note2File({ note, vault, wsRoot, }: {
    note: NoteProps;
    vault: DVault;
    wsRoot: URI;
}): Promise<void>;
