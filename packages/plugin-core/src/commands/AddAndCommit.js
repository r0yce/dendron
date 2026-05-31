"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAndCommit = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
const L = logger_1.Logger;
class AddAndCommit extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.ADD_AND_COMMIT.key;
    static generateReportMessage({ committed, }) {
        const message = ["Finished Commit."];
        // Report anything unusual the user probably should know about
        let maxMessageSeverity = vsCodeUtils_1.MessageSeverity.INFO;
        const makeMessage = (status, results, fn) => {
            const uniqResults = lodash_1.default.uniq(lodash_1.default.flattenDeep(results));
            const repos = engine_server_1.WorkspaceUtils.getFilteredRepoNames(uniqResults, status);
            if (repos.length === 0)
                return;
            const { msg, severity } = fn(repos.join(", "));
            message.push(msg);
            if (severity > maxMessageSeverity)
                maxMessageSeverity = severity;
        };
        // Warnings, need user interaction to continue commit
        makeMessage(engine_server_1.SyncActionStatus.MERGE_CONFLICT, [committed], (repos) => {
            return {
                msg: `Skipped ${repos} because they have merge conflicts that must be resolved manually.`,
                severity: vsCodeUtils_1.MessageSeverity.WARN,
            };
        });
        makeMessage(engine_server_1.SyncActionStatus.NO_CHANGES, [committed], (repos) => {
            return {
                msg: `Skipped ${repos} because it has no new changes.`,
                severity: vsCodeUtils_1.MessageSeverity.INFO,
            };
        });
        makeMessage(engine_server_1.SyncActionStatus.REBASE_IN_PROGRESS, [committed], (repos) => {
            return {
                msg: `Skipped ${repos} because there's a rebase in progress that must be resolved.`,
                severity: vsCodeUtils_1.MessageSeverity.WARN,
            };
        });
        return { message, maxMessageSeverity };
    }
    async execute(opts) {
        const ctx = "execute";
        L.info({ ctx, opts });
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const workspaceService = ExtensionProvider_1.ExtensionProvider.getExtension().workspaceService;
        if (lodash_1.default.isUndefined(workspaceService))
            throw new common_all_1.DendronError({
                message: "Workspace is not initialized",
                severity: common_all_1.ERROR_SEVERITY.FATAL,
            });
        const committed = await vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "Workspace Add and Commit",
            cancellable: false,
        }, async (progress) => {
            progress.report({ message: "staging changes" });
            const committed = await workspaceService.commitAndAddAll({
                engine,
            });
            L.info(committed);
            return committed;
        });
        const { message, maxMessageSeverity } = AddAndCommit.generateReportMessage({
            committed,
        });
        const committedDone = engine_server_1.WorkspaceUtils.getCountForStatusDone(committed);
        const repos = (count) => (count <= 1 ? "repo" : "repos");
        message.push(`Committed ${committedDone} ${repos(committedDone)}`);
        const finalMessage = message.join(" ");
        vsCodeUtils_1.VSCodeUtils.showMessage(maxMessageSeverity, finalMessage, {});
        return { committed, finalMessage };
    }
}
exports.AddAndCommit = AddAndCommit;
//# sourceMappingURL=AddAndCommit.js.map