import { RespV3 } from "@dendronhq/common-all";
import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
type CheckStatus = "pass" | "warn" | "fail" | "skip";
interface HealthCheckResult {
    name: string;
    status: CheckStatus;
    detail: string;
    fixable: boolean;
    fixHint?: string;
    timingMs?: number;
}
type CommandCLIOpts = {
    checks?: string;
    fix?: boolean;
    verbose?: boolean;
    json?: boolean;
} & CommandCommonProps;
type CommandOpts = CommandCLIOpts & {
    wsRoot: string;
};
type CommandOutput = {
    checks: HealthCheckResult[];
    summary: {
        pass: number;
        warn: number;
        fail: number;
    };
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
export declare class DoctorCommand extends CLICommand<CommandOpts, CommandOutput> {
    constructor();
    buildArgs(yargs: yargs.Argv): yargs.Argv;
    enrichArgs(opts: CommandCLIOpts): Promise<RespV3<CommandOpts>>;
    execute(opts: CommandOpts): Promise<CommandOutput>;
}
export { CommandOpts as DoctorHealthCommandOpts };
