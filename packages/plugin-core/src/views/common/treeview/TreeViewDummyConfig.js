"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeViewDummyConfig = void 0;
const common_all_1 = require("@dendronhq/common-all");
/**
 * Dummy Config for Tree View - this version doesn't pull values from
 * MetadataService or any other persisted storage, nor does it save any settings
 * that a user specified beyond their current session. This is meant to be used
 * in Dendron Web Extension until persistent settings can be implemented in the
 * Web Extension.
 */
class TreeViewDummyConfig {
    _labelType = common_all_1.TreeViewItemLabelTypeEnum.filename;
    /**
     * This just defaults to sorting by file name initially
     */
    get LabelTypeSetting() {
        return this._labelType;
    }
    /**
     * This doesn't touch any persistent settings
     */
    set LabelTypeSetting(_value) {
        this._labelType = _value;
    }
}
exports.TreeViewDummyConfig = TreeViewDummyConfig;
//# sourceMappingURL=TreeViewDummyConfig.js.map