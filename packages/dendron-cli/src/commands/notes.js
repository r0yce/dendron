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
exports.NoteCLICommand = exports.NoteCommands = exports.NoteCLIOutput = void 0;
var common_all_1 = require("@dendronhq/common-all");
var common_server_1 = require("@dendronhq/common-server");
var pods_core_1 = require("@dendronhq/pods-core");
var lodash_1 = require("lodash");
var base_1 = require("./base");
var utils_1 = require("./utils");
var NoteCLIOutput;
(function (NoteCLIOutput) {
    NoteCLIOutput["JSON"] = "json";
    NoteCLIOutput["MARKDOWN_GFM"] = "md_gfm";
    NoteCLIOutput["MARKDOWN_DENDRON"] = "md_dendron";
})(NoteCLIOutput || (exports.NoteCLIOutput = NoteCLIOutput = {}));
var NoteCommands;
(function (NoteCommands) {
    /**
     * Like lookup, but only look for notes.
     * Returns a list of notes
     */
    NoteCommands["LOOKUP"] = "lookup";
    /**
     * Get note by id.
     */
    NoteCommands["GET"] = "get";
    /**
     * Find note by note properties.
     */
    NoteCommands["FIND"] = "find";
    /**
     * Find or create a note. Uses old engineV2/storeV2
     */
    NoteCommands["LOOKUP_LEGACY"] = "lookup_legacy";
    /**
     * Delete note by fname and vault.
     */
    NoteCommands["DELETE"] = "delete";
    /**
     * Move a note to another vault, or rename a note within a workspace.
     */
    NoteCommands["MOVE"] = "move";
    /**
     * Create or update a note by fname and vault.
     */
    NoteCommands["WRITE"] = "write";
})(NoteCommands || (exports.NoteCommands = NoteCommands = {}));
function checkQuery(opts) {
    if (lodash_1.default.isUndefined(opts.query)) {
        throw Error("no query found");
    }
    return opts.query;
}
function checkVault(opts) {
    var vaults = opts.engine.vaults;
    if (lodash_1.default.size(vaults) > 1 && !opts.vault) {
        throw Error("need to specify vault");
    }
    else {
        return opts.vault
            ? common_all_1.VaultUtils.getVaultByNameOrThrow({ vaults: vaults, vname: opts.vault })
            : vaults[0];
    }
}
function checkFname(opts) {
    if (lodash_1.default.isUndefined(opts.fname)) {
        throw Error("no fname found");
    }
    return opts.fname;
}
function formatNotes(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var resp;
        var output = _b.output, notes = _b.notes, engine = _b.engine;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, Promise.all(lodash_1.default.map(notes, function (note) {
                        return formatNote({ note: note, output: output, engine: engine });
                    }))];
                case 1:
                    resp = _c.sent();
                    if (output === NoteCLIOutput.JSON) {
                        return [2 /*return*/, JSON.stringify(resp, null, 4)];
                    }
                    return [2 /*return*/, resp.join("\n")];
            }
        });
    });
}
function formatNote(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var payload, _c;
        var output = _b.output, note = _b.note, engine = _b.engine;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _c = output;
                    switch (_c) {
                        case NoteCLIOutput.JSON: return [3 /*break*/, 1];
                        case NoteCLIOutput.MARKDOWN_DENDRON: return [3 /*break*/, 2];
                        case NoteCLIOutput.MARKDOWN_GFM: return [3 /*break*/, 3];
                        case undefined: return [3 /*break*/, 5];
                    }
                    return [3 /*break*/, 6];
                case 1:
                    // this is a NOP
                    payload = note;
                    return [3 /*break*/, 7];
                case 2:
                    payload = common_all_1.NoteUtils.serialize(note);
                    return [3 /*break*/, 7];
                case 3: return [4 /*yield*/, new pods_core_1.MarkdownPublishPod().execute({
                        engine: engine,
                        vaults: engine.vaults,
                        wsRoot: engine.wsRoot,
                        config: {
                            fname: note.fname,
                            vaultName: common_all_1.VaultUtils.getName(note.vault),
                            dest: "stdout",
                        },
                    })];
                case 4:
                    payload = _d.sent();
                    return [3 /*break*/, 7];
                case 5: throw new common_all_1.DendronError({
                    message: "Unknown output format requested",
                    payload: {
                        ctx: "NoteCLICommand.execute",
                        output: output,
                    },
                });
                case 6:
                    (0, common_all_1.assertUnreachable)(output);
                    _d.label = 7;
                case 7: return [2 /*return*/, payload];
            }
        });
    });
}
var NoteCLICommand = /** @class */ (function (_super) {
    __extends(NoteCLICommand, _super);
    function NoteCLICommand() {
        return _super.call(this, { name: "note <cmd>", desc: "note related commands" }) || this;
    }
    NoteCLICommand.prototype.buildArgs = function (args) {
        _super.prototype.buildArgs.call(this, args);
        (0, utils_1.setupEngineArgs)(args);
        args.positional("cmd", {
            describe: "a command to run",
            choices: Object.values(NoteCommands),
            type: "string",
        });
        args.option("query", {
            describe: "the query to run",
            type: "string",
        });
        args.option("output", {
            describe: "format to output in",
            type: "string",
            choices: Object.values(NoteCLIOutput),
            default: NoteCLIOutput.JSON,
        });
        args.option("fname", {
            describe: "name of file to find/write",
            type: "string",
        });
        args.option("body", {
            describe: "body of file to write",
            type: "string",
        });
        args.option("destFname", {
            describe: "name to change to (for move)",
            type: "string",
        });
        args.option("destVaultName", {
            describe: "vault to move to (for move)",
            type: "string",
        });
    };
    NoteCLICommand.prototype.enrichArgs = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var engineArgs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.addArgsToPayload({ cmd: args.cmd, output: args.output });
                        // TODO remove after migration to new engine
                        if (args.cmd !== NoteCommands.LOOKUP_LEGACY) {
                            args.newEngine = true;
                        }
                        return [4 /*yield*/, (0, utils_1.setupEngine)(args)];
                    case 1:
                        engineArgs = _a.sent();
                        return [2 /*return*/, { data: __assign(__assign({}, args), engineArgs) }];
                }
            });
        });
    };
    NoteCLICommand.prototype.execute = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, cmd, engine, output, destFname, destVaultName, body, _b, query, notes, resp, data, query, note, resp, data, maybeVault, notes, resp, data, query, vault_1, notes, note, resp, resp, stringOutput, fname, vault, notes, note, status_1, newBody, resp, fname, vault, note, resp, fname, vault, note, oldLoc, newLoc, destVault, noteExists, isStub, vaultName, errMsg, resp;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = lodash_1.default.defaults(opts, {
                            output: NoteCLIOutput.JSON,
                        }), cmd = _a.cmd, engine = _a.engine, output = _a.output, destFname = _a.destFname, destVaultName = _a.destVaultName, body = _a.body;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, , 35, 36]);
                        _b = cmd;
                        switch (_b) {
                            case NoteCommands.LOOKUP: return [3 /*break*/, 2];
                            case NoteCommands.GET: return [3 /*break*/, 5];
                            case NoteCommands.FIND: return [3 /*break*/, 9];
                            case NoteCommands.LOOKUP_LEGACY: return [3 /*break*/, 12];
                            case NoteCommands.WRITE: return [3 /*break*/, 21];
                            case NoteCommands.DELETE: return [3 /*break*/, 24];
                            case NoteCommands.MOVE: return [3 /*break*/, 28];
                        }
                        return [3 /*break*/, 33];
                    case 2:
                        query = checkQuery(opts);
                        return [4 /*yield*/, common_all_1.NoteLookupUtils.lookup({ qsRaw: query, engine: engine })];
                    case 3:
                        notes = _c.sent();
                        return [4 /*yield*/, formatNotes({
                                output: output,
                                notes: notes,
                                engine: engine,
                            })];
                    case 4:
                        resp = _c.sent();
                        this.print(resp);
                        data = {
                            notesOutput: notes,
                            stringOutput: resp,
                        };
                        return [2 /*return*/, { data: data }];
                    case 5:
                        query = checkQuery(opts);
                        return [4 /*yield*/, engine.getNote(query)];
                    case 6:
                        note = _c.sent();
                        if (!note.data) return [3 /*break*/, 8];
                        return [4 /*yield*/, formatNotes({
                                output: output,
                                notes: [note.data],
                                engine: engine,
                            })];
                    case 7:
                        resp = _c.sent();
                        this.print(resp);
                        data = {
                            notesOutput: [note.data],
                            stringOutput: resp,
                        };
                        return [2 /*return*/, { data: data }];
                    case 8: return [2 /*return*/, {
                            error: common_all_1.ErrorFactory.create404Error({
                                url: query,
                            }),
                            data: undefined,
                        }];
                    case 9:
                        maybeVault = opts.vault
                            ? common_all_1.VaultUtils.getVaultByNameOrThrow({
                                vaults: engine.vaults,
                                vname: opts.vault,
                            })
                            : undefined;
                        return [4 /*yield*/, engine.findNotes({
                                fname: opts.fname,
                                vault: maybeVault,
                            })];
                    case 10:
                        notes = _c.sent();
                        return [4 /*yield*/, formatNotes({
                                output: output,
                                notes: notes,
                                engine: engine,
                            })];
                    case 11:
                        resp = _c.sent();
                        this.print(resp);
                        data = {
                            notesOutput: notes,
                            stringOutput: resp,
                        };
                        return [2 /*return*/, { data: data }];
                    case 12:
                        query = checkQuery(opts);
                        vault_1 = checkVault(opts);
                        return [4 /*yield*/, engine.findNotes({ fname: query, vault: vault_1 })];
                    case 13:
                        notes = _c.sent();
                        note = void 0;
                        if (!(notes.length === 0)) return [3 /*break*/, 17];
                        return [4 /*yield*/, common_all_1.NoteUtils.createWithSchema({
                                noteOpts: {
                                    fname: query,
                                    vault: vault_1,
                                },
                                engine: engine,
                            })];
                    case 14:
                        note = _c.sent();
                        // Until we support user prompt, pick template note for them if there are multiple matches in order of
                        // 1. Template note that lies in same vault as note to lookup
                        // 2. First note in list
                        return [4 /*yield*/, common_server_1.TemplateUtils.findAndApplyTemplate({
                                note: note,
                                engine: engine,
                                pickNote: function (choices) { return __awaiter(_this, void 0, void 0, function () {
                                    var sameVaultNote;
                                    return __generator(this, function (_a) {
                                        sameVaultNote = choices.find(function (ent) {
                                            return common_all_1.VaultUtils.isEqual(vault_1, ent.vault, engine.wsRoot);
                                        });
                                        if (sameVaultNote) {
                                            return [2 /*return*/, { data: sameVaultNote }];
                                        }
                                        else {
                                            return [2 /*return*/, { data: choices[0] }];
                                        }
                                        return [2 /*return*/];
                                    });
                                }); },
                            })];
                    case 15:
                        // Until we support user prompt, pick template note for them if there are multiple matches in order of
                        // 1. Template note that lies in same vault as note to lookup
                        // 2. First note in list
                        _c.sent();
                        return [4 /*yield*/, engine.writeNote(note)];
                    case 16:
                        resp = _c.sent();
                        if (resp.error) {
                            return [2 /*return*/, {
                                    error: common_all_1.ErrorFactory.createInvalidStateError({
                                        message: "lookup failed",
                                    }),
                                    data: undefined,
                                }];
                        }
                        return [3 /*break*/, 19];
                    case 17:
                        note = notes[0];
                        if (!note.stub) return [3 /*break*/, 19];
                        delete note.stub;
                        return [4 /*yield*/, engine.writeNote(note)];
                    case 18:
                        resp = _c.sent();
                        if (resp.error) {
                            return [2 /*return*/, {
                                    error: common_all_1.ErrorFactory.createInvalidStateError({
                                        message: "lookup failed",
                                    }),
                                    data: undefined,
                                }];
                        }
                        _c.label = 19;
                    case 19: return [4 /*yield*/, formatNotes({
                            engine: engine,
                            notes: [note],
                            output: output,
                        })];
                    case 20:
                        stringOutput = _c.sent();
                        this.print(stringOutput);
                        return [2 /*return*/, {
                                data: {
                                    notesOutput: [note],
                                    stringOutput: stringOutput,
                                },
                            }];
                    case 21:
                        fname = checkFname(opts);
                        vault = checkVault(opts);
                        return [4 /*yield*/, engine.findNotes({ fname: fname, vault: vault })];
                    case 22:
                        notes = _c.sent();
                        note = void 0;
                        // If note doesn't exist, create new note
                        if (notes.length === 0) {
                            note = common_all_1.NoteUtils.create({ fname: fname, vault: vault, body: body });
                            status_1 = "CREATE";
                        }
                        else {
                            newBody = body || "";
                            note = __assign(__assign({}, notes[0]), { body: newBody });
                            status_1 = "UPDATE";
                        }
                        return [4 /*yield*/, engine.writeNote(note)];
                    case 23:
                        resp = _c.sent();
                        if (resp.error) {
                            return [2 /*return*/, {
                                    error: common_all_1.ErrorFactory.createInvalidStateError({
                                        message: "write failed: ".concat(resp.error.message),
                                    }),
                                    data: undefined,
                                }];
                        }
                        else {
                            this.print("wrote ".concat(note.fname));
                            return [2 /*return*/, {
                                    data: { payload: note.fname, rawData: resp, status: status_1 },
                                }];
                        }
                        _c.label = 24;
                    case 24:
                        fname = checkFname(opts);
                        vault = checkVault(opts);
                        return [4 /*yield*/, engine.findNotes({ fname: fname, vault: vault })];
                    case 25:
                        note = (_c.sent())[0];
                        if (!note) return [3 /*break*/, 27];
                        return [4 /*yield*/, engine.deleteNote(note.id)];
                    case 26:
                        resp = _c.sent();
                        if (resp.error) {
                            return [2 /*return*/, {
                                    error: common_all_1.ErrorFactory.createInvalidStateError({
                                        message: "delete failed: ".concat(resp.error.message),
                                    }),
                                    data: undefined,
                                }];
                        }
                        else {
                            this.print("deleted ".concat(note.fname));
                            return [2 /*return*/, { data: { payload: note.fname, rawData: resp } }];
                        }
                        return [3 /*break*/, 28];
                    case 27: return [2 /*return*/, {
                            error: common_all_1.ErrorFactory.createInvalidStateError({
                                message: "note ".concat(fname, " not found"),
                            }),
                            data: undefined,
                        }];
                    case 28:
                        fname = checkFname(opts);
                        vault = checkVault(opts);
                        return [4 /*yield*/, engine.findNotes({
                                fname: fname,
                                vault: vault,
                            })];
                    case 29:
                        note = (_c.sent())[0];
                        if (!note) return [3 /*break*/, 32];
                        oldLoc = common_all_1.NoteUtils.toNoteLoc(note);
                        newLoc = {
                            fname: destFname || oldLoc.fname,
                            vaultName: destVaultName || oldLoc.vaultName,
                        };
                        destVault = common_all_1.VaultUtils.getVaultByName({
                            vname: destVaultName || oldLoc.fname,
                            vaults: engine.vaults,
                        });
                        return [4 /*yield*/, engine.findNotes({
                                fname: destFname || fname,
                                vault: destVault || vault,
                            })];
                    case 30:
                        noteExists = (_c.sent())[0];
                        isStub = noteExists === null || noteExists === void 0 ? void 0 : noteExists.stub;
                        if (noteExists && !isStub) {
                            vaultName = common_all_1.VaultUtils.getName(noteExists.vault);
                            errMsg = "".concat(vaultName, "/").concat(fname, " exists");
                            throw Error(errMsg);
                        }
                        return [4 /*yield*/, engine.renameNote({ oldLoc: oldLoc, newLoc: newLoc })];
                    case 31:
                        resp = _c.sent();
                        return [2 /*return*/, { data: { payload: note.fname, rawData: resp } }];
                    case 32: throw new common_all_1.DendronError({ message: "note ".concat(fname, " not found") });
                    case 33:
                        {
                            throw Error("bad option");
                        }
                        _c.label = 34;
                    case 34: return [3 /*break*/, 36];
                    case 35:
                        if (opts.server.close) {
                            opts.server.close();
                        }
                        return [7 /*endfinally*/];
                    case 36: return [2 /*return*/];
                }
            });
        });
    };
    return NoteCLICommand;
}(base_1.CLICommand));
exports.NoteCLICommand = NoteCLICommand;
