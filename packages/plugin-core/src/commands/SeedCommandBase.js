"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedCommandBase = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const vscode_1 = require("vscode");
const workspace_1 = require("../workspace");
const base_1 = require("./base");
class SeedCommandBase extends base_1.BasicCommand {
    seedSvc = undefined;
    constructor(seedSvc) {
        super();
        if (seedSvc !== undefined) {
            this.seedSvc = seedSvc;
        }
    }
    // Have lazy initialization on SeedService if it's not explicitly set in the
    // constructor. Ideally, SeedService should be set as a readonly prop in the
    // constructor, but right now the workspace from getWS() isn't set up by the
    // time the commands are constructed in the initialization lifecycle.
    getSeedSvc() {
        if (!this.seedSvc) {
            const wsService = (0, workspace_1.getExtension)().workspaceService;
            if (!wsService) {
                throw new common_all_1.DendronError({
                    message: `workspace service unavailable`,
                    severity: common_all_1.ERROR_SEVERITY.MINOR,
                });
            }
            else {
                this.seedSvc = wsService.seedService;
            }
        }
        return this.seedSvc;
    }
    async onUpdatingWorkspace() {
        engine_server_1.MetadataService.instance().setActivationContext(engine_server_1.WorkspaceActivationContext.seedBrowser);
    }
    async onUpdatedWorkspace() {
        await vscode_1.commands.executeCommand("workbench.action.reloadWindow");
    }
}
exports.SeedCommandBase = SeedCommandBase;
//# sourceMappingURL=SeedCommandBase.js.map