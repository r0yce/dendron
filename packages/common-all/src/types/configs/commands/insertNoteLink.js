"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsertNoteLinkAliasModeEnum = void 0;
exports.genDefaultInsertNoteLinkConfig = genDefaultInsertNoteLinkConfig;
/**
 * Enum definitions of possible alias mode values
 */
var InsertNoteLinkAliasModeEnum;
(function (InsertNoteLinkAliasModeEnum) {
    InsertNoteLinkAliasModeEnum["snippet"] = "snippet";
    InsertNoteLinkAliasModeEnum["selection"] = "selection";
    InsertNoteLinkAliasModeEnum["title"] = "title";
    InsertNoteLinkAliasModeEnum["prompt"] = "prompt";
    InsertNoteLinkAliasModeEnum["none"] = "none";
})(InsertNoteLinkAliasModeEnum || (exports.InsertNoteLinkAliasModeEnum = InsertNoteLinkAliasModeEnum = {}));
/**
 * Generates default {@link InsertNoteLinkConfig}
 * @returns InsertNoteLinkConfig
 */
function genDefaultInsertNoteLinkConfig() {
    return {
        aliasMode: InsertNoteLinkAliasModeEnum.none,
        enableMultiSelect: false,
    };
}
//# sourceMappingURL=insertNoteLink.js.map