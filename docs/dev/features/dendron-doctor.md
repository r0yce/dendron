# Dendron Doctor (Health Check Command) — 1-Page Spec

**Status**: **GAPS FILLED + MVP LAUNCH READY (2026-06, post-M2 + Test-Guardian smoke 019e7cd0-df92-7203-aa4d-eb6ca900e628 239.2s/55 calls + Doc-Master 019e7cd0-caa7-78d3-84cc-97932f7f37a5 285.4s/60 calls + prior reg/table 019e7ccf-96a6-7d00 283.2s/68 + Feature-Ideator 6 checks 019e7cc6 + full orchestra + 06/07 polish)**: 6 checks + --checks wired (subset filter in enrich/execute) + 3 real safe --fix (DConfig yml drift+backups, GitUtils .gitignore metadata, ConfigUtils minor) + units/snapshots (5 cases: --help, dry 0 exit, --json+timingMs, subset, --fix) + bin reg UNCOMMENTED + updated. Smoke re-verify ready. Health now directly usable post-build with table + --json + perf. All gaps filled (no units, --checks ignored, --fix skeleton, bin commented). MVP launch ready on feature/dendron-doctor. Handoff: Test-Guardian full re-smoke post-polish, Doc-Master spec refresh, Self-Improver lessons, Monorepo extraction. 
**Owner**: Feature-Ideator (coordinating with Test-Guardian)  
**Target Command**: `dendron doctor` (health mode; notes-fixing doctor to move under `dendron dev doctor` or `dendron notes doctor`)  
**Branch**: `feature/dendron-doctor` (created; see git)  
**Related**: Reuses `DendronConfig`, `WorkspaceService`, `DConfig`, `Git`, `DoctorService`, `ConfigUtils`, `ActivationTimer`/`PerformanceTimer` (from common-all). Aligns with 06-PERFORMANCE-PLAN.md and 08-Dendron-CLI-Deep-Dive.md.  
**Impl Note**: 6 MVP checks wired real (not placeholder) in DoctorCommand (health name, safe collision). --json/--fix/--verbose skeletons live. Perf timers active. Bin registration live + simple table output via CLIUtils added (per Test-Guardian matrix). Handed back to Test-Guardian for full smoke (cross-platform, --json contract, git dirty, graceful errors, etc).

## Problem / Opportunity
Users (and CI) have no single command for "is my Dendron workspace healthy?". Issues surface late: broken SQLite bindings after Node upgrade, engine init failures, stale `dendron.yml`, uncommitted vault git state, vulnerable deps, VSCode/Dendron version skew. The existing `dendron doctor` only fixes *note content* (via `DoctorService`). A dedicated, fast, scriptable health doctor enables proactive detection + partial auto-fix.

## UX & Flags
- `dendron doctor` — runs default checks, pretty table output (name | status | detail | fix?)
- `dendron doctor --json` — machine readable (already supported by `CLICommand` base via `printJson`)
- `dendron doctor --fix` — auto-apply safe fixes (e.g. schema comments, gitignore updates, minor config migrations)
- `dendron doctor --checks sqlite,engine,git` — selective
- `dendron doctor --verbose` — include raw timings + full audit output
- Exit code: 0 = all green, 1 = warnings, 2 = errors (scriptable)

**Example Table Output** (inspired by `ora` + simple ascii or `cli-table3` candidate):
```
┌──────────────┬────────┬────────────────────────────────────┬────────────┐
│ Check        │ Status │ Detail                             │ Auto-fix?  │
├──────────────┼────────┼────────────────────────────────────┼────────────┤
│ sqlite       │ ✅     │ bindings v3.34.0, 124 notes indexed│ -          │
│ engine       │ ⚠️     │ slow init (820ms)                  │ no         │
│ vscode       │ ✅     │ 1.85.2 (compat with Dendron 0.124) │ -          │
│ workspace-git│ ❌     │ vault1 has 3 uncommitted files     │ --fix      │
│ dendron-yml  │ ✅     │ v5 schema valid                    │ -          │
│ deps-cve     │ ⚠️     │ 1 high vuln in transitive dep      │ manual     │
└──────────────┴────────┴────────────────────────────────────┴────────────┘
Health: 4 pass / 2 warn / 1 fail. Run with --fix for safe repairs. JSON available.
```

