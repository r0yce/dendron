# Agent backlog reference

Canonical human doc: [docs/dev/BACKLOG.md](../../docs/dev/BACKLOG.md).

## BL-001 — Latest deps + green `bootstrap:init`

**Intent:** Stay on latest npm versions; fix breakages in code. Avoid downgrades except broken publishes or deferred platform work (CJS→ESM).

**Gate command:**

```bash
yarn bootstrap:init
```

**Do not re-introduce without BL-001 closure:**

- `yargs@17` in `dendron-cli` (target: ESM + yargs 18)
- `antd@4` only in `common-assets` for Less themes (target: antd 6 theme path)
- `remark-footnotes@5` (empty package on npm — use 4.0.1 or alternative)
- Root resolutions `ansi-regex@5`, `loader-utils@2` (CRA/react-dev-utils; target: remove)
- Conflicting duplicate `resolutions` keys in root `package.json`

**When editing deps:** Read the compromise table in `docs/dev/BACKLOG.md` before adding a new resolution pin.

## BL-002 — ESLint flat config

Pre-commit lint-staged needs `eslint.config.js` for ESLint 10.

## BL-003 — plugin-views bundler

Long-term webpack/CRA vs Vite/rspack; linked to BL-001.