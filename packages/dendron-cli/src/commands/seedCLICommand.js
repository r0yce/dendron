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
exports.SeedCLICommand = void 0;
var common_all_1 = require("@dendronhq/common-all");
var engine_server_1 = require("@dendronhq/engine-server");
var lodash_1 = require("lodash");
var path_1 = require("path");
var base_1 = require("./base");
var utils_1 = require("./utils");
var SeedCLICommand = /** @class */ (function (_super) {
    __extends(SeedCLICommand, _super);
    function SeedCLICommand() {
        var _this = _super.call(this, { name: "seed <cmd> <id>", desc: "seed bank related commands" }) || this;
        _this.wsRootOptional = true;
        return _this;
    }
    SeedCLICommand.prototype.buildArgs = function (args) {
        _super.prototype.buildArgs.call(this, args);
        (0, utils_1.setupEngineArgs)(args);
        args.positional("cmd", {
            describe: "a command to run",
            choices: Object.values(common_all_1.SeedCommands),
            type: "string",
        });
        args.positional("id", {
            describe: "id of seed",
            type: "string",
        });
        args.option("mode", {
            describe: "what mode to init a seed in",
            type: "string",
            choices: Object.values(engine_server_1.SeedInitMode),
        });
        args.option("registryFile", {
            describe: "yml file used by registry file",
            type: "string",
        });
    };
    SeedCLICommand.prototype.enrichArgs = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var engineOpts, engineArgs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.addArgsToPayload({ cmd: args.cmd, id: args.id, mode: args.mode });
                        engineOpts = __assign(__assign({}, args), { init: false });
                        if (args.cmd === common_all_1.SeedCommands.INIT &&
                            args.mode === engine_server_1.SeedInitMode.CREATE_WORKSPACE) {
                            engineOpts.wsRoot = process.cwd();
                        }
                        return [4 /*yield*/, (0, utils_1.setupEngine)(engineOpts)];
                    case 1:
                        engineArgs = _a.sent();
                        return [2 /*return*/, { data: __assign(__assign({}, args), engineArgs) }];
                }
            });
        });
    };
    SeedCLICommand.prototype.execute = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var cmd, id, wsRoot, config, mode, registryFile, seedService, ctx, _a, _b, error, data, initOpts, seed, resp, resp, _c, error, data, err_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        cmd = opts.cmd, id = opts.id, wsRoot = opts.wsRoot, config = opts.config, mode = opts.mode, registryFile = opts.registryFile;
                        seedService = new engine_server_1.SeedService({ wsRoot: wsRoot, registryFile: registryFile });
                        ctx = "execute";
                        this.L.info({ ctx: ctx, id: id });
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 12, 13, 14]);
                        _a = cmd;
                        switch (_a) {
                            case common_all_1.SeedCommands.ADD: return [3 /*break*/, 2];
                            case common_all_1.SeedCommands.INIT: return [3 /*break*/, 4];
                            case common_all_1.SeedCommands.INFO: return [3 /*break*/, 6];
                            case common_all_1.SeedCommands.REMOVE: return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 10];
                    case 2:
                        if (!id) {
                            throw new common_all_1.DendronError({ message: "missing arguments" });
                        }
                        return [4 /*yield*/, seedService.addSeed({ id: id })];
                    case 3:
                        _b = _d.sent(), error = _b.error, data = _b.data;
                        if (error) {
                            throw error;
                        }
                        this.print("success - Planted 1 new seed: ".concat(id));
                        return [2 /*return*/, { data: data }];
                    case 4:
                        if (!mode) {
                            throw new common_all_1.DendronError({ message: "missing arguments" });
                        }
                        initOpts = lodash_1.default.defaults({}, {
                            name: path_1.default.basename(process.cwd()),
                        });
                        seed = engine_server_1.SeedUtils.genDefaultConfig(__assign({ id: opts.id, seed: config }, initOpts));
                        return [4 /*yield*/, seedService.init({ wsRoot: wsRoot, mode: mode, seed: seed })];
                    case 5:
                        resp = _d.sent();
                        this.print("success - initialized seed: ".concat(id));
                        return [2 /*return*/, resp];
                    case 6:
                        if (!id) {
                            throw new common_all_1.DendronError({ message: "missing arguments" });
                        }
                        return [4 /*yield*/, seedService.info({ id: id })];
                    case 7:
                        resp = _d.sent();
                        if (lodash_1.default.isUndefined(resp)) {
                            this.print("".concat(id, " is not in seed bank"));
                        }
                        else {
                            this.print(JSON.stringify(resp, null, 4));
                        }
                        return [2 /*return*/, { data: resp }];
                    case 8:
                        if (!id) {
                            throw new common_all_1.DendronError({ message: "missing arguments" });
                        }
                        return [4 /*yield*/, seedService.removeSeed({ id: id })];
                    case 9:
                        _c = _d.sent(), error = _c.error, data = _c.data;
                        if (error) {
                            throw error;
                        }
                        this.print("success - remove seed: ".concat(id));
                        return [2 /*return*/, { data: data }];
                    case 10: return [2 /*return*/, (0, common_all_1.assertUnreachable)(cmd)];
                    case 11: return [3 /*break*/, 14];
                    case 12:
                        err_1 = _d.sent();
                        this.L.error(err_1);
                        if (err_1 instanceof common_all_1.DendronError) {
                            this.print(["status:", err_1.status, err_1.message].join(" "));
                        }
                        else {
                            this.print("unknown error " + (0, common_all_1.error2PlainObject)(err_1));
                        }
                        return [2 /*return*/, { error: err_1 }];
                    case 13:
                        if (opts.server.close) {
                            opts.server.close();
                        }
                        return [7 /*endfinally*/];
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    return SeedCLICommand;
}(base_1.CLICommand));
exports.SeedCLICommand = SeedCLICommand;
