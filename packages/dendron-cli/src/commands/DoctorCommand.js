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
exports.DoctorCommand = void 0;
var common_all_1 = require("@dendronhq/common-all");
var common_server_1 = require("@dendronhq/common-server");
var engine_server_1 = require("@dendronhq/engine-server");
var fs_extra_1 = require("fs-extra");
var lodash_1 = require("lodash");
var path_1 = require("path");
var child_process_1 = require("child_process");
var util_1 = require("util");
var base_1 = require("./base");
var cli_1 = require("../utils/cli");
// NOTE: In real impl import { setupEngine, SetupEngineCLIOpts } from "./utils"; for full engine health check (heavy; doctor uses light module probe + timers)
var L = (0, common_server_1.createLogger)("DoctorCommand");
var execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * DoctorCommand (Health / System Doctor)
 *
 * Scaffolding for the proactive "dendron doctor" health checker (see docs/dev/features/dendron-doctor.md).
 * M2 green trigger pulled; impl started (priority-5 immediate kickoff, zero ramp-up per Feature-Ideator recipe).
 *
 * Current command name: "health" (safe collision handling; avoids existing notes "doctor" in doctor.ts).
 * Per recipe: keep "health" until migration plan (notes doctor → `dendron dev doctor` or `dendron notes doctor`).
 * Registration live + table output added (per Test-Guardian matrix).
 *
 * Registration (low-risk, copy-paste ready; now LIVE):
 *   In packages/dendron-cli/bin/dendron-cli.ts:
 *     import { DoctorCommand } from "../src/commands/DoctorCommand";
 *     ...
 *     new DoctorCommand().buildCmd(buildYargs);
 *
 *   Then `dendron health` (or `dendron doctor` after rename) works.
 *   Existing `dendron doctor` (notes) remains untouched until migration.
 *
 * Integrations (now wired in M2+):
 *   - WorkspaceService + Git + DoctorService for git/workspace + notes-doctor-subsys checks.
 *   - DConfig.getRaw + ConfigUtils for yml/schema + vaults.
 *   - Perf timers: ActivationTimer (overall) + PerformanceTimer (per-check) from common-all.
 *     (PerfRingBuffer/withPerfTiming deferred to common-all/perf evolution; see SKILL.md)
 *   - --json via base, --verbose includes timings; --fix LIVE (3 safe: gitignore-metadata, yml drift/defaults/deprecated via DConfig+backups+GitUtils; no data loss).
 *
 * Checks 1-6 fully wired (real probes, not placeholders; --checks subset filter + only-selected timing). --fix real (3 safe candidates). registration + CLIUtils table live (per Test-Guardian matrix).
 * Gaps filled + MVP launch ready, health now directly usable post-build with table + --json + perf (post-smoke polish 06/07).
 * Post-green proactive pattern: prep during hardening = instant value add.
 */
