"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genDefaultGlobalConfig = genDefaultGlobalConfig;
/**
 * Generates default for {@link DendronGlobalConfig}
 * @returns DendronGlobalConfig
 */
function genDefaultGlobalConfig() {
    return {
        enableFMTitle: true, // TODO: split implementation to respect non-global config
        enableNoteTitleForLink: true, // TODO: split
        enableKatex: true,
        enablePrettyRefs: true,
        enableChildLinks: true,
        enableBackLinks: true,
    };
}
//# sourceMappingURL=global.js.map