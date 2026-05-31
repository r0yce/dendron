# @dendronhq/common-di

Typed DI tokens, tsyringe re-exports with ergonomics, and declarative registration facade.

**Scope (per ADR 0001)**: Pure, zero `vscode` leakage. All vscode-tied registration and ExtensionContext wiring stays in `@dendronhq/plugin-core/src/di`.

See:
- [ADR 0001: Introduce common-di](https://github.com/dendronhq/dendron/blob/dev/docs/dev/adr/0001-introduce-common-di-for-tsyringe-ergonomics.md)
- di-container-proposal.md
- MONOREPO-PACKAGES-MODERNIZATION-TRACKER.md

## Usage (Phase 2)

```ts
import { TOKENS, inject, injectable, registerAllDependencies, resolveOrThrow, DiToken } from "@dendronhq/common-di";

// TOKENS are string consts (compat) + branded for future
@injectable()
class Foo {
  constructor(@inject(TOKENS.SomeService) private svc: SomeService) {}
}

registerAllDependencies({ /* pure deps */ });
const inst = resolveOrThrow(TOKENS.SomeService);
```

## Extraction State

**Phase 2 live** (2026-05-31, Monorepo-Architect 019e7ce2... in isolated worktree): Real package scaffolded, thin shims + 2 proof reg migrations in plugin-core. Full credits + diagrams in ADR/TRACKER/GROK/SKILL.

**Post-extraction invariants enforced**:
- Compiles under root strict + decorator flags.
- No package except plugin-core may import from common-di (until 2nd consumer).
- Shim re-exports for compat window.
- Zero vscode in this package (verified).

## Credits (orchestra, non-stop chain)

Pulled: Doc-Master M2 019e7cd0-caa7 (285.4s/60 polished extraction phase1 + common-di readiness + 4+diagrams), Test-Guardian smoke 019e7cd0-df92 (239.2s/55, DI 43 TOKENS + factories + doctor gaps).

Prior: Monorepo phase1 019e7cc6-3d67 (211s/71), refinement 019e7ccc-d4a9 (190s/59), ts-expect-error-burner 019e7cb5-0da5 (252s/82, 14 burns + registerInstance), Self-Improver hooks, Feature-Ideator (doctor), Dependency-Hunter proposals + 4-axis review.

## License

Apache 2.0 (see root LICENSE.md)
