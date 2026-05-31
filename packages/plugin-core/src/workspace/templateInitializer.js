"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateInitializer = void 0;
const blankInitializer_1 = require("./blankInitializer");
/**
 * Template Workspace Initializer - add the templates seed to the workspace:
 */
class TemplateInitializer extends blankInitializer_1.BlankInitializer {
    async onWorkspaceCreation(opts) {
        await super.onWorkspaceCreation(opts);
        await opts.svc?.seedService.addSeed({
            id: "dendron.templates",
        });
        return;
    }
}
exports.TemplateInitializer = TemplateInitializer;
//# sourceMappingURL=templateInitializer.js.map