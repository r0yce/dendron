"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputArgCommand = exports.BasicCommand = exports.BaseCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const logger_1 = require("../logger");
const analytics_1 = require("../utils/analytics");
/**
 * Base class for all Dendron Plugin Commands.
 *
 *
 * Generics:
 *   - TOpts: passed into {@link BaseCommand.execute}
 *   - TOut: returned by {@link BaseCommand.execute}
 *   - TGatherOutput: returned by {@link BaseCommand.gatherInputs}
 *   - TRunOpts: passed into {@link BaseCommand.run}
 */
// eslint-disable-next-line no-redeclare
class BaseCommand {
    L;
    constructor(_name) {
        this.L = logger_1.Logger;
    }
    static showInput = vscode_1.window.showInputBox;
    /**
     * Does this command require an active workspace in order to function
     */
    static requireActiveWorkspace = false;
    skipAnalytics;
    async gatherInputs(_opts) {
        return {};
    }
    async showResponse(_resp) {
        return;
    }
    /** Check for errors and stop execution if needed, runs before `gatherInputs`. */
    async sanityCheck(_opts) {
        return;
    }
    mergeInputs(opts, args) {
        return { ...opts, ...args };
    }
    async run(args) {
        const ctx = `${this.key}:run`;
        const start = process.hrtime();
        let isError = false;
        let opts;
        let resp;
        let sanityCheckResp;
        try {
            sanityCheckResp = await this.sanityCheck(args);
            if (sanityCheckResp === "cancel") {
                this.L.info({ ctx, msg: "sanity check cancelled" });
                return;
            }
            if (!lodash_1.default.isUndefined(sanityCheckResp) && sanityCheckResp !== "cancel") {
                vscode_1.window.showErrorMessage(sanityCheckResp);
                return;
            }
            // @ts-ignore
            const inputs = await this.gatherInputs(args);
            // if undefined, imply user cancel
            if (lodash_1.default.isUndefined(inputs)) {
                return;
            }
            opts = await this.enrichInputs(inputs);
            if (lodash_1.default.isUndefined(opts)) {
                return;
            }
            this.L.info({ ctx, msg: "pre-execute" });
            resp = await this.execute(this.mergeInputs(opts, args));
            this.L.info({ ctx, msg: "post-execute" });
            this.showResponse(resp);
            return resp;
        }
        catch (error) {
            let cerror;
            if (error instanceof common_all_1.DendronError) {
                cerror = error;
            }
            else if ((0, common_all_1.isTSError)(error)) {
                cerror = new common_all_1.DendronError({
                    message: `error while running command: ${error.message}`,
                    innerError: error,
                });
            }
            else {
                cerror = new common_all_1.DendronError({
                    message: `unknown error while running command`,
                });
            }
            logger_1.Logger.error({
                ctx,
                error: cerror,
            });
            isError = true;
            // During development only, rethrow the errors to make them easier to debug
            if ((0, common_all_1.getStage)() === "dev") {
                throw error;
            }
            return;
        }
        finally {
            const payload = this.addAnalyticsPayload
                ? await this.addAnalyticsPayload(opts, resp)
                : {};
            const sanityCheckResults = sanityCheckResp
                ? { sanityCheck: sanityCheckResp }
                : {};
            if (!this.skipAnalytics)
                analytics_1.AnalyticsUtils.track(this.key, {
                    duration: (0, common_server_1.getDurationMilliseconds)(start),
                    error: isError,
                    ...payload,
                    ...sanityCheckResults,
                });
        }
    }
}
exports.BaseCommand = BaseCommand;
/**
 * Command with no enriched inputs
 */
class BasicCommand extends BaseCommand {
    async enrichInputs(inputs) {
        return inputs;
    }
}
exports.BasicCommand = BasicCommand;
/** This command passes the output of `gatherOpts`/`enrichOpts` directly to `execute`.
 *
 * The regular command class tries to merge the inputs from `gatherOpts` and `enrichOpts` together, which
 * will break your code if you use any `TOpts` that is not a basic js object.
 *
 * This is especially useful for commands that accept input directly from VSCode, like {@link ShowPreviewCommand}
 */
class InputArgCommand extends BasicCommand {
    async gatherInputs(opts) {
        // The cast and return is needed because if `opts` is `undefined` then `run` will just skip doing `execute`
        return opts || {};
    }
    mergeInputs(opts, _args) {
        return opts;
    }
}
exports.InputArgCommand = InputArgCommand;
//# sourceMappingURL=base.js.map