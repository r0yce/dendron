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
exports.LaunchEngineServerCommand = void 0;
var api_server_1 = require("@dendronhq/api-server");
var common_all_1 = require("@dendronhq/common-all");
var common_server_1 = require("@dendronhq/common-server");
var engine_server_1 = require("@dendronhq/engine-server");
var lodash_1 = require("lodash");
var cli_1 = require("../utils/cli");
var base_1 = require("./base");
var LaunchEngineServerCommand = /** @class */ (function (_super) {
    __extends(LaunchEngineServerCommand, _super);
    function LaunchEngineServerCommand() {
        return _super.call(this, {
            name: "launchEngineServer",
            desc: "launch instance of dendron engine",
        }) || this;
    }
    LaunchEngineServerCommand.prototype.buildArgs = function (args) {
        _super.prototype.buildArgs.call(this, args);
        args.option("port", {
            describe: "port to launch server",
            type: "number",
        });
        args.option("init", {
            describe: "initialize server",
            type: "boolean",
        });
        args.option("noWritePort", {
            describe: "don't write the port to a file",
            type: "boolean",
        });
        args.option("fast", {
            describe: "launch engine without indexing",
            type: "boolean",
        });
    };
    LaunchEngineServerCommand.prototype.enrichArgs = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, _a, port, init, noWritePort, fast, wsRoot, ws, dev, vaults, vaultPaths, _b, _port, server, serverSockets, engine, out;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        ctx = "enrichArgs";
                        _a = lodash_1.default.defaults(args, {
                            init: false,
                            noWritePort: false,
                            fast: false,
                        }), port = _a.port, init = _a.init, noWritePort = _a.noWritePort, fast = _a.fast;
                        wsRoot = (0, common_server_1.resolvePath)(args.wsRoot, process.cwd());
                        ws = new engine_server_1.WorkspaceService({ wsRoot: wsRoot });
                        dev = ws.config.dev;
                        vaults = common_all_1.ConfigUtils.getVaults(ws.config);
                        vaultPaths = vaults.map(function (v) { return (0, common_server_1.resolvePath)(v.fsPath, wsRoot); });
                        return [4 /*yield*/, (0, api_server_1.launchv2)({
                                port: port,
                                logPath: process.env["LOG_DST"],
                                logLevel: process.env["LOG_LEVEL"] || "error",
                                nextServerUrl: dev === null || dev === void 0 ? void 0 : dev.nextServerUrl,
                                nextStaticRoot: dev === null || dev === void 0 ? void 0 : dev.nextStaticRoot,
                            })];
                    case 1:
                        _b = _c.sent(), _port = _b.port, server = _b.server, serverSockets = _b.serverSockets;
                        ws.writeMeta({ version: cli_1.CLIUtils.getClientVersion() });
                        if (!noWritePort) {
                            engine_server_1.EngineUtils.writeEnginePortForCLI({ port: _port, wsRoot: wsRoot });
                        }
                        engine = engine_server_1.DendronEngineClient.create({
                            port: _port,
                            vaults: vaults,
                            ws: wsRoot,
                        });
                        if (!init) return [3 /*break*/, 3];
                        this.L.info({ ctx: ctx, msg: "pre:engine.init" });
                        return [4 /*yield*/, engine.init()];
                    case 2:
                        out = _c.sent();
                        // These events will only upload if the upload action completes before the
                        // CLI command completes. They are uploaded on a best effort basis.
                        // engine.onEngineNoteStateChanged((entries) => {
                        //   const createCount = extractNoteChangeEntriesByType(
                        //     entries,
                        //     "create"
                        //   ).length;
                        //   const updateCount = extractNoteChangeEntriesByType(
                        //     entries,
                        //     "update"
                        //   ).length;
                        //   const deleteCount = extractNoteChangeEntriesByType(
                        //     entries,
                        //     "delete"
                        //   ).length;
                        //   CLIAnalyticsUtils.track(EngagementEvents.EngineStateChanged, {
                        //     created: createCount,
                        //     updated: updateCount,
                        //     deleted: deleteCount,
                        //   });
                        // });
                        if (out.error) {
                            this.printError(out.error);
                        }
                        _c.label = 3;
                    case 3: return [2 /*return*/, {
                            data: __assign(__assign({}, args), { engine: engine, wsRoot: wsRoot, init: init, fast: fast, vaults: vaultPaths, port: _port, server: server, serverSockets: serverSockets }),
                        }];
                }
            });
        });
    };
    LaunchEngineServerCommand.prototype.execute = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var port, server;
            return __generator(this, function (_a) {
                port = opts.port, server = opts.server;
                return [2 /*return*/, {
                        port: lodash_1.default.toInteger(port),
                        server: server,
                    }];
            });
        });
    };
    return LaunchEngineServerCommand;
}(base_1.CLICommand));
exports.LaunchEngineServerCommand = LaunchEngineServerCommand;
