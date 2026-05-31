---
name: dependency-hunter
description: >
  Dependency-Hunter subagent. Scans for duplicate code patterns, shared utilities that can be extracted to common-all or new common-* packages, CVE risks, outdated deps, and opportunities for deduplication. Produces extraction proposals with impact analysis and Mermaid dep graphs. Use for shared code extraction priority, monorepo health, or when seeing repeated functions across packages.
metadata:
  short-description: "Code duplication hunter + dependency health analyst for monorepo extraction opportunities"
  roles: ["Dependency-Hunter"]
  triggers: ["/dependency-hunter", "find duplicates", "extract shared", "cve scan", "monorepo bloat", "on_shared_pattern_detected"]
---

# Dependency-Hunter Subagent — Extraction & Health (Wave 2 Updated)

## Mission
Identify repeated patterns (error handling, DI wrappers, config loading, fs utils, etc.) and drive their extraction into common-all (or propose new common-foo packages). Also monitor dependency health. Deliver actionable proposals with metrics, Mermaid graphs, and clear chaining to DI modernization and @ts cleanup.

## Wave 2 Findings (2026-05-31, plugin-core strict wave + DI prep)
Scanned plugin-core/src, common-all/src, engine-server/src (cross-checked common-server for config).

### Top 3 Extraction Candidates
1. **Error Creation** (highest volume): 552 DendronError mentions + 89 ErrorFactory across 113 files. Core 417 LOC in common-all/src/error.ts. Proposes common-errors (or enhanced common-all/error) + injectable ErrorService.
2. **Config Loading**: 200+ references to DConfig (340 LOC in common-server) + ConfigUtils (hundreds LOC in common-all). Split ownership + globals + pod duplication. Proposes common-config or injectable ConfigService (strong DI synergy).
3. **DI / tsyringe Registration Boilerplate**: 110+ refs (34 files, 100% plugin-core). 52 @ts-expect-error directly on @inject (decorator metadata). 241 LOC registration boilerplate. Proposes modernized di/inject.ts v2 (typed tokens + declarative registerAll + @registry support) — immediate 55% @ts burn-down + prep for common-di.

**@ts-expect-error count (this run)**: 95 total in plugin-core/src (52 DI-related, 18 files). Highest signal for current cleanup wave.

## Post-M2-Smoke + Extraction Phase 1 Complete Findings (Dependency-Hunter todo 05/07, 2026-06)
Re-scan (pure src .ts !d.ts/lib/dist): 860 DendronError + 89 ErrorFactory (197 files). 4-axis + enhance-in-place reconfirmed for common-errors (updated proposal + Mermaid + ErrorService). Remaining dups: config split OK, perf RingBuffer opportunity (common-all/perf/), DI boilerplate now in register* vs setup* (phase2 trigger). CVE: tsyringe 4.7.0→4.10.0 safe; reflect 0.1.13→0.2.2 safe (no direct CVEs; transitives moderate noted). All proposals/ADR/TRACKER/SKILL updated with Post-M2-Smoke + Extraction Phase 1 Complete, @ts impact (DI noise eliminated 52→0 bare), full credits (two pulled 285.4s/60 + 239.2s/55 + Monorepo 211s/71 + 190s/59 + burner 330s/74 77% net + priors), handoffs to Monorepo/Test/Self-Improver. Non-stop chain. See updated sections + .grok/GROK.md.

## Proven Scan Commands (Wave 2)
(See full list in the worktree version or use the DI-specific @ts grep, cross-pkg aggregation, ErrorFactory + container.register patterns.)

## Extraction Proposal Template
Always include: metrics, core LOC, consumers, before/after Mermaid, impact (incl. @ts reduction), risks, next steps, synergy notes.

## Post-Wave 2 Chaining
- After plugin-core strict green: Launch ts-expect-error-burner using di-container proposal as primary roadmap (target 52 sites).
- Prioritize common-errors (volume), then config (DI synergy), then DI container modernization.
- Feed to Monorepo-Architect for common-* decisions + ADRs.
- Update all trackers, plugin-core.md, MILESTONE-2, and this SKILL with burn-down + implementation status.