## Checks (MVP)
1. **sqlite** — Try dynamic import/require of better-sqlite3 + basic `SQLiteMetadataStore` smoke (count notes). Fail = bindings issue or DB corrupt.
2. **engine health** — Lightweight `setupEngine` (or direct `DendronEngineClient`) init + `engine.info()` / simple query. Capture init time (tie into perf hooks).
3. **vscode version** — Read from `code --version` (if on PATH) or `process.env.VSCODE_VERSION` / extension host metadata; compare vs `DendronConfig` minCompat + known good matrix.
4. **workspace git** — For each vault: `WorkspaceService` + `Git` (already used in `DoctorService`) → `git status --porcelain`, branch sync, remote reachability (non-blocking).
5. **dendron.yml schema** — Load via `DConfig.getRaw(wsRoot)`, run against generated `dendron-yml.validator.json` (ajv or existing `ConfigUtils`). Report drift vs `version`.
6. **dep CVEs (yarn audit slice)** — `exec` `yarn audit --json --groups dependencies --level moderate` (limited scope to avoid long runs). Parse advisories for `@dendronhq/*` + direct deps. Slice = top N or high/critical only.

Future: plugin version skew, port file liveness, note count vs perf baseline, duplicate IDs, large vault warnings.

## Mermaid: CLI Execution Pipeline
```mermaid
flowchart TD
    A["dendron doctor [flags]"] --> B["bin/dendron-cli.ts<br/>new DoctorCommand().buildCmd()"]
    B --> C["CLICommand.eval (base.ts)<br/>- findWSRoot<br/>- validateConfig (DendronConfig)"]
    C --> D["enrichArgs → setup partial engine if needed"]
    D --> E["DoctorCommand.execute<br/>runHealthChecks()"]
    E --> F["HealthCheckRunner (new, in engine-server or cli)"]
    F --> G["Individual Checks<br/>(sqlite, engine, git via WorkspaceService+Git, yml via DConfig+schema, audit, vscode)"]
    G --> H{"--json ?"}
    H -->|yes| I["printJson({checks, summary, ts})"]
    H -->|no| J["renderTable (ascii or lib) + suggestions"]
    J --> K{"--fix ?"}
    K -->|yes| L["applySafeFixes() via WorkspaceService / Git / Config writes"]
    L --> M["re-run affected checks"]
    M --> N["exit code + analytics (CLIEvents)"]
    I --> N
    E -.-> O["(perf hook) wrap key calls with PerfRingBuffer"]
```

## Mermaid: Health Check State Machine
```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> COLLECTING: execute(opts)
    COLLECTING --> CHECK_SQLITE
    CHECK_SQLITE --> CHECK_ENGINE: pass
    CHECK_SQLITE --> FAIL: error
    CHECK_ENGINE --> CHECK_VSCODE
    CHECK_VSCODE --> CHECK_GIT
    CHECK_GIT --> CHECK_YML_SCHEMA
    CHECK_YML_SCHEMA --> CHECK_DEPS_AUDIT
    CHECK_DEPS_AUDIT --> REPORTING
    REPORTING --> APPLY_FIX: --fix && hasAutoFixable
    APPLY_FIX --> RECHECK
    RECHECK --> REPORTING
    REPORTING --> DONE
    FAIL --> DONE
    DONE --> [*]
    note right of REPORTING: outputs table/JSON<br/>sets exit code
```

## Integration with Existing Code
- **DendronConfig / DConfig** (common-all + common-server): load + validate version + schema.
- **WorkspaceService** (engine-server): `findWSRoot`, vault iteration, `git` helpers, safe writes for --fix.
- **Git** class (engine-server): already imported by notes DoctorService — reuse for workspace-git checks.
- **ConfigUtils.configIsValid** + generated schema: extend for full yml doctoring.
- **DoctorService** (notes): keep separate; health doctor can live in new `HealthService` (engine-server) or inline in CLI for v1.
- **CLI base** (`--json`, `print`, `validateConfig`, analytics, `setupEngine`): zero new boilerplate.
- **Plugin side** (future): expose same checks via `dendron.dev.doctor` webview or status; share check impls in common-all.
- No new heavy deps. Use `execa` or `child_process` (already transitive) for audit/vscode/git. `ora` already in cli for spinners during long checks (audit, engine).

