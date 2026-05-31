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
exports.ExportPodV2CLICommand = void 0;
var common_all_1 = require("@dendronhq/common-all");
var pods_core_1 = require("@dendronhq/pods-core");
var base_1 = require("./base");
var podsV2_1 = require("./podsV2");
var utils_1 = require("./utils");
var airtable_1 = require("@dendronhq/airtable");
var lodash_1 = require("lodash");
var engine_server_1 = require("@dendronhq/engine-server");
var clipboardy_1 = require("clipboardy");
var common_server_1 = require("@dendronhq/common-server");
var ExportPodV2CLICommand = /** @class */ (function (_super) {
    __extends(ExportPodV2CLICommand, _super);
    function ExportPodV2CLICommand() {
        return _super.call(this, {
            name: "exportPodV2",
            desc: "use a pod v2 to export notes",
        }) || this;
    }
    ExportPodV2CLICommand.prototype.buildArgs = function (args) {
        _super.prototype.buildArgs.call(this, args);
        (0, utils_1.setupEngineArgs)(args);
        (0, podsV2_1.setupPodArgs)(args);
    };
    ExportPodV2CLICommand.prototype.enrichArgs = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                this.addArgsToPayload({ podType: (_a = args.configValues) === null || _a === void 0 ? void 0 : _a.podType });
                return [2 /*return*/, (0, podsV2_1.enrichPodArgs)(args)];
            });
        });
    };
    /**
     * Method to instantiate the pod instance with the
     * passed in configuration
     */
    ExportPodV2CLICommand.prototype.createPod = function (config, engine) {
        switch (config.podType) {
            case pods_core_1.PodV2Types.MarkdownExportV2:
                return new pods_core_1.MarkdownExportPodV2({
                    podConfig: config,
                    engine: engine,
                    dendronConfig: common_server_1.DConfig.readConfigSync(engine.wsRoot),
                });
            case pods_core_1.PodV2Types.JSONExportV2:
                return new pods_core_1.JSONExportPodV2({
                    podConfig: config,
                });
            case pods_core_1.PodV2Types.AirtableExportV2:
                return new pods_core_1.AirtableExportPodV2({
                    airtable: new airtable_1.default({ apiKey: config.apiKey }),
                    config: config,
                    engine: engine,
                });
            case pods_core_1.PodV2Types.NotionExportV2:
                return new pods_core_1.NotionExportPodV2({
                    podConfig: config,
                });
            case pods_core_1.PodV2Types.GoogleDocsExportV2: {
                var wsRoot = engine.wsRoot;
                var fpath = engine_server_1.EngineUtils.getPortFilePathForCLI({ wsRoot: wsRoot });
                /**
                 * The GDoc Export/Import pod requires engine port to refresh google access token.
                 * refreshGoogleAccessToken: [[..\packages\pods-core\src\utils.ts]]
                 */
                var port = (0, engine_server_1.openPortFile)({ fpath: fpath });
                return new pods_core_1.GoogleDocsExportPodV2({
                    podConfig: config,
                    engine: engine,
                    port: port,
                });
            }
            default:
                throw new common_all_1.DendronError({
                    message: "the requested pod type :".concat(config.podType, " is not implemented yet"),
                });
        }
    };
    ExportPodV2CLICommand.prototype.execute = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, server, serverSockets, engine, config, payload, pod, exportReturnValue;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = "execute";
                        server = opts.server, serverSockets = opts.serverSockets, engine = opts.engine, config = opts.config, payload = opts.payload;
                        this.multiNoteExportCheck({
                            destination: config.destination,
                            exportScope: config.exportScope,
                        });
                        pod = this.createPod(config, engine);
                        this.L.info({ ctx: ctx, msg: "running pod..." });
                        return [4 /*yield*/, pod.exportNotes(payload)];
                    case 1:
                        exportReturnValue = _a.sent();
                        return [4 /*yield*/, this.onExportComplete({
                                exportReturnValue: exportReturnValue,
                                podType: config.podType,
                                engine: engine,
                                config: config,
                            })];
                    case 2:
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
    ExportPodV2CLICommand.prototype.onExportComplete = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var exportReturnValue, podType, engine, config;
            return __generator(this, function (_a) {
                exportReturnValue = opts.exportReturnValue, podType = opts.podType, engine = opts.engine, config = opts.config;
                switch (podType) {
                    case pods_core_1.PodV2Types.AirtableExportV2:
                        return [2 /*return*/, this.onAirtableExportComplete({
                                exportReturnValue: exportReturnValue,
                                engine: engine,
                                config: config,
                            })];
                    case pods_core_1.PodV2Types.GoogleDocsExportV2:
                        return [2 /*return*/, this.onGoogleDocsExportComplete({
                                exportReturnValue: exportReturnValue,
                                engine: engine,
                                config: config,
                            })];
                    case pods_core_1.PodV2Types.NotionExportV2:
                        return [2 /*return*/, this.onNotionExportComplete({ exportReturnValue: exportReturnValue, engine: engine })];
                    case pods_core_1.PodV2Types.MarkdownExportV2:
                        return [2 /*return*/, this.onMarkdownExportComplete({ exportReturnValue: exportReturnValue, config: config })];
                    case pods_core_1.PodV2Types.JSONExportV2:
                        return [2 /*return*/, this.onJSONExportComplete({ exportReturnValue: exportReturnValue, config: config })];
                    default:
                        (0, common_all_1.assertUnreachable)(podType);
                }
                return [2 /*return*/];
            });
        });
    };
    ExportPodV2CLICommand.prototype.onAirtableExportComplete = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var exportReturnValue, engine, config, records, createdCount, updatedCount, errorMsg;
            var _a, _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        exportReturnValue = opts.exportReturnValue, engine = opts.engine, config = opts.config;
                        records = exportReturnValue.data;
                        if (!(records === null || records === void 0 ? void 0 : records.created)) return [3 /*break*/, 2];
                        return [4 /*yield*/, pods_core_1.AirtableUtils.updateAirtableIdForNewlySyncedNotes({
                                records: records.created,
                                engine: engine,
                                logger: this.L,
                                podId: config.podId,
                            })];
                    case 1:
                        _g.sent();
                        _g.label = 2;
                    case 2:
                        createdCount = (_c = (_b = (_a = exportReturnValue.data) === null || _a === void 0 ? void 0 : _a.created) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0;
                        updatedCount = (_f = (_e = (_d = exportReturnValue.data) === null || _d === void 0 ? void 0 : _d.updated) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0;
                        if (common_all_1.ResponseUtil.hasError(exportReturnValue)) {
                            errorMsg = "Finished Airtable Export. ".concat(createdCount, " records created; ").concat(updatedCount, " records updated. Error encountered: ").concat(common_all_1.ErrorFactory.safeStringify(exportReturnValue.error));
                            this.L.error(errorMsg);
                        }
                        else {
                            this.print("Finished Airtable Export. ".concat(createdCount, " records created; ").concat(updatedCount, " records updated."));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ExportPodV2CLICommand.prototype.onGoogleDocsExportComplete = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var exportReturnValue, engine, config, createdDocs, updatedDocs, createdCount, updatedCount, errorMsg;
            var _a, _b, _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        exportReturnValue = opts.exportReturnValue, engine = opts.engine, config = opts.config;
                        createdDocs = (_b = (_a = exportReturnValue.data) === null || _a === void 0 ? void 0 : _a.created) === null || _b === void 0 ? void 0 : _b.filter(function (ent) { return !!ent; });
                        updatedDocs = (_d = (_c = exportReturnValue.data) === null || _c === void 0 ? void 0 : _c.updated) === null || _d === void 0 ? void 0 : _d.filter(function (ent) { return !!ent; });
                        createdCount = (_e = createdDocs === null || createdDocs === void 0 ? void 0 : createdDocs.length) !== null && _e !== void 0 ? _e : 0;
                        updatedCount = (_f = updatedDocs === null || updatedDocs === void 0 ? void 0 : updatedDocs.length) !== null && _f !== void 0 ? _f : 0;
                        if (!(createdDocs && createdCount > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, pods_core_1.GoogleDocsUtils.updateNotesWithCustomFrontmatter(createdDocs, engine, config.parentFolderId)];
                    case 1:
                        _h.sent();
                        _h.label = 2;
                    case 2:
                        if (!(updatedDocs && updatedCount > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, pods_core_1.GoogleDocsUtils.updateNotesWithCustomFrontmatter(updatedDocs, engine, config.parentFolderId)];
                    case 3:
                        _h.sent();
                        _h.label = 4;
                    case 4:
                        if (common_all_1.ResponseUtil.hasError(exportReturnValue)) {
                            errorMsg = "Finished GoogleDocs Export. ".concat(createdCount, " docs created; ").concat(updatedCount, " docs updated. Error encountered: ").concat(common_all_1.ErrorFactory.safeStringify((_g = exportReturnValue.error) === null || _g === void 0 ? void 0 : _g.message));
                            this.L.error(errorMsg);
                        }
                        else {
                            this.print("Finished GoogleDocs Export. ".concat(createdCount, " docs created; ").concat(updatedCount, " docs updated."));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ExportPodV2CLICommand.prototype.onNotionExportComplete = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var exportReturnValue, engine, data, createdCount, errorMsg;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        exportReturnValue = opts.exportReturnValue, engine = opts.engine;
                        data = exportReturnValue.data;
                        if (!(data === null || data === void 0 ? void 0 : data.created)) return [3 /*break*/, 2];
                        return [4 /*yield*/, pods_core_1.NotionUtils.updateNotionIdForNewlyCreatedNotes(data.created, engine)];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2:
                        createdCount = (_b = (_a = data === null || data === void 0 ? void 0 : data.created) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
                        if (common_all_1.ResponseUtil.hasError(exportReturnValue)) {
                            errorMsg = "Finished Notion Export. ".concat(createdCount, " notes created in Notion; Error encountered: ").concat(common_all_1.ErrorFactory.safeStringify(exportReturnValue.error));
                            this.L.error(errorMsg);
                        }
                        else {
                            this.print("Finished Notion Export. ".concat(createdCount, " notes created in Notion"));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ExportPodV2CLICommand.prototype.onMarkdownExportComplete = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var exportReturnValue, config, content, count, errorMsg;
            var _a, _b;
            return __generator(this, function (_c) {
                exportReturnValue = opts.exportReturnValue, config = opts.config;
                content = (_a = exportReturnValue.data) === null || _a === void 0 ? void 0 : _a.exportedNotes;
                if (config.destination === "clipboard" && lodash_1.default.isString(content)) {
                    clipboardy_1.default.writeSync(content);
                }
                count = (_b = content === null || content === void 0 ? void 0 : content.length) !== null && _b !== void 0 ? _b : 0;
                if (common_all_1.ResponseUtil.hasError(exportReturnValue)) {
                    errorMsg = "Finished Markdown Export. ".concat(count, " notes exported; Error encountered: ").concat(common_all_1.ErrorFactory.safeStringify(exportReturnValue.error));
                    this.L.error(errorMsg);
                }
                else {
                    this.print("Finished running Markdown export pod.");
                }
                return [2 /*return*/];
            });
        });
    };
    ExportPodV2CLICommand.prototype.onJSONExportComplete = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var exportReturnValue, config, content, errorMsg;
            var _a;
            return __generator(this, function (_b) {
                exportReturnValue = opts.exportReturnValue, config = opts.config;
                content = (_a = exportReturnValue.data) === null || _a === void 0 ? void 0 : _a.exportedNotes;
                if (config.destination === "clipboard" && lodash_1.default.isString(content)) {
                    clipboardy_1.default.writeSync(content);
                }
                if (common_all_1.ResponseUtil.hasError(exportReturnValue)) {
                    errorMsg = "Finished JSON Export. Error encountered: ".concat(common_all_1.ErrorFactory.safeStringify(exportReturnValue.error));
                    this.L.error(errorMsg);
                }
                else {
                    this.print("Finished running JSON export pod.");
                }
                return [2 /*return*/];
            });
        });
    };
    ExportPodV2CLICommand.prototype.multiNoteExportCheck = function (opts) {
        if (opts.destination === "clipboard" &&
            opts.exportScope !== pods_core_1.PodExportScope.Note &&
            opts.exportScope !== pods_core_1.PodExportScope.Selection) {
            throw new common_all_1.DendronError({
                message: "Multi Note Export cannot have clipboard as destination. Please configure your destination by using Dendron: Configure Export Pod V2 command",
            });
        }
    };
    return ExportPodV2CLICommand;
}(base_1.CLICommand));
exports.ExportPodV2CLICommand = ExportPodV2CLICommand;
