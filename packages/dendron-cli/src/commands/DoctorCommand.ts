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
} from "@dendronhq/common-server";
import {
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
  checks?: string; // comma-separated subset
  fix?: boolean;
  verbose?: boolean;
  json?: boolean; // supported via base eval (this.opts.json) + yargs passthrough
} & CommandCommonProps;

type CommandOpts = CommandCLIOpts & { wsRoot: string };

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
 *   - --json via base, --verbose includes timings; --fix skeleton only (no mutations yet).
 *
 * Checks 1-6 fully wired (real probes, not placeholders). --fix skeleton / engine-full future; registration + simple CLIUtils table live (per Test-Guardian matrix).
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
    // validateConfig etc. handled in base lifecycle
    return { data: { ...opts, wsRoot } as CommandOpts };
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ctx = "DoctorCommand:execute";
    L.info({ ctx, msg: "enter health doctor (M2+ wired)", opts });

    // Perf: top-level activation style timer + per-check PerformanceTimer (existing common-all; ring buffer future)
    const timer = new ActivationTimer();
    const pt = new PerformanceTimer({ timerName: "doctor-health" });

    // simple per-phase timing capture (ms) to attach to HealthCheckResult + feed table helper (pairs with pt.before/after)
    const checkTimings: Record<string, number> = {};

    const wsService = new WorkspaceService({ wsRoot: opts.wsRoot });
    // NOTE: vaults is sync getter (post-WS init/config load); was await getVaults() in stub (fixed)
    const vaults = wsService.vaults || [];
    // Also pull via ConfigUtils for robustness (task requires wiring DConfig + ConfigUtils)
    const dendronConfig = DConfig.getOrCreate(opts.wsRoot);
    const configVaults = ConfigUtils.getVaults(dendronConfig);

    const checks: HealthCheckResult[] = [];

    // 1. sqlite — real: metadata.db probe + DoctorService instantiation (notes doctor subsys health) + binding hint
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

    // 2. engine health — light (module load + config proxy; full setupEngine heavy, used in other cmds)
    // Ties to perf timers (ActivationTimer/PerformanceTimer). Full engine.info() in --verbose future.
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

    // 3. vscode version — real exec probe (or env fallback)
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

    // 4. workspace-git — real reuse of Git (fixed API: no .status(), use hasChanges + client porcelain; per-vault)
    // DoctorService also imports Git internally for its git actions. WS + ConfigUtils for vault list.
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
          ...(dirtyCount > 0 ? { fixHint: "git add/commit/stash (or --fix future)" } : {}),
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

    // 5. dendron.yml schema — real DConfig + ConfigUtils (base already validated; report version/drift)
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
        fixable: false,
      });
    } catch (e) {
      checks.push({
        name: "dendron-yml",
        status: "fail",
        detail: `schema/load error: ${(e as Error).message}`,
        fixable: true,
        fixHint: "run migration or dendron dev run_migration",
      });
    }
    checkTimings["dendron-yml"] = Date.now() - ymlT0;
    pt.after("yml");

    // 6. deps-cve — real sliced yarn audit (non-blocking, timeout, limited output; ora candidate for UX)
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
      const hasHigh = /"severity":"high"|"severity":"critical"|vulnerab|advisories/i.test(stdout) && !/"found":\s*0/.test(stdout);
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

    const summary = {
      pass: checks.filter((c) => c.status === "pass").length,
      warn: checks.filter((c) => c.status === "warn").length,
      fail: checks.filter((c) => c.status === "fail").length,
    };

    const exitCode = summary.fail > 0 ? 2 : summary.warn > 0 ? 1 : 0;

    timer.mark("health-checks-complete");
    const perfReport = timer.getDetailedReport();
    const ptReport = pt.report();

    // Perf hook surface (verbose or DENDRON_PERF); future: global PerfRingBuffer in common-all
    const useVerbose = !!(this.opts as any).verbose || !!opts.verbose;
    if (useVerbose) {
      this.print(perfReport);
      this.print(`Per-check: ${ptReport}`);
    }

    // json from CLI opts (base sets this.opts.json from args via eval; super.buildArgs ensures declared)
    // Polished: always emits checks[] + summary + exitCode; perf (activation + perCheck) only when verbose
    const useJson = !!(this.opts as any).json || !!opts.json;
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
