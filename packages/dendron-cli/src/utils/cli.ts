import _ from "lodash";
import { Ora } from "ora";
import { DENDRON_EMOJIS } from "@dendronhq/common-all";

export class CLIUtils {
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
  static objectConfig2StringConfig = (ent: any): string => {
    return (
      _.map(ent, (v, k) => {
        if (_.isUndefined(v)) {
          return undefined;
        } else {
          return `${k}=${v}`;
        }
      }).filter((ent) => !_.isUndefined(ent)) as string[]
    ).join(",");
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
  static renderHealthChecks(
    checks: Array<{
      name: string;
      status: string;
      detail: string;
      fixable?: boolean;
      fixHint?: string;
      timingMs?: number;
    }>,
    opts: {
      verbose?: boolean;
      timings?: Record<string, number>;
      summary?: { pass: number; warn: number; fail: number };
      exitCode?: number;
      fixNote?: boolean;
    } = {}
  ) {
    const { verbose = false, timings = {}, summary, exitCode, fixNote = false } = opts;
    console.log("\n=== Dendron Workspace Health ===");
    const header = `${"Check".padEnd(20)} | ${"Status".padEnd(8)} | ${"Detail".padEnd(55)} | ${"Fixable"}`;
    console.log(header);
    console.log("-".repeat(Math.max(80, header.length)));
    checks.forEach((c) => {
      const icon =
        c.status === "pass"
          ? "✅"
          : c.status === "warn"
          ? "⚠️"
          : c.status === "fail"
          ? "❌"
          : "⏭️";
      let timingStr = "";
      if (verbose) {
        let t: number | undefined = c.timingMs ?? timings[c.name];
        if (t === undefined && c.name.startsWith("git:")) {
          t = timings["git"];
        }
        if (typeof t === "number") {
          timingStr = ` (${t}ms)`;
        }
      }
      const fixTag = c.fixable ? " [fixable]" : "";
      const detailWithExtras = `${c.detail}${fixTag}${timingStr}`;
      const detailDisplay =
        detailWithExtras.length > 52 ? detailWithExtras.slice(0, 49) + "..." : detailWithExtras;
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

export class SpinnerUtils {
  /**
   * Given a Ora spinner, render given text with optional symbol
   * Continue spinning.
   * @param opts
   */
  static renderAndContinue(opts: {
    spinner: Ora;
    text?: string;
    symbol?: string;
  }) {
    const { spinner, text, symbol } = opts;
    spinner.stopAndPersist({
      text: text || undefined,
      symbol: symbol || DENDRON_EMOJIS.SEEDLING,
    });
    spinner.start();
  }
}