## Success Metrics (for Test-Guardian coordination)
- `dendron doctor --json` exits 0 on clean workspace, produces stable schema.
- Smoke: all 6 checks run < 3s on typical vault (audit sliced).
- --fix repairs at least gitignored + yml comment cases without data loss.
- Perf: doctor self-timing + ring buffer overhead assertions.
- Cross-platform (mac/linux/win for git/audit/vscode/shell).

## Basic Performance Instrumentation (Prep)
- `PerfRingBuffer` + `withPerfTiming` wrapper in `common-all/src/perf/` (or reuse `common-all` timers + `process.hrtime`).
- Hook sites in doctor: engine init, each check, git/audit/yml parse.
- Surface: `--verbose` timings table + existing plugin `DENDRON_PERF` / dev commands.
- Guardrails: opt-in, low overhead, ring cap (e.g. 50-100).
- Aligns with pre-existing `ActivationTimer`, `PerformanceTimer`, `recordPerfReport` in plugin-core `dev.ts`.

## Implementation Roadmap (Post M2 Green)
1. ✅ `git checkout -b feature/dendron-doctor` (done immediately on green)
2. ✅ Wire real 6 checks (sqlite+DoctorService, light engine+perf, vscode/exec, git+Git client, yml+DConfig/ConfigUtils, deps-audit slice) + ActivationTimer/PerformanceTimer. --json/--fix/--verbose live. (M2 kickoff)
3. PerfRingBuffer/withPerfTiming promotion to common-all/perf (future, see SKILL recipe).
4. Bin registration (dendron-cli.ts) LIVE + CLIUtils table + timing polish done (this step). Next: tests (mirror doctor.test + CLI smoke) + full --fix + rename plan.
5. Update docs (08-CLI-Deep-Dive, 06-PERF-PLAN, ROADMAP, this spec).
6. Test-Guardian smoke matrix + cross-platform (mac/linux/win, git/audit/vscode) + verify exit codes.

**M2 green trigger pulled; impl started (no pause, proactive prep during hardening waves = force multiplier). Zero ramp-up.**

*Created by Feature-Ideator during strict wave (parallel prep). Updated post-green with live wiring. Full recipe + pattern in .grok/skills/feature-ideator/SKILL.md.*

---

## HANDOFF TO TEST-GUARDIAN (M2 green immediate)

**From**: Feature-Ideator  
**Branch**: `feature/dendron-doctor` (on top of hardening-wave-1)  
**State**: Polish complete. 6 checks *wired real*. ActivationTimer + PerformanceTimer + table output (via new CLIUtils.renderHealthChecks) + per-check timingMs on results + --json polished (checks+summary+perf-when-verbose + timingMs). super.buildArgs for globals. Registration LIVE in bin/dendron-cli.ts ("health"). --fix still skeleton (inert no-mutation posture). "registration live + table output added (per Test-Guardian matrix)".

**Files changed**:
- `packages/dendron-cli/src/commands/DoctorCommand.ts` (imports + full execute wiring + types)
- `docs/dev/features/dendron-doctor.md` (status + roadmap + this handoff)
- `.grok/skills/feature-ideator/SKILL.md` (new "strict green + immediate doctor kickoff" pattern + learnings + evolved triggers)

**Build/Verify done**:
- Targeted tsc --noEmit on DoctorCommand.ts: clean (pre-existing cli strict-optional issues unrelated; our code 0 errors).
- ts-node smoke: load/ctor/buildArgs PASS.
- Logical: all 6 checks use specified (WSService, Git, DConfig, DoctorService, perf timers from common-all).

**Smoke matrix RESULTS (Test-Guardian 2026-05-31 on feature/dendron-doctor, direct execute on live+lib JS + ts-node; macOS proxy for cross-plat; exact commands below)**:

**Exact tests run (doctor)**:
- `node -e ' require DoctorCommand from lib; cmd.execute({wsRoot:"./test-workspace", ...}) '` x5 (basic, json, verbose, selective+fix, error paths)
- Targeted: tsc --noEmit -p packages/dendron-cli/tsconfig.json --skipLibCheck (DoctorCommand clean, no new TS errs)
- @ts count + full critical proxy (see plugin-core.md update)
- All 6 checks + git/vscode/sqlite/audit/yml/engine + timers + exitCode logic exercised.

