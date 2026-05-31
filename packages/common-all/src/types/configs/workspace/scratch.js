"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genDefaultScratchConfig = genDefaultScratchConfig;
const types_1 = require("./types");
/**
 * Generates default {@link ScratchConfig}
 * @returns ScratchConfig
 */
function genDefaultScratchConfig() {
    return {
        name: "scratch",
        dateFormat: "y.MM.dd.HHmmss",
        addBehavior: types_1.NoteAddBehaviorEnum.asOwnDomain,
    };
}
//# sourceMappingURL=scratch.js.map