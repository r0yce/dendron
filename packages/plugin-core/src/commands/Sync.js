"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncCommand = exports.UPDATE_SEED_CONFIG_PROMPT = void 0;
exports.detectOutOfDateSeeds = detectOutOfDateSeeds;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const analytics_1 = require("../utils/analytics");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
exports.UPDATE_SEED_CONFIG_PROMPT = "Update configuration";
/** If the configuration for a seed vault has changed, prompt to suggest updating the configuration. */
async function detectOutOfDateSeeds({ wsRoot, seedSvc, }) {
    const seedVaults = seedSvc.getSeedVaultsInWorkspace();
    await Promise.all(seedVaults.map(async (seedVault) => {
        const id = seedVault.seed;
        const info = await seedSvc.info({ id });
        if (!info) {
            // Seed is missing from the config, or it's an unknown seed. We could
            // warn the user here to fix their config, but I've never seen issues
            // around this so skipping it for now.
            return;
        }
        if (seedVault.fsPath !== info.root) {
            // The path specified in the seed has changed compared to what's in the
            // users config. User won't be able to read the notes in that vault, we
            // should prompt to fix it.
            analytics_1.AnalyticsUtils.track(common_all_1.ConfigEvents.OutdatedSeedVaultMessageShow);
            const select = await vsCodeUtils_1.VSCodeUtils.showMessage(vsCodeUtils_1.MessageSeverity.WARN, `The configuration for the seed vault ${common_all_1.VaultUtils.getName(seedVault)} has changed. You may be unable to access the vault until you update your configuration.`, {}, {
                title: exports.UPDATE_SEED_CONFIG_PROMPT,
            }, {
                title: "Skip for now",
            });
            if (select?.title === exports.UPDATE_SEED_CONFIG_PROMPT) {
                await analytics_1.AnalyticsUtils.trackForNextRun(common_all_1.ConfigEvents.OutdatedSeedVaultMessageAccept);
                await common_server_1.DConfig.createBackup(wsRoot, "update-seed");
                const config = common_server_1.DConfig.getOrCreate(wsRoot);
                common_all_1.ConfigUtils.updateVault(config, seedVault, (vault) => {
                    vault.fsPath = info.root;
                    return vault;
                });
                await common_server_1.DConfig.writeConfig({ wsRoot, config });
                vsCodeUtils_1.VSCodeUtils.reloadWindow();
            }
        }
    }));
}
const L = logger_1.Logger;
class SyncCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.SYNC.key;
    static generateReportMessage({ committed, pulled, pushed, }) {
        const message = ["Finished sync."];
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
        // Errors, sync is probably misconfigured or there's something wrong with git
        makeMessage(engine_server_1.SyncActionStatus.CANT_STASH, [pulled], (repos) => {
            return {
                msg: `Can't pull ${repos} because there are local changes that can't be stashed.`,
                severity: vsCodeUtils_1.MessageSeverity.ERROR,
            };
        });
        makeMessage(engine_server_1.SyncActionStatus.NOT_PERMITTED, [pushed], (repos) => {
            return {
                msg: `Can't pull ${repos} because this user is not permitted.`,
                severity: vsCodeUtils_1.MessageSeverity.ERROR,
            };
        });
        makeMessage(engine_server_1.SyncActionStatus.BAD_REMOTE, [pulled, pushed], (repos) => {
            return {
                msg: `Can't pull or push ${repos} because of a connection problem. Check your internet connection, repository permissions, and credentials.`,
                severity: vsCodeUtils_1.MessageSeverity.ERROR,
            };
        });
        // Warnings, need user interaction to continue sync
        makeMessage(engine_server_1.SyncActionStatus.MERGE_CONFLICT, [committed, pulled, pushed], (repos) => {
            return {
                msg: `Skipped ${repos} because they have merge conflicts that must be resolved manually.`,
                severity: vsCodeUtils_1.MessageSeverity.WARN,
            };
        });
        makeMessage(engine_server_1.SyncActionStatus.MERGE_CONFLICT_AFTER_PULL, [pulled], (repos) => {
            return {
                msg: `Pulled ${repos} but they have merge conflicts that must be resolved.`,
                severity: vsCodeUtils_1.MessageSeverity.WARN,
            };
        });
        makeMessage(engine_server_1.SyncActionStatus.MERGE_CONFLICT_AFTER_RESTORE, [pulled], (repos) => {
            return {
                msg: `Pulled ${repos} but encountered merge conflicts when restoring local changes.`,
                severity: vsCodeUtils_1.MessageSeverity.WARN,
            };
        });
        makeMessage(engine_server_1.SyncActionStatus.MERGE_CONFLICT_LOSES_CHANGES, [pulled], (repos) => {
            return {
                msg: `Can't pull ${repos} because there are local changes, and pulling will cause a merge conflict. You must commit your local changes first.`,
                severity: vsCodeUtils_1.MessageSeverity.WARN,
            };
        });
        makeMessage(engine_server_1.SyncActionStatus.REBASE_IN_PROGRESS, [pulled, pushed, committed], (repos) => {
            return {
                msg: `Skipped ${repos} because there's a rebase in progress that must be resolved.`,
                severity: vsCodeUtils_1.MessageSeverity.WARN,
            };
        });
        makeMessage(engine_server_1.SyncActionStatus.NO_UPSTREAM, [pulled, pushed], (repos) => {
            return {
                msg: `Skipped pulling or pushing ${repos} because they don't have upstream branches configured.`,
                severity: vsCodeUtils_1.MessageSeverity.WARN,
            };
        });
        makeMessage(engine_server_1.SyncActionStatus.UNPULLED_CHANGES, [pushed], (repos) => {
            return {
                msg: `Can't push ${repos} because there are unpulled changes.`,
                severity: vsCodeUtils_1.MessageSeverity.WARN,
            };
        });
        return { message, maxMessageSeverity };
    }
    addAnalyticsPayload(_opts, resp) {
        const allActions = [
            ...(resp?.committed ?? []),
            ...(resp?.pulled ?? []),
            ...(resp?.pushed ?? []),
        ];
        return {
            hasMultiVaultRepo: allActions.some((action) => action.vaults.length > 1),
        };
    }
    async execute(opts) {
        const ctx = "execute";
        L.info({ ctx, opts });
        const workspaceService = ExtensionProvider_1.ExtensionProvider.getExtension().workspaceService;
        if (lodash_1.default.isUndefined(workspaceService))
            throw new common_all_1.DendronError({
                message: "Workspace is not initialized",
                severity: common_all_1.ERROR_SEVERITY.FATAL,
            });
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const { committed, pulled, pushed } = await vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "Syncing Workspace",
            cancellable: false,
        }, async (progress) => {
            progress.report({ increment: 0, message: "committing repos" });
            const committed = await workspaceService.commitAndAddAll({ engine });
            L.info(committed);
            progress.report({ increment: 25, message: "pulling repos" });
            const pulled = await workspaceService.pullVaults();
            L.info(pulled);
            progress.report({ increment: 50, message: "pushing repos" });
            const pushed = await workspaceService.pushVaults();
            progress.report({ increment: 100 });
            L.info(pushed);
            return { committed, pulled, pushed };
        });
        const { message, maxMessageSeverity } = SyncCommand.generateReportMessage({
            committed,
            pulled,
            pushed,
        });
        // Successful operations
        const committedDone = engine_server_1.WorkspaceUtils.getCountForStatusDone(committed);
        const pulledDone = engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled);
        const pushedDone = engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed);
        const repos = (count) => (count === 1 ? "repo" : "repos");
        message.push(`Committed ${committedDone} ${repos(committedDone)},`);
        message.push(`pulled ${pulledDone}`);
        message.push(`and pushed ${pushedDone} ${repos(pushedDone)}.`);
        const finalMessage = message.join(" ");
        vsCodeUtils_1.VSCodeUtils.showMessage(maxMessageSeverity, finalMessage, {});
        detectOutOfDateSeeds({
            wsRoot: engine.wsRoot,
            seedSvc: new engine_server_1.SeedService({ wsRoot: engine.wsRoot }),
        });
        return {
            committed,
            pulled,
            pushed,
            finalMessage,
        };
    }
}
exports.SyncCommand = SyncCommand;
//# sourceMappingURL=Sync.js.map