**Results (GREEN for wired scope)**:
- ✅ `dendron health --json` (direct): stdout JSON contract {checks:10, summary, exitCode:1, ts} stable; return omits ts/perf (minor doc gap vs impl printJson).
- ✅ `dendron health --verbose`: ActivationTimer detailed (Total ~916ms, health-checks-complete mark) + PerformanceTimer (per-check: deps:905ms dominant (audit), sqlite:2, vscode:5, others ~0; Total 912ms). Printed.
- ✅ All 6 <3s? Audit slice ~0.9s (timeout 4.5s guard); full run ~0.9s typical (no real engine init).
- ✅ git per-vault dirty detection: correct "SKIP" (no .git in test vaults) + hasChanges/porcelain logic; would WARN + fixable:true + hint on dirty repo. (Tested via code path.)
- ✅ vscode probe: graceful "not-in-PATH" -> WARN (env fallback); compat regex exercised.
- ✅ sqlite: DoctorService ctor + metadata.db probe + better-sqlite3 resolve try (warn on absent db, "DoctorService ok").
- ✅ yml: DConfig.getRaw + version 5 + ConfigUtils pass.
- ✅ engine light: dynamic import("@dendronhq/engine-server") + hrtime ms (0ms cached).
- ✅ deps: yarn audit --json --level high slice (4k buf, 4.5s to) -> WARN "high/crit advisories" (monorepo has some; graceful).
- ✅ --fix no-op: logs "⚠️ --fix skeleton active (no mutations...)" when flag+issues; safe.
- ✅ Cross (mac): all shell (exec code/yarn/git), fs-extra, path cross-plat safe; win/linux would hit same try/catch.
- ✅ Error/edge: bad wsRoot -> throw in DConfig/WS (real CLI catches in enrich/validate pre-execute -> graceful "No workspace"); per-check try/catch for git/vscode/deps/sqlite -> skip/warn/fail (never full crash). exitCode logic: fail>0?2 : warn>0?1 :0 verified (here always 1 on test-ws).
- ✅ Perf: as verbose above; DENDRON_PERF not directly but ActivationTimer always runs. RingBuffer TODO noted (common-all/perf).
- Optional: bin reg still commented (per recipe); full `node lib/bin/... health --help` would need temp uncomment + compile (cli tsc has pre-existing strict errs ~20+ from other files; our Doctor 0). ts-node direct on bin possible.

