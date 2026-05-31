"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinnerUtils = exports.CLIUtils = void 0;
const lodash_1 = __importDefault(require("lodash"));
const common_all_1 = require("@dendronhq/common-all");
class CLIUtils {
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
    static objectConfig2StringConfig = (ent) => {
        return lodash_1.default.map(ent, (v, k) => {
            if (lodash_1.default.isUndefined(v)) {
                return undefined;
            }
            else {
                return `${k}=${v}`;
            }
        }).filter((ent) => !lodash_1.default.isUndefined(ent)).join(",");
    };
    static getClientVersion() {
        // eslint-disable-next-line global-require
        const pkgJSON = require("@dendronhq/dendron-cli/package.json");
        return pkgJSON.version;
    }
    /**
     * Simple console "table" renderer for HealthCheckResult[] (no extra deps).
     * Uses emoji status + padded columns + | separators for readability.
     * Timings appended in verbose mode (per-check ms from PerformanceTimer capture).
     * Used by `dendron health` (DoctorCommand) non-JSON output path.
     * Keeps output scriptable + human friendly; ora spinners can wrap slow checks later.
     */
    static renderHealthChecks(checks, opts = {}) {
        const { verbose = false, timings = {}, summary, exitCode, fixNote = false } = opts;
        console.log("\n=== Dendron Workspace Health ===");
        const header = `${"Check".padEnd(20)} | ${"Status".padEnd(8)} | ${"Detail".padEnd(55)} | ${"Fixable"}`;
        console.log(header);
        console.log("-".repeat(Math.max(80, header.length)));
        checks.forEach((c) => {
            const icon = c.status === "pass"
                ? "✅"
                : c.status === "warn"
                    ? "⚠️"
                    : c.status === "fail"
                        ? "❌"
                        : "⏭️";
            let timingStr = "";
            if (verbose) {
                let t = c.timingMs ?? timings[c.name];
                if (t === undefined && c.name.startsWith("git:")) {
                    t = timings["git"];
                }
                if (typeof t === "number") {
                    timingStr = ` (${t}ms)`;
                }
            }
            const fixTag = c.fixable ? " [fixable]" : "";
            const detailWithExtras = `${c.detail}${fixTag}${timingStr}`;
            const detailDisplay = detailWithExtras.length > 52 ? detailWithExtras.slice(0, 49) + "..." : detailWithExtras;
            const row = `${icon} ${c.name.padEnd(18)} | ${c.status.toUpperCase().padEnd(7)} | ${detailDisplay.padEnd(55)} | ${c.fixable ? "yes" : "-"}`;
            console.log(row);
            if (verbose && c.fixHint) {
                console.log(`    ↳ hint: ${c.fixHint}`);
            }
        });
        if (summary) {
            const ec = exitCode ?? (summary.fail > 0 ? 2 : summary.warn > 0 ? 1 : 0);
            console.log(`\nSummary: ${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail  | exit=${ec}`);
        }
        if (fixNote) {
            console.log("⚠️  --fix active (safe gitignore/yml drift+defaults+deprecated applied where triggered; backups created). Re-run to verify.");
        }
        console.log("Use --json for machine output. --checks/--fix/--verbose supported.");
    }
}
exports.CLIUtils = CLIUtils;
class SpinnerUtils {
    /**
     * Given a Ora spinner, render given text with optional symbol
     * Continue spinning.
     * @param opts
     */
    static renderAndContinue(opts) {
        const { spinner, text, symbol } = opts;
        const persistOpts = {
            symbol: symbol || common_all_1.DENDRON_EMOJIS.SEEDLING,
        };
        if (text) {
            persistOpts.text = text;
        }
        spinner.stopAndPersist(persistOpts);
        spinner.start();
    }
}
exports.SpinnerUtils = SpinnerUtils;
//# sourceMappingURL=cli.js.map