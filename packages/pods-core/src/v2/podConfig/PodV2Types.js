"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PodExportScope = exports.PodV2Types = void 0;
exports.isExportPodConfigurationV2 = isExportPodConfigurationV2;
/**
 * Pod Types that work with the V2 workflow
 */
var PodV2Types;
(function (PodV2Types) {
    PodV2Types["AirtableExportV2"] = "AirtableExportV2";
    PodV2Types["MarkdownExportV2"] = "MarkdownExportV2";
    PodV2Types["GoogleDocsExportV2"] = "GoogleDocsExportV2";
    PodV2Types["NotionExportV2"] = "NotionExportV2";
    PodV2Types["JSONExportV2"] = "JSONExportV2";
})(PodV2Types || (exports.PodV2Types = PodV2Types = {}));
/**
 * Specifies what information to export
 */
var PodExportScope;
(function (PodExportScope) {
    PodExportScope["Note"] = "Note";
    PodExportScope["Lookup"] = "Lookup";
    PodExportScope["Selection"] = "Selection";
    PodExportScope["Hierarchy"] = "Hierarchy";
    PodExportScope["Vault"] = "Vault";
    PodExportScope["Workspace"] = "Workspace";
    PodExportScope["LinksInSelection"] = "LinksInSelection";
})(PodExportScope || (exports.PodExportScope = PodExportScope = {}));
/**
 * Helper function to perform a type check on an object to see if it's an
 * instance of {@link ExportPodConfigurationV2}
 * @param object
 * @returns
 */
function isExportPodConfigurationV2(object) {
    return (object !== undefined &&
        "podId" in object &&
        "podType" in object &&
        "exportScope" in object);
}
//# sourceMappingURL=PodV2Types.js.map