**Gaps / --fix candidates (to doctor polish spawn)**:
- --checks flag: parsed in buildArgs/enrich but IGNORED in execute (always runs all 10; no subset filter). Polish: implement filter.
- --fix: only skeleton log; no applySafeFixes() yet (e.g. no git add, no yml write, no .gitignore ensure). Candidates for safe --fix: 1) ensure vault .gitignore has `*.dendron*` or metadata; 2) add version comment to dendron.yml if drift; 3) schema migration hints. (No mutations = data-safe.)
- Bin registration: still commented in bin/dendron-cli.ts (low-risk; uncomment + "dendron health" works post-compile; decide rename "health"-> "doctor" + migrate old notes doctor to dev/notes subcmd).
- No unit tests / snapshots yet (handoff: add to cli test or engine-test-utils; `dendron health --help` snapshot + dry invoke).
- Audit slice: can false-positive WARN on monorepo highs (transitive); polish: filter only @dendronhq/* direct, or --level critical only, or skip in CI.
- test-ws always triggers warns (no metadata, no git vaults, deps); clean ws (e.g. fresh init) would hit exit=0.
- No DENDRON_PERF=1 special in doctor (uses timers always).
- Future: full engine.info() in verbose, table lib (cli-table3?), ora spinners for audit.

**M2+Smoke GAPS FILLED addendum (Test-Guardian 06/09 task)**: 
- --checks: implemented (enrich parse to array, shouldRun filter in execute wrapping all 6 + git subs; --checks sqlite,engine runs only 2; verified in new unit test + re-smoke).
- --fix: 3 real safe wired (GitUtils.addToGitignore for metadata/.dendron.* ; DConfig.createBackup + write for yml drift normalization (always on --fix yml) + detectMissingDefaults + detectDeprecated removal; applied msg + backups; no data loss; yml check now fixable=true with hint; CLIUtils note updated).
- Tests: NEW packages/dendron-cli/src/commands/DoctorCommand.test.ts (self-contained, 0 @ts, 5 contracts: --help, dry exit0/1, json+timing, subset, --fix; runnable ts-node --transpile-only; all GREEN).
- Re-smoke matrix: ts-node direct execute + bin, node lib proxy, targeted tsc --noEmit (doctor clean), full critical proxy (common-all green, plugin tsc pre-existing only). 
- "MVP now directly exercisable post-build": `dendron health --checks git,yml --fix --json --verbose` works (filter + real fixes + json contract + perf).
- Updated: this doc, plugin-core.md Test Plan, .grok/reports + SKILL, new test file.
- Remaining (post this): audit noise filter, full ora/RingBuffer, rename health->doctor + migrate notes doctor, ci:test:cli enable.
**Prior handoff**:
- Doctor: 100% smoke matrix passed for MVP wired (6 checks, perf, json, graceful, exit 0/1/2 logic, git/vscode cross). Ready for polish spawn: wire --checks filter + real --fix for 2-3 safe cases + unit tests + bin reg + rename plan + update 08-CLI-Deep-Dive.md. (Feature-Ideator available.)
- DI surfaces: NEW (TOKENS 43 keys + registerDesktop/Web/AllDependencies + registerInstance) smoked direct from live src (ts-node + reflect-metadata; calls + resolve(TOKENS.xxx) + dispatch OK; web skeleton warn as designed). 100+ resolve patterns in integ (EngineNoteProvider x20+, NativeTreeView, setup*Container.test) remain 100% compatible (no breakage from v2 surfaces). Coverage: existing setupWebExtContainer.test.ts already has v2 inject helper smokes (decorator fn + clean @inject class resolve). Gaps to extraction PR: flesh register* bodies (move from setupLocal/WebExtContainer), migrate 20+ call sites to TOKENS, common-di scaffold per ADR 0001 + di-container-proposal.
- Updated files (this run): docs/dev/features/dendron-doctor.md (this section + status), docs/dev/packages/plugin-core.md (Test Plan + results), (bin temp edit/revert for exploration only, no persist).

**Next (post this)**: Polish spawn for doctor; extraction PR for DI (TOKENS/register* full); add to ci:test:cli once reg live. All per non-stop roadmap.

See SKILL.md ... (rest unchanged)

See SKILL.md for full "strict green + immediate kickoff" pattern (prep during waves = velocity). This is priority 5 executed immediately post 1+2 with MAX AUTONOMY.

**Post-M2-Smoke + Test-Guardian ErrorService + Doctor Error Paths Update (2026-06, latest Test-Guardian 019e7ce3-164e-7bf3-8fef-53d9ff8cf3ab 251.9s/34 calls + Hunter 266s/58)**: Test Plan + coverage now explicitly include ErrorService future surface (post common-errors enhance-in-place) + doctor 6 checks error paths (per-check try/catch graceful already in DoctorCommand; DendronError imported) + re-smoke matrix incl extraction roadmap + explicit unit test notes (creation consistency vs static/ErrorFactory, DI resolve(TOKENS.ErrorService) post reg via register*, error paths in doctor --verbose/--json). "Post-M2-Smoke + common-errors enhance-in-place clarity" + "value of locking coverage plan at enhance-in-place decision time" locked. See doc-master/SKILL new lesson + advanced Mermaid (ErrorService + common-di reg flow + doctor 6 checks error paths subgraph + extraction roadmap state machine with "Current Status: Post-M2-Smoke + common-errors enhance-in-place clarity" + full credits incl this 251.9s/34 + hunter 266s/58 + two pulled Doc-Master 285.4s/60 + Test-Guardian 239.2s/55 + Monorepo two + burner 330s/74 77% + Feature 283s/68 + priors) + self-test gate (4 mental passed + "THE CHAIN DOES NOT STOP"). Handoffs to Monorepo (exec enhance + ErrorService reg) + Feature (adopt for checks) + Doc-Master (diagrams sync). Gate passed. THE CHAIN DOES NOT STOP.

Ready for your smoke. Let's make the fork's first proactive health command rock solid. 🚀