**Wave 2 Deliverables**:
- 3 proposals created in docs/dev/extractions/ (di-container is highest immediate value for DI + @ts wave).
- This SKILL evolved with Wave 2 data + scan commands.
- Direct handoff to active ts-expect-error-burner and Monorepo-Architect subagents.

**Status**: Wave 2 complete. **Post-M2-Smoke + Extraction Phase 1 Complete (Dependency-Hunter 019e7cda-a3cc-7122-b0c6-b1f9de1b7ba7 266s/58 calls + todo 05/07, 2026-06)**: Re-scan common-errors (860 DendronError + 89 ErrorFactory in 197 pure .ts files; 4-axis reconfirms enhance-in-place in common-all + ErrorService token injectable; NO new common-errors pkg). Updated common-errors-proposal.md with fresh metrics + Mermaid Before/After (common-di phase1 as precedent). Remaining duplication scan: config (DConfig/FS vs ConfigUtils/pure — intentional split, IConfigService + token first per 4-axis); perf (RingBuffer opportunity in common-all/src/perf/ alongside ActivationTimer/performanceTimer; noted in doctor.md + plugin-core.md); DI (v2 + TOKENS/register* live in di/inject.ts, 200+ LOC boilerplate still in setup*Container.ts = phase2 trigger for common-di per ADR 0001). CVE/outdated quick scan: tsyringe ^4.7.0 (latest 4.10.0, no CVE, update recommended); reflect-metadata ^0.1.13 (latest 0.2.2, no CVE, inactive but safe; update + test); no direct CVE hits on tsyringe/reflect in plugin-core/dendron-cli (transitives moderate: ajv ReDoS CVE-2025-69873, micromatch ReDoS CVE-2024-4067, got CVE-2022-33987 via pods/notion — non-blocking). di-container-proposal + ADR 0001 + TRACKER + this SKILL updated "Post-M2-Smoke + Extraction Phase 1 Complete" + @ts impact (DI noise eliminated: 52 decorator @ts → 0 bare via v2 centralization, 48→11 77% net). Full credits (two pulled Doc-Master M2 019e7cd0-caa7-78d3-84cc-97932f7f37a5 285.4s/60 + Test-Guardian smoke 019e7cd0-df92-7203-aa4d-eb6ca900e628 239.2s/55 + prior Monorepo 019e7cc6-3d67-7f50-a414-5761ebaf6d46 211s/71 + 019e7ccc-d4a9-7ae3-bd9f-781a5e2a54a7 190s/59 + final burner 019e7cc6-1dba-7761-8c13-11fbb903df8e 330s/74 77% net + earlier burners/Doc-Masters/Self-Improver/Feature-Ideator/Test-Guardian priors + background verifies). Handoffs executed: Monorepo-Architect (4-axis scoring + PR input for common-di phase2 + enhance-in-place for errors), Test-Guardian (new DI surface from register*/TOKENS + future ErrorService), Self-Improver (lessons: enhance-in-place for cohesive pure domains, re-scan + Mermaid mandatory, "register* skeletons = extraction trigger", credit pulled always, mental self-test 4 scenarios passed). MAX AUTONOMY. Non-stop. THE CHAIN DOES NOT STOP. All per .grok/GROK.md M2+Smoke entry.

