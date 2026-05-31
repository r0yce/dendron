"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataSvcTreeViewConfig = void 0;
const engine_server_1 = require("@dendronhq/engine-server");
/**
 * Config for Tree View when extension is run locally- this version pull values from
 * MetadataService
 */
class MetadataSvcTreeViewConfig {
    _labelType = engine_server_1.MetadataService.instance().getTreeViewItemLabelType();
    get LabelTypeSetting() {
        return this._labelType;
    }
    set LabelTypeSetting(labelType) {
        this._labelType = labelType;
        engine_server_1.MetadataService.instance().setTreeViewItemLabelType(labelType);
    }
}
exports.MetadataSvcTreeViewConfig = MetadataSvcTreeViewConfig;
//# sourceMappingURL=MetadataSvcTreeViewConfig.js.map