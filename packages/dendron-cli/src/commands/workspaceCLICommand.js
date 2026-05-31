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
exports.WorkspaceCLICommand = exports.WorkspaceCommands = void 0;
var engine_server_1 = require("@dendronhq/engine-server");
var lodash_1 = require("lodash");
var base_1 = require("./base");
var utils_1 = require("./utils");
var WorkspaceCommands;
(function (WorkspaceCommands) {
    WorkspaceCommands["PULL"] = "pull";
    WorkspaceCommands["PUSH"] = "push";
    WorkspaceCommands["ADD_AND_COMMIT"] = "addAndCommit";
    WorkspaceCommands["SYNC"] = "sync";
    WorkspaceCommands["REMOVE_CACHE"] = "removeCache";
    WorkspaceCommands["INIT"] = "init";
    WorkspaceCommands["INFO"] = "info";
})(WorkspaceCommands || (exports.WorkspaceCommands = WorkspaceCommands = {}));
var WorkspaceCLICommand = /** @class */ (function (_super) {
    __extends(WorkspaceCLICommand, _super);
    function WorkspaceCLICommand() {
        return _super.call(this, { name: "workspace <cmd>", desc: "workspace related commands" }) || this;
    }
    WorkspaceCLICommand.prototype.buildArgs = function (args) {
        _super.prototype.buildArgs.call(this, args);
        (0, utils_1.setupEngineArgs)(args);
        args.positional("cmd", {
            describe: "a command to run",
            choices: Object.values(WorkspaceCommands),
            type: "string",
        });
    };
    WorkspaceCLICommand.prototype.enrichArgs = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var engineOpts, engineArgs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.addArgsToPayload({ cmd: args.cmd });
                        engineOpts = lodash_1.default.defaults(args, { init: false });
                        return [4 /*yield*/, (0, utils_1.setupEngine)(engineOpts)];
                    case 1:
                        engineArgs = _a.sent();
                        return [2 /*return*/, { data: __assign(__assign({}, args), engineArgs) }];
                }
            });
        });
    };
    WorkspaceCLICommand.prototype.execute = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var cmd, wsRoot, engine, _a, ws, ws, out, engineOut, resp, ws, ws, ws, ws, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cmd = opts.cmd, wsRoot = opts.wsRoot, engine = opts.engine;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 21, 22, 23]);
                        _a = cmd;
                        switch (_a) {
                            case WorkspaceCommands.PULL: return [3 /*break*/, 2];
                            case WorkspaceCommands.INIT: return [3 /*break*/, 4];
                            case WorkspaceCommands.INFO: return [3 /*break*/, 7];
                            case WorkspaceCommands.ADD_AND_COMMIT: return [3 /*break*/, 9];
                            case WorkspaceCommands.PUSH: return [3 /*break*/, 11];
                            case WorkspaceCommands.REMOVE_CACHE: return [3 /*break*/, 13];
                            case WorkspaceCommands.SYNC: return [3 /*break*/, 15];
                        }
                        return [3 /*break*/, 19];
                    case 2:
                        ws = new engine_server_1.WorkspaceService({ wsRoot: wsRoot });
                        return [4 /*yield*/, ws.pullVaults()];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 20];
                    case 4:
                        ws = new engine_server_1.WorkspaceService({ wsRoot: wsRoot });
                        return [4 /*yield*/, ws.initialize()];
                    case 5:
                        out = _b.sent();
                        return [4 /*yield*/, (engine === null || engine === void 0 ? void 0 : engine.init())];
                    case 6:
                        engineOut = _b.sent();
                        if (engineOut === null || engineOut === void 0 ? void 0 : engineOut.error) {
                            this.printError(engineOut.error);
                        }
                        return [2 /*return*/, { data: out }];
                    case 7: return [4 /*yield*/, (engine === null || engine === void 0 ? void 0 : engine.info())];
                    case 8:
                        resp = _b.sent();
                        if (this.opts.json) {
                            this.printJson(resp);
                        }
                        else {
                            this.print(resp);
                        }
                        return [3 /*break*/, 20];
                    case 9:
                        ws = new engine_server_1.WorkspaceService({ wsRoot: wsRoot });
                        if (!engine) {
                            this.printError("Can't find the engine");
                            process.exit(1);
                        }
                        return [4 /*yield*/, ws.commitAndAddAll({ engine: engine })];
                    case 10:
                        _b.sent();
                        return [3 /*break*/, 20];
                    case 11:
                        ws = new engine_server_1.WorkspaceService({ wsRoot: wsRoot });
                        return [4 /*yield*/, ws.pushVaults()];
                    case 12:
                        _b.sent();
                        return [3 /*break*/, 20];
                    case 13:
                        ws = new engine_server_1.WorkspaceService({ wsRoot: wsRoot });
                        return [4 /*yield*/, ws.removeVaultCaches()];
                    case 14:
                        _b.sent();
                        this.print("caches removed");
                        return [3 /*break*/, 20];
                    case 15:
                        ws = new engine_server_1.WorkspaceService({ wsRoot: wsRoot });
                        this.print("commit and add...");
                        return [4 /*yield*/, ws.commitAndAddAll({ engine: engine })];
                    case 16:
                        _b.sent();
                        this.print("pull...");
                        return [4 /*yield*/, ws.pullVaults()];
                    case 17:
                        _b.sent();
                        this.print("push...");
                        return [4 /*yield*/, ws.pushVaults()];
                    case 18:
                        _b.sent();
                        this.print("done...");
                        return [3 /*break*/, 20];
                    case 19:
                        {
                            throw Error("bad option");
                        }
                        _b.label = 20;
                    case 20: return [2 /*return*/, { error: undefined }];
                    case 21:
                        err_1 = _b.sent();
                        this.L.error(err_1);
                        return [2 /*return*/, { error: err_1 }];
                    case 22:
                        if (opts.server.close) {
                            opts.server.close();
                        }
                        return [7 /*endfinally*/];
                    case 23: return [2 /*return*/];
                }
            });
        });
    };
    return WorkspaceCLICommand;
}(base_1.CLICommand));
exports.WorkspaceCLICommand = WorkspaceCLICommand;
