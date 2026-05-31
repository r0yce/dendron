"use strict";
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
exports.setupEngine = setupEngine;
exports.setupEngineArgs = setupEngineArgs;
var common_server_1 = require("@dendronhq/common-server");
var engine_server_1 = require("@dendronhq/engine-server");
var lodash_1 = require("lodash");
var launchEngineServer_1 = require("./launchEngineServer");
/**
 * used by {@link setupEngine}.
 * Depending on options passed, we create a mock {@link Server}
 * with a compatible API
 * @param closeServer
 * @returns
 */
var createDummyServer = function (closeServer) {
    return ({
        close: function (cb) {
            if (closeServer) {
                closeServer().then(cb);
                return;
            }
            else {
                return cb();
            }
        },
    });
};
/**
 * Setup an engine based on CLI args
 */
function setupEngine(opts) {
    return __awaiter(this, void 0, void 0, function () {
        var logger, _a, enginePort, init, useLocalEngine, newEngine, engine, port, server, serverSockets, wsRoot, ctx, engine_1, out, engineConnector, engineConnector_1, resp, out;
        var _b;
        var _this = this;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    logger = (0, common_server_1.createLogger)();
                    _a = lodash_1.default.defaults(opts, {
                        init: true,
                        useLocalEngine: false,
                    }), enginePort = _a.enginePort, init = _a.init, useLocalEngine = _a.useLocalEngine, newEngine = _a.newEngine;
                    serverSockets = new Set();
                    wsRoot = (0, common_server_1.resolvePath)(opts.wsRoot, process.cwd());
                    ctx = "setupEngine";
                    if (!useLocalEngine) return [3 /*break*/, 2];
                    engine_1 = newEngine
                        ? engine_server_1.DendronEngineV3.create({ wsRoot: wsRoot, logger: logger })
                        : engine_server_1.DendronEngineV2.create({ wsRoot: wsRoot, logger: logger });
                    return [4 /*yield*/, engine_1.init()];
                case 1:
                    out = _c.sent();
                    if (out.error) {
                        // eslint-disable-next-line no-console
                        console.error(out.error);
                    }
                    return [2 /*return*/, {
                            wsRoot: wsRoot,
                            engine: engine_1,
                            port: -1,
                            server: createDummyServer(),
                            serverSockets: new Set(),
                        }];
                case 2:
                    if (!enginePort) return [3 /*break*/, 4];
                    logger.info({
                        ctx: ctx,
                        msg: "connecting to engine at port",
                        enginePort: enginePort,
                        init: init,
                    });
                    engineConnector = engine_server_1.EngineConnector.getOrCreate({
                        wsRoot: wsRoot,
                    });
                    return [4 /*yield*/, engineConnector.init({
                            portOverride: enginePort,
                            init: init,
                        })];
                case 3:
                    _c.sent();
                    engine = engineConnector.engine;
                    port = enginePort;
                    // the server is running somewhere else
                    // we need a dummy server because the calling function
                    // will try to close the server
                    server = createDummyServer();
                    return [2 /*return*/, { wsRoot: wsRoot, engine: engine, port: port, server: server, serverSockets: serverSockets }];
                case 4:
                    if (!opts.attach) return [3 /*break*/, 6];
                    logger.info({
                        ctx: ctx,
                        msg: "connecting to running engine",
                        attach: opts.attach,
                        init: init,
                    });
                    engineConnector_1 = engine_server_1.EngineConnector.getOrCreate({
                        wsRoot: wsRoot,
                    });
                    return [4 /*yield*/, engineConnector_1.init({
                            init: init,
                            target: opts.target,
                        })];
                case 5:
                    _c.sent();
                    engine = engineConnector_1.engine;
                    port = engineConnector_1.port;
                    if (engineConnector_1.serverPortWatcher) {
                        // a file watcher is created when engine port is undefined
                        // needs to be cleaned up on server closing
                        server = createDummyServer(function () { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                (_a = engineConnector_1.serverPortWatcher) === null || _a === void 0 ? void 0 : _a.close();
                                return [2 /*return*/];
                            });
                        }); });
                    }
                    else {
                        server = createDummyServer();
                    }
                    return [2 /*return*/, { wsRoot: wsRoot, engine: engine, port: port, server: server, serverSockets: serverSockets }];
                case 6:
                    // if not using current engine, initialize a new one
                    logger.info({ ctx: ctx, msg: "initialize new engine" });
                    return [4 /*yield*/, new launchEngineServer_1.LaunchEngineServerCommand().enrichArgs(opts)];
                case 7:
                    resp = _c.sent();
                    (_b = resp.data, engine = _b.engine, port = _b.port, server = _b.server, serverSockets = _b.serverSockets);
                    if (!init) return [3 /*break*/, 9];
                    return [4 /*yield*/, engine.init()];
                case 8:
                    out = _c.sent();
                    // eslint-disable-next-line no-console
                    if (out.error)
                        console.error(out.error);
                    _c.label = 9;
                case 9: return [2 /*return*/, { wsRoot: wsRoot, engine: engine, port: port, server: server, serverSockets: serverSockets }];
            }
        });
    });
}
/**
 * Add yargs based options to setup engine
 */
function setupEngineArgs(args) {
    args.option("enginePort", {
        describe: "If set, connect to to running engine. If not set, create new instance of Dendron Engine",
    });
    args.option("attach", {
        describe: "Use existing engine instead of spawning a new one",
    });
    args.option("useLocalEngine", {
        type: "boolean",
        describe: "If set, use in memory engine instead of connecting to a server",
    });
}
