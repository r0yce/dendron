# @dendronhq/common-di

Shared [tsyringe](https://github.com/microsoft/tsyringe) DI ergonomics for the Dendron monorepo.

- Central `inject` wrapper (TS 5+ decorator metadata absorption)
- Re-exports: `injectable`, `singleton`, `container`, `Lifecycle`, `registry`, `registerInstance`
- Core `TOKENS` for workspace/engine (vscode-specific tokens stay in `plugin-core`)

See [ADR 0001](../../docs/dev/adr/0001-introduce-common-di-for-tsyringe-ergonomics.md).