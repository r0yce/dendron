import { TreeViewItemLabelTypeEnum } from "@dendronhq/common-all";
import { ITreeViewConfig } from "../../common/treeview/ITreeViewConfig";
/**
 * Config for Tree View when extension is run locally- this version pull values from
 * MetadataService
 */
export declare class MetadataSvcTreeViewConfig implements ITreeViewConfig {
    private _labelType;
    get LabelTypeSetting(): TreeViewItemLabelTypeEnum;
    set LabelTypeSetting(labelType: TreeViewItemLabelTypeEnum);
}
