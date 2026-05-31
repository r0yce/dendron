"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinnerUtils = exports.CLIUtils = void 0;
var lodash_1 = require("lodash");
var common_all_1 = require("@dendronhq/common-all");
var CLIUtils = /** @class */ (function () {
    function CLIUtils() {
    }
    CLIUtils.getClientVersion = function () {
        // eslint-disable-next-line global-require
        var pkgJSON = require("@dendronhq/dendron-cli/package.json");
        return pkgJSON.version;
    };
    /**
     * Simple console "table" renderer for HealthCheckResult[] (no extra deps).
     * Uses emoji status + padded columns + | separators for readability.
     * Timings appended in verbose mode (per-check ms from PerformanceTimer capture).
     * Used by `dendron health` (DoctorCommand) non-JSON output path.
     * Keeps output scriptable + human friendly; ora spinners can wrap slow checks later.
     */
    CLIUtils.renderHealthChecks = function (checks, opts) {
        if (opts === void 0) { opts = {}; }
        var _a = opts.verbose, verbose = _a === void 0 ? false : _a, _b = opts.timings, timings = _b === void 0 ? {} : _b, summary = opts.summary, exitCode = opts.exitCode, _c = opts.fixNote, fixNote = _c === void 0 ? false : _c;
        console.log("\n=== Dendron Workspace Health ===");
        var header = "".concat("Check".padEnd(20), " | ").concat("Status".padEnd(8), " | ").concat("Detail".padEnd(55), " | ").concat("Fixable");
        console.log(header);
        console.log("-".repeat(Math.max(80, header.length)));
        checks.forEach(function (c) {
            var _a;
            var icon = c.status === "pass"
                ? "✅"
                : c.status === "warn"
                    ? "⚠️"
                    : c.status === "fail"
                        ? "❌"
                        : "⏭️";
            var timingStr = "";
            if (verbose) {
                var t = (_a = c.timingMs) !== null && _a !== void 0 ? _a : timings[c.name];
                if (t === undefined && c.name.startsWith("git:")) {
                    t = timings["git"];
                }
                if (typeof t === "number") {
                    timingStr = " (".concat(t, "ms)");
                }
            }
            var fixTag = c.fixable ? " [fixable]" : "";
            var detailWithExtras = "".concat(c.detail).concat(fixTag).concat(timingStr);
            var detailDisplay = detailWithExtras.length > 52 ? detailWithExtras.slice(0, 49) + "..." : detailWithExtras;
            var row = "".concat(icon, " ").concat(c.name.padEnd(18), " | ").concat(c.status.toUpperCase().padEnd(7), " | ").concat(detailDisplay.padEnd(55), " | ").concat(c.fixable ? "yes" : "-");
            console.log(row);
            if (verbose && c.fixHint) {
                console.log("    \u21B3 hint: ".concat(c.fixHint));
            }
        });
        if (summary) {
            var ec = exitCode !== null && exitCode !== void 0 ? exitCode : (summary.fail > 0 ? 2 : summary.warn > 0 ? 1 : 0);
            console.log("\nSummary: ".concat(summary.pass, " pass / ").concat(summary.warn, " warn / ").concat(summary.fail, " fail  | exit=").concat(ec));
        }
        if (fixNote) {
            console.log("⚠️  --fix active (safe gitignore/yml drift+defaults+deprecated applied where triggered; backups created). Re-run to verify.");
        }
        console.log("Use --json for machine output. --checks/--fix/--verbose supported.");
    };
    /**
     * Takes an object like
     *     {
     *     		foo: "42",
     *     		bar: 10
     *     }
     * and returns "foo=42,bar=10"
     * @param ent: config object
     * @returns
     */
    CLIUtils.objectConfig2StringConfig = function (ent) {
        return lodash_1.default.map(ent, function (v, k) {
            if (lodash_1.default.isUndefined(v)) {
                return undefined;
            }
            else {
                return "".concat(k, "=").concat(v);
            }
        }).filter(function (ent) { return !lodash_1.default.isUndefined(ent); }).join(",");
    };
    return CLIUtils;
}());
exports.CLIUtils = CLIUtils;
var SpinnerUtils = /** @class */ (function () {
    function SpinnerUtils() {
    }
    /**
     * Given a Ora spinner, render given text with optional symbol
     * Continue spinning.
     * @param opts
     */
    SpinnerUtils.renderAndContinue = function (opts) {
        var spinner = opts.spinner, text = opts.text, symbol = opts.symbol;
        var persistOpts = {
            symbol: symbol || common_all_1.DENDRON_EMOJIS.SEEDLING,
        };
        if (text) {
            persistOpts.text = text;
        }
        spinner.stopAndPersist(persistOpts);
        spinner.start();
    };
    return SpinnerUtils;
}());
exports.SpinnerUtils = SpinnerUtils;
