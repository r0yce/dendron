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
exports.DevCLICommand = exports.DevCommands = void 0;
var common_all_1 = require("@dendronhq/common-all");
var common_server_1 = require("@dendronhq/common-server");
var engine_server_1 = require("@dendronhq/engine-server");
var fs_extra_1 = require("fs-extra");
var lodash_1 = require("lodash");
var path_1 = require("path");
var __1 = require("..");
var build_1 = require("../utils/build");
var base_1 = require("./base");
var DevCommands;
(function (DevCommands) {
    DevCommands["GENERATE_JSON_SCHEMA_FROM_CONFIG"] = "generate_json_schema_from_config";
    DevCommands["BUILD"] = "build";
    DevCommands["CREATE_TEST_VAULT"] = "create_test_vault";
    DevCommands["BUMP_VERSION"] = "bump_version";
    DevCommands["PUBLISH"] = "publish";
    DevCommands["SYNC_ASSETS"] = "sync_assets";
    DevCommands["SYNC_TUTORIAL"] = "sync_tutorial";
    DevCommands["PREP_PLUGIN"] = "prep_plugin";
    DevCommands["PACKAGE_PLUGIN"] = "package_plugin";
    DevCommands["INSTALL_PLUGIN"] = "install_plugin";
    DevCommands["ENABLE_TELEMETRY"] = "enable_telemetry";
    DevCommands["DISABLE_TELEMETRY"] = "disable_telemetry";
    DevCommands["SHOW_TELEMETRY"] = "show_telemetry";
    DevCommands["SHOW_MIGRATIONS"] = "show_migrations";
    DevCommands["RUN_MIGRATION"] = "run_migration";
})(DevCommands || (exports.DevCommands = DevCommands = {}));
/**
 * To use when working on dendron
 */
