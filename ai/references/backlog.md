# Agent backlog reference

Canonical human doc: [docs/dev/BACKLOG.md](../../docs/dev/BACKLOG.md).  
Product status: [docs/dev/PRODUCT-ROADMAP.md](../../docs/dev/PRODUCT-ROADMAP.md) (sprints + awesome wave **complete**).

## BL-001 — Latest deps + green bootstrap

**Status:** Core platform **done** (TS 7, Babel 8, webpack 5, React 19, yargs 18). Residuals optional (CRA shrink, Vite stretch, some majors).

**Gate:** `yarn verify:local` / `yarn bootstrap:init` on clean clone when capacity allows.

Prefer code migrations over new root `resolutions` pins.

## BL-002 — ESLint flat config

Pre-commit lint-staged needs complete `eslint.config.js` for ESLint 10. Workarounds: `--no-verify` when compile-green and user accepts.

## BL-003 — plugin-views bundler

Long-term webpack/CRA vs Vite/rspack. Current: webpack **5.109** + CRA-ejected scripts; `build:dev` green.

## Packaging notes (2026-07)

| Build | Status |
|-------|--------|
| `plugin-core` `webpack` (dev) | 0 errors; circular-dep **warnings** if `DETECT_CIRCULAR_DEPS=1` |
| `plugin-core` `webpack:prod` | 0 errors after Sentry v5 factory fix |
| `plugin-core` `compile-web` | Residual node-builtin errors; **not** required for F5 |

## Agent implementation

Use [spec.md](./spec.md) playbooks; do not reopen completed PRODUCT-ROADMAP items unless fixing bugs.
