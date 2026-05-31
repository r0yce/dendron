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
exports.setupPodArgs = setupPodArgs;
exports.enrichPodArgs = enrichPodArgs;
var common_all_1 = require("@dendronhq/common-all");
var pods_core_1 = require("@dendronhq/pods-core");
var lodash_1 = require("lodash");
var utils_1 = require("./utils");
function setupPodArgs(args) {
    args.option("inlineConfig", {
        describe: "pass in config instead of reading from file. format is Key={key},Value={value}. If provided, this will override the value saved in the config file",
        array: true,
    });
    args.config("podConfig", "*.yml configuration file for pod", function (configPath) {
        var path = common_all_1.URI.parse(configPath);
        var configValues = pods_core_1.ConfigFileUtils.getConfigByFPath({
            fPath: path.fsPath,
        });
        if (lodash_1.default.isUndefined(configValues)) {
            throw new common_all_1.DendronError({
                message: "unable to find configuration file at ".concat(path.fsPath),
            });
        }
        return { configValues: configValues };
    });
    args.option("fname", {
        describe: "full name of the note you want to export",
        type: "string",
    });
    args.option("hierarchy", {
        describe: "hierarchy you want to export",
        type: "string",
    });
    args.option("podId", {
        describe: "unique ID for your custom pod configuration.",
        type: "string",
    });
}
function enrichPodArgs(args) {
    return __awaiter(this, void 0, void 0, function () {
        var inlineConfig, _a, configValues, engineArgs, wsRoot, podConfigPath, resp, serviceConnectionPath, resp, payload, engine, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    inlineConfig = args.inlineConfig;
                    _a = args.configValues, configValues = _a === void 0 ? {} : _a;
                    return [4 /*yield*/, (0, utils_1.setupEngine)(args)];
                case 1:
                    engineArgs = _c.sent();
                    wsRoot = engineArgs.wsRoot;
                    // return if no config is given
                    if (!args.podId && !args.podConfig && !args.inlineConfig) {
                        return [2 /*return*/, {
                                error: new common_all_1.DendronError({
                                    severity: common_all_1.ERROR_SEVERITY.FATAL,
                                    message: "no pod config found. Please provide a pod config or inline config",
                                }),
                            }];
                    }
                    // if podId is provided, get configValues from the config.{podId}.yml
                    if (args.podId) {
                        podConfigPath = pods_core_1.PodUtils.getCustomConfigPath({
                            wsRoot: wsRoot,
                            podId: args.podId,
                        });
                        try {
                            resp = pods_core_1.ConfigFileUtils.getConfigByFPath({
                                fPath: podConfigPath,
                            });
                            if (lodash_1.default.isUndefined(resp)) {
                                return [2 /*return*/, {
                                        error: new common_all_1.DendronError({
                                            severity: common_all_1.ERROR_SEVERITY.FATAL,
                                            status: "no-custom-config",
                                            message: "no pod config found for this podId. Please create a pod config at ".concat(podConfigPath),
                                        }),
                                    }];
                            }
                            configValues = __assign({}, resp);
                        }
                        catch (err) {
                            return [2 /*return*/, {
                                    error: err,
                                }];
                        }
                    }
                    // if provided, overwrite the configValues
                    if (inlineConfig) {
                        inlineConfig.map(function (conf) {
                            var _a = conf.split(","), k = _a[0], v = _a[1];
                            var key = k.split("=")[1];
                            var value = v.split("=")[1];
                            configValues[key] = value;
                        });
                    }
                    // If the config has a connectionId, read the sevice connection config file.
                    if (configValues.connectionId) {
                        serviceConnectionPath = pods_core_1.PodUtils.getServiceConfigPath({
                            wsRoot: wsRoot,
                            connectionId: configValues.connectionId,
                        });
                        try {
                            resp = pods_core_1.ConfigFileUtils.getConfigByFPath({
                                fPath: serviceConnectionPath,
                            });
                            if (lodash_1.default.isUndefined(resp)) {
                                return [2 /*return*/, {
                                        error: new common_all_1.DendronError({
                                            status: "no-service-config",
                                            message: "no service config found for this connectionId. Please create a service connection config at ".concat(serviceConnectionPath),
                                        }),
                                    }];
                            }
                            configValues = __assign(__assign({}, configValues), resp);
                        }
                        catch (err) {
                            return [2 /*return*/, {
                                    error: err,
                                }];
                        }
                    }
                    engine = engineArgs.engine;
                    _b = configValues.exportScope;
                    switch (_b) {
                        case pods_core_1.PodExportScope.Workspace: return [3 /*break*/, 2];
                        case pods_core_1.PodExportScope.Vault: return [3 /*break*/, 4];
                        case pods_core_1.PodExportScope.Note: return [3 /*break*/, 6];
                        case pods_core_1.PodExportScope.Hierarchy: return [3 /*break*/, 8];
                    }
                    return [3 /*break*/, 10];
                case 2: return [4 /*yield*/, getPropsForWorkspaceScope(engine)];
                case 3:
                    payload = _c.sent();
                    return [3 /*break*/, 11];
                case 4: return [4 /*yield*/, getPropsForVaultScope({ engine: engine, vaultName: args.vault })];
                case 5:
                    payload = _c.sent();
                    return [3 /*break*/, 11];
                case 6: return [4 /*yield*/, getPropsForNoteScope({
                        engine: engine,
                        vaultName: args.vault,
                        fname: args.fname,
                    })];
                case 7:
                    payload = _c.sent();
                    return [3 /*break*/, 11];
                case 8: return [4 /*yield*/, getPropsForHierarchyScope({
                        engine: engine,
                        hierarchy: args.hierarchy,
                        vaultName: args.vault,
                    })];
                case 9:
                    payload = _c.sent();
                    return [3 /*break*/, 11];
                case 10: throw new common_all_1.DendronError({
                    message: "the CLI doesn't support the provided export scope: ".concat(configValues.exportScope, ". please run this export pod using the Dendon plugin"),
                });
                case 11: return [2 /*return*/, {
                        data: __assign(__assign(__assign({}, args), engineArgs), { config: configValues, payload: payload }),
                    }];
            }
        });
    });
}
/**
 *
 * @param engine
 * @returns all notes in workspace
 */
