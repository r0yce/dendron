"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaunchTutorialWorkspaceCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const path_1 = __importDefault(require("path"));
const constants_1 = require("../constants");
const analytics_1 = require("../utils/analytics");
const tutorialInitializer_1 = require("../workspace/tutorialInitializer");
const base_1 = require("./base");
const SetupWorkspace_1 = require("./SetupWorkspace");
/**
 * Helper command to launch the user into a new tutorial workspace.
 */
class LaunchTutorialWorkspaceCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.LAUNCH_TUTORIAL_WORKSPACE.key;
    async execute(opts) {
        // Try to put into a default '~/Dendron' folder first. If path is occupied,
        // create a new folder with an numbered suffix
        const { filePath } = common_server_1.FileUtils.genFilePathWithSuffixThatDoesNotExist({
            fpath: path_1.default.join((0, common_server_1.resolveTilde)("~"), "Dendron"),
        });
        // Since this command will cause a window reload, track this telemetry point
        // via trackForNextRun
        await analytics_1.AnalyticsUtils.trackForNextRun(common_all_1.TutorialEvents.TutorialWorkspaceLaunching, {
            invocationPoint: opts.invocationPoint,
        });
        await new SetupWorkspace_1.SetupWorkspaceCommand().execute({
            rootDirRaw: filePath,
            workspaceInitializer: new tutorialInitializer_1.TutorialInitializer(),
            workspaceType: common_all_1.WorkspaceType.CODE,
            EXPERIMENTAL_openNativeWorkspaceNoReload: false,
        });
    }
}
exports.LaunchTutorialWorkspaceCommand = LaunchTutorialWorkspaceCommand;
//# sourceMappingURL=LaunchTutorialWorkspaceCommand.js.map