var DevCLICommand = /** @class */ (function (_super) {
    __extends(DevCLICommand, _super);
    function DevCLICommand() {
        var _this = _super.call(this, {
            name: "dev <cmd>",
            desc: "commands related to development of Dendron",
        }) || this;
        _this.wsRootOptional = true;
        _this.skipValidation = true;
        return _this;
    }
    DevCLICommand.prototype.setEndpoint = function (publishEndpoint) {
        this.print("setting endpoint to ".concat(publishEndpoint, "..."));
        if (publishEndpoint === build_1.PublishEndpoint.LOCAL) {
            build_1.BuildUtils.prepPublishLocal();
        }
        else {
            build_1.BuildUtils.prepPublishRemote();
        }
    };
    DevCLICommand.prototype.buildArgs = function (args) {
        _super.prototype.buildArgs.call(this, args);
        args.positional("cmd", {
            describe: "a command to run",
            choices: Object.values(DevCommands),
            type: "string",
        });
        args.option("upgradeType", {
            describe: "how to do upgrade",
            choices: Object.values(build_1.SemverVersion),
        });
        args.option("publishEndpoint", {
            describe: "where to publish",
            choices: Object.values(build_1.PublishEndpoint),
        });
        args.option("extensionType", {
            describe: "extension name to publish in the marketplace (Dendron / Nightly)",
            choices: Object.values(build_1.ExtensionType),
        });
        args.option("extensionTarget", {
            describe: "extension target to pass to vsce to specify platform and architecture",
        });
        args.option("fast", {
            describe: "skip some checks",
        });
        args.option("skipSentry", {
            describe: "skip upload source map to sentry",
        });
        args.option("migrationVersion", {
            describe: "migration version to run",
            choices: engine_server_1.MIGRATION_ENTRIES.map(function (m) { return m.version; }),
        });
        args.option("wsRoot", {
            describe: "root directory of the Dendron workspace",
        });
        args.option("jsonData", {
            describe: "json data to pass into command",
        });
    };
    DevCLICommand.prototype.enrichArgs = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.addArgsToPayload({ cmd: args.cmd });
                return [2 /*return*/, { data: __assign({}, args) }];
            });
        });
    };
    DevCLICommand.prototype.createTestVault = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var vaults, svc, ratioTotal, vaultTotal, _c, engine, server;
            var _this = this;
            var wsRoot = _b.wsRoot, payload = _b.payload;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        fs_extra_1.default.ensureDirSync(wsRoot);
                        fs_extra_1.default.emptyDirSync(wsRoot);
                        this.print("creating test vault with ".concat(JSON.stringify(payload)));
                        vaults = lodash_1.default.times(payload.numVaults, function (idx) {
                            return { fsPath: "vault".concat(idx) };
                        });
                        return [4 /*yield*/, engine_server_1.WorkspaceService.createWorkspace({
                                additionalVaults: vaults,
                                wsVault: { fsPath: "notes", selfContained: true },
                                wsRoot: wsRoot,
                                createCodeWorkspace: false,
                                useSelfContainedVault: true,
                            })];
                    case 1:
                        svc = _d.sent();
                        return [4 /*yield*/, svc.initialize()];
                    case 2:
                        _d.sent();
                        ratioTotal = lodash_1.default.values(payload.ratios).reduce(function (acc, cur) { return acc + cur; }, 0);
                        vaultTotal = payload.numVaults;
                        return [4 /*yield*/, (0, __1.setupEngine)({ wsRoot: wsRoot })];
                    case 3:
                        _c = _d.sent(), engine = _c.engine, server = _c.server;
                        this.print("vaults: ".concat(JSON.stringify(svc.vaults)));
                        return [4 /*yield*/, Promise.all(lodash_1.default.keys(payload.ratios).map(function (key) { return __awaiter(_this, void 0, void 0, function () {
                                var numNotes, vault, notes;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            numNotes = Math.round((payload.ratios[key] /
                                                ratioTotal) *
                                                payload.numNotes);
                                            this.print("creating ".concat(numNotes, " ").concat(key, " notes..."));
                                            vault = svc.vaults[lodash_1.default.random(0, vaultTotal - 1)];
                                            return [4 /*yield*/, Promise.all(lodash_1.default.times(numNotes, function (i) { return __awaiter(_this, void 0, void 0, function () {
                                                    return __generator(this, function (_a) {
                                                        return [2 /*return*/, common_all_1.NoteUtils.create({ fname: "".concat(key, ".").concat(i), vault: vault })];
                                                    });
                                                }); }))];
                                        case 1:
                                            notes = _a.sent();
                                            return [4 /*yield*/, engine.bulkWriteNotes({ notes: notes })];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 4:
                        _d.sent();
                        return [2 /*return*/, { server: server }];
                }
            });
        });
    };
    DevCLICommand.prototype.generateJSONSchemaFromConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var repoRoot, pkgRoot, commonOutputPath, pluginOutputPath, configType, tsj, schema, schemaString;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        repoRoot = process.cwd();
                        pkgRoot = path_1.default.join(repoRoot, "packages", "engine-server");
                        commonOutputPath = path_1.default.join(repoRoot, "packages", "common-all", "data", "dendron-yml.validator.json");
                        pluginOutputPath = path_1.default.join(repoRoot, "packages", "plugin-core", "dist", "dendron-yml.validator.json");
                        configType = "ConfigForSchemaGenerator";
                        tsj = require("ts-json-schema-generator");
                        schema = tsj
                            .createGenerator({
                            path: path_1.default.join(pkgRoot, "src", "config.ts"),
                            tsconfig: path_1.default.join(pkgRoot, "tsconfig.build.json"),
                            type: configType,
                            skipTypeCheck: true,
                        })
                            .createSchema(configType);
                        schemaString = JSON.stringify(schema, null, 2);
                        fs_extra_1.default.ensureDirSync(path_1.default.dirname(pluginOutputPath));
                        return [4 /*yield*/, Promise.all([
                                fs_extra_1.default.writeFile(commonOutputPath, schemaString),
                                fs_extra_1.default.writeFile(pluginOutputPath, schemaString),
                            ])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DevCLICommand.prototype.execute = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var cmd, ctx, _a, wsRoot, jsonData, payload, server, currentVersion, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cmd = opts.cmd;
                        ctx = "execute";
                        this.L.info({ ctx: ctx });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 32, , 33]);
                        _a = cmd;
                        switch (_a) {
                            case DevCommands.GENERATE_JSON_SCHEMA_FROM_CONFIG: return [3 /*break*/, 2];
                            case DevCommands.BUILD: return [3 /*break*/, 4];
                            case DevCommands.CREATE_TEST_VAULT: return [3 /*break*/, 6];
                            case DevCommands.BUMP_VERSION: return [3 /*break*/, 8];
                            case DevCommands.SYNC_ASSETS: return [3 /*break*/, 10];
                            case DevCommands.SYNC_TUTORIAL: return [3 /*break*/, 12];
                            case DevCommands.PUBLISH: return [3 /*break*/, 13];
                            case DevCommands.PREP_PLUGIN: return [3 /*break*/, 18];
                            case DevCommands.PACKAGE_PLUGIN: return [3 /*break*/, 20];
                            case DevCommands.INSTALL_PLUGIN: return [3 /*break*/, 23];
                            case DevCommands.ENABLE_TELEMETRY: return [3 /*break*/, 25];
                            case DevCommands.DISABLE_TELEMETRY: return [3 /*break*/, 26];
                            case DevCommands.SHOW_TELEMETRY: return [3 /*break*/, 27];
                            case DevCommands.SHOW_MIGRATIONS: return [3 /*break*/, 28];
                            case DevCommands.RUN_MIGRATION: return [3 /*break*/, 29];
                        }
                        return [3 /*break*/, 30];
                    case 2: return [4 /*yield*/, this.generateJSONSchemaFromConfig()];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, { error: null }];
                    case 4:
                        if (!this.validateBuildArgs(opts)) {
                            return [2 /*return*/, {
                                    error: new common_all_1.DendronError({
                                        message: "missing options for build command",
                                    }),
                                }];
                        }
                        return [4 /*yield*/, this.build(opts)];
                    case 5:
                        _b.sent();
                        return [2 /*return*/, { error: null }];
                    case 6:
                        if (!this.validateCreateTestVaultArgs(opts)) {
                            return [2 /*return*/, {
                                    error: new common_all_1.DendronError({
                                        message: "missing required options",
                                    }),
                                }];
                        }
                        wsRoot = opts.wsRoot, jsonData = opts.jsonData;
                        payload = fs_extra_1.default.readJSONSync(jsonData);
                        this.print("reading json data from ".concat(jsonData));
                        return [4 /*yield*/, this.createTestVault({ wsRoot: wsRoot, payload: payload })];
                    case 7:
                        server = (_b.sent()).server;
                        if (server.close) {
                            this.print("closing server...");
                            server.close();
                        }
                        return [2 /*return*/, { error: null }];
                    case 8:
                        if (!this.validateBumpVersionArgs(opts)) {
                            return [2 /*return*/, {
                                    error: new common_all_1.DendronError({
                                        message: "missing options for build command",
                                    }),
                                }];
                        }
                        return [4 /*yield*/, this.bumpVersion(opts)];
                    case 9:
                        _b.sent();
                        return [2 /*return*/, { error: null }];
                    case 10: return [4 /*yield*/, this.syncAssets(opts)];
                    case 11:
                        _b.sent();
                        return [2 /*return*/, { error: null }];
                    case 12:
                        {
                            this.syncTutorial();
                            return [2 /*return*/, { error: null }];
                        }
                        _b.label = 13;
                    case 13:
                        if (!opts.publishEndpoint) {
                            return [2 /*return*/, {
                                    error: new common_all_1.DendronError({
                                        message: "missing options for cmd",
                                    }),
                                }];
                        }
                        _b.label = 14;
                    case 14:
                        _b.trys.push([14, , 16, 17]);
                        this.setEndpoint(opts.publishEndpoint);
                        return [4 /*yield*/, build_1.LernaUtils.publishVersion(opts.publishEndpoint)];
                    case 15:
                        _b.sent();
                        return [3 /*break*/, 17];
                    case 16:
                        if (opts.publishEndpoint === build_1.PublishEndpoint.LOCAL) {
                            build_1.BuildUtils.setRegRemote();
                        }
                        return [7 /*endfinally*/];
                    case 17: return [2 /*return*/, { error: null }];
                    case 18:
                        if (!this.validatePrepPluginArgs(opts)) {
                            return [2 /*return*/, {
                                    error: new common_all_1.DendronError({
                                        message: "missing options for prep_plugin command",
                                    }),
                                }];
                        }
                        return [4 /*yield*/, build_1.BuildUtils.prepPluginPkg(opts.extensionType)];
                    case 19:
                        _b.sent();
                        return [2 /*return*/, { error: null }];
                    case 20:
                        if (!opts.fast) {
                            this.print("install deps...");
                            build_1.BuildUtils.installPluginDependencies();
                        }
                        this.print("compiling plugin...");
                        return [4 /*yield*/, build_1.BuildUtils.compilePlugin(opts)];
                    case 21:
                        _b.sent();
                        this.print("package deps...");
                        return [4 /*yield*/, build_1.BuildUtils.packagePluginDependencies(opts)];
                    case 22:
                        _b.sent();
                        return [2 /*return*/, { error: null }];
                    case 23:
                        currentVersion = build_1.BuildUtils.getCurrentVersion();
                        return [4 /*yield*/, build_1.BuildUtils.installPluginLocally(currentVersion)];
                    case 24:
                        _b.sent();
                        return [2 /*return*/, { error: null }];
                    case 25:
                        {
                            this.enableTelemetry();
                            return [2 /*return*/, { error: null }];
                        }
                        _b.label = 26;
                    case 26:
                        {
                            this.disableTelemetry();
                            return [2 /*return*/, { error: null }];
                        }
                        _b.label = 27;
                    case 27:
                        {
                            __1.CLIAnalyticsUtils.showTelemetryMessage();
                            return [2 /*return*/, { error: null }];
                        }
                        _b.label = 28;
                    case 28:
                        {
                            this.showMigrations();
                            return [2 /*return*/, { error: null }];
                        }
                        _b.label = 29;
                    case 29:
                        {
                            if (!this.validateRunMigrationArgs(opts)) {
                                return [2 /*return*/, {
                                        error: new common_all_1.DendronError({
                                            message: "missing option(s) for run_migration command",
                                        }),
                                    }];
                            }
                            this.runMigration(opts);
                            return [2 /*return*/, { error: null }];
                        }
                        _b.label = 30;
                    case 30: return [2 /*return*/, (0, common_all_1.assertUnreachable)(cmd)];
                    case 31: return [3 /*break*/, 33];
                    case 32:
                        err_1 = _b.sent();
                        this.L.error(err_1);
                        if (err_1 instanceof common_all_1.DendronError) {
                            this.print(["status:", err_1.status, err_1.message].join(" "));
                        }
                        else {
                            this.print("unknown error " + (0, common_all_1.stringifyError)(err_1));
                        }
                        return [2 /*return*/, { error: err_1 }];
                    case 33: return [2 /*return*/];
                }
            });
        });
    };
    DevCLICommand.prototype.bumpVersion = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.print("bump version...");
                build_1.LernaUtils.bumpVersion(opts.upgradeType);
                return [2 /*return*/];
            });
        });
    };
    DevCLICommand.prototype.build = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, currentVersion, nextVersion, shouldPublishLocal, localSleepSeconds;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = "build";
                        currentVersion = build_1.BuildUtils.getCurrentVersion();
                        nextVersion = build_1.BuildUtils.genNextVersion({
                            currentVersion: currentVersion,
                            upgradeType: opts.upgradeType,
                        });
                        shouldPublishLocal = opts.publishEndpoint === build_1.PublishEndpoint.LOCAL;
                        this.L.info({ ctx: ctx, currentVersion: currentVersion, nextVersion: nextVersion });
                        this.print("prep publish ".concat(opts.publishEndpoint, "..."));
                        if (!shouldPublishLocal) return [3 /*break*/, 2];
                        this.print("setting endpoint to local");
                        return [4 /*yield*/, build_1.BuildUtils.prepPublishLocal()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        this.print("setting endpoint to remote");
                        return [4 /*yield*/, build_1.BuildUtils.prepPublishRemote()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!opts.fast) {
                            this.print("run type-check...");
                            build_1.BuildUtils.runTypeCheck();
                        }
                        else {
                            this.print("skipping type-check...");
                        }
                        this.bumpVersion(opts);
                        this.print("publish version...");
                        return [4 /*yield*/, build_1.LernaUtils.publishVersion(opts.publishEndpoint)];
                    case 5:
                        _a.sent();
                        this.print("sync assets...");
                        return [4 /*yield*/, this.syncAssets(opts)];
                    case 6:
                        _a.sent();
                        this.print("prep repo...");
                        return [4 /*yield*/, build_1.BuildUtils.prepPluginPkg(opts.extensionType)];
                    case 7:
                        _a.sent();
                        if (!!shouldPublishLocal) return [3 /*break*/, 9];
                        this.print("sleeping 2 mins for remote npm registry to have packages ready");
                        return [4 /*yield*/, common_all_1.TimeUtils.sleep(2 * 60 * 1000)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 9:
                        localSleepSeconds = 15;
                        this.print("sleeping ".concat(localSleepSeconds, "s for local npm registry to have packages ready"));
                        return [4 /*yield*/, common_all_1.TimeUtils.sleep(localSleepSeconds * 1000)];
                    case 10:
                        _a.sent();
                        _a.label = 11;
                    case 11:
                        this.print("install deps...");
                        build_1.BuildUtils.installPluginDependencies();
                        this.print("compiling plugin...");
                        return [4 /*yield*/, build_1.BuildUtils.compilePlugin(opts)];
                    case 12:
                        _a.sent();
                        this.print("package deps...");
                        return [4 /*yield*/, build_1.BuildUtils.packagePluginDependencies(opts)];
                    case 13:
                        _a.sent();
                        this.print("setRegRemote...");
                        build_1.BuildUtils.setRegRemote();
                        if (!opts.fast) {
                            this.print("restore package.json...");
                            build_1.BuildUtils.restorePluginPkgJson();
                        }
                        else {
                            this.print("skip restore package.json...");
                        }
                        this.L.info("done");
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Takes assets from different monorepo packages and copies them over to the plugin
     * @param param0
     * @returns
     */
    DevCLICommand.prototype.syncAssets = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var staticPath;
            var fast = _b.fast;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!fast) {
                            this.print("build plugin views for prod...");
                            build_1.BuildUtils.buildPluginViews();
                        }
                        this.print("sync static...");
                        return [4 /*yield*/, build_1.BuildUtils.syncStaticAssets()];
                    case 1:
                        staticPath = (_c.sent()).staticPath;
                        return [4 /*yield*/, build_1.BuildUtils.syncStaticAssetsToNextjsTemplate()];
                    case 2:
                        _c.sent();
                        return [2 /*return*/, { staticPath: staticPath }];
                }
            });
        });
    };
    DevCLICommand.prototype.syncTutorial = function () {
        var dendronSiteVaultPath = path_1.default.join(build_1.BuildUtils.getLernaRoot(), "docs", "seeds", "dendron.dendron-site", "vault");
        var tutorialDirPath = path_1.default.join(build_1.BuildUtils.getPluginRootPath(), "assets", "dendron-ws", "tutorial");
        var commonDirPath = path_1.default.join(tutorialDirPath, "common");
        // wipe everything in /assets/dendron-ws/tutorial/treatments
        var treatmentsDirPath = path_1.default.join(tutorialDirPath, "treatments");
        fs_extra_1.default.removeSync(treatmentsDirPath);
        fs_extra_1.default.ensureDirSync(treatmentsDirPath);
        // grab everything from `tutorial.*` hierarchy
        var tutorialNotePaths = fs_extra_1.default
            .readdirSync(dendronSiteVaultPath)
            .filter(function (basename) {
            return (basename.startsWith("tutorial.") &&
                basename.endsWith(".md") &&
                basename !== "tutorial.md");
        });
        // determine treatment name
        var treatmentNames = lodash_1.default.uniq(tutorialNotePaths.map(function (basename) { return basename.split(".")[1]; }));
        treatmentNames.forEach(function (treatmentName) {
            // create directories for treatment
            var treatmentNameDirPath = path_1.default.join(treatmentsDirPath, treatmentName);
            fs_extra_1.default.ensureDirSync(treatmentNameDirPath);
            // copy in commons (root, schema, assetdir)
            fs_extra_1.default.copySync(commonDirPath, treatmentNameDirPath);
            // copy in individual treated tutorial notes
            tutorialNotePaths
                .filter(function (basename) { return basename.startsWith("tutorial.".concat(treatmentName)); })
                .forEach(function (basename) {
                var src = path_1.default.join(dendronSiteVaultPath, basename);
                var dest = path_1.default.join(treatmentNameDirPath, basename.replace("tutorial.".concat(treatmentName), "tutorial"));
                fs_extra_1.default.copyFileSync(src, dest);
            });
        });
    };
    DevCLICommand.prototype.validateBuildArgs = function (opts) {
        if (!opts.upgradeType || !opts.publishEndpoint) {
            return false;
        }
        return true;
    };
    DevCLICommand.prototype.validateBumpVersionArgs = function (opts) {
        if (!opts.upgradeType) {
            return false;
        }
        return true;
    };
    DevCLICommand.prototype.validateCreateTestVaultArgs = function (opts) {
        if (!opts.wsRoot || !opts.jsonData) {
            return false;
        }
        return true;
    };
    DevCLICommand.prototype.validatePrepPluginArgs = function (opts) {
        if (opts.extensionType) {
            return Object.values(build_1.ExtensionType).includes(opts.extensionType);
        }
        return true;
    };
    DevCLICommand.prototype.validateRunMigrationArgs = function (opts) {
        if (!opts.wsRoot) {
            return false;
        }
        if (opts.migrationVersion) {
            return engine_server_1.MIGRATION_ENTRIES.map(function (m) { return m.version; }).includes(opts.migrationVersion);
        }
        return true;
    };
    DevCLICommand.prototype.enableTelemetry = function () {
        var reason = common_server_1.TelemetryStatus.ENABLED_BY_CLI_COMMAND;
        common_server_1.SegmentClient.enable(reason);
        __1.CLIAnalyticsUtils.track(common_all_1.CLIEvents.CLITelemetryEnabled, { reason: reason });
        var message = [
            "Telemetry is enabled.",
            "Thank you for helping us improve Dendron 🌱",
        ].join("\n");
        this.print(message);
    };
    DevCLICommand.prototype.disableTelemetry = function () {
        var reason = common_server_1.TelemetryStatus.DISABLED_BY_CLI_COMMAND;
        __1.CLIAnalyticsUtils.track(common_all_1.CLIEvents.CLITelemetryDisabled, { reason: reason });
        common_server_1.SegmentClient.disable(reason);
        var message = "Telemetry is disabled.";
        this.print(message);
    };
    DevCLICommand.prototype.showMigrations = function () {
        var headerMessage = [
            "",
            "Make note of the version number and use it in the run_migration command",
            "",
            "e.g.)",
            "> dendron dev run_migration --migrationVersion=0.64.1",
            "",
        ].join("\n");
        var body = [];
        var maxLength = 0;
        engine_server_1.MIGRATION_ENTRIES.forEach(function (migrations) {
            var version = migrations.version.padEnd(17);
            var changes = migrations.changes.map(function (set) { return set.name; }).join(", ");
            var line = "".concat(version, "| ").concat(changes);
            if (maxLength < line.length)
                maxLength = line.length;
            body.push(line);
        });
        var divider = "-".repeat(maxLength);
        this.print("======Available Migrations======");
        this.print(headerMessage);
        this.print(divider);
        this.print("version          | description");
        this.print(divider);
        this.print(body.join("\n"));
        this.print(divider);
    };
    DevCLICommand.prototype.runMigration = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var migrationsToRun, currentVersion, wsService, configPath, dendronConfig, wsConfig, changes;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        migrationsToRun = engine_server_1.MIGRATION_ENTRIES.filter(function (m) { return m.version === opts.migrationVersion; });
                        currentVersion = migrationsToRun[0].version;
                        wsService = new engine_server_1.WorkspaceService({ wsRoot: opts.wsRoot });
                        configPath = common_server_1.DConfig.configPath(opts.wsRoot);
                        dendronConfig = (0, common_server_1.readYAML)(configPath);
                        wsConfig = wsService.getCodeWorkspaceSettingsSync();
                        if (lodash_1.default.isUndefined(wsConfig)) {
                            throw common_all_1.DendronError.createFromStatus({
                                status: common_all_1.ERROR_STATUS.INVALID_STATE,
                                message: "no workspace config found",
                            });
                        }
                        return [4 /*yield*/, engine_server_1.MigrationService.applyMigrationRules({
                                currentVersion: currentVersion,
                                previousVersion: "0.0.0",
                                migrations: migrationsToRun,
                                wsService: wsService,
                                logger: this.L,
                                wsConfig: wsConfig,
                                dendronConfig: dendronConfig,
                            })];
                    case 1:
                        changes = _a.sent();
                        // report
                        if (changes.length > 0) {
                            changes.forEach(function (change) {
                                var event = lodash_1.default.isUndefined(change.error)
                                    ? common_all_1.CLIEvents.CLIMigrationSucceeded
                                    : common_all_1.CLIEvents.CLIMigrationFailed;
                                __1.CLIAnalyticsUtils.track(event, engine_server_1.MigrationUtils.getMigrationAnalyticProps(change));
                                if (change.error) {
                                    _this.print("Migration failed.");
                                    _this.print(change.error.message);
                                }
                                else {
                                    _this.print("Migration succeeded.");
                                }
                            });
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return DevCLICommand;
}(base_1.CLICommand));
exports.DevCLICommand = DevCLICommand;
