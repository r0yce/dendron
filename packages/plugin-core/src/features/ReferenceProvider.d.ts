import vscode from "vscode";
export default class ReferenceProvider implements vscode.ReferenceProvider {
    provideReferences(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Location[] | null>;
}
