"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReloadIndexCommand = exports.FIX_CONFIG_SELF_CONTAINED = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const dev_1 = require("../utils/dev");
const analytics_1 = require("../utils/analytics");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
var AutoFixAction;
(function (AutoFixAction) {
    AutoFixAction["CREATE_ROOT_SCHEMA"] = "create root schema";
    AutoFixAction["CREATE_ROOT_NOTE"] = "create root note";
})(AutoFixAction || (AutoFixAction = {}));
exports.FIX_CONFIG_SELF_CONTAINED = "Fix configuration";
function categorizeActions(actions) {
    return {
        [AutoFixAction.CREATE_ROOT_NOTE]: actions.filter((item) => item === AutoFixAction.CREATE_ROOT_NOTE).length,
        [AutoFixAction.CREATE_ROOT_SCHEMA]: actions.filter((item) => item === AutoFixAction.CREATE_ROOT_SCHEMA).length,
    };
}
class ReloadIndexCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.RELOAD_INDEX.key;
    silent = true;
    /** Create the root schema if it is missing. */
    async createRootSchemaIfMissing(wsRoot, vault) {
        const ctx = "ReloadIndex.createRootSchemaIfMissing";
        const vaultDir = (0, common_server_1.vault2Path)({ wsRoot, vault });
        const rootSchemaPath = path_1.default.join(vaultDir, "root.schema.yml");
        // If it already exists, nothing to do
        if (await fs_extra_1.default.pathExists(rootSchemaPath))
            return;
        // If this is just a misconfigured self contained vault, skip it because we'll need to fix the config
        if (await fs_extra_1.default.pathExists(path_1.default.join(vaultDir, common_all_1.FOLDERS.NOTES, "root.schema.yml")))
            return;
        try {
            const schema = common_all_1.SchemaUtils.createRootModule({ vault });
            this.L.info({ ctx, vaultDir, msg: "creating root schema" });
            await (0, common_server_1.schemaModuleOpts2File)(schema, vaultDir, "root");
            return AutoFixAction.CREATE_ROOT_SCHEMA;
        }
        catch (err) {
            this.L.info({
                ctx,
                vaultDir,
                msg: "Error when creating root schema",
                err,
            });
            return;
        }
    }
    /** Creates the root note if it is missing. */
    async createRootNoteIfMissing(wsRoot, vault) {
        const ctx = "ReloadIndex.createRootNoteIfMissing";
        const vaultDir = (0, common_server_1.vault2Path)({ wsRoot, vault });
        const rootNotePath = path_1.default.join(vaultDir, "root.md");
        // If it already exists, nothing to do
        if (await fs_extra_1.default.pathExists(rootNotePath))
            return;
        // If this is just a misconfigured self contained vault, skip it because we'll need to fix the config
        if (await fs_extra_1.default.pathExists(path_1.default.join(vaultDir, common_all_1.FOLDERS.NOTES, "root.md")))
            return;
        try {
            const note = common_all_1.NoteUtils.createRoot({ vault });
            this.L.info({ ctx, vaultDir, msg: "creating root note" });
            await (0, common_server_1.note2File)({
                note,
                vault,
                wsRoot,
            });
            return AutoFixAction.CREATE_ROOT_NOTE;
        }
        catch (err) {
            this.L.info({ ctx, vaultDir, msg: "Error when creating root note", err });
            return;
        }
    }
    /** Checks if there are any self contained vaults that aren't marked correctly, and prompts the user to fix the configuration. */
    static async checkAndPromptForMisconfiguredSelfContainedVaults({ engine, }) {
        const ctx = "checkAndPromptForMisconfiguredSelfContainedVaults";
        const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const doctor = new engine_server_1.DoctorService();
        const vaultsToFix = await doctor.findMisconfiguredSelfContainedVaults(wsRoot, vaults);
        const fixConfig = exports.FIX_CONFIG_SELF_CONTAINED;
        if (vaultsToFix.length > 0) {
            logger_1.Logger.info({
                ctx,
                numVaultsToFix: vaultsToFix.length,
            });
            let message;
            let detail;
            if (vaultsToFix.length === 1) {
                message = `Vault "${common_all_1.VaultUtils.getName(vaultsToFix[0])}" needs to be marked as a self contained vault in your configuration file.`;
            }
            else {
                message = `${vaultsToFix.length} vaults need to be marked as self contained vaults in your configuration file`;
            }
            analytics_1.AnalyticsUtils.track(common_all_1.ConfigEvents.MissingSelfContainedVaultsMessageShow, {
                vaultsToFix: vaultsToFix.length,
            });
            const pick = await vscode_1.window.showWarningMessage(message, {
                detail,
            }, fixConfig, "Ignore for now");
            logger_1.Logger.info({
                ctx,
                msg: "Used picked an option in the fix prompt",
                pick,
            });
            if (pick === fixConfig) {
                analytics_1.AnalyticsUtils.trackForNextRun(common_all_1.ConfigEvents.MissingSelfContainedVaultsMessageAccept);
                await doctor.executeDoctorActions({
                    action: engine_server_1.DoctorActionsEnum.FIX_SELF_CONTAINED_VAULT_CONFIG,
                    engine,
                });
                logger_1.Logger.info({
                    ctx,
                    msg: "Fixing vaults done!",
                });
                // Need to reload because the vaults loaded are incorrect now
                vsCodeUtils_1.VSCodeUtils.reloadWindow();
            }
        }
        doctor.dispose();
    }
    /**
     * Update index
     * @param opts
     */
    async execute(opts) {
        const ctx = "ReloadIndex.execute";
        this.L.info({ ctx, msg: "enter" });
        const perf = new common_all_1.PerformanceTimer({ timerName: "ReloadIndex" });
        perf.before("total");
        const ws = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        let initError;
        const { wsRoot, engine } = ws;
        // Check if there are any misconfigured self contained vaults.
        // Deliberately not awaiting this to avoid blocking the reload
        ReloadIndexCommand.checkAndPromptForMisconfiguredSelfContainedVaults({
            engine: ExtensionProvider_1.ExtensionProvider.getEngine(),
        });
        // Fix up any broken vaults
        const reloadIndex = async () => {
            perf.before("autoFixActions");
            const autoFixActions = await Promise.all(engine.vaults.flatMap((vault) => {
                return [
                    this.createRootSchemaIfMissing(wsRoot, vault),
                    this.createRootNoteIfMissing(wsRoot, vault),
                ];
            }));
            perf.after("autoFixActions");
            perf.before("engineInit");
            if (autoFixActions.filter(common_all_1.isNotUndefined).length > 0) {
                analytics_1.AnalyticsUtils.track(common_all_1.WorkspaceEvents.AutoFix, {
                    ...categorizeActions(autoFixActions),
                    nonFatalInitError: initError && initError.severity === common_all_1.ERROR_SEVERITY.MINOR,
                });
            }
            const start = process.hrtime();
            const { error } = await engine.init();
            const durationEngineInit = (0, common_server_1.getDurationMilliseconds)(start);
            this.L.info({ ctx, durationEngineInit });
            perf.after("engineInit");
            // if fatal, stop initialization
            if (error && error.severity !== common_all_1.ERROR_SEVERITY.MINOR) {
                this.L.error({ ctx, error, msg: "unable to initialize engine" });
                return;
            }
            if (error) {
                // There may be one or more errors,
                const errors = (0, common_all_1.errorsList)(error);
                errors.forEach((error) => {
                    if (common_all_1.DuplicateNoteError.isDuplicateNoteError(error) && error.code) {
                        vsCodeUtils_1.VSCodeUtils.showMessage(vsCodeUtils_1.MessageSeverity.WARN, error.message, {});
                        analytics_1.AnalyticsUtils.track(common_all_1.WorkspaceEvents.DuplicateNoteFound, {
                            source: this.key,
                        });
                        this.L.info({ ctx, error, msg: "Duplicate note IDs found" });
                    }
                    else {
                        // Warn about any errors not handled above
                        this.L.error({
                            ctx,
                            error,
                            msg: `Initialization error: ${error.message}`,
                        });
                    }
                });
                if (errors.length === 0) {
                    // For backwards compatibility, warn if there are warnings that are
                    // non-fatal errors not covered by the new error architecture
                    this.L.error({ ctx, error, msg: "init error" });
                }
            }
            return autoFixActions;
        };
        if (!(opts && !opts.silent)) {
            await reloadIndex();
        }
        else {
            await vscode_1.window.withProgress({
                location: vscode_1.ProgressLocation.Notification,
                title: "Reloading Index...",
                cancellable: false,
            }, reloadIndex);
        }
        perf.after("total");
        // Only log detailed perf in dev mode or when explicitly requested
        const shouldLogPerf = (0, common_all_1.getStage)() === "dev" || process.env.DENDRON_PERF === "1";
        if (shouldLogPerf) {
            const report = perf.report();
            logger_1.Logger.info({ ctx, msg: "perf-report", report });
            (0, dev_1.logPerfReport)("ReloadIndex", report);
        }
        this.L.info({ ctx, msg: "exit", initError });
        return engine;
    }
}
exports.ReloadIndexCommand = ReloadIndexCommand;
//# sourceMappingURL=ReloadIndex.js.map