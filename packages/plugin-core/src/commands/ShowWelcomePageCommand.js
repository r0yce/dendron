"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowWelcomePageCommand = void 0;
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const WelcomeUtils_1 = require("../WelcomeUtils");
const workspace_1 = require("../workspace");
const base_1 = require("./base");
/**
 * This command is a bit of a misnomer - it actually launches the welcome
 * webview page
 */
class ShowWelcomePageCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.SHOW_WELCOME_PAGE.key;
    async gatherInputs() {
        return {};
    }
    async execute(_opts) {
        const assetUri = vsCodeUtils_1.VSCodeUtils.getAssetUri(workspace_1.DendronExtension.context());
        await (0, WelcomeUtils_1.showWelcome)(assetUri);
    }
}
exports.ShowWelcomePageCommand = ShowWelcomePageCommand;
//# sourceMappingURL=ShowWelcomePageCommand.js.map