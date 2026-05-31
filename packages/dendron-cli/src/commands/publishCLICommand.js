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
exports.PublishCLICommand = exports.PublishCommands = void 0;
var common_all_1 = require("@dendronhq/common-all");
var engine_server_1 = require("@dendronhq/engine-server");
var pods_core_1 = require("@dendronhq/pods-core");
var lodash_1 = require("lodash");
var path_1 = require("path");
var cli_1 = require("../utils/cli");
var base_1 = require("./base");
var exportPod_1 = require("./exportPod");
var pod_1 = require("./pod");
var prompts_1 = require("prompts");
var fs_extra_1 = require("fs-extra");
var ora_1 = require("ora");
var common_server_1 = require("@dendronhq/common-server");
var PublishCommands;
(function (PublishCommands) {
    /**
     * Initiliaze the nextjs-template from Dendron in the dendron workspace
     */
    PublishCommands["INIT"] = "init";
    /**
     * Create metadata needed to builid dendron nextjs template
     */
    PublishCommands["BUILD"] = "build";
    /**
     * Builds the website
     */
    PublishCommands["DEV"] = "dev";
    /**
     * Export website
     */
    PublishCommands["EXPORT"] = "export";
})(PublishCommands || (exports.PublishCommands = PublishCommands = {}));
var getNextRoot = function (wsRoot) {
    return path_1.default.join(wsRoot, ".next");
};
var isBuildOverrideKey = function (key) {
    var allowedKeys = [
        "siteUrl",
        "assetsPrefix",
    ];
    return allowedKeys.includes(key);
};
/**
 * To use when working on dendron
 */
