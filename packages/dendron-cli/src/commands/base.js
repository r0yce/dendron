"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLICommand = exports.BaseCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const analytics_1 = require("../utils/analytics");
const cli_1 = require("../utils/cli");
class BaseCommand {
    L;
    opts;
    constructor(name, opts) {
        this.opts = opts || {};
        this.L = (0, common_server_1.createLogger)(name || "Command");
    }
}
exports.BaseCommand = BaseCommand;
class CLICommand extends BaseCommand {
    name;
    desc;
    // TODO: hackish
    wsRootOptional;
    skipValidation;
    _analyticsPayload = {};
    constructor(opts) {
        super(opts.name, opts);
        this.name = opts.name;
        this.desc = opts.desc;
    }
    buildArgs(args) {
        args.option("wsRoot", {
            describe: "location of workspace",
        });
        args.option("vault", {
            describe: "name of vault",
        });
        args.option("quiet", {
            describe: "don't print output to stdout",
        });
        args.option("devMode", {
            describe: "set stage to dev",
            type: "boolean",
            default: false,
        });
        args.hide("devMode");
        args.option("json", {
            describe: "Output results as JSON (useful for scripting)",
            type: "boolean",
            default: false,
        });
    }
    buildCmd(yargsInstance) {
        // yargs 17+ has stricter builder typing; we wrap to keep our existing pattern
        return yargsInstance.command(this.name, this.desc, (args) => this.buildArgs(args), this.eval);
    }
    setUpSegmentClient() {
        if (common_all_1.RuntimeUtils.isRunningInTestOrCI()) {
            return;
        }
        // if running CLI without ever having used dendron plugin,
        // show a notice about telemety and instructions on how to disable.
        if (lodash_1.default.isUndefined(common_server_1.SegmentClient.readConfig())) {
            analytics_1.CLIAnalyticsUtils.showTelemetryMessage();
            const reason = common_server_1.TelemetryStatus.ENABLED_BY_CLI_DEFAULT;
            common_server_1.SegmentClient.enable(reason);
            analytics_1.CLIAnalyticsUtils.track(common_all_1.CLIEvents.CLITelemetryEnabled, { reason });
        }
        const stage = this.opts.dev ? common_all_1.config.dev : common_all_1.config.prod;
        const segment = common_server_1.SegmentClient.instance({
            forceNew: true,
            key: stage.SEGMENT_VSCODE_KEY,
        });
        this.L.info({ msg: `Telemetry is disabled? ${segment.hasOptedOut}` });
    }
    async validateConfig(opts) {
        const { wsRoot } = opts;
        // we shouldn't use ConfigUtils.getProp for cases when `version` doesn't exist.
        const configVersion = common_server_1.DConfig.getRaw(wsRoot).version;
        const clientVersion = cli_1.CLIUtils.getClientVersion();
        let validationResp;
        try {
            validationResp = common_all_1.ConfigUtils.configIsValid({
                clientVersion,
                configVersion,
            });
        }
        catch (err) {
            this.print(err.message);
            process.exit();
        }
        if (!validationResp.isValid) {
            const { reason, minCompatConfigVersion, minCompatClientVersion } = validationResp;
            const instruction = reason === "client"
                ? "Please make sure dendron-cli is up to date by running the following: \n npm install @dendronhq/dendron-cli@latest"
                : `Please make sure dendron.yml is up to date by running the following: \n dendron dev run_migration --migrationVersion=${engine_server_1.MIGRATION_ENTRIES[0].version}`;
            const clientVersionOkay = reason === "client" ? common_all_1.DENDRON_EMOJIS.NOT_OKAY : common_all_1.DENDRON_EMOJIS.OKAY;
            const configVersionOkay = reason === "config" ? common_all_1.DENDRON_EMOJIS.NOT_OKAY : common_all_1.DENDRON_EMOJIS.OKAY;
            const body = [
                `current client version:            ${clientVersionOkay} ${clientVersion}`,
                `current config version:            ${configVersionOkay} ${configVersion}`,
                reason === "client"
                    ? `minimum compatible client version:    ${minCompatClientVersion}`
                    : `minimum compatible config version:    ${minCompatConfigVersion}`,
            ].join("\n");
            const message = [
                "================================================",
                `${reason} is out of date.`,
                "------------------------------------------------",
                body,
                "------------------------------------------------",
                instruction,
            ].join("\n");
            if (!validationResp.isSoftMapping) {
                // we should wait for this before exiting the process.
                await analytics_1.CLIAnalyticsUtils.trackSync(common_all_1.CLIEvents.CLIClientConfigMismatch, {
                    ...validationResp,
                    configVersion,
                });
                this.print(message);
                this.print("Exiting due to configuration / client version mismatch.");
                process.exit();
            }
            else {
                analytics_1.CLIAnalyticsUtils.track(common_all_1.CLIEvents.CLIClientConfigMismatch, {
                    ...validationResp,
                    configVersion,
                });
                this.print(message);
                // show warning but don't exit if it's a soft mapping.
                this.print("WARN: Your configuration version is outdated and is scheduled for deprecation in the near future.");
            }
        }
    }
    addArgsToPayload(data) {
        this.addToPayload({
            key: "args",
            value: data,
        });
    }
    addToPayload(opts) {
        const { key, value } = opts;
        lodash_1.default.set(this._analyticsPayload, key, value);
    }
    eval = async (args) => {
        const start = process.hrtime();
        analytics_1.CLIAnalyticsUtils.identify();
        this.L.info({ args, state: "enter" });
        if (args.devMode) {
            this.opts.dev = args.devMode;
        }
        this.L.info({ args, state: "setUpSegmentClient:pre" });
        this.setUpSegmentClient();
        this.L.info({ args, state: "findWSRoot:pre" });
        if (!args.wsRoot) {
            const configPath = engine_server_1.WorkspaceUtils.findWSRoot();
            if (lodash_1.default.isUndefined(configPath) && !this.wsRootOptional) {
                this.printError("No Dendron workspace detected.\n" +
                    "Run this command from inside a vault, or pass --wsRoot /path/to/workspace");
                process.exit(1);
            }
            else {
                args.wsRoot = configPath;
            }
        }
        if (args.quiet) {
            this.opts.quiet = true;
        }
        if (args.json) {
            this.opts.json = true;
        }
        if (!this.skipValidation) {
            await this.validateConfig({ wsRoot: args.wsRoot });
        }
        this.L.info({ args, state: "enrichArgs:pre" });
        const opts = await this.enrichArgs(args);
        if (opts.error) {
            this.L.error(opts.error);
            return { error: opts.error };
        }
        this.L.info({ args, state: "execute:pre" });
        const out = await this.execute(opts.data);
        this.L.info({ args, state: "execute:post" });
        if (out.error instanceof common_all_1.DendronError && out.error) {
            this.L.error(out.error);
            this.printError(out.error.message || out.error);
        }
        else if (out.error) {
            this.printError(out.error);
        }
        const analyticsPayload = this._analyticsPayload || {};
        const event = this.constructor.name;
        const props = {
            duration: (0, common_server_1.getDurationMilliseconds)(start),
            ...analyticsPayload,
        };
        if (out.exit) {
            this.L.info({ args, state: "processExit:pre" });
            await analytics_1.CLIAnalyticsUtils.trackSync(event, props);
            process.exit();
        }
        analytics_1.CLIAnalyticsUtils.track(event, props);
        this.L.info({ args, state: "exit" });
        return out;
    };
    print(obj) {
        if (this.opts.json) {
            // In JSON mode, normal output is suppressed.
            // Commands that support --json should produce structured output themselves.
            return;
        }
        if (!this.opts.quiet) {
            // eslint-disable-next-line no-console
            console.log(obj);
        }
    }
    printError(obj) {
        if (!this.opts.quiet) {
            // eslint-disable-next-line no-console
            console.error(obj);
        }
    }
    /**
     * Print a structured result when --json is used.
     * Safe to call from any command.
     */
    printJson(data) {
        if (this.opts.json) {
            // eslint-disable-next-line no-console
            console.log(JSON.stringify(data, null, 2));
        }
    }
}
exports.CLICommand = CLICommand;
//# sourceMappingURL=base.js.map