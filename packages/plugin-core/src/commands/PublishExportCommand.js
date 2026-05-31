"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishExportCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const pods_core_1 = require("@dendronhq/pods-core");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const site_1 = require("../utils/site");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
class PublishExportCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.PUBLISH_EXPORT.key;
    async gatherInputs() {
        return {};
    }
    async execute() {
        const ctx = "PublishExportCommand";
        this.L.info({ ctx, msg: "enter" });
        const prepareOut = await site_1.NextJSPublishUtils.prepareNextJSExportPod();
        const { enrichedOpts, wsRoot, cmd, nextPath } = prepareOut;
        this.L.info({ ctx, msg: "prepare", enrichedOpts, nextPath });
        if (lodash_1.default.isUndefined(enrichedOpts)) {
            return { nextPath };
        }
        // check if we need to remove .next
        const nextPathExists = await pods_core_1.NextjsExportPodUtils.nextPathExists({
            nextPath,
        });
        if (nextPathExists) {
            await site_1.NextJSPublishUtils.removeNextPath(nextPath);
        }
        // init.
        await site_1.NextJSPublishUtils.initialize(nextPath);
        // build
        const skipBuild = await site_1.NextJSPublishUtils.promptSkipBuild();
        if (!skipBuild) {
            const { podChoice, config } = enrichedOpts;
            await site_1.NextJSPublishUtils.build(cmd, podChoice, config);
        }
        // export
        await site_1.NextJSPublishUtils.export(nextPath);
        const target = await vsCodeUtils_1.VSCodeUtils.showQuickPick(["None", "github"], {
            title: "Select export target.",
            ignoreFocusOut: true,
        });
        if (target && target !== "None") {
            await site_1.NextJSPublishUtils.handlePublishTarget(target, nextPath, wsRoot);
        }
        return { nextPath };
    }
    async showResponse(opts) {
        const { nextPath } = opts;
        vscode_1.window.showInformationMessage(`NextJS template initialized at ${nextPath}, and exported to ${nextPath}/out ${common_all_1.DENDRON_EMOJIS.SEEDLING}`);
    }
}
exports.PublishExportCommand = PublishExportCommand;
//# sourceMappingURL=PublishExportCommand.js.map