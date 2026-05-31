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
exports.ImportPodCLICommand = void 0;
var pods_core_1 = require("@dendronhq/pods-core");
var base_1 = require("./base");
var pod_1 = require("./pod");
var utils_1 = require("./utils");
var prompts_1 = require("prompts");
var common_all_1 = require("@dendronhq/common-all");
var ImportPodCLICommand = /** @class */ (function (_super) {
    __extends(ImportPodCLICommand, _super);
    function ImportPodCLICommand() {
        return _super.call(this, {
            name: "importPod",
            desc: "use a pod to import notes",
        }) || this;
    }
    ImportPodCLICommand.prototype.buildArgs = function (args) {
        _super.prototype.buildArgs.call(this, args);
        (0, utils_1.setupEngineArgs)(args);
        (0, pod_1.setupPodArgs)(args);
    };
    ImportPodCLICommand.prototype.enrichArgs = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.addArgsToPayload({ podId: args.podId });
                return [2 /*return*/, (0, pod_1.enrichPodArgs)({ pods: (0, pods_core_1.getAllImportPods)(), podType: "import" })(args)];
            });
        });
    };
    ImportPodCLICommand.prototype.execute = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var PodClass, config, wsRoot, engine, server, vaults, pod, utilityMethods;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        PodClass = opts.podClass, config = opts.config, wsRoot = opts.wsRoot, engine = opts.engine, server = opts.server;
                        vaults = engine.vaults;
                        pod = new PodClass();
                        utilityMethods = {
                            handleConflict: pod_1.handleConflict,
                        };
                        return [4 /*yield*/, pod.execute({
                                wsRoot: wsRoot,
                                config: config,
                                engine: engine,
                                vaults: vaults,
                                utilityMethods: utilityMethods,
                                onPrompt: function (type) { return __awaiter(_this, void 0, void 0, function () {
                                    var resp, _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                if (!(type === pods_core_1.PROMPT.USERPROMPT)) return [3 /*break*/, 2];
                                                return [4 /*yield*/, (0, prompts_1.default)({
                                                        type: "text",
                                                        name: "title",
                                                        message: "Do you want to overwrite: Yes/No",
                                                        validate: function (title) {
                                                            return ["yes", "no"].includes(title.toLowerCase())
                                                                ? true
                                                                : "Enter either Yes or No";
                                                        },
                                                    })];
                                            case 1:
                                                _a = _b.sent();
                                                return [3 /*break*/, 3];
                                            case 2:
                                                _a = console.log("Note is already in sync with the google doc");
                                                _b.label = 3;
                                            case 3:
                                                resp = _a;
                                                return [2 /*return*/, resp];
                                        }
                                    });
                                }); },
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, new Promise(function (resolve) {
                                server.close(function (err) {
                                    if (err) {
                                        var error = new common_all_1.DendronError({
                                            message: "error closing server",
                                            payload: err,
                                        });
                                        return resolve({ error: error });
                                    }
                                    resolve({});
                                });
                            })];
                }
            });
        });
    };
    return ImportPodCLICommand;
}(base_1.CLICommand));
exports.ImportPodCLICommand = ImportPodCLICommand;