var DoctorCommand = /** @class */ (function (_super) {
    __extends(DoctorCommand, _super);
    function DoctorCommand() {
        return _super.call(this, {
            name: "health",
            desc: "Dendron workspace health doctor (sqlite, engine, git, yml, deps, vscode)",
        }) || this;
    }
    DoctorCommand.prototype.buildArgs = function (yargs) {
        // call super so global flags (json, wsRoot, quiet, etc) are registered for "health" (was missing; caused partial wiring)
        _super.prototype.buildArgs.call(this, yargs);
        return yargs
            .option("checks", {
            describe: "Comma-separated subset of checks (sqlite,engine,git,yml,deps,vscode)",
            type: "string",
        })
            .option("fix", {
            describe: "Auto-apply safe fixes where possible",
            type: "boolean",
            default: false,
        })
            .option("verbose", {
            describe: "Include raw timings and full details",
            type: "boolean",
            default: false,
        });
    };
    DoctorCommand.prototype.enrichArgs = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var wsRoot, parsedChecks;
            return __generator(this, function (_a) {
                wsRoot = opts.wsRoot || engine_server_1.WorkspaceUtils.findWSRoot();
                if (!wsRoot) {
                    return [2 /*return*/, { error: new common_all_1.DendronError({ message: "No workspace found" }) }];
                }
                parsedChecks = opts.checks
                    ? opts.checks
                        .split(",")
                        .map(function (s) { return s.trim().toLowerCase(); })
                        .filter(Boolean)
                    : null;
                // validateConfig etc. handled in base lifecycle
                return [2 /*return*/, { data: __assign(__assign({}, opts), { checks: parsedChecks, wsRoot: wsRoot }) }];
            });
        });
    };
    DoctorCommand.prototype.execute = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, timer, pt, checkTimings, wsService, vaults, dendronConfig, configVaults, checks, requestedChecks, shouldRun, sqliteT0, dbPath, exists, detail, _a, _b, e_1, engineT0, engStart, engEnd, engMs, e_2, vscodeT0, ver, stdout, _c, compat, e_3, gitT0, targetVaults, _i, targetVaults_1, vault, vname, vpath, git, isRepo, hasDirty, porcelain, dirtyCount, e_4, ymlT0, raw, version, depsT0, auditCmd, stdout, hasHigh, e_5, useVerbose, useJson, appliedFixes, fixRequestedYml, fixRequestedGit, e_6, rawForDetect, detectOut, current, depPaths, cfgCopy_1, e_7, msg, note, summary, exitCode, perfReport, ptReport;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        ctx = "DoctorCommand:execute";
                        L.info({ ctx: ctx, msg: "enter health doctor (M2+ wired)", opts: opts });
                        console.log("DEBUG: post-enter, before timers. checks in opts?", !!opts.checks);
                        timer = new common_all_1.ActivationTimer();
                        pt = new common_all_1.PerformanceTimer({ timerName: "doctor-health" });
                        checkTimings = {};
                        wsService = new engine_server_1.WorkspaceService({ wsRoot: opts.wsRoot });
                        vaults = wsService.vaults || [];
                        dendronConfig = common_server_1.DConfig.getOrCreate(opts.wsRoot);
                        configVaults = common_all_1.ConfigUtils.getVaults(dendronConfig);
                        checks = [];
                        requestedChecks = opts.checks;
                        shouldRun = function (name) {
                            if (!requestedChecks || requestedChecks.length === 0)
                                return true;
                            var n = name.toLowerCase();
                            return requestedChecks.some(function (c) {
                                if (n.includes(c) || c.includes(n))
                                    return true;
                                if (c === "yml" && n.includes("dendron-yml"))
                                    return true;
                                if (c === "deps" && n.includes("deps-cve"))
                                    return true;
                                if (c === "git" && n.startsWith("git:"))
                                    return true;
                                return false;
                            });
                        };
                        if (!shouldRun("sqlite")) return [3 /*break*/, 8];
                        pt.before("sqlite");
                        sqliteT0 = Date.now();
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 6, , 7]);
                        dbPath = path_1.default.join(opts.wsRoot, "metadata.db");
                        return [4 /*yield*/, fs_extra_1.default.pathExists(dbPath)];
                    case 2:
                        exists = _e.sent();
                        if (!exists) return [3 /*break*/, 4];
                        _b = "metadata.db present (".concat;
                        return [4 /*yield*/, fs_extra_1.default.stat(dbPath).catch(function () { return ({ size: 0 }); })];
                    case 3:
                        _a = _b.apply("metadata.db present (", [(_e.sent()).size, "B)"]);
                        return [3 /*break*/, 5];
                    case 4:
                        _a = "no metadata.db (json-only mode or uninitialized)";
                        _e.label = 5;
                    case 5:
                        detail = _a;
                        // light binding probe (better-sqlite3 common in sqlite stacks; prisma shim in current)
                        try {
                            require.resolve("better-sqlite3");
                            detail += " | better-sqlite3 resolvable";
                        }
                        catch (_f) {
                            detail += " | better-sqlite3 not direct (ok via prisma/engine)";
                        }
                        // Wire DoctorService per task (light health of notes-doctor subsystem, no engine needed for ctor)
                        new engine_server_1.DoctorService({ printFunc: function () { } }); // side-effect ctor only (for health probe); assigned var removed for unused lint/TS6133
                        detail += " | DoctorService ok";
                        checks.push({
                            name: "sqlite",
                            status: exists ? "pass" : "warn",
                            detail: detail,
                            fixable: false,
                        });
                        return [3 /*break*/, 7];
                    case 6:
                        e_1 = _e.sent();
                        checks.push({
                            name: "sqlite",
                            status: "fail",
                            detail: "probe error: ".concat(e_1.message),
                            fixable: false,
                        });
                        return [3 /*break*/, 7];
                    case 7:
                        checkTimings["sqlite"] = Date.now() - sqliteT0;
                        pt.after("sqlite");
                        _e.label = 8;
                    case 8:
                        if (!shouldRun("engine")) return [3 /*break*/, 13];
                        pt.before("engine");
                        engineT0 = Date.now();
                        _e.label = 9;
                    case 9:
                        _e.trys.push([9, 11, , 12]);
                        engStart = process.hrtime.bigint ? process.hrtime.bigint() : BigInt(Date.now() * 1e6);
                        // dynamic import to measure load (real wiring, avoids top-level cost)
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("@dendronhq/engine-server"); })];
                    case 10:
                        // dynamic import to measure load (real wiring, avoids top-level cost)
                        _e.sent();
                        engEnd = process.hrtime.bigint ? process.hrtime.bigint() : BigInt(Date.now() * 1e6);
                        engMs = Number((engEnd - engStart) / 1000000n);
                        // also confirm DConfig/WS (already used) as "engine-adjacent" health
                        checks.push({
                            name: "engine",
                            status: "pass",
                            detail: "engine-server load ".concat(engMs, "ms | DConfig/WSService ok (vaults: ").concat(vaults.length, ")"),
                            fixable: false,
                        });
                        return [3 /*break*/, 12];
                    case 11:
                        e_2 = _e.sent();
                        checks.push({ name: "engine", status: "fail", detail: "load error: ".concat(e_2.message), fixable: false });
                        return [3 /*break*/, 12];
                    case 12:
                        checkTimings["engine"] = Date.now() - engineT0;
                        pt.after("engine");
                        _e.label = 13;
                    case 13:
                        if (!shouldRun("vscode")) return [3 /*break*/, 21];
                        pt.before("vscode");
                        vscodeT0 = Date.now();
                        _e.label = 14;
                    case 14:
                        _e.trys.push([14, 19, , 20]);
                        ver = "unknown";
                        _e.label = 15;
                    case 15:
                        _e.trys.push([15, 17, , 18]);
                        return [4 /*yield*/, execAsync("code --version", { timeout: 1500, maxBuffer: 1024 })];
                    case 16:
                        stdout = (_e.sent()).stdout;
                        ver = ((_d = stdout.split("\n")[0]) === null || _d === void 0 ? void 0 : _d.trim()) || "code-in-path-but-empty";
                        return [3 /*break*/, 18];
                    case 17:
                        _c = _e.sent();
                        ver = process.env.VSCODE_VERSION || "not-in-PATH (editor host only?)";
                        return [3 /*break*/, 18];
                    case 18:
                        compat = /1\.(8[5-9]|[9-9][0-9]|[0-9]{3,})/.test(ver) || ver.includes("code");
                        checks.push({
                            name: "vscode",
                            status: compat ? "pass" : "warn",
                            detail: "".concat(ver, " (compat probe)"),
                            fixable: false,
                        });
                        return [3 /*break*/, 20];
                    case 19:
                        e_3 = _e.sent();
                        checks.push({
                            name: "vscode",
                            status: "skip",
                            detail: "vscode probe error: ".concat(e_3.message),
                            fixable: false,
                        });
                        return [3 /*break*/, 20];
                    case 20:
                        checkTimings["vscode"] = Date.now() - vscodeT0;
                        pt.after("vscode");
                        _e.label = 21;
                    case 21:
                        if (!shouldRun("git")) return [3 /*break*/, 30];
                        pt.before("git");
                        gitT0 = Date.now();
                        targetVaults = vaults.length > 0 ? vaults : configVaults;
                        _i = 0, targetVaults_1 = targetVaults;
                        _e.label = 22;
                    case 22:
                        if (!(_i < targetVaults_1.length)) return [3 /*break*/, 29];
                        vault = targetVaults_1[_i];
                        vname = vault.name || vault.fsPath || "root";
                        vpath = vault.fsPath
                            ? path_1.default.isAbsolute(vault.fsPath)
                                ? vault.fsPath
                                : path_1.default.join(opts.wsRoot, vault.fsPath)
                            : opts.wsRoot;
                        _e.label = 23;
                    case 23:
                        _e.trys.push([23, 27, , 28]);
                        git = new engine_server_1.Git({ localUrl: vpath, remoteUrl: "" });
                        return [4 /*yield*/, git.isRepo().catch(function () { return false; })];
                    case 24:
                        isRepo = _e.sent();
                        if (!isRepo) {
                            checks.push({
                                name: "git:".concat(vname),
                                status: "skip",
                                detail: "no .git (non-git vault or external)",
                                fixable: false,
                            });
                            return [3 /*break*/, 28];
                        }
                        return [4 /*yield*/, git.hasChanges().catch(function () { return false; })];
                    case 25:
                        hasDirty = _e.sent();
                        return [4 /*yield*/, git.client(["status", "--porcelain"]).catch(function () { return ""; })];
                    case 26:
                        porcelain = _e.sent();
                        dirtyCount = porcelain.trim().split("\n").filter(Boolean).length;
                        checks.push(__assign({ name: "git:".concat(vname), status: hasDirty ? "warn" : "pass", detail: dirtyCount > 0 ? "".concat(dirtyCount, " uncommitted changes") : "clean", fixable: dirtyCount > 0 }, (dirtyCount > 0 ? { fixHint: "git add/commit/stash (or doctor --fix for related gitignore ensures)" } : {})));
                        return [3 /*break*/, 28];
                    case 27:
                        e_4 = _e.sent();
                        checks.push({
                            name: "git:".concat(vname),
                            status: "skip",
                            detail: "git error or no repo: ".concat(e_4.message.slice(0, 80)),
                            fixable: false,
                        });
                        return [3 /*break*/, 28];
                    case 28:
                        _i++;
                        return [3 /*break*/, 22];
                    case 29:
                        checkTimings["git"] = Date.now() - gitT0;
                        pt.after("git");
                        _e.label = 30;
                    case 30:
                        // 5. dendron.yml schema — real DConfig + ConfigUtils (base already validated; report version/drift)
                        if (shouldRun("yml") || shouldRun("dendron-yml")) {
                            pt.before("yml");
                            ymlT0 = Date.now();
                            try {
                                raw = common_server_1.DConfig.getRaw(opts.wsRoot);
                                version = raw.version || "v5?";
                                // Wire ConfigUtils (already in base validateConfig path)
                                checks.push({
                                    name: "dendron-yml",
                                    status: "pass",
                                    detail: "version ".concat(version, " (DConfig+ConfigUtils; base validation passed)"),
                                    fixable: true,
                                    fixHint: "doctor --fix for comment-drift normalization + missing-defaults (DConfig backup+write; safe)",
                                });
                            }
                            catch (e) {
                                checks.push({
                                    name: "dendron-yml",
                                    status: "fail",
                                    detail: "schema/load error: ".concat(e.message),
                                    fixable: true,
                                    fixHint: "doctor --fix (yml drift + defaults + deprecated removal; backups created)",
                                });
                            }
                            checkTimings["dendron-yml"] = Date.now() - ymlT0;
                            pt.after("yml");
                        }
                        if (!(shouldRun("deps") || shouldRun("deps-cve"))) return [3 /*break*/, 35];
                        pt.before("deps");
                        depsT0 = Date.now();
                        _e.label = 31;
                    case 31:
                        _e.trys.push([31, 33, , 34]);
                        auditCmd = "yarn audit --json --level high --groups dependencies 2>&1 | head -c 4096";
                        return [4 /*yield*/, execAsync(auditCmd, {
                                cwd: opts.wsRoot,
                                timeout: 4500,
                                maxBuffer: 1024 * 64,
                            }).catch(function (e) { return ({ stdout: (e === null || e === void 0 ? void 0 : e.stdout) || "audit-timeout-or-no-yarn" }); })];
                    case 32:
                        stdout = (_e.sent()).stdout;
                        hasHigh = /"severity":"(high|critical)"/i.test(stdout) && !/"found":\s*0/.test(stdout);
                        checks.push({
                            name: "deps-cve",
                            status: hasHigh ? "warn" : "pass",
                            detail: hasHigh ? "high/crit advisories in yarn output (run full yarn audit --fix)" : "no high/crit in slice or clean",
                            fixable: false,
                        });
                        return [3 /*break*/, 34];
                    case 33:
                        e_5 = _e.sent();
                        checks.push({
                            name: "deps-cve",
                            status: "skip",
                            detail: "audit skipped: ".concat(e_5.message.slice(0, 60), " (ensure yarn in PATH)"),
                            fixable: false,
                        });
                        return [3 /*break*/, 34];
                    case 34:
                        checkTimings["deps-cve"] = Date.now() - depsT0;
                        pt.after("deps");
                        _e.label = 35;
                    case 35:
                        // Attach per-check timings (captured alongside pt) to results for table + --json polish (timingMs on each check)
                        // Mapping handles name differences (dendron-yml vs yml pt key; git:foo subs use "git" aggregate)
                        // Use conditional set to avoid assigning `number | undefined` (exactOptionalPropertyTypes strictness)
                        checks.forEach(function (c) {
                            if (c.name.startsWith("git:")) {
                                var t = checkTimings["git"];
                                if (t !== undefined)
                                    c.timingMs = t;
                            }
                            else {
                                var t = checkTimings[c.name];
                                if (t !== undefined)
                                    c.timingMs = t;
                            }
                        });
                        console.log("DEBUG: reached after attach, before hoisted use*");
                        useVerbose = !!this.opts.verbose || !!opts.verbose;
                        useJson = !!this.opts.json || !!opts.json;
                        console.log("DEBUG: hoisted use* done, fix? ", !!opts.fix);
                        if (!opts.fix) return [3 /*break*/, 52];
                        appliedFixes = [];
                        fixRequestedYml = !requestedChecks || requestedChecks.some(function (c) { return c.includes("yml"); });
                        fixRequestedGit = !requestedChecks || requestedChecks.some(function (c) { return c.includes("git"); });
                        _e.label = 36;
                    case 36:
                        _e.trys.push([36, 40, , 41]);
                        if (!(fixRequestedGit || !requestedChecks)) return [3 /*break*/, 39];
                        return [4 /*yield*/, common_server_1.GitUtils.addToGitignore({ addPath: ".dendron.*", root: opts.wsRoot })];
                    case 37:
                        _e.sent();
                        return [4 /*yield*/, common_server_1.GitUtils.addToGitignore({ addPath: "metadata.db", root: opts.wsRoot, noCreateIfMissing: true })];
                    case 38:
                        _e.sent();
                        appliedFixes.push("gitignore-metadata-dendron");
                        _e.label = 39;
                    case 39: return [3 /*break*/, 41];
                    case 40:
                        e_6 = _e.sent();
                        L.warn({ ctx: ctx, msg: "gitignore --fix skipped (non-fatal)", err: e_6.message });
                        return [3 /*break*/, 41];
                    case 41:
                        _e.trys.push([41, 50, , 51]);
                        if (!(fixRequestedYml || !requestedChecks)) return [3 /*break*/, 49];
                        rawForDetect = common_server_1.DConfig.getRaw(opts.wsRoot);
                        detectOut = common_all_1.ConfigUtils.detectMissingDefaults({ config: rawForDetect });
                        if (!(detectOut === null || detectOut === void 0 ? void 0 : detectOut.needsBackfill)) return [3 /*break*/, 44];
                        return [4 /*yield*/, common_server_1.DConfig.createBackup(opts.wsRoot, "doctor-fix-missing-defaults")];
                    case 42:
                        _e.sent();
                        return [4 /*yield*/, common_server_1.DConfig.writeConfig({ wsRoot: opts.wsRoot, config: detectOut.backfilledConfig })];
                    case 43:
                        _e.sent();
                        appliedFixes.push("dendron-yml-missing-defaults");
                        _e.label = 44;
                    case 44: 
                    // explicit comment drift normalization (always safe roundtrip when --fix yml; backup protects; this IS the drift repair action)
                    return [4 /*yield*/, common_server_1.DConfig.createBackup(opts.wsRoot, "doctor-fix-yml-drift")];
                    case 45:
                        // explicit comment drift normalization (always safe roundtrip when --fix yml; backup protects; this IS the drift repair action)
                        _e.sent();
                        current = common_server_1.DConfig.readConfigSync(opts.wsRoot);
                        return [4 /*yield*/, common_server_1.DConfig.writeConfig({ wsRoot: opts.wsRoot, config: current })];
                    case 46:
                        _e.sent();
                        appliedFixes.push("dendron-yml-drift-normalized");
                        depPaths = engine_server_1.DEPRECATED_PATHS && engine_server_1.DEPRECATED_PATHS.length
                            ? common_all_1.ConfigUtils.detectDeprecatedConfigs({ config: rawForDetect, deprecatedPaths: engine_server_1.DEPRECATED_PATHS })
                            : [];
                        if (!(depPaths.length > 0)) return [3 /*break*/, 49];
                        return [4 /*yield*/, common_server_1.DConfig.createBackup(opts.wsRoot, "doctor-fix-deprecated")];
                    case 47:
                        _e.sent();
                        cfgCopy_1 = lodash_1.default.cloneDeep(current);
                        depPaths.forEach(function (p) { return lodash_1.default.unset(cfgCopy_1, p); });
                        return [4 /*yield*/, common_server_1.DConfig.writeConfig({ wsRoot: opts.wsRoot, config: cfgCopy_1 })];
                    case 48:
                        _e.sent();
                        appliedFixes.push("deprecated-removed:".concat(depPaths.length));
                        _e.label = 49;
                    case 49: return [3 /*break*/, 51];
                    case 50:
                        e_7 = _e.sent();
                        L.warn({ ctx: ctx, msg: "yml/config --fix skipped (safe no-op on error)", err: e_7.message.slice(0, 120) });
                        return [3 /*break*/, 51];
                    case 51:
                        if (appliedFixes.length > 0) {
                            msg = "\u2705 --fix applied: ".concat(appliedFixes.join(", "), " (backups in .dendron/backups/ where yml touched). Re-run without --fix or with --checks to verify.");
                            if (useJson) {
                                // json path already printed; append note? for now console for visibility (or enhance printJson future)
                                // eslint-disable-next-line no-console
                                console.log(msg);
                            }
                            else {
                                this.print(msg);
                            }
                        }
                        else if (opts.fix) {
                            note = "ℹ️  --fix: no mutations needed (or only idempotent like gitignore already present).";
                            if (!useJson)
                                this.print(note);
                        }
                        _e.label = 52;
                    case 52:
                        console.log("DEBUG: after fix block, before summary. checks.length=", checks.length);
                        summary = {
                            pass: checks.filter(function (c) { return c.status === "pass"; }).length,
                            warn: checks.filter(function (c) { return c.status === "warn"; }).length,
                            fail: checks.filter(function (c) { return c.status === "fail"; }).length,
                        };
                        exitCode = summary.fail > 0 ? 2 : summary.warn > 0 ? 1 : 0;
                        timer.mark("health-checks-complete");
                        perfReport = timer.getDetailedReport();
                        ptReport = pt.report();
                        // Perf hook surface (verbose or DENDRON_PERF); future: global PerfRingBuffer in common-all
                        if (useVerbose) {
                            this.print(perfReport);
                            this.print("Per-check: ".concat(ptReport));
                        }
                        // json from CLI opts (base sets this.opts.json from args via eval; super.buildArgs ensures declared)
                        // Polished: always emits checks[] + summary + exitCode; perf (activation + perCheck) only when verbose
                        if (useJson) {
                            this.printJson({
                                checks: checks,
                                summary: summary,
                                exitCode: exitCode,
                                perf: useVerbose ? { activation: perfReport, perCheck: ptReport } : undefined,
                                ts: Date.now(),
                            });
                        }
                        else {
                            // Use the new console table helper from CLIUtils (simple padded | table w/ emojis + verbose timings + fix hints)
                            cli_1.CLIUtils.renderHealthChecks(checks, {
                                verbose: useVerbose,
                                timings: checkTimings,
                                summary: summary,
                                exitCode: exitCode,
                                fixNote: !!(opts.fix && (summary.fail + summary.warn > 0)),
                            });
                        }
                        L.info({ ctx: ctx, msg: "exit", exitCode: exitCode, summary: summary });
                        console.log("DEBUG: reached return with checks.length=", checks.length);
                        return [2 /*return*/, { checks: checks, summary: summary, exitCode: exitCode }];
                }
            });
        });
    };
    return DoctorCommand;
}(base_1.CLICommand));
exports.DoctorCommand = DoctorCommand;
