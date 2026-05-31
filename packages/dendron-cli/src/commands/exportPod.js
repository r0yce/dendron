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
exports.ExportPodCLICommand = void 0;
var common_all_1 = require("@dendronhq/common-all");
var pods_core_1 = require("@dendronhq/pods-core");
var base_1 = require("./base");
var pod_1 = require("./pod");
var utils_1 = require("./utils");
var ExportPodCLICommand = /** @class */ (function (_super) {
    __extends(ExportPodCLICommand, _super);
    function ExportPodCLICommand() {
        return _super.call(this, {
            name: "exportPod",
            desc: "use a pod to export notes",
        }) || this;
    }
    ExportPodCLICommand.prototype.buildArgs = function (args) {
        _super.prototype.buildArgs.call(this, args);
        (0, utils_1.setupEngineArgs)(args);
        (0, pod_1.setupPodArgs)(args);
    };
    ExportPodCLICommand.prototype.enrichArgs = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.addArgsToPayload({ podId: args.podId });
                return [2 /*return*/, (0, pod_1.enrichPodArgs)({ pods: (0, pods_core_1.getAllExportPods)(), podType: "export" })(args)];
            });
        });
    };
    ExportPodCLICommand.getPods = function () {
        return (0, pods_core_1.getAllExportPods)();
    };
    ExportPodCLICommand.prototype.execute = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, PodClass, config, wsRoot, engine, server, serverSockets, vaults, pod;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = "execute";
                        PodClass = opts.podClass, config = opts.config, wsRoot = opts.wsRoot, engine = opts.engine, server = opts.server, serverSockets = opts.serverSockets;
                        vaults = engine.vaults;
                        pod = new PodClass();
                        this.L.info({ ctx: ctx, msg: "running pod..." });
                        return [4 /*yield*/, pod.execute({ wsRoot: wsRoot, config: config, engine: engine, vaults: vaults })];
                    case 1:
                        _a.sent();
                        this.L.info({ ctx: ctx, msg: "done execute" });
                        return [2 /*return*/, new Promise(function (resolve) {
                                server.close(function (err) {
                                    _this.L.info({ ctx: ctx, msg: "closing server" });
                                    // close outstanding connections
                                    serverSockets === null || serverSockets === void 0 ? void 0 : serverSockets.forEach(function (socket) { return socket.destroy(); });
                                    if (err) {
                                        return resolve({
                                            error: new common_all_1.DendronError({ message: "error closing", payload: err }),
                                        });
                                    }
                                    resolve({ error: undefined });
                                });
                            })];
                }
            });
        });
    };
    return ExportPodCLICommand;
}(base_1.CLICommand));
exports.ExportPodCLICommand = ExportPodCLICommand;
