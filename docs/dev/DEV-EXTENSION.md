# Running Dendron Personal (extension host)

## Source of truth for F5

`packages/plugin-core/package.json` → `"main": "./out/src/extension.js"`

That path is produced by **TypeScript compile**, not webpack.

```bash
cd packages/plugin-core
./scripts/dev-extension.sh   # or: yarn compile
# then F5 / Run Dendron Extension (Desktop, No Precompile)
```

## Webpack (`dist/`)

```bash
yarn webpack:dev:watch   # packages/plugin-core → dist/extension.js
```

Use for packaging / vsce. Do **not** assume F5 loads `dist/` unless you change `main`.

## After command changes

Always re-run `yarn compile` in `plugin-core` before reload, or new commands will show as “not found”.
