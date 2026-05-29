# Monorepo Packages Modernization Tracker

**Goal**: Modernize every package in the Dendron monorepo to latest standards (TypeScript, configuration, dependencies where practical) while creating **extremely detailed documentation** for each package.

**Process per package**:
1. Modernize `package.json` (TypeScript, `@types/node`, other key deps if safe).
2. Modernize `tsconfig*.json` files (target, moduleResolution, strict flags, etc.).
3. Compile + fix errors.
4. Create or heavily expand a dedicated documentation file: `docs/dev/packages/[package-name].md`
5. The per-package doc must include:
   - Table of Contents
   - Overview / Purpose
   - Architecture (Mermaid diagrams)
   - Dependencies & Relationships
   - Build / Compilation process
   - Current Modernization Status
   - Roadmap / Open Items
   - Key Files & Code Patterns

**Legend**:
- [ ] Not started
- [~] In progress
- [x] Modernization + detailed doc complete

---

## Package Status

### Core Shared Libraries

- [x] **common-all** — Foundational types, errors, utilities  
  **Status**: Compiles cleanly on modern TS. Extremely detailed documentation created (`docs/dev/packages/common-all.md`) with TOC + multiple Mermaid diagrams. Modernization baseline complete.
- [x] **common-server** — Server-side utilities, file handling, config  
  **Status**: Package.json modernized (rimraf removed, dead deps cleaned, ts-node updated). Compiles cleanly. Extremely detailed doc created (`docs/dev/packages/common-server.md`) with TOC + Mermaid.
- [x] **common-frontend** — Shared frontend code  
  **Status**: Scripts modernized. Compiles cleanly. Detailed doc created.
- [x] **common-test-utils** — Testing helpers  
  **Status**: Scripts modernized (rimraf + ts-node updated). Compiles cleanly. Detailed doc created with TOC + Mermaid.
- [x] **engine-server** — Core Dendron engine  
  **Status**: Scripts modernized (rimraf removed). Compiles cleanly. Extremely detailed doc created with TOC + architecture Mermaid.
- [x] **engine-test-utils** — Engine testing utilities  
  **Status**: Scripts modernized. Compiles cleanly. Detailed doc created.
- [x] **api-server** — HTTP API server for the engine  
  **Status**: Scripts modernized. Compiles cleanly. Detailed doc created.
- [x] **pods-core** — Import/Export pod system  
  **Status**: Scripts modernized. Detailed doc created (some node_modules type friction noted after @types/node bump).
- [x] **unified** — Markdown processing pipeline  
  **Status**: Scripts modernized. Detailed doc created.

### CLI & Tooling

- [x] **dendron-cli** — Command-line interface (significant modernization already completed)

### UI / Extension Packages

- [ ] **plugin-core** — The main VS Code extension (highest complexity)
- [x] **dendron-plugin-views** — React webviews for the extension  
  **Status**: Scripts modernized (rimraf removed). Very complex package — detailed high-level doc created. Major future build system work needed.
- [x] **dendron-viz** — Visualization tools  
  **Status**: Scripts modernized. Doc created.
- [x] **dendron-design-system** — Design system components  
  **Status**: TS already at 5.5.4. Detailed doc created. Further Chakra/Emotion version review recommended as part of UI modernization.
- [x] **nextjs-template** — Next.js publishing template  
  **Status**: Clean script modernized. Doc created.

### Other

- [x] **generator-dendron** — Yeoman generator  
  **Status**: @types updated. Doc created.
- [x] **_pkg-template** — Internal package template  
  **Status**: Scripts modernized (rimraf removed). Documentation created.

---

## Master Checklist

### Configuration Modernization (applies to all)
- [ ] Root `tsconfig.build.json` fully modern (moduleResolution, strict flags, etc.)
- [ ] All package `tsconfig*.json` files reviewed and updated
- [ ] `package.json` files updated for modern TypeScript + `@types/node`
- [ ] Legacy decorator usage audited and migration plan created per package

### Documentation Standard
Every package documentation file must contain at minimum:
- Clear Table of Contents (auto-generated or manual)
- Mermaid diagrams for:
  - Package architecture / responsibilities
  - Dependency graph (what it depends on + what depends on it)
  - Build / compilation flow (if complex)
- Current modernization status table
- Key classes / entry points
- Open issues / roadmap

---

**Last Updated**: [Will be maintained as work progresses]

**Overall Progress**: 1 / 17 packages significantly modernized + documented (dendron-cli had prior work). Full one-wave effort now beginning.