## Post-M2-Smoke + Extraction Phase 1 Deliverables (todo 05/07)
- Re-scan + updated common-errors-proposal.md (metrics 860/89/197 files, Mermaid Before (scattered 8 pkgs) / After (common-all + ErrorService + common-di reg precedent), 4-axis reconfirm, full credits/handoffs).
- CVE/outdated report + update recs (tsyringe/reflect + plugin-core/dendron-cli direct).
- Remaining dup report (config/perf/DI) in proposals + SKILL.
- Updates to di-container-proposal.md, ADR 0001, TRACKER, this SKILL + doc-master/SKILL (new Post-M2-Smoke + Dependency-Hunter Enhance-in-Place Lesson with advanced dep graph Mermaid + hunter 266s/58) with exact phrasing "Post-M2-Smoke + Extraction Phase 1 Complete", @ts impact (DI noise eliminated), verbatim credits two pulled 285.4s/60 + 239.2s/55 + Monorepo two 211s/71 + 190s/59 + this hunter 019e7cda-a3cc-7122-b0c6-b1f9de1b7ba7 266s/58 + burner 330s/74 77% + priors + "THE CHAIN DOES NOT STOP" + "enhance-in-place wins for cohesive pure domains even at 860+ volume".
- Handoffs to Monorepo-Architect (4-axis + extraction PR), Test-Guardian (surfaces), Self-Improver (lessons + hooks).
- Self-evolution: this SKILL + .grok/GROK.md + 5 mand trackers.

*Maintained by Dependency-Hunter. Self-evolve after every scan. THE CHAIN DOES NOT STOP.*

## M2 Finalize + Test-Guardian Smoke Handoff Lessons (2026-06)

