# Telemetry (Privacy-First — Personal Fork)

**Status:** Live default **OFF** (2026-07 improvement wave)  
**Source of truth:** `packages/common-server/src/analytics.ts` (`SegmentClient`)

## Principles

1. **Never on by default.** Missing `~/.dendron.telemetry` means telemetry is off (`disabled by fork default`).
2. **Zero vault content.** When enabled, only anonymous usage signals (command names, errors) — never note text or paths with content.
3. **User owns the switch.** Opt in only via command/CLI; opt out the same way.
4. **Local-first.** This fork does not require Segment/Sentry for daily use.

## Defaults (this fork vs upstream)

| Situation | Upstream Dendron | This fork |
|-----------|------------------|-----------|
| No telemetry config file | Enabled | **Disabled** (`DISABLED_BY_FORK_DEFAULT`) |
| `~/.dendron.no-telemetry` exists | Disabled | Disabled |
| Explicit enable command | Enabled | Enabled |
| `DENDRON_TELEMETRY_DEFAULT=on` | n/a | Treat missing config as enabled (escape hatch / tests) |

## How to opt in / out

**VS Code**

- Command palette: `Dendron: Enable Telemetry` / `Dendron: Disable Telemetry`  
  (network path — prefer CLI `--local` for this fork)

**CLI (recommended for this fork)**

```bash
# Privacy-first opt-in: local NDJSON only, never Segment/Sentry
yarn dendron dev enable_telemetry --local

# Network path (upstream-compatible; not recommended for personal use)
yarn dendron dev enable_telemetry

yarn dendron dev disable_telemetry
yarn dendron dev show_telemetry
```

Local file path: `~/.dendron.local-telemetry.ndjson`  
Session override: `DENDRON_LOCAL_TELEMETRY=1`

**Health check**

```bash
yarn dendron health --checks telemetry
# fresh install: pass + off (fork default)
# --local mode: pass + local-file only
# network enable: warn
```

## Local-file mode details

| | |
|--|--|
| Status enum | `ENABLED_BY_LOCAL_FILE` |
| Sink | `LocalTelemetry` in `common-server` |
| Cap | 5 MB; further writes skipped |
| Redaction | drops body/content/path/vault-like keys; truncates long strings |

## What still exists

Segment + Sentry client code remains for users who explicitly enable **network** telemetry. With the fork default or `--local`, **no network calls** are made.

## Related

- `packages/common-server/src/localTelemetry.ts` — NDJSON sink
- `packages/plugin-core/src/telemetry.ts` — wires workspace `disableTelemetry` + Segment
- `packages/plugin-core/src/_extension.ts` — Sentry init only when not opted out + prod stage (local mode skips)
- Doctor check `telemetry` in `DoctorCommand`
- Perf: `yarn dendron dev dump_perf` / command **Dendron: Dev: Show All Perf Reports**
