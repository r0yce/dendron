"use strict";
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
exports.handleConflict = exports.PodSource = exports.executePod = void 0;
exports.fetchPodClassV4 = fetchPodClassV4;
exports.setupPodArgs = setupPodArgs;
exports.enrichPodArgs = enrichPodArgs;
/* eslint-disable import/no-dynamic-require */
var common_all_1 = require("@dendronhq/common-all");
var pods_core_1 = require("@dendronhq/pods-core");
var lodash_1 = require("lodash");
var path_1 = require("path");
var prompts_1 = require("prompts");
var utils_1 = require("./utils");
function fetchPodClassV4(podId, opts) {
    var podSource = opts.podSource, pods = opts.pods;
    if (podSource === PodSource.BUILTIN) {
        if (!pods) {
            throw Error("pods needs to be defined");
        }
        var podClass = lodash_1.default.find(pods, {
            id: podId,
        });
        if (lodash_1.default.isUndefined(podClass)) {
            throw Error("no pod found");
        }
        return podClass;
    }
    else {
        if (!opts.podPkg || !opts.wsRoot) {
            throw Error("podPkg not defined");
        }
        // eslint-disable-next-line global-require
        var podEntries = require("".concat(path_1.default.join(opts.wsRoot, "node_modules", opts.podPkg))).pods;
        var podClass = lodash_1.default.find(podEntries, function (entry) {
            return entry.id === podId && entry.kind === opts.podType;
        });
        if (!podClass) {
            throw Error("no podClass found");
        }
        return podClass;
    }
}
function setupPodArgs(args) {
    args.option("podId", {
        describe: "id of pod to use",
        requiresArg: true,
    });
    args.option("showConfig", {
        describe: "show pod configuration",
    });
    args.option("genConfig", {
        describe: "show pod configuration",
    });
    args.option("podPkg", {
        describe: "if specifying a custom pod, name of pkg",
    });
    args.option("config", {
        describe: "pass in config instead of reading from file. format is comma delimited {key}={value} pairs",
    });
    args.option("podSource", {
        describe: "podSource",
        choices: lodash_1.default.values(PodSource),
        default: PodSource.BUILTIN,
    });
}
function enrichPodArgs(opts) {
    var _this = this;
    var pods = opts.pods, podType = opts.podType;
    var enrichFunc = function (args) { return __awaiter(_this, void 0, void 0, function () {
        var podId, showConfig, podSource, podPkg, genConfig, config, engineArgs, wsRoot, podClass, config_1, podsDir_1, configPath, podsDir, cleanConfig, resp, podConfigPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    podId = args.podId, showConfig = args.showConfig, podSource = args.podSource, podPkg = args.podPkg, genConfig = args.genConfig, config = args.config;
                    return [4 /*yield*/, (0, utils_1.setupEngine)(args)];
                case 1:
                    engineArgs = _a.sent();
                    wsRoot = engineArgs.wsRoot;
                    podClass = fetchPodClassV4(podId, {
                        pods: pods,
                        podType: podType,
                        podSource: podSource,
                        podPkg: podPkg,
                        wsRoot: wsRoot,
                    });
                    // if show config, output configuration and exit
                    if (showConfig) {
                        config_1 = new podClass().config;
                        // eslint-disable-next-line no-console
                        console.log(config_1);
                        process.exit(0);
                    }
                    // if genConfig, create the file and exit
                    if (genConfig) {
                        podsDir_1 = pods_core_1.PodUtils.getPodDir({ wsRoot: wsRoot });
                        configPath = pods_core_1.PodUtils.genConfigFile({
                            podsDir: podsDir_1,
                            podClass: podClass,
                            force: true,
                        });
                        // eslint-disable-next-line no-console
                        console.log("config generated at ".concat(configPath));
                        process.exit(0);
                    }
                    podsDir = path_1.default.join(wsRoot, "pods");
                    cleanConfig = {};
                    resp = args.configPath
                        ? pods_core_1.PodUtils.readPodConfigFromDisk(args.configPath)
                        : pods_core_1.PodUtils.getConfig({
                            podsDir: podsDir,
                            podClass: podClass,
                        });
                    if (resp.error && !config && pods_core_1.PodUtils.hasRequiredOpts(podClass)) {
                        return [2 /*return*/, {
                                error: resp.error,
                            }];
                    }
                    if (resp.data) {
                        cleanConfig = resp.data;
                    }
                    // if additional parameters are passed in, then add them to the config
                    // add additional config
                    if (config) {
                        config.split(",").map(function (ent) {
                            var _a = ent.split("="), k = _a[0], v = _a[1];
                            cleanConfig[k] = v;
                        });
                    }
                    if (podType === "publish") {
                        switch (podId) {
                            case pods_core_1.MarkdownPublishPod.id:
                            case pods_core_1.JSONPublishPod.id:
                            case pods_core_1.HTMLPublishPod.id:
                                cleanConfig["dest"] = "stdout";
                                break;
                            default:
                                // default is no-op
                                break;
                        }
                        // if vault is specified, then override config to pass in
                        if (args.vault) {
                            cleanConfig["vaultName"] = args.vault;
                        }
                        if (args.query) {
                            cleanConfig["fname"] = args.query;
                        }
                    }
                    else if (podId !== pods_core_1.NextjsExportPod.id) {
                        // eslint-disable-next-line no-console
                        console.log("WARN: --query and --vault parameter not implemented for podType ".concat(podType));
                    }
                    // error checking, config shouldn't be empty
                    if (lodash_1.default.isEmpty(cleanConfig)) {
                        podConfigPath = pods_core_1.PodUtils.getConfigPath({ podsDir: podsDir, podClass: podClass });
                        throw new common_all_1.DendronError({
                            status: "no-config",
                            message: "no config found. please create a config at ".concat(podConfigPath),
                        });
                    }
                    return [2 /*return*/, {
                            data: __assign(__assign(__assign({}, args), engineArgs), { podClass: podClass, config: cleanConfig }),
                        }];
            }
        });
    }); };
    return enrichFunc;
}
var executePod = function (opts) { return __awaiter(void 0, void 0, void 0, function () {
    var PodClass, config, wsRoot, engine, server, vaults, pod;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                PodClass = opts.podClass, config = opts.config, wsRoot = opts.wsRoot, engine = opts.engine, server = opts.server;
                vaults = engine.vaults;
                pod = new PodClass();
                return [4 /*yield*/, pod.execute({ wsRoot: wsRoot, config: config, engine: engine, vaults: vaults })];
            case 1:
                _a.sent();
                server.close(function (err) {
                    if (err) {
                        throw err;
                    }
                });
                return [2 /*return*/];
        }
    });
}); };
exports.executePod = executePod;
var PodSource;
(function (PodSource) {
    PodSource["CUSTOM"] = "custom";
    PodSource["BUILTIN"] = "builtin";
})(PodSource || (exports.PodSource = PodSource = {}));
var handleConflict = function (conflict, conflictResolveOpts) { return __awaiter(void 0, void 0, void 0, function () {
    var options, optionsMessage, resp;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                options = conflictResolveOpts.options();
                optionsMessage = "What would you like to do? Choose 0/1..";
                options.map(function (option, index) {
                    optionsMessage = optionsMessage.concat("\n".concat(index, ": ").concat(option));
                });
                return [4 /*yield*/, (0, prompts_1.default)({
                        type: "text",
                        name: "choice",
                        message: "".concat(conflictResolveOpts.message(conflict), "\n").concat(optionsMessage),
                        validate: function (choice) { return conflictResolveOpts.validate(choice, options); },
                    })];
            case 1:
                resp = _a.sent();
                return [2 /*return*/, options[resp.choice]];
        }
    });
}); };
exports.handleConflict = handleConflict;
