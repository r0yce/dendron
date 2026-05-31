"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genDefaultDendronConfig = genDefaultDendronConfig;
const commands_1 = require("./commands/commands");
const DendronWorkspaceConfig_1 = require("./workspace/DendronWorkspaceConfig");
const preview_1 = require("./preview/preview");
const publishing_1 = require("./publishing/publishing");
const DendronDevConfig_1 = require("./dev/DendronDevConfig");
/**
 * Generates a default DendronConfig using
 * respective default config generators of each sub config groups.
 * @returns DendronConfig
 */
function genDefaultDendronConfig() {
    return {
        version: 5,
        commands: (0, commands_1.genDefaultCommandConfig)(),
        workspace: (0, DendronWorkspaceConfig_1.genDefaultWorkspaceConfig)(),
        preview: (0, preview_1.genDefaultPreviewConfig)(),
        publishing: (0, publishing_1.genDefaultPublishingConfig)(),
        dev: (0, DendronDevConfig_1.genDefaultDevConfig)(),
    };
}
//# sourceMappingURL=dendronConfig.js.map