var getPropsForWorkspaceScope = function (engine) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, engine.findNotes({ excludeStub: true })];
    });
}); };
/**
 *
 * @returns all notes in the vault
 */
var getPropsForVaultScope = function (opts) { return __awaiter(void 0, void 0, void 0, function () {
    var engine, vaultName, vault;
    return __generator(this, function (_a) {
        engine = opts.engine, vaultName = opts.vaultName;
        vault = checkVaultArgs({ engine: engine, vaultName: vaultName });
        return [2 /*return*/, engine.findNotes({ excludeStub: true, vault: vault })];
    });
}); };
var getPropsForNoteScope = function (opts) { return __awaiter(void 0, void 0, void 0, function () {
    var engine, fname, vaultName, vault, note;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                engine = opts.engine, fname = opts.fname, vaultName = opts.vaultName;
                vault = checkVaultArgs({ engine: engine, vaultName: vaultName });
                if (!fname) {
                    throw new common_all_1.DendronError({
                        message: "Please provide fname of note in --fname arg",
                    });
                }
                return [4 /*yield*/, engine.findNotes({ fname: fname, vault: vault })];
            case 1:
                note = (_a.sent())[0];
                if (!note)
                    throw new common_all_1.DendronError({
                        message: "Cannot find note with fname ".concat(fname, " in vault ").concat(vault),
                    });
                return [2 /*return*/, [note]];
        }
    });
}); };
// returns notes within a hierarchy (for a specefic vault)
var getPropsForHierarchyScope = function (opts) { return __awaiter(void 0, void 0, void 0, function () {
    var engine, hierarchy, vaultName, vault, notes;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                engine = opts.engine, hierarchy = opts.hierarchy, vaultName = opts.vaultName;
                if (!hierarchy) {
                    throw new common_all_1.DendronError({
                        message: "Please provide hierarchy in --hierarchy arg",
                    });
                }
                vault = checkVaultArgs({ engine: engine, vaultName: vaultName });
                return [4 /*yield*/, engine.findNotes({ excludeStub: true, vault: vault })];
            case 1:
                notes = _a.sent();
                return [2 /*return*/, notes.filter(function (value) { return value.fname.startsWith(hierarchy); })];
        }
    });
}); };
/**
 * This method check --vault argument. For a single vault workspace, if --vault not provided,
 * returns the vault from workspace.
 * For multi-vault workspace, if no --vault is given, returns an error, else returns selected vault
 */
var checkVaultArgs = function (opts) {
    var engine = opts.engine, vaultName = opts.vaultName;
    var vaults = engine.vaults;
    if (lodash_1.default.size(vaults) > 1 && !vaultName) {
        throw new common_all_1.DendronError({
            message: "Please provide vault name in --vault arg",
        });
    }
    else {
        return vaultName
            ? common_all_1.VaultUtils.getVaultByNameOrThrow({ vaults: vaults, vname: vaultName })
            : vaults[0];
    }
};
