"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceInitFactory = void 0;
const engine_server_1 = require("@dendronhq/engine-server");
const blankInitializer_1 = require("./blankInitializer");
const seedBrowserInitializer_1 = require("./seedBrowserInitializer");
const tutorialInitializer_1 = require("./tutorialInitializer");
/**
 * Factory class for creating WorkspaceInitializer types
 */
class WorkspaceInitFactory {
    static create() {
        switch (engine_server_1.MetadataService.instance().getActivationContext()) {
            case engine_server_1.WorkspaceActivationContext.tutorial:
                return new tutorialInitializer_1.TutorialInitializer();
            case engine_server_1.WorkspaceActivationContext.seedBrowser:
                return new seedBrowserInitializer_1.SeedBrowserInitializer();
            default:
                return new blankInitializer_1.BlankInitializer();
        }
    }
}
exports.WorkspaceInitFactory = WorkspaceInitFactory;
//# sourceMappingURL=WorkspaceInitFactory.js.map