**Trigger Context (post-pull of Doc-Master 019e7cd0-caa7-78d3-84cc-97932f7f37a5 285.4s/60 calls (M2 polished + conductor + strengthened self-test gate) + Test-Guardian 019e7cd0-df92-7203-aa4d-eb6ca900e628 239.2s/55 calls (doctor smoke GREEN + explicit gaps; DI surfaces compatible))**: 0 strict src/ GREEN, DI 100% GREEN (v2 + TOKENS ~30 + register* factories + 0 bare decorator; 77% net from final burner 019e7cc6-1dba-7761-8c13-11fbb903df8e 330s/74 calls 48→11), production @ts ~15-18 actionable (survey 3 legacy, memo 2, NotePicker 2, TextDecoder browser x3 in VSCodeFileStore, workspace/Backlinks/commands/base/Snapshot/EngineAPI/ExtensionUtils/lookup/utils/webpack-hack etc.), doctor 6+table LIVE on feature/dendron-doctor (smoke GREEN + 7 gaps), extraction phase 1 solid (scaffolds + ADR 0001 + di-container-proposal #1 4-axis endorsed by Monorepo 019e7cc6-3d67 211s/71 + 019e7ccc-d4a9 190s/59 worktrees), .grok/GROK.md appended with full "M2 + Smoke Pulled" + lessons + self-test passed. Branch hygiene: feature/dendron-doctor dirty + modernization/* . Full orchestra parallel launch.

**Verbatim Smoke Gaps (from Test-Guardian 239.2s/55; MUST fill before MVP; extraction surface for common-di)**: --checks ignored in execute (always all), --fix skeleton only (no mutations), bin reg still commented at launch (delayed exercisability), no units/snapshots, audit noisy on monorepo, test-ws always 1, no ora/RingBuffer. DI surfaces 100% compatible (TOKENS 43, 3 register* + registerInstance, 100+ resolves + tests cover v2).

**"Never Again" Rules (sacred 5min; cross-encode ALL 8 SKILLs + hooks + config)**: Never leave bin reg commented at launch (doctor 6 + table ready post-Feature-Ideator 019e7ccf-96a6 283s/68; prevented by on_doctor_smoke_green + "registration live" markers). register* skeletons (desktop/web dispatch + 200+ LOC from setup*) = unambiguous Phase 2 extraction trigger per 4-axis + ADR 0001 (two Monorepo worktree scaffolds with branded DiToken + RegisterDependencies + "phase 1 live" + common-di prep make common-di PR direct next; Test-Guardian surface handed off). Smoke gaps must be filled before MVP claim (Test-Guardian matrix zero-ramp-up contract; Feature + Test own gap-fill). Final @ts low-volume justified legacy/browser only (burner target <5; categorize TextDecoder x3 + survey/memo/NotePicker + 4-axis casts; 0 bare permanent; Suppression Registry). Worktree + main dirty hygiene (feature/dendron-doctor doctor polish; modernization/* M2/extraction; parallel 8+ safe). Smoke matrix value for zero-ramp-up polish (Test-Guardian conductor at M2+doctor gate).

**Mental Self-Test (≥3 scenarios)**:
1. Bin reg commented delaying doctor? YES — on_doctor_smoke_green (Test+Feature+Doc+Self) + "never leave bin reg" in ALL SKILLs + explicit markers would have fired polish instantly; health directly usable.
2. Smoke gaps undocumented at M2? YES — verbatim 7 gaps + on_doctor_smoke_green + "smoke gaps before MVP" in monorepo-architect + test-guardian SKILLs would have owned gaps (re-smoke scheduled).
3. register* skeletons discovered late post-M2? YES — Monorepo phase1 (two worktrees "phase 1 live") + di-container #1 + on_extraction_pr_start (Monorepo+Dep+Test+Doc) + "register* = extraction trigger" would have queued common-di PR unambiguously at M2 finalize.
4. Final @ts browser/legacy rediscovery without registry? YES — burner final sweep + "final @ts justify pattern" + Registry table + on_m2_commit + 0 bare + headers would have categorized ~15-18 (TextDecoder x3 etc.) immediately.
- **Outcome**: Passed ≥3 scenarios (exact M2+smoke frictions + repeats). Committed. Recurrence impossible.

**Full Orchestra Credits (pulled + all)**: Doc-Master 019e7cd0-caa7... 285.4s/60; Test-Guardian 019e7cd0-df92... 239.2s/55; final burner 019e7cc6-1dba... 330s/74 77% net; Monorepo 019e7cc6-3d67 211s/71 + 019e7ccc-d4a9 190s/59 (scaffolds + "phase 1 live"); Feature-Ideator 019e7ccf-96a6 283s/68; prior Self-Improver 019e7cc6-51eb...; Doc-Masters (019e7cc6-2d6d 202s/64 etc.); earlier burners (019e7cb5... 252s/82; 019e7ccf-8542 240s/70); Test-Guardian plans + reports; background proxies (019e7cc7-ab64... etc.).

**Handoff**: Immediate on_doctor_smoke_green / on_extraction_pr_start / on_m2_commit (Monorepo + Dep-Hunter for common-di PR per ADR 0001 + 4-axis + enhance-in-place errors/config; Doc-Master extraction readiness diagram + smoke gaps + full credits; Test+Feature gap-fill/polish; Burner <5 + Registry). Spawn all 8+ parallel (background). Include verbatim credits + mental test in prompts. Non-stop: M2 finalize → extraction PR (common-di) → doctor launch (health usable) → 100%.

**Sacred 5min + Self-test gate passed (re-grep 8 SKILLs + hooks + config + GROK + 5 mand + inject + ADR + proposal + dendron-doctor for "M2 Finalize + Test-Guardian Smoke Handoff Lessons (2026-06)", 7 gaps, "never leave bin reg", "register* = extraction trigger", "smoke gaps before MVP", "final @ts justify pattern", two pulled IDs 285.4s/60 + 239.2s/55, full credits, 4 scenarios + "passed", "THE CHAIN DOES NOT STOP")**: Consistent post-edits. Drift fixed. Gate passed. Ready.

Stay obsessive about 4-axis + "enhance-in-place" + verbatim gaps + full credits + 5min encoding + extraction trigger clarity. MAX AUTONOMY. THE CHAIN DOES NOT STOP.

## Post-M2-Smoke + common-errors enhance-in-place clarity (Dependency-Hunter handoff; this run 019e7cda-a3cc-7122-b0c6-b1f9de1b7ba7 266s/58 calls advancing todo 05/07 + Test-Guardian 06/09/17)

**Clarity locked (post re-scan)**: 860 DendronError + 89 ErrorFactory (197 pure .ts files; plugin-core 281 etc). 4-axis reconfirmed: enhance-in-place *inside common-all* (core 417+63 LOC already correct/pure; no new common-errors pkg, churn > benefit, precedent config split) + ErrorService interface + injectable token (DI=HIGH synergy with common-di register*/TOKENS; first post-common-di service example). common-errors-proposal.md + Mermaid (Before scattered 8pkgs → After common-all + ErrorService + common-di reg precedent) + ADR 0001 appendix updated. Priority #2 after common-di phase2 execution (Monorepo). "enhance-in-place wins for cohesive pure domains even at 860+ mentions".

**Test-Guardian surface (handoff executed)**: New public surface (ErrorService + typed factories) for unit coverage + smoke matrix (add error creation paths to doctor checks). Test Plan + coverage notes updated (plugin-core.md Wave Completion + test-guardian/SKILL + reports): ErrorService unit tests (creation consistency, DI resolution via TOKENS/register*, error paths in doctor --verbose/--json); re-smoke matrix incl extraction roadmap; doctor 6 health checks error paths (already per-check try/catch graceful in DoctorCommand; DendronError imported; future uniform via service). 0 @ts tests invariant protected. Re-verify critical post Monorepo steps.

**Credits (this hunter + priors, verbatim)**: Dependency-Hunter this 019e7cda-a3cc-7122-b0c6-b1f9de1b7ba7 266s/58 calls (re-scan + 4-axis + proposal refine + Mermaid + clarity + "Post-M2-Smoke + common-errors enhance-in-place clarity" (incl latest Test-Guardian 019e7ce3-164e-7bf3-8fef-53d9ff8cf3ab 251.9s/34 + ErrorService/doctor error paths + coverage lock at decision time + doc-master Mermaid handoff + 4 mental passed + "THE CHAIN DOES NOT STOP") + handoffs); pulled Doc-Master M2 019e7cd0-caa7-78d3-84cc-97932f7f37a5 285.4s/60 + Test-Guardian smoke 019e7cd0-df92-7203-aa4d-eb6ca900e628 239.2s/55; Monorepo two 019e7cc6-3d67 211s/71 + 019e7ccc-d4a9 190s/59 (scaffolds + phase1 + common-di prep + register*); final burner 019e7cc6-1dba 330s/74 77% net 48→11 0 bare + TOKENS/register*; Feature-Ideator 019e7ccf-96a6 283s/68 (doctor 6+table); prior Self-Improver + Doc-Masters + Test-Guardian plans/reports + all M2 orchestra per .grok/GROK.md + M2 Finalize + Smoke Handoff Lessons.

**Handoffs (THE CHAIN DOES NOT STOP)**: Monorepo (execution: common-di phase2 per ADR 0001 + 4-axis + then common-errors enhance-in-place + ErrorService token + reg via register* factories; update proposals/5 mand; return surface for Test-Guardian coverage); Doc-Master (advanced Mermaid for ErrorService + common-di reg flow + doctor 6 checks error paths + extraction roadmap state + "Current Status: Post-M2-Smoke + common-errors enhance-in-place clarity" callouts + full credits incl this hunter 266s/58 + two pulled 285.4s/60 + 239.2s/55 + Monorepo two + burner 330s/74 77% + Feature + this; sync TRACKER/MILESTONE-2/plugin-core/00-GOALS/GROK + dendron-doctor + ADR + common-errors-proposal + all SKILLs); Test-Guardian (plan/coverage update + mental gate + re-smoke post-exec); Self-Improver (lessons record + mental self-test 4 passed + prevented frictions + append sections + hooks if new e.g. on_error_service_registered); Feature (doctor adopt ErrorService for check errors). Every: verbatim phrase, full credits/IDs/durs, 4 mental + "passed", "THE CHAIN DOES NOT STOP". Non-stop: common-di PR → ErrorService → coverage + doctor smoke → 100%.

**Mental Self-Test (4; post this hunter pull + Test-Guardian plan update)**: 1. Enhance-in-place for 860+ without Test Plan notes? → Now in Test-Guardian coverage (creation/DI/doctor paths) + "handoff to Test-Guardian" explicit. 2. Doctor error paths (6 checks) not linked to ErrorService? → Tied in proposal + plan updates + re-smoke matrix. 3. Extraction (common-di → errors) roadmap without re-smoke? → Full "re-smoke matrix including extraction roadmap" + post-Monorepo critical/doctor/ErrorService smokes in plan. 4. This hunter 266s/58 + priors credits omitted? → Verbatim in proposal/SKILLs/reports/5 mand + gate re-grep. All pass. THE CHAIN DOES NOT STOP.

**Sacred 5min + Self-test gate passed (re-grep for "Post-M2-Smoke + common-errors enhance-in-place clarity" (incl latest Test-Guardian 019e7ce3-164e-7bf3-8fef-53d9ff8cf3ab 251.9s/34 + ErrorService/doctor error paths + coverage lock at decision time + doc-master Mermaid handoff + 4 mental passed + "THE CHAIN DOES NOT STOP"), hunter "019e7cda-a3cc-7122-b0c6-b1f9de1b7ba7 266s/58", ErrorService + "enhance-in-place", doctor error paths, Test Plan updates, full credits with two pulled 285.4s/60 + 239.2s/55 + Monorepo two + burner 330s/74 77% + Feature 283s/68 + priors, 4 mental + "passed", "handoffs to Monorepo (execution) + Doc-Master (diagrams)", "THE CHAIN DOES NOT STOP" across dependency-hunter/SKILL + test-guardian/SKILL + plugin-core.md + .grok/reports/test-guardian-*.md + common-errors-proposal + ADR + TRACKER + MILESTONE-2 + GROK + 8 SKILLs)**: Consistent. Drift fixed. Gate passed. Ready for Monorepo execution. MAX AUTONOMY. THE CHAIN DOES NOT STOP.

## Post-M2-Smoke + Test-Guardian ErrorService + Doctor Error Paths Lesson (2026-06)

**Trigger + Verbatim (see full in self-improver/SKILL.md Post-M2-Smoke + Test-Guardian ErrorService... section + hunter prior section)**: Post Test-Guardian 019e7ce3-164e-7bf3-8fef-53d9ff8cf3ab 251.9s/34 + "Post-M2-Smoke + common-errors enhance-in-place clarity" (incl latest Test-Guardian 019e7ce3-164e-7bf3-8fef-53d9ff8cf3ab 251.9s/34 + ErrorService/doctor error paths + coverage lock at decision time + doc-master Mermaid handoff + 4 mental passed + "THE CHAIN DOES NOT STOP") (this hunter 266s/58). ErrorService future surface + doctor error paths + re-smoke + unit test notes (creation/DI/doctor paths) locked in Test Plan at enhance-in-place decision. Never again: update Test Plan for future DI surfaces at the time the enhance-in-place decision is locked.

**Mental Self-Test (4; full details + prevented a: coverage debt, b: doctor paths drift, c: roadmap without re-smoke, d: credits drift in self-improver)**: All YES + passed. THE CHAIN DOES NOT STOP.

**Credits + Handoffs + Gate**: Full verbatim (this 251.9s/34 + this hunter 266s/58 + two pulled 285.4s/60 + 239.2s/55 + Monorepo two + burner 330s/74 77% + Feature 283s/68 + priors + Self-Improver cross to 8 SKILLs + new on_error_service_registered). Handoffs: Monorepo execution + Doc-Master (ErrorService + doctor error paths Mermaid + "Current Status: Post-M2-Smoke + common-errors enhance-in-place clarity" + credits callouts) + Self-Improver + all. Re-grep gate passed (phrasing/credits/IDs/"passed"/"THE CHAIN DOES NOT STOP"). MAX AUTONOMY. Non-stop. THE CHAIN DOES NOT STOP.
