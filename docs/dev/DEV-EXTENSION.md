# Running Dendron Personal (extension host)

## Source of truth for F5

`packages/plugin-core/package.json` → `"main": "./out/src/extension.js"`

That path is produced by **TypeScript compile**, not webpack.

```bash
yarn workspace @dendronhq/common-all build   # if you changed shared types/views
yarn workspace @dendronhq/plugin-core compile
# or: packages/plugin-core/scripts/dev-extension.sh
# then F5 / Run Dendron Extension (Desktop, No Precompile)
```

After **any** new command, webview provider, or service: recompile `plugin-core` or the palette shows “command not found” / stale behavior.

## Webpack (`dist/`)

```bash
cd packages/plugin-core
yarn webpack              # dev; SKIP_SENTRY=1 is default in script
yarn webpack:prod         # packaging (Sentry plugin fixed for v5 API)
```

Use for `.vsix` / vsce. **Do not** assume F5 loads `dist/` unless you change `main`.

### React webviews (preview, graph, calendar)

```bash
yarn workspace @dendronhq/dendron-plugin-views run build:dev
```

HTML Task Board / Dendron Home do **not** need this rebuild (inline HTML in host).

## Dual-build summary

| Artifact | Command | Consumer |
|----------|---------|----------|
| `out/src/extension.js` | `plugin-core` compile | **F5** |
| `dist/extension.js` | webpack | Package / VSIX |
| `dendron-plugin-views/build` | views `build:dev` | React panels |

## AI docs

Agents: start at [ai/README.md](../../ai/README.md) → context + **spec**.
