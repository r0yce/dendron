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
exports.VaultCLICommand = exports.VaultCommands = void 0;
var engine_server_1 = require("@dendronhq/engine-server");
var common_all_1 = require("@dendronhq/common-all");
var base_1 = require("./base");
var utils_1 = require("./utils");
var common_server_1 = require("@dendronhq/common-server");
var VaultCommands;
(function (VaultCommands) {
    VaultCommands["CREATE"] = "create";
    VaultCommands["CONVERT"] = "convert";
})(VaultCommands || (exports.VaultCommands = VaultCommands = {}));
var VaultCLICommand = /** @class */ (function (_super) {
    __extends(VaultCLICommand, _super);
    function VaultCLICommand() {
        return _super.call(this, { name: "vault <cmd>", desc: "vault related commands" }) || this;
    }
    VaultCLICommand.prototype.buildArgs = function (args) {
        _super.prototype.buildArgs.call(this, args);
        (0, utils_1.setupEngineArgs)(args);
        args.positional("cmd", {
            describe: "a command to run",
            choices: Object.values(VaultCommands),
            type: "string",
        });
        args.option("vaultPath", {
            describe: "path to vault",
            type: "string",
            required: true,
        });
        args.option("noAddToConfig", {
            describe: "if set, don't add vault to dendron.yml",
            type: "boolean",
        });
        args.option("remoteUrl", {
            describe: "If converting to a remote vault, URL of the remote to use. Like https://github.com/dendronhq/dendron-site.git or git@github.com:dendronhq/dendron-site.git",
            type: "string",
        });
        args.option("type", {
            describe: "If converting a vault, what type of vault to convert it to.",
            type: "string",
            choices: ["remote", "local"],
        });
    };
    VaultCLICommand.prototype.enrichArgs = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var engineArgs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.addArgsToPayload({ cmd: args.cmd });
                        return [4 /*yield*/, (0, utils_1.setupEngine)(args)];
                    case 1:
                        engineArgs = _a.sent();
                        return [2 /*return*/, { data: __assign(__assign({}, args), engineArgs) }];
                }
            });
        });
    };
    VaultCLICommand.prototype.execute = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var cmd, wsRoot, vaultPath, noAddToConfig, _a, wsService, resp, vault, vault, vault, wsService, remoteUrl;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        cmd = opts.cmd, wsRoot = opts.wsRoot, vaultPath = opts.vaultPath, noAddToConfig = opts.noAddToConfig;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, , 10, 11]);
                        _a = cmd;
                        switch (_a) {
                            case VaultCommands.CREATE: return [3 /*break*/, 2];
                            case VaultCommands.CONVERT: return [3 /*break*/, 7];
                        }
                        return [3 /*break*/, 8];
                    case 2:
                        wsService = new engine_server_1.WorkspaceService({ wsRoot: wsRoot });
                        resp = void 0;
                        if (!((_b = common_server_1.DConfig.readConfigSync(wsRoot).dev) === null || _b === void 0 ? void 0 : _b.enableSelfContainedVaults)) return [3 /*break*/, 4];
                        vault = {
                            fsPath: vaultPath,
                            selfContained: true,
                        };
                        return [4 /*yield*/, wsService.createSelfContainedVault({
                                vault: vault,
                                addToConfig: true,
                                addToCodeWorkspace: true,
                                newVault: true,
                            })];
                    case 3:
                        resp = _c.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        vault = {
                            fsPath: vaultPath,
                        };
                        return [4 /*yield*/, wsService.createVault({
                                vault: vault,
                                noAddToConfig: noAddToConfig,
                                addToCodeWorkspace: true,
                            })];
                    case 5:
                        resp = _c.sent();
                        _c.label = 6;
                    case 6:
                        this.print("".concat(vaultPath, " created"));
                        return [2 /*return*/, { vault: resp, error: undefined }];
                    case 7:
                        {
                            vault = opts.engine.vaults.find(function (vault) { return vault.fsPath === vaultPath; });
                            if (!vault)
                                throw new common_all_1.DendronError({
                                    message: "Could not find any vaults at ".concat(vaultPath),
                                });
                            wsService = new engine_server_1.WorkspaceService({ wsRoot: wsRoot });
                            if (opts.type === "local") {
                                wsService.convertVaultLocal({ wsRoot: wsRoot, vault: vault });
                            }
                            else if (opts.type === "remote") {
                                remoteUrl = opts.remoteUrl;
                                if (!remoteUrl)
                                    throw new common_all_1.DendronError({
                                        message: "Trying to convert to a remote vault, but the ",
                                    });
                                wsService.convertVaultRemote({ wsRoot: wsRoot, vault: vault, remoteUrl: remoteUrl });
                            }
                            else {
                                throw new common_all_1.DendronError({
                                    message: "Please provide what type of vault should be created.",
                                });
                            }
                            return [2 /*return*/, { vault: vault, error: undefined }];
                        }
                        _c.label = 8;
                    case 8:
                        {
                            throw Error("bad option");
                        }
                        _c.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        if (opts.server.close) {
                            opts.server.close();
                        }
                        return [7 /*endfinally*/];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    return VaultCLICommand;
}(base_1.CLICommand));
exports.VaultCLICommand = VaultCLICommand;
