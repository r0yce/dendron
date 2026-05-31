import { NoteChangeEntry, NoteProps } from "@dendronhq/common-all";
import { DLogger } from "@dendronhq/common-server";
import vscode from "vscode";
export default class RenameProvider implements vscode.RenameProvider {
    private _targetNote;
    private refAtPos;
    L: DLogger;
    set targetNote(value: NoteProps);
    private getRangeForReference;
    trackProxyMetrics({ note, noteChangeEntryCounts, }: {
        note: NoteProps;
        noteChangeEntryCounts: {
            createdCount?: number;
            deletedCount?: number;
            updatedCount?: number;
        };
    }): void;
    executeRename(opts: {
        newName: string;
    }): Promise<{
        changed: NoteChangeEntry[];
    } | undefined>;
    prepareRename(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Range | undefined>;
    provideRenameEdits(_document: vscode.TextDocument, _position: vscode.Position, newName: string): Promise<vscode.WorkspaceEdit>;
}
