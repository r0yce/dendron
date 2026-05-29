# Package: _pkg-template

**Status**: Internal template for new packages. Modernization complete. Documentation created.

## Table of Contents

- [Overview](#overview)
- [Purpose](#purpose)
- [Structure](#structure)
- [Modernization State](#modernization-state)
- [Usage](#usage)

---

## Overview

This is the template used by the monorepo tooling to scaffold new packages. It provides the standard `package.json`, tsconfig, and basic structure.

---

## Purpose

- Ensure consistency across all packages in the monorepo
- Provide starting point with modern baseline (post-upgrade)
- Include common scripts, engines, publishConfig, etc.

---

## Structure

- `package.json` (template variables like $PKG_NAME)
- `tsconfig.json` and `tsconfig.build.json`
- Basic `index.ts`
- README and LICENSE

---

## Modernization State

Scripts updated to remove rimraf (now uses pure Node `fs.rmSync`).

This template now reflects the modernized state of the monorepo.

---

## Usage

Used internally when generating new packages via the generator or manual scaffolding.

---

**Last Updated**: During full one-wave modernization (May 2026)

See master tracker for overall progress.