import vscode from "vscode";
export default class ReferenceHoverProvider implements vscode.HoverProvider {
    private provideHoverNonNote;
    /** Returns a message if this is a non-dendron URI. */
    private handleNonDendronUri;
    private maybeFindNonNoteFile;
    provideHover(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover | null>;
}
