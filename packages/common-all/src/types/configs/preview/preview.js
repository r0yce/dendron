"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genDefaultPreviewConfig = genDefaultPreviewConfig;
/**
 * Generate defaults for {@link DendronPreviewConfig}
 * @returns DendronPreviewConfig
 */
function genDefaultPreviewConfig() {
    return {
        enableFMTitle: true,
        enableNoteTitleForLink: true,
        enableFrontmatterTags: true,
        enableHashesForFMTags: false,
        enablePrettyRefs: true,
        enableKatex: true,
        automaticallyShowPreview: false,
    };
}
//# sourceMappingURL=preview.js.map