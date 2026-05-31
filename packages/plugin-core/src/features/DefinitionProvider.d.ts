import vscode from "vscode";
export default class DefinitionProvider implements vscode.DefinitionProvider {
    private maybeNonNoteFileDefinition;
    private provideForNonNoteFile;
    private provideForNewNote;
    provideDefinition(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): Promise<vscode.Location | vscode.Location[] | undefined>;
}
