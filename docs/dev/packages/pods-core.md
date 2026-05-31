# Package: @dendronhq/pods-core

**Status**: Import/Export pod system. Modernization in progress. Detailed documentation created.

## Table of Contents

- [Overview](#overview)
- [Purpose & Responsibilities](#purpose--responsibilities)
- [Architecture](#architecture)
- [Key Pod Types](#key-pod-types)
- [Internal Dependency Graph](#internal-dependency-graph)
- [External Dependencies](#external-dependencies)
- [Build & Compilation](#build--compilation)
- [Current Modernization State](#current-modernization-state)
- [Modernization Roadmap](#modernization-roadmap)

---

## Overview

`pods-core` implements Dendron's powerful import and export system ("Pods").

It allows users to bring data in from (and push data out to) external services like Airtable, Notion, Google Docs, Markdown, JSON, etc.

---

## Purpose & Responsibilities

- Define the base interfaces for all Pods (`ExportPod`, `ImportPod`, etc.).
- Implement concrete pods for popular services.
- Provide configuration and transformation logic between Dendron notes and external formats.

---

## Architecture

```mermaid
graph TD
    A[pods-core] --> B[Base Pod Interfaces]
    A --> C[Export Pods (Markdown, JSON, Airtable, etc.)]
    A --> D[Import Pods]
    A --> E[Transformation Utilities]

    B --> F[Used by: dendron-cli, plugin-core]
```

---

## Key Pod Types

- `ExportPod`
- `ImportPod`
- `PublishPod`
- V2 pods (newer architecture)

Many pods live in `src/v2/pods/`.

---

## Internal Dependency Graph

```mermaid
graph LR
    common-all --> common-server --> engine-server --> pods-core
```

---

## External Dependencies

- Service-specific clients: `@notionhq/client`, `airtable`, `@octokit/graphql`, etc.
- `emailjs` (for some export features)
- Various format libraries (csv-writer, etc.)

Note: Some transitive type conflicts exist with newer `@types/node` (e.g. emailjs Timer vs Timeout issues). `skipLibCheck` is used as mitigation.

---

## Build & Compilation

Compiles cleanly at the source level. The emailjs type conflict (library ships .ts sources with Timer/Timeout incompatibility vs modern @types/node + TS 5.x) was resolved with a local `src/typings/emailjs.d.ts` ambient declaration + `paths` redirect in both tsconfig files. This completely isolates the bad types without affecting runtime.

---

## Current Modernization State

| Area              | Status     | Notes |
|-------------------|------------|-------|
| TypeScript        | Modern     | 5.5.4 |
| @types/node       | ^20.12.0   | Clean compile via local type shim for emailjs |
| Scripts           | Modernized | rimraf removed |
| Documentation     | Created    | This file |

---

## Modernization Roadmap

- [x] Resolved emailjs type conflict via local shim + paths redirect (compiles cleanly).
- [ ] Continue V2 pod migration if not complete.
- [ ] Participate in broader dependency cleanup.

---

**Last Updated**: During full one-wave modernization (May 2026)

See master tracker for overall progress.