"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLICommand = exports.BaseCommand = void 0;
var common_all_1 = require("@dendronhq/common-all");
var common_server_1 = require("@dendronhq/common-server");
var engine_server_1 = require("@dendronhq/engine-server");
var lodash_1 = require("lodash");
var analytics_1 = require("../utils/analytics");
var cli_1 = require("../utils/cli");
var BaseCommand = /** @class */ (function () {
    function BaseCommand(name, opts) {
        this.opts = opts || {};
        this.L = (0, common_server_1.createLogger)(name || "Command");
    }
    return BaseCommand;
}());
exports.BaseCommand = BaseCommand;
var CLICommand = /** @class */ (function (_super) {
    __extends(CLICommand, _super);
    function CLICommand(opts) {
        var _this = _super.call(this, opts.name, opts) || this;
        _this._analyticsPayload = {};
        _this.eval = function (args) { return __awaiter(_this, void 0, void 0, function () {
            var start, configPath, opts, out, analyticsPayload, event, props;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        start = process.hrtime();
                        analytics_1.CLIAnalyticsUtils.identify();
                        this.L.info({ args: args, state: "enter" });
                        if (args.devMode) {
                            this.opts.dev = args.devMode;
                        }
                        this.L.info({ args: args, state: "setUpSegmentClient:pre" });
                        this.setUpSegmentClient();
                        this.L.info({ args: args, state: "findWSRoot:pre" });
                        if (!args.wsRoot) {
                            configPath = engine_server_1.WorkspaceUtils.findWSRoot();
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
                        if (!!this.skipValidation) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.validateConfig({ wsRoot: args.wsRoot })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.L.info({ args: args, state: "enrichArgs:pre" });
                        return [4 /*yield*/, this.enrichArgs(args)];
                    case 3:
                        opts = _a.sent();
                        if (opts.error) {
                            this.L.error(opts.error);
                            return [2 /*return*/, { error: opts.error }];
                        }
                        this.L.info({ args: args, state: "execute:pre" });
                        return [4 /*yield*/, this.execute(opts.data)];
                    case 4:
                        out = _a.sent();
                        this.L.info({ args: args, state: "execute:post" });
                        if (out.error instanceof common_all_1.DendronError && out.error) {
                            this.L.error(out.error);
                            this.printError(out.error.message || out.error);
                        }
                        else if (out.error) {
                            this.printError(out.error);
                        }
                        analyticsPayload = this._analyticsPayload || {};
                        event = this.constructor.name;
                        props = __assign({ duration: (0, common_server_1.getDurationMilliseconds)(start) }, analyticsPayload);
                        if (!out.exit) return [3 /*break*/, 6];
                        this.L.info({ args: args, state: "processExit:pre" });
                        return [4 /*yield*/, analytics_1.CLIAnalyticsUtils.trackSync(event, props)];
                    case 5:
                        _a.sent();
                        process.exit();
                        _a.label = 6;
                    case 6:
                        analytics_1.CLIAnalyticsUtils.track(event, props);
                        this.L.info({ args: args, state: "exit" });
                        return [2 /*return*/, out];
                }
            });
        }); };
        _this.name = opts.name;
        _this.desc = opts.desc;
        return _this;
    }
    CLICommand.prototype.buildArgs = function (args) {
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
    };
    CLICommand.prototype.buildCmd = function (yargsInstance) {
        var _this = this;
        // yargs 17+ has stricter builder typing; we wrap to keep our existing pattern
        return yargsInstance.command(this.name, this.desc, function (args) { return _this.buildArgs(args); }, this.eval);
    };
    CLICommand.prototype.setUpSegmentClient = function () {
        if (common_all_1.RuntimeUtils.isRunningInTestOrCI()) {
            return;
        }
        // if running CLI without ever having used dendron plugin,
        // show a notice about telemety and instructions on how to disable.
        if (lodash_1.default.isUndefined(common_server_1.SegmentClient.readConfig())) {
            analytics_1.CLIAnalyticsUtils.showTelemetryMessage();
            var reason = common_server_1.TelemetryStatus.ENABLED_BY_CLI_DEFAULT;
            common_server_1.SegmentClient.enable(reason);
            analytics_1.CLIAnalyticsUtils.track(common_all_1.CLIEvents.CLITelemetryEnabled, { reason: reason });
        }
        var stage = this.opts.dev ? common_all_1.config.dev : common_all_1.config.prod;
        var segment = common_server_1.SegmentClient.instance({
            forceNew: true,
            key: stage.SEGMENT_VSCODE_KEY,
        });
        this.L.info({ msg: "Telemetry is disabled? ".concat(segment.hasOptedOut) });
    };
    CLICommand.prototype.validateConfig = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var wsRoot, configVersion, clientVersion, validationResp, reason, minCompatConfigVersion, minCompatClientVersion, instruction, clientVersionOkay, configVersionOkay, body, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wsRoot = opts.wsRoot;
                        configVersion = common_server_1.DConfig.getRaw(wsRoot).version;
                        clientVersion = cli_1.CLIUtils.getClientVersion();
                        try {
                            validationResp = common_all_1.ConfigUtils.configIsValid({
                                clientVersion: clientVersion,
                                configVersion: configVersion,
                            });
                        }
                        catch (err) {
                            this.print(err.message);
                            process.exit();
                        }
                        if (!!validationResp.isValid) return [3 /*break*/, 3];
                        reason = validationResp.reason, minCompatConfigVersion = validationResp.minCompatConfigVersion, minCompatClientVersion = validationResp.minCompatClientVersion;
                        instruction = reason === "client"
                            ? "Please make sure dendron-cli is up to date by running the following: \n npm install @dendronhq/dendron-cli@latest"
                            : "Please make sure dendron.yml is up to date by running the following: \n dendron dev run_migration --migrationVersion=".concat(engine_server_1.MIGRATION_ENTRIES[0].version);
                        clientVersionOkay = reason === "client" ? common_all_1.DENDRON_EMOJIS.NOT_OKAY : common_all_1.DENDRON_EMOJIS.OKAY;
                        configVersionOkay = reason === "config" ? common_all_1.DENDRON_EMOJIS.NOT_OKAY : common_all_1.DENDRON_EMOJIS.OKAY;
                        body = [
                            "current client version:            ".concat(clientVersionOkay, " ").concat(clientVersion),
                            "current config version:            ".concat(configVersionOkay, " ").concat(configVersion),
                            reason === "client"
                                ? "minimum compatible client version:    ".concat(minCompatClientVersion)
                                : "minimum compatible config version:    ".concat(minCompatConfigVersion),
                        ].join("\n");
                        message = [
                            "================================================",
                            "".concat(reason, " is out of date."),
                            "------------------------------------------------",
                            body,
                            "------------------------------------------------",
                            instruction,
                        ].join("\n");
                        if (!!validationResp.isSoftMapping) return [3 /*break*/, 2];
                        // we should wait for this before exiting the process.
                        return [4 /*yield*/, analytics_1.CLIAnalyticsUtils.trackSync(common_all_1.CLIEvents.CLIClientConfigMismatch, __assign(__assign({}, validationResp), { configVersion: configVersion }))];
                    case 1:
                        // we should wait for this before exiting the process.
                        _a.sent();
                        this.print(message);
                        this.print("Exiting due to configuration / client version mismatch.");
                        process.exit();
                        return [3 /*break*/, 3];
                    case 2:
                        analytics_1.CLIAnalyticsUtils.track(common_all_1.CLIEvents.CLIClientConfigMismatch, __assign(__assign({}, validationResp), { configVersion: configVersion }));
                        this.print(message);
                        // show warning but don't exit if it's a soft mapping.
                        this.print("WARN: Your configuration version is outdated and is scheduled for deprecation in the near future.");
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CLICommand.prototype.addArgsToPayload = function (data) {
        this.addToPayload({
            key: "args",
            value: data,
        });
    };
    CLICommand.prototype.addToPayload = function (opts) {
        var key = opts.key, value = opts.value;
        lodash_1.default.set(this._analyticsPayload, key, value);
    };
    CLICommand.prototype.print = function (obj) {
        if (this.opts.json) {
            // In JSON mode, normal output is suppressed.
            // Commands that support --json should produce structured output themselves.
            return;
        }
        if (!this.opts.quiet) {
            // eslint-disable-next-line no-console
            console.log(obj);
        }
    };
    CLICommand.prototype.printError = function (obj) {
        if (!this.opts.quiet) {
            // eslint-disable-next-line no-console
            console.error(obj);
        }
    };
    /**
     * Print a structured result when --json is used.
     * Safe to call from any command.
     */
    CLICommand.prototype.printJson = function (data) {
        if (this.opts.json) {
            // eslint-disable-next-line no-console
            console.log(JSON.stringify(data, null, 2));
        }
    };
    return CLICommand;
}(BaseCommand));
exports.CLICommand = CLICommand;
