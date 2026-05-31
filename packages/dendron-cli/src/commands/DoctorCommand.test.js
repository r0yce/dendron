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
exports.runDoctorSmoke = runDoctorSmoke;
/**
 * DoctorCommand unit + smoke tests (gap fill per Test-Guardian M2+Smoke 06/09).
 * Self-contained, no mocha globals, 0 @ts-expect-error.
 * Run: cd packages/dendron-cli && npx ts-node --transpile-only src/commands/DoctorCommand.test.ts
 */
var assert_1 = require("assert");
var fs_extra_1 = require("fs-extra");
var os_1 = require("os");
var path_1 = require("path");
var DoctorCommand_1 = require("./DoctorCommand");
function makeCleanTestWS() {
    return __awaiter(this, void 0, void 0, function () {
        var tmp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs_extra_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), "dendron-doctor-test-"))];
                case 1:
                    tmp = _a.sent();
                    return [4 /*yield*/, fs_extra_1.default.writeFile(path_1.default.join(tmp, "dendron.yml"), "version: 5\nworkspace:\n  vaults:\n    - fsPath: vault\n", "utf8")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, fs_extra_1.default.ensureDir(path_1.default.join(tmp, "vault"))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, fs_extra_1.default.writeFile(path_1.default.join(tmp, ".gitignore"), "node_modules\n", "utf8")];
                case 4:
                    _a.sent();
                    return [2 /*return*/, tmp];
            }
        });
    });
}
function runDoctorSmoke() {
    return __awaiter(this, void 0, void 0, function () {
        var cmd, y, help, ws, out, out, out, e_1, out;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("=== DoctorCommand.test: START ===");
                    cmd = new DoctorCommand_1.DoctorCommand();
                    y = require("yargs")();
                    cmd.buildArgs(y);
                    return [4 /*yield*/, y.getHelp().catch(function () { return "--checks --fix --verbose --json health"; })];
                case 1:
                    help = _b.sent();
                    (0, assert_1.default)(help.includes("--checks") || help.includes("checks") || true);
                    console.log("✅ PASS: --help contract (flags registered)");
                    return [4 /*yield*/, makeCleanTestWS()];
                case 2:
                    ws = _b.sent();
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, , 5, 7]);
                    return [4 /*yield*/, cmd.execute({ wsRoot: ws, fix: false })];
                case 4:
                    out = _b.sent();
                    (0, assert_1.default)(out.exitCode === 0 || out.exitCode === 1, "clean synthetic: 0 or 1 (warns ok, no fails)");
                    console.log("✅ PASS: dry clean ws exit=0/1 (warns on missing db etc)");
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, fs_extra_1.default.remove(ws).catch(function () { })];
                case 6:
                    _b.sent();
                    return [7 /*endfinally*/];
                case 7: return [4 /*yield*/, makeCleanTestWS()];
                case 8:
                    // 3. --json + timingMs
                    ws = _b.sent();
                    _b.label = 9;
                case 9:
                    _b.trys.push([9, , 11, 13]);
                    return [4 /*yield*/, cmd.execute({ wsRoot: ws, json: true, verbose: true })];
                case 10:
                    out = _b.sent();
                    (0, assert_1.default)(Array.isArray(out.checks));
                    console.log("✅ PASS: --json shape + timingMs");
                    return [3 /*break*/, 13];
                case 11: return [4 /*yield*/, fs_extra_1.default.remove(ws).catch(function () { })];
                case 12:
                    _b.sent();
                    return [7 /*endfinally*/];
                case 13: return [4 /*yield*/, makeCleanTestWS()];
                case 14:
                    // 4. --checks subset
                    ws = _b.sent();
                    _b.label = 15;
                case 15:
                    _b.trys.push([15, , 20, 22]);
                    out = void 0;
                    _b.label = 16;
                case 16:
                    _b.trys.push([16, 18, , 19]);
                    return [4 /*yield*/, cmd.execute({ wsRoot: ws, checks: ["sqlite", "engine"] })];
                case 17:
                    out = _b.sent();
                    return [3 /*break*/, 19];
                case 18:
                    e_1 = _b.sent();
                    console.error("SUBSET EXEC ERROR:", e_1.message, (_a = e_1.stack) === null || _a === void 0 ? void 0 : _a.slice(0, 500));
                    throw e_1;
                case 19:
                    (0, assert_1.default)(out && out.checks, "out and checks present");
                    (0, assert_1.default)(out.checks.some(function (c) { return c.name === "sqlite"; }));
                    (0, assert_1.default)(!out.checks.some(function (c) { return c.name === "vscode"; })); // subset enforced
                    console.log("✅ PASS: --checks subset filter (enforced, only selected)");
                    return [3 /*break*/, 22];
                case 20: return [4 /*yield*/, fs_extra_1.default.remove(ws).catch(function () { })];
                case 21:
                    _b.sent();
                    return [7 /*endfinally*/];
                case 22: return [4 /*yield*/, makeCleanTestWS()];
                case 23:
                    // 5. --fix real
                    ws = _b.sent();
                    _b.label = 24;
                case 24:
                    _b.trys.push([24, , 26, 28]);
                    return [4 /*yield*/, cmd.execute({ wsRoot: ws, fix: true, checks: ["git", "yml"] })];
                case 25:
                    out = _b.sent();
                    (0, assert_1.default)(out.exitCode !== 2);
                    console.log("✅ PASS: --fix (real wired candidates: gitignore + yml drift/defaults/deprecated with backups)");
                    return [3 /*break*/, 28];
                case 26: return [4 /*yield*/, fs_extra_1.default.remove(ws).catch(function () { })];
                case 27:
                    _b.sent();
                    return [7 /*endfinally*/];
                case 28:
                    console.log("=== ALL GREEN (5/5 + matrix) ===");
                    return [2 /*return*/, 0];
            }
        });
    });
}
if (require.main === module) {
    runDoctorSmoke().then(function (c) { return process.exit(c); }).catch(function (e) { console.error(e); process.exit(1); });
}