var PublishCLICommand = /** @class */ (function (_super) {
    __extends(PublishCLICommand, _super);
    function PublishCLICommand() {
        return _super.call(this, {
            name: "publish <cmd>",
            desc: "commands for publishing notes",
        }) || this;
    }
    PublishCLICommand.prototype.buildArgs = function (args) {
        _super.prototype.buildArgs.call(this, args);
        args.positional("cmd", {
            describe: "a command to run",
            choices: Object.values(PublishCommands),
            type: "string",
        });
        args.option("dest", {
            describe: "override where nextjs-template is located",
            type: "string",
        });
        args.option("attach", {
            describe: "use existing dendron engine instead of spawning a new one",
            type: "boolean",
        });
        args.option("noBuild", {
            describe: "skip building notes",
            type: "boolean",
            default: false,
        });
        args.option("overrides", {
            describe: "override existing siteConfig properties",
            type: "string",
        });
        args.option("target", {
            describe: "export to specific destination",
            choices: lodash_1.default.values(pods_core_1.PublishTarget),
        });
        args.option("yes", {
            describe: "automatically say yes to all prompts",
            type: "boolean",
        });
        args.option("sitemap", {
            describe: "generates a sitemap: https://en.wikipedia.org/wiki/Site_map",
            type: "boolean",
        });
    };
    PublishCLICommand.prototype.enrichArgs = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var error, coverrides;
            return __generator(this, function (_a) {
                this.addArgsToPayload({ cmd: args.cmd });
                coverrides = {};
                if (!lodash_1.default.isUndefined(args.overrides)) {
                    args.overrides.split(",").map(function (ent) {
                        var _a = lodash_1.default.trim(ent).split("="), k = _a[0], v = _a[1];
                        if (isBuildOverrideKey(k)) {
                            coverrides[k] = v;
                        }
                        else {
                            error = new common_all_1.DendronError({
                                message: "bad key for override. ".concat(k, " is not a valid key"),
                            });
                        }
                    });
                }
                if (error) {
                    return [2 /*return*/, { error: error }];
                }
                return [2 /*return*/, {
                        data: __assign(__assign({}, lodash_1.default.omit(args, "overrides")), { overrides: coverrides }),
                    }];
            });
        });
    };
    PublishCLICommand.prototype.execute = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var cmd, ctx, spinner, _a, out, wsRoot, isInitialized, wsRoot, isInitialized, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cmd = opts.cmd;
                        ctx = "execute";
                        this.L.info({ ctx: ctx });
                        spinner = (0, ora_1.default)().start();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 25, , 26]);
                        _a = cmd;
                        switch (_a) {
                            case PublishCommands.INIT: return [3 /*break*/, 2];
                            case PublishCommands.BUILD: return [3 /*break*/, 4];
                            case PublishCommands.DEV: return [3 /*break*/, 5];
                            case PublishCommands.EXPORT: return [3 /*break*/, 13];
                        }
                        return [3 /*break*/, 23];
                    case 2: return [4 /*yield*/, this.init(__assign(__assign({}, opts), { spinner: spinner }))];
                    case 3:
                        out = _b.sent();
                        spinner.stop();
                        return [2 /*return*/, out];
                    case 4:
                        {
                            spinner.stop();
                            return [2 /*return*/, this.build(opts)];
                        }
                        _b.label = 5;
                    case 5:
                        wsRoot = opts.wsRoot;
                        return [4 /*yield*/, this._isInitialized({ wsRoot: wsRoot, spinner: spinner })];
                    case 6:
                        isInitialized = _b.sent();
                        if (!!isInitialized) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.init(__assign(__assign({}, opts), { spinner: spinner }))];
                    case 7:
                        _b.sent();
                        _b.label = 8;
                    case 8:
                        if (!opts.noBuild) return [3 /*break*/, 9];
                        cli_1.SpinnerUtils.renderAndContinue({
                            spinner: spinner,
                            text: "skipping build...",
                        });
                        return [3 /*break*/, 11];
                    case 9:
                        spinner.stop();
                        return [4 /*yield*/, this.build(opts)];
                    case 10:
                        _b.sent();
                        _b.label = 11;
                    case 11: return [4 /*yield*/, this.dev(opts)];
                    case 12:
                        _b.sent();
                        return [2 /*return*/, { error: null }];
                    case 13:
                        wsRoot = opts.wsRoot;
                        return [4 /*yield*/, this._isInitialized({ wsRoot: wsRoot, spinner: spinner })];
                    case 14:
                        isInitialized = _b.sent();
                        if (!!isInitialized) return [3 /*break*/, 16];
                        return [4 /*yield*/, this.init(__assign(__assign({}, opts), { spinner: spinner }))];
                    case 15:
                        _b.sent();
                        _b.label = 16;
                    case 16:
                        if (!opts.noBuild) return [3 /*break*/, 17];
                        cli_1.SpinnerUtils.renderAndContinue({
                            spinner: spinner,
                            text: "skipping build...",
                        });
                        return [3 /*break*/, 19];
                    case 17: return [4 /*yield*/, this.build(opts)];
                    case 18:
                        _b.sent();
                        _b.label = 19;
                    case 19:
                        spinner.stop();
                        return [4 /*yield*/, this.export(opts)];
                    case 20:
                        _b.sent();
                        if (!opts.target) return [3 /*break*/, 22];
                        return [4 /*yield*/, this._handlePublishTarget(opts.target, opts)];
                    case 21:
                        _b.sent();
                        _b.label = 22;
                    case 22: return [2 /*return*/, { error: null }];
                    case 23:
                        (0, common_all_1.assertUnreachable)(cmd);
                        _b.label = 24;
                    case 24: return [3 /*break*/, 26];
                    case 25:
                        err_1 = _b.sent();
                        this.L.error(err_1);
                        if (err_1 instanceof common_all_1.DendronError) {
                            this.print(["status:", err_1.status, err_1.message].join(" "));
                        }
                        else {
                            this.print("unknown error " + (0, common_all_1.error2PlainObject)(err_1));
                        }
                        return [2 /*return*/, { error: err_1 }];
                    case 26: return [2 /*return*/];
                }
            });
        });
    };
    PublishCLICommand.prototype._buildNextData = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var cli, podConfig, resp, opts, config, publishingConfig, error;
            var _c;
            var wsRoot = _b.wsRoot, stage = _b.stage, dest = _b.dest, attach = _b.attach, overrides = _b.overrides;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        cli = new exportPod_1.ExportPodCLICommand();
                        podConfig = {
                            dest: dest || getNextRoot(wsRoot),
                        };
                        return [4 /*yield*/, cli.enrichArgs({
                                podId: pods_core_1.NextjsExportPod.id,
                                podSource: pod_1.PodSource.BUILTIN,
                                wsRoot: wsRoot,
                                config: cli_1.CLIUtils.objectConfig2StringConfig(podConfig),
                                attach: attach,
                            })];
                    case 1:
                        resp = _d.sent();
                        if (resp.error) {
                            return [2 /*return*/, { error: resp.error }];
                        }
                        opts = resp.data;
                        opts.config.overrides = overrides || {};
                        config = common_server_1.DConfig.readConfigSync(opts.engine.wsRoot);
                        publishingConfig = common_all_1.ConfigUtils.getPublishing(config);
                        if (stage !== "prod") {
                            if (!publishingConfig.siteUrl && !(overrides === null || overrides === void 0 ? void 0 : overrides.siteUrl)) {
                                lodash_1.default.set(opts.config.overrides, "siteUrl", "localhost:3000");
                            }
                        }
                        error = engine_server_1.SiteUtils.validateConfig(publishingConfig).error;
                        if (error) {
                            return [2 /*return*/, { error: error }];
                        }
                        _c = {};
                        return [4 /*yield*/, cli.execute(opts)];
                    case 2: return [2 /*return*/, (_c.data = _d.sent(), _c)];
                }
            });
        });
    };
    PublishCLICommand.prototype._handlePublishTarget = function (target, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var wsRoot, _a, docsPath, outPath, docsExist, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        wsRoot = opts.wsRoot;
                        _a = target;
                        switch (_a) {
                            case pods_core_1.PublishTarget.GITHUB: return [3 /*break*/, 1];
                        }
                        return [3 /*break*/, 5];
                    case 1:
                        docsPath = path_1.default.join(wsRoot, "docs");
                        outPath = path_1.default.join(wsRoot, ".next", "out");
                        this.print("building github target...");
                        // if `out` no exist, exit
                        if (!fs_extra_1.default.pathExistsSync(outPath)) {
                            this.print("".concat(outPath, " does not exist. exiting"));
                            return [2 /*return*/];
                        }
                        docsExist = fs_extra_1.default.pathExistsSync(docsPath);
                        if (!docsExist) return [3 /*break*/, 4];
                        if (!!opts.yes) return [3 /*break*/, 3];
                        return [4 /*yield*/, (0, prompts_1.default)({
                                type: "confirm",
                                name: "value",
                                message: "Docs folder exists. Delete?",
                                initial: false,
                            })];
                    case 2:
                        response = _b.sent();
                        if (!response.value) {
                            this.print("exiting");
                            return [2 /*return*/];
                        }
                        _b.label = 3;
                    case 3:
                        fs_extra_1.default.removeSync(docsPath);
                        _b.label = 4;
                    case 4:
                        // build docs
                        fs_extra_1.default.moveSync(outPath, docsPath);
                        fs_extra_1.default.ensureFileSync(path_1.default.join(docsPath, ".nojekyll"));
                        this.print("done export. files available at ".concat(docsPath));
                        return [2 /*return*/];
                    case 5:
                        (0, common_all_1.assertUnreachable)(target);
                        _b.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    PublishCLICommand.prototype.init = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var wsRoot, spinner, nextPath, nextPathExists, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wsRoot = opts.wsRoot, spinner = opts.spinner;
                        common_server_1.GitUtils.addToGitignore({ addPath: ".next", root: wsRoot });
                        nextPath = pods_core_1.NextjsExportPodUtils.getNextRoot(wsRoot);
                        return [4 /*yield*/, this._nextPathExists({
                                nextPath: nextPath,
                                spinner: spinner,
                            })];
                    case 1:
                        nextPathExists = _a.sent();
                        if (!nextPathExists) return [3 /*break*/, 8];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 7]);
                        return [4 /*yield*/, this._updateNextTemplate({
                                nextPath: nextPath,
                                spinner: spinner,
                            })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 4:
                        err_2 = _a.sent();
                        cli_1.SpinnerUtils.renderAndContinue({
                            spinner: spinner,
                            text: "failed to update next NextJS template working copy (".concat(err_2, "); cloning fresh"),
                        });
                        return [4 /*yield*/, this._removeNextPath({
                                nextPath: nextPath,
                                spinner: spinner,
                            })];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this._initialize({ nextPath: nextPath, spinner: spinner })];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 7: return [3 /*break*/, 10];
                    case 8: return [4 /*yield*/, this._initialize({ nextPath: nextPath, spinner: spinner })];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10: return [2 /*return*/, { error: null }];
                }
            });
        });
    };
    PublishCLICommand.prototype._isInitialized = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var spinner, wsRoot, isInitialized;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        spinner = opts.spinner, wsRoot = opts.wsRoot;
                        spinner.start();
                        cli_1.SpinnerUtils.renderAndContinue({
                            spinner: spinner,
                            text: "checking if NextJS template is initialized",
                        });
                        return [4 /*yield*/, pods_core_1.NextjsExportPodUtils.isInitialized({
                                wsRoot: wsRoot,
                            })];
                    case 1:
                        isInitialized = _a.sent();
                        cli_1.SpinnerUtils.renderAndContinue({
                            spinner: spinner,
                            text: "NextJS template is ".concat(isInitialized ? "already" : "not", " initialized."),
                        });
                        return [2 /*return*/, isInitialized];
                }
            });
        });
    };
    PublishCLICommand.prototype._nextPathExists = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var spinner, nextPath, nextPathBase, nextPathExists;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        spinner = opts.spinner, nextPath = opts.nextPath;
                        nextPathBase = path_1.default.basename(nextPath);
                        cli_1.SpinnerUtils.renderAndContinue({
                            spinner: spinner,
                            text: "checking if ".concat(nextPathBase, " directory exists."),
                        });
                        return [4 /*yield*/, pods_core_1.NextjsExportPodUtils.nextPathExists({
                                nextPath: nextPath,
                            })];
                    case 1:
                        nextPathExists = _a.sent();
                        cli_1.SpinnerUtils.renderAndContinue({
                            spinner: spinner,
                            text: "".concat(nextPathBase, " directory ").concat(nextPathExists ? "exists" : "does not exist"),
                        });
                        return [2 /*return*/, nextPathExists];
                }
            });
        });
    };
    PublishCLICommand.prototype._updateNextTemplate = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var spinner, nextPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        spinner = opts.spinner, nextPath = opts.nextPath;
                        cli_1.SpinnerUtils.renderAndContinue({
                            spinner: spinner,
                            text: "updating NextJS template.",
                        });
                        return [4 /*yield*/, pods_core_1.NextjsExportPodUtils.updateTemplate({
                                nextPath: nextPath,
                            })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this._installDependencies(opts)];
                    case 2:
                        _a.sent();
                        cli_1.SpinnerUtils.renderAndContinue({
                            spinner: spinner,
                            text: "updated NextJS template.",
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    PublishCLICommand.prototype._removeNextPath = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var spinner, nextPath, nextPathBase;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        spinner = opts.spinner, nextPath = opts.nextPath;
                        nextPathBase = path_1.default.basename(nextPath);
                        return [4 /*yield*/, pods_core_1.NextjsExportPodUtils.removeNextPath({
                                nextPath: nextPath,
                            })];
                    case 1:
                        _a.sent();
                        cli_1.SpinnerUtils.renderAndContinue({
                            spinner: spinner,
                            text: "existing ".concat(nextPathBase, " directory deleted."),
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    PublishCLICommand.prototype._initialize = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var spinner;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        spinner = opts.spinner;
                        cli_1.SpinnerUtils.renderAndContinue({
                            spinner: spinner,
                            text: "Initializing NextJS template.",
                        });
                        return [4 /*yield*/, this._cloneTemplate(opts)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this._installDependencies(opts)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PublishCLICommand.prototype._cloneTemplate = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var nextPath, spinner;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nextPath = opts.nextPath, spinner = opts.spinner;
                        spinner.stop();
                        spinner.start("Cloning NextJS template...");
                        return [4 /*yield*/, pods_core_1.NextjsExportPodUtils.cloneTemplate({ nextPath: nextPath })];
                    case 1:
                        _a.sent();
                        cli_1.SpinnerUtils.renderAndContinue({
                            spinner: spinner,
                            text: "Successfully cloned.",
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    PublishCLICommand.prototype._installDependencies = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var nextPath, spinner;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nextPath = opts.nextPath, spinner = opts.spinner;
                        spinner.stop();
                        spinner.start("Installing dependencies... This may take a while.");
                        return [4 /*yield*/, pods_core_1.NextjsExportPodUtils.installDependencies({ nextPath: nextPath })];
                    case 1:
                        _a.sent();
                        cli_1.SpinnerUtils.renderAndContinue({
                            spinner: spinner,
                            text: "All dependencies installed.",
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    PublishCLICommand.prototype.build = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var error, nextPath;
            var wsRoot = _b.wsRoot, dest = _b.dest, attach = _b.attach, overrides = _b.overrides, sitemap = _b.sitemap;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.print("generating metadata for publishing...");
                        return [4 /*yield*/, this._buildNextData({
                                wsRoot: wsRoot,
                                stage: (0, common_all_1.getStage)(),
                                dest: dest,
                                attach: attach,
                                overrides: overrides,
                            })];
                    case 1:
                        error = (_c.sent()).error;
                        if (error) {
                            this.print("ERROR: " + error.message);
                            return [2 /*return*/, { error: error }];
                        }
                        if (!sitemap) return [3 /*break*/, 3];
                        nextPath = pods_core_1.NextjsExportPodUtils.getNextRoot(wsRoot);
                        return [4 /*yield*/, pods_core_1.NextjsExportPodUtils.buildSiteMap({ nextPath: nextPath })];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3: return [2 /*return*/, { error: null }];
                }
            });
        });
    };
    PublishCLICommand.prototype.dev = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var nextPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nextPath = pods_core_1.NextjsExportPodUtils.getNextRoot(opts.wsRoot);
                        return [4 /*yield*/, pods_core_1.NextjsExportPodUtils.startNextDev({ nextPath: nextPath, windowsHide: false })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { error: null }];
                }
            });
        });
    };
    PublishCLICommand.prototype.export = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var nextPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nextPath = pods_core_1.NextjsExportPodUtils.getNextRoot(opts.wsRoot);
                        return [4 /*yield*/, pods_core_1.NextjsExportPodUtils.startNextExport({ nextPath: nextPath })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return PublishCLICommand;
}(base_1.CLICommand));
exports.PublishCLICommand = PublishCLICommand;
