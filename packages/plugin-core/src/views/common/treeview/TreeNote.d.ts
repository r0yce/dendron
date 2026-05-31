import { NotePropsMeta, TreeViewItemLabelTypeEnum } from "@dendronhq/common-all";
import vscode, { Uri } from "vscode";
import { URI } from "vscode-uri";
/**
 * Contains {@link NoteProps} representing a single Tree Item inside the
 * NativeTreeView
 */
export declare class TreeNote extends vscode.TreeItem {
    id: string;
    note: NotePropsMeta;
    uri: Uri;
    private _labelType;
    get labelType(): TreeViewItemLabelTypeEnum | undefined;
    set labelType(value: TreeViewItemLabelTypeEnum | undefined);
    constructor(wsRoot: URI, { note, collapsibleState, labelType, }: {
        note: NotePropsMeta;
        collapsibleState: vscode.TreeItemCollapsibleState;
        labelType: TreeViewItemLabelTypeEnum;
    });
}
