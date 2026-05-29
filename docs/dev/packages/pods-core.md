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

Compiles cleanly at the source level. Some node_modules type friction remains after the @types/node modernization.

---

## Current Modernization State

| Area              | Status     | Notes |
|-------------------|------------|-------|
| TypeScript        | Modern     | 5.5.4 |
| @types/node       | ^20.12.0   | Some node_modules conflicts |
| Scripts           | Modernized | rimraf removed |
| Documentation     | Created    | This file |

---

## Modernization Roadmap

- [ ] Resolve or better isolate emailjs / similar type conflicts.
- [ ] Continue V2 pod migration if not complete.
- [ ] Participate in broader dependency cleanup.

---

**Last Updated**: During full one-wave modernization (May 2026)

See master tracker for overall progress.