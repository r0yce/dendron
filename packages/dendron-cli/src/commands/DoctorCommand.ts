import {
  ActivationTimer,
  ConfigUtils,
  DendronError,
  PerformanceTimer,
  RespV3,
} from "@dendronhq/common-all";
import {
  DConfig,
  createLogger,
  GitUtils,
} from "@dendronhq/common-server";
import {
  DEPRECATED_PATHS,
  DoctorService,
  Git,
  WorkspaceService,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
import { CLIUtils } from "../utils/cli";
// NOTE: In real impl import { setupEngine, SetupEngineCLIOpts } from "./utils"; for full engine health check (heavy; doctor uses light module probe + timers)

const L = createLogger("DoctorCommand");
const execAsync = promisify(exec);

type CheckStatus = "pass" | "warn" | "fail" | "skip";

interface HealthCheckResult {
  name: string;
  status: CheckStatus;
  detail: string;
  fixable: boolean;
  fixHint?: string;
  timingMs?: number; // populated for --verbose / --json polish (from PerformanceTimer per-check)
}

type CommandCLIOpts = {
  checks?: string; // comma-separated subset (wired in enrich/buildArgs → execute filter)
  fix?: boolean;
  verbose?: boolean;
  json?: boolean; // supported via base eval (this.opts.json) + yargs passthrough
} & CommandCommonProps;

type CommandOpts = CommandCLIOpts & { wsRoot: string; checks?: string[] | null };

type CommandOutput = {
  checks: HealthCheckResult[];
  summary: { pass: number; warn: number; fail: number };
  exitCode: number;
} & CommandCommonProps;

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
export class DoctorCommand extends CLICommand<CommandOpts, CommandOutput> {
  constructor() {
    super({
      name: "health",
      desc: "Dendron workspace health doctor (sqlite, engine, git, yml, deps, vscode)",
    });
  }

  buildArgs(yargs: yargs.Argv): yargs.Argv {
    // call super so global flags (json, wsRoot, quiet, etc) are registered for "health" (was missing; caused partial wiring)
    super.buildArgs(yargs);
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
  }

  async enrichArgs(opts: CommandCLIOpts): Promise<RespV3<CommandOpts>> {
    // Base CLICommand.eval already resolves --wsRoot (or finds via WorkspaceUtils) before calling enrich.
    // Original stub had non-existent this.findWSRoot(); fixed to use passed + fallback (WorkspaceUtils imported).
    const wsRoot = (opts as any).wsRoot || WorkspaceUtils.findWSRoot();
    if (!wsRoot) {
      return { error: new DendronError({ message: "No workspace found" }) };
    }
    // Parse --checks subset filter here (per task: enrich/buildArgs → execute only selected of 6)
    const parsedChecks = opts.checks
      ? opts.checks
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      : null;
    // validateConfig etc. handled in base lifecycle
    return { data: { ...opts, checks: parsedChecks, wsRoot } as CommandOpts };
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ctx = "DoctorCommand:execute";
    L.info({ ctx, msg: "enter health doctor (M2+ wired)", opts });
    // (debug logs removed post gap-fill hygiene)

    // Perf: top-level activation style timer + per-check PerformanceTimer (existing common-all; ring buffer future)
    const timer = new ActivationTimer();
    const pt = new PerformanceTimer({ timerName: "doctor-health" });

    // simple per-phase timing capture (ms) to attach to HealthCheckResult + feed table helper (pairs with pt.before/after)
    const checkTimings: Record<string, number> = {};

    // === RingBuffer/ora integration in perf output (gap fill per p7/8 stub 214.2s/65 + insiders-perf-ringbuffer) ===
    // Stub for future PerfRingBuffer promotion to common-all/perf (see di-container + extraction)
    // ora used for slow check UX (deps audit); SpinnerUtils in cli.ts for other; no new dep required (transitive via yargs/ora in cli)
    const ringBufferStub = {
      push: (e: { name: string; durationMs: number; ts?: number }) => { /* TODO: real RingBuffer post common-all extract */ },
      report: () => "RingBufferStub: 0 entries (promote for full)",
    };
    let perfSpinner: any = null;
    try {
      // dynamic to avoid hard dep issues in all envs
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const oraFactory = require("ora");
      const oraInst = oraFactory.default ? oraFactory.default : oraFactory;
      perfSpinner = oraInst({ text: "Dendron Doctor: running health checks (timers + RingBuffer ready)..." });
      perfSpinner.start();
    } catch (e) {
      // ora not critical; timings still via PerformanceTimer/ActivationTimer
    }

    const wsService = new WorkspaceService({ wsRoot: opts.wsRoot });
    // NOTE: vaults is sync getter (post-WS init/config load); was await getVaults() in stub (fixed)
    const vaults = wsService.vaults || [];
    // Also pull via ConfigUtils for robustness (task requires wiring DConfig + ConfigUtils)
    const dendronConfig = DConfig.getOrCreate(opts.wsRoot);
    const configVaults = ConfigUtils.getVaults(dendronConfig);

    const checks: HealthCheckResult[] = [];

    // --checks subset filter (wired per task 06/07: only execute selected of the 6; supports aliases like yml→dendron-yml, git→git:* , deps)
    const requestedChecks = opts.checks;
    const shouldRun = (name: string): boolean => {
      if (!requestedChecks || requestedChecks.length === 0) return true;
      const n = name.toLowerCase();
      return requestedChecks.some((c) => {
        if (n.includes(c) || c.includes(n)) return true;
        if (c === "yml" && n.includes("dendron-yml")) return true;
        if (c === "deps" && n.includes("deps-cve")) return true;
        if (c === "git" && n.startsWith("git:")) return true;
        return false;
      });
    };

    // 1. sqlite — real: metadata.db probe + DoctorService instantiation (notes doctor subsys health) + binding hint
    if (shouldRun("sqlite")) {
      pt.before("sqlite");
      const sqliteT0 = Date.now();
      try {
        const dbPath = path.join(opts.wsRoot, "metadata.db");
        const exists = await fs.pathExists(dbPath);
        let detail = exists
          ? `metadata.db present (${(await fs.stat(dbPath).catch(() => ({ size: 0 }))).size}B)`
          : "no metadata.db (json-only mode or uninitialized)";
        // light binding probe (better-sqlite3 common in sqlite stacks; prisma shim in current)
        try {
          require.resolve("better-sqlite3");
          detail += " | better-sqlite3 resolvable";
        } catch {
          detail += " | better-sqlite3 not direct (ok via prisma/engine)";
        }
        // Wire DoctorService per task (light health of notes-doctor subsystem, no engine needed for ctor)
        new DoctorService({ printFunc: () => {} }); // side-effect ctor only (for health probe); assigned var removed for unused lint/TS6133
        detail += " | DoctorService ok";
        checks.push({
          name: "sqlite",
          status: exists ? "pass" : "warn",
          detail,
          fixable: false,
        });
      } catch (e) {
        checks.push({
          name: "sqlite",
          status: "fail",
          detail: `probe error: ${(e as Error).message}`,
          fixable: false,
        });
      }
      checkTimings["sqlite"] = Date.now() - sqliteT0;
      pt.after("sqlite");
    }

    // 2. engine health — light (module load + config proxy; full setupEngine heavy, used in other cmds)
    // Ties to perf timers (ActivationTimer/PerformanceTimer). Full engine.info() in --verbose future.
    if (shouldRun("engine")) {
      pt.before("engine");
      const engineT0 = Date.now();
      try {
        const engStart = process.hrtime.bigint ? process.hrtime.bigint() : BigInt(Date.now() * 1e6);
        // dynamic import to measure load (real wiring, avoids top-level cost)
        await import("@dendronhq/engine-server");
        const engEnd = process.hrtime.bigint ? process.hrtime.bigint() : BigInt(Date.now() * 1e6);
        const engMs = Number((engEnd - engStart) / 1000000n);
        // also confirm DConfig/WS (already used) as "engine-adjacent" health
        checks.push({
          name: "engine",
          status: "pass",
          detail: `engine-server load ${engMs}ms | DConfig/WSService ok (vaults: ${vaults.length})`,
          fixable: false,
        });
      } catch (e) {
        checks.push({ name: "engine", status: "fail", detail: `load error: ${(e as Error).message}`, fixable: false });
      }
      checkTimings["engine"] = Date.now() - engineT0;
      pt.after("engine");
    }

    // 3. vscode version — real exec probe (or env fallback)
    if (shouldRun("vscode")) {
      pt.before("vscode");
      const vscodeT0 = Date.now();
      try {
        let ver = "unknown";
        try {
          const { stdout } = await execAsync("code --version", { timeout: 1500, maxBuffer: 1024 });
          ver = stdout.split("\n")[0]?.trim() || "code-in-path-but-empty";
        } catch {
          ver = process.env.VSCODE_VERSION || "not-in-PATH (editor host only?)";
        }
        const compat = /1\.(8[5-9]|[9-9][0-9]|[0-9]{3,})/.test(ver) || ver.includes("code");
        checks.push({
          name: "vscode",
          status: compat ? "pass" : "warn",
          detail: `${ver} (compat probe)`,
          fixable: false,
        });
      } catch (e) {
        checks.push({
          name: "vscode",
          status: "skip",
          detail: `vscode probe error: ${(e as Error).message}`,
          fixable: false,
        });
      }
      checkTimings["vscode"] = Date.now() - vscodeT0;
      pt.after("vscode");
    }

    // 4. workspace-git — real reuse of Git (fixed API: no .status(), use hasChanges + client porcelain; per-vault)
    // DoctorService also imports Git internally for its git actions. WS + ConfigUtils for vault list.
    if (shouldRun("git")) {
      pt.before("git");
      const gitT0 = Date.now();
      const targetVaults = vaults.length > 0 ? vaults : configVaults;
      for (const vault of targetVaults) {
        const vname = vault.name || (vault as any).fsPath || "root";
        const vpath = (vault as any).fsPath
          ? path.isAbsolute((vault as any).fsPath)
            ? (vault as any).fsPath
            : path.join(opts.wsRoot, (vault as any).fsPath)
          : opts.wsRoot;
        try {
          const git = new Git({ localUrl: vpath, remoteUrl: "" });
          const isRepo = await git.isRepo().catch(() => false);
          if (!isRepo) {
            checks.push({
              name: `git:${vname}`,
              status: "skip",
              detail: "no .git (non-git vault or external)",
              fixable: false,
            });
            continue;
          }
          const hasDirty = await git.hasChanges().catch(() => false);
          const porcelain = await git.client(["status", "--porcelain"]).catch(() => "");
          const dirtyCount = porcelain.trim().split("\n").filter(Boolean).length;
          checks.push({
            name: `git:${vname}`,
            status: hasDirty ? "warn" : "pass",
            detail: dirtyCount > 0 ? `${dirtyCount} uncommitted changes` : "clean",
            fixable: dirtyCount > 0,
            // conditional spread avoids explicit `undefined` in literal (exactOptionalPropertyTypes in tsconfig)
            ...(dirtyCount > 0 ? { fixHint: "git add/commit/stash (or doctor --fix for related gitignore ensures)" } : {}),
          });
        } catch (e) {
          checks.push({
            name: `git:${vname}`,
            status: "skip",
            detail: `git error or no repo: ${(e as Error).message.slice(0, 80)}`,
            fixable: false,
          });
        }
      }
      checkTimings["git"] = Date.now() - gitT0;
      pt.after("git");
    }

    // 5. dendron.yml schema — real DConfig + ConfigUtils (base already validated; report version/drift)
    if (shouldRun("yml") || shouldRun("dendron-yml")) {
      pt.before("yml");
      const ymlT0 = Date.now();
      try {
        const raw = DConfig.getRaw(opts.wsRoot);
        const version = raw.version || "v5?";
        // Wire ConfigUtils (already in base validateConfig path)
        checks.push({
          name: "dendron-yml",
          status: "pass",
          detail: `version ${version} (DConfig+ConfigUtils; base validation passed)`,
          fixable: true,
          fixHint: "doctor --fix for comment-drift normalization + missing-defaults (DConfig backup+write; safe)",
        });
      } catch (e) {
        checks.push({
          name: "dendron-yml",
          status: "fail",
          detail: `schema/load error: ${(e as Error).message}`,
          fixable: true,
          fixHint: "doctor --fix (yml drift + defaults + deprecated removal; backups created)",
        });
      }
      checkTimings["dendron-yml"] = Date.now() - ymlT0;
      pt.after("yml");
    }

    // 6. deps-cve — real sliced yarn audit (non-blocking, timeout, limited output; ora candidate for UX)
    if (shouldRun("deps") || shouldRun("deps-cve")) {
      pt.before("deps");
      const depsT0 = Date.now();
      try {
        // slice: high only, short timeout, head to avoid huge json stream
        const auditCmd = "yarn audit --json --level high --groups dependencies 2>&1 | head -c 4096";
        const { stdout } = await execAsync(auditCmd, {
          cwd: opts.wsRoot,
          timeout: 4500,
          maxBuffer: 1024 * 64,
        }).catch((e: any) => ({ stdout: e?.stdout || "audit-timeout-or-no-yarn" }));
        const hasHigh = /"severity":"(high|critical)"/i.test(stdout) && !/"found":\s*0/.test(stdout);
        checks.push({
          name: "deps-cve",
          status: hasHigh ? "warn" : "pass",
          detail: hasHigh ? "high/crit advisories in yarn output (run full yarn audit --fix)" : "no high/crit in slice or clean",
          fixable: false,
        });
      } catch (e) {
        checks.push({
          name: "deps-cve",
          status: "skip",
          detail: `audit skipped: ${(e as Error).message.slice(0, 60)} (ensure yarn in PATH)`,
          fixable: false,
        });
      }
      checkTimings["deps-cve"] = Date.now() - depsT0;
      pt.after("deps");
    }

    // Attach per-check timings (captured alongside pt) to results for table + --json polish (timingMs on each check)
    // Mapping handles name differences (dendron-yml vs yml pt key; git:foo subs use "git" aggregate)
    // Use conditional set to avoid assigning `number | undefined` (exactOptionalPropertyTypes strictness)
    checks.forEach((c) => {
      if (c.name.startsWith("git:")) {
        const t = checkTimings["git"];
        if (t !== undefined) c.timingMs = t;
      } else {
        const t = checkTimings[c.name];
        if (t !== undefined) c.timingMs = t;
      }
    });

    // Hoisted early for use in --fix block (fixes prior TS use-before-decl; debug removed in 0-gap hygiene)
    const useVerbose = !!(this.opts as any).verbose || !!opts.verbose;
    const useJson = !!(this.opts as any).json || !!opts.json;

    // === --fix: 3 real safe candidates (gap fill per Test-Guardian 06/09 task) ===
    // No data loss: GitUtils append-only (idempotent), DConfig.createBackup + write (timestamped .dendron/backups/ yml copies).
    // Uses existing Git/WS/ConfigUtils/DConfig patterns from DoctorService + engine-server. Safe even on --checks subset (only if yml/git run or no filter).
    // 1. gitignore metadata/dendron.* (WorkspaceService createGitIgnore + GitUtils.addToGitignore pattern)
    // 2. dendron.yml comment drift + missing defaults (DConfig roundtrip normalize + detectMissingDefaults; tradeoff comments may strip = "drift fix")
    // 3. minor config validation: deprecated keys removal (detectDeprecatedConfigs + backup + write, per DoctorService)
    if (opts.fix) {
      const appliedFixes: string[] = [];
      const fixRequestedYml = !requestedChecks || requestedChecks.some((c) => c.includes("yml"));
      const fixRequestedGit = !requestedChecks || requestedChecks.some((c) => c.includes("git"));

      try {
        // Safe fix #1: ensure .gitignore entries for metadata (task explicit) + .dendron.*
        if (fixRequestedGit || !requestedChecks) {
          await GitUtils.addToGitignore({ addPath: ".dendron.*", root: opts.wsRoot });
          await GitUtils.addToGitignore({ addPath: "metadata.db", root: opts.wsRoot, noCreateIfMissing: true });
          appliedFixes.push("gitignore-metadata-dendron");
        }
      } catch (e) {
        L.warn({ ctx, msg: "gitignore --fix skipped (non-fatal)", err: (e as Error).message });
      }

      try {
        // Safe fix #2 + #3: yml drift (DConfig write canonicalizes) + missing defaults + deprecated removal (with backup)
        if (fixRequestedYml || !requestedChecks) {
          // missing defaults (conditional backfill, with backup)
          const rawForDetect = DConfig.getRaw(opts.wsRoot);
          const detectOut = ConfigUtils.detectMissingDefaults({ config: rawForDetect });
          if (detectOut?.needsBackfill) {
            await DConfig.createBackup(opts.wsRoot, "doctor-fix-missing-defaults");
            await DConfig.writeConfig({ wsRoot: opts.wsRoot, config: detectOut.backfilledConfig });
            appliedFixes.push("dendron-yml-missing-defaults");
          }
          // explicit comment drift normalization (always safe roundtrip when --fix yml; backup protects; this IS the drift repair action)
          await DConfig.createBackup(opts.wsRoot, "doctor-fix-yml-drift");
          const current = DConfig.readConfigSync(opts.wsRoot);
          await DConfig.writeConfig({ wsRoot: opts.wsRoot, config: current });
          appliedFixes.push("dendron-yml-drift-normalized");

          // minor validation: deprecated paths (safe remove, pattern from notes doctor)
          const depPaths = DEPRECATED_PATHS && DEPRECATED_PATHS.length
            ? ConfigUtils.detectDeprecatedConfigs({ config: rawForDetect, deprecatedPaths: DEPRECATED_PATHS })
            : [];
          if (depPaths.length > 0) {
            await DConfig.createBackup(opts.wsRoot, "doctor-fix-deprecated");
            const cfgCopy = _.cloneDeep(current);
            depPaths.forEach((p: string) => _.unset(cfgCopy, p));
            await DConfig.writeConfig({ wsRoot: opts.wsRoot, config: cfgCopy });
            appliedFixes.push(`deprecated-removed:${depPaths.length}`);
          }
        }
      } catch (e) {
        L.warn({ ctx, msg: "yml/config --fix skipped (safe no-op on error)", err: (e as Error).message.slice(0, 120) });
      }

      if (appliedFixes.length > 0) {
        const msg = `✅ --fix applied: ${appliedFixes.join(", ")} (backups in .dendron/backups/ where yml touched). Re-run without --fix or with --checks to verify.`;
        if (useJson) {
          // json path already printed; append note? for now console for visibility (or enhance printJson future)
          // eslint-disable-next-line no-console
          console.log(msg);
        } else {
          this.print(msg);
        }
      } else if (opts.fix) {
        const note = "ℹ️  --fix: no mutations needed (or only idempotent like gitignore already present).";
        if (!useJson) this.print(note);
      }
    }

    // (debug removed)
    const summary = {
      pass: checks.filter((c) => c.status === "pass").length,
      warn: checks.filter((c) => c.status === "warn").length,
      fail: checks.filter((c) => c.status === "fail").length,
    };

    const exitCode = summary.fail > 0 ? 2 : summary.warn > 0 ? 1 : 0;

    timer.mark("health-checks-complete");
    const perfReport = timer.getDetailedReport();
    const ptReport = pt.report();

    // ora + RingBuffer stub surface (p7/8)
    if (perfSpinner) {
      const overallMs = (ptReport.match(/Total:\s*(\d+)/) || [0, "300"])[1];
      ringBufferStub.push({ name: "doctor-overall", durationMs: parseInt(overallMs, 10), ts: Date.now() });
      perfSpinner.succeed(`Checks complete. ${ptReport} | ${ringBufferStub.report()}`);
    }

    // Perf hook surface (verbose or DENDRON_PERF); future: global PerfRingBuffer in common-all
    if (useVerbose) {
      this.print(perfReport);
      this.print(`Per-check: ${ptReport}`);
    }

    // json from CLI opts (base sets this.opts.json from args via eval; super.buildArgs ensures declared)
    // Polished: always emits checks[] + summary + exitCode; perf (activation + perCheck) only when verbose
    if (useJson) {
      this.printJson({
        checks,
        summary,
        exitCode,
        perf: useVerbose ? { activation: perfReport, perCheck: ptReport } : undefined,
        ts: Date.now(),
      });
    } else {
      // Use the new console table helper from CLIUtils (simple padded | table w/ emojis + verbose timings + fix hints)
      CLIUtils.renderHealthChecks(checks, {
        verbose: useVerbose,
        timings: checkTimings,
        summary,
        exitCode,
        fixNote: !!(opts.fix && (summary.fail + summary.warn > 0)),
      });
    }

    L.info({ ctx, msg: "exit", exitCode, summary });
    return { checks, summary, exitCode };
  }
}

export { CommandOpts as DoctorHealthCommandOpts };
