# .github Directory Documentation (Archived)

> **Note:** This directory has been archived as `github-archive/` in this personal fork.
> The original `.github/` contained the full CI/CD, automation, and community configuration for the upstream Dendron project.
> It has been preserved here for historical reference and learning purposes.

This document provides a complete inventory and explanation of every file that originally lived in `.github/`.

---

## Directory Overview

```
.github/
├── FUNDING.yml
├── auto_assign.yml
├── stale.yml
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   ├── feature_request.md
│   ├── pod-request-template.md
│   ├── seed-request.md
│   ├── testimonial.md
│   └── work-item.md
├── config/
│   └── issue-labler/
│       ├── labler-v1.yml
│       ├── labler-v2.yml
│       ├── labler-v3.yml
│       └── labler-v4.yml
└── workflows/
    ├── ci.yml
    ├── ci-perf.yml
    ├── ci-windows-test.yml
    ├── performace-tests.yml          # (note the typo in original filename)
    ├── publish-extension-dendron-minor.yml
    ├── publish-extension-dendron-patch.yml
    ├── publish-extension-nightly.yml
    ├── create-release-branch.yml
    ├── create-release-image.yml
    ├── create-release-image-patch.yml
    ├── create-early-seed-branch.yml
    ├── hackathon-create-test-image.yml
    ├── issue-labler.yml
    ├── no-response.yml
    ├── proto.yml
    └── releasepages.yml
```

---

## Root-Level Configuration Files

### FUNDING.yml
- **Purpose**: GitHub Sponsors / funding links for the project.
- **Content**: Primarily pointed to Dendron's own subscription page (`https://accounts.dendron.so/account/subscribe`).
- **Upstream behavior**: Displayed a "Sponsor" button on the repository.

### auto_assign.yml
- **Purpose**: Configuration for the [auto-assign GitHub app](https://github.com/kentaro-m/auto-assign).
- **Behavior**:
  - Automatically added reviewers and assignees to pull requests.
  - Core team members listed: `kevinslin`, `tma66`, `hikchoi`, `Harshita-mindfire`, `namjul`.
  - Skipped PRs containing the keyword `wip`.
  - Added 2 reviewers by default.

### stale.yml
- **Purpose**: Configuration for the [Stale GitHub Action](https://github.com/actions/stale).
- **Behavior**:
  - Issues became stale after **90 days** of inactivity.
  - Stale issues were closed after an additional **7 days**.
  - Issues labeled `type.epic` were exempt.
  - Applied the label `status.stale` when marking issues.

---

## ISSUE_TEMPLATE/

All templates used the old GitHub issue form format (YAML frontmatter + Markdown).

### bug_report.md
- Primary template for reporting bugs.
- Included a required triage checkbox block (`issue_labeler_regex_version=4`).
- Categorized areas: Workspace, Lookup, Views, Schema, Pod, Publish, Markdown.
- Asked for Dendron version, VS Code version, CLI version, and log file attachment.

### feature_request.md
- Used for both enhancements and new features.
- Similar triage + area categorization as bug reports.
- Asked for problem description, desired solution, and alternatives considered.

### pod-request-template.md
- Specialized template for requesting new **Pods** (import/export plugins).
- Sections: Import, Build, Export, Configuration, Example Use Cases.
- Auto-assigned to `kpathakota`.
- Used older labeler version (`v3`).

### seed-request.md
- Template for requesting new **Seeds** (pre-built starter vaults).
- Focused on topic proposal + existing open-source source material.

### testimonial.md
- Simple template for users to share how they use Dendron.
- Not heavily structured.

### work-item.md
- Internal template used by the Dendron core team.
- Very minimal (just "Context" and "Proposal" sections).
- Marked as triaged by default.

---

## config/issue-labler/

This folder contained the evolution of the automatic issue labeling rules used by the [issue-labeler bot](https://github.com/dendronhq/issue-labler) (a custom Dendron tool).

### Evolution of the Labler

| Version | Focus | Notes |
|---------|-------|-------|
| `labler-v1.yml` | Early area-based labeling (UI, Workbench, Publishing, Pods, etc.) | Very coarse |
| `labler-v2.yml` | Introduced the "Onboard / Create / Retrieve / Structure / Publish" mental model | Major shift in taxonomy |
| `labler-v3.yml` | Refined v2 model + fixed triage detection | Used in many templates |
| `labler-v4.yml` | Final version — switched to `scope.*` instead of `area.*` | Matched the scopes in bug/feature templates (Workspace, Lookup, Views, Schema, Pod, Publish, Markdown) |

These files defined regex patterns that scanned issue bodies for checked boxes (e.g. `- [X] Workspace.`) and applied the corresponding labels automatically.

---

## workflows/

This was the heart of Dendron's CI/CD automation. Most workflows were tightly coupled to their internal release and testing processes.

### Core CI

- **ci.yml** — The main CI pipeline.
  - Ran on push to `master`/`release/*` and all PRs.
  - Matrix: macOS, Ubuntu, Windows + Node 14/16.
  - Suites: `cli`, `plugin`, `plugin-web`, Playwright (nextjs-template).
  - Heavy use of caching for `node_modules` and compiled `lib/` folders.
  - Used Xvfb on Linux for GUI tests.

- **ci-perf.yml** — Performance test suite (plugin-perf).
  - Required the `plugin-development` environment (secrets).
  - Only ran on master + manual dispatch.

- **ci-windows-test.yml** — Windows-specific CI, triggered only on branches matching `chore/windows-ci-*`.

- **performace-tests.yml** — Duplicate/older performance testing workflow (note the spelling "performace").

### Publishing & Releases

- **publish-extension-dendron-minor.yml** & **publish-extension-dendron-patch.yml**
  - Manually triggered (`workflow_dispatch`).
  - Bumped version, built the VSIX, published to VS Code Marketplace + Open VSX.
  - Also published packages to npm.
  - Required the `plugin-production` environment.

- **publish-extension-nightly.yml**
  - Scheduled (weekdays at 7:00 UTC).
  - Published a "nightly" build of the extension (did **not** publish to npm).
  - Guarded with `if: github.repository_owner == 'dendronhq'`.

- **create-release-branch.yml**, **create-release-image.yml**, **create-release-image-patch.yml**
  - Internal release engineering workflows for cutting release branches and container images.

- **create-early-seed-branch.yml**
  - Automation around early seed releases.

### Automation & Bots

- **issue-labler.yml**
  - Ran the custom issue labeling bot on issue events.
  - Used the configs in `config/issue-labler/`.

- **no-response.yml**
  - Classic "close issues with no response" bot.

### Other / Niche

- **proto.yml** — Likely related to protobuf generation (Dendron had some gRPC/proto usage in the past).
- **releasepages.yml** — Sent recent commits to an external changelog service (releasepages.dev).
- **hackathon-create-test-image.yml** — One-off workflow for hackathon events.

---

## Why This Directory Was Archived

In this personal fork (`go-to-work`), the entire `.github/` directory was renamed to `github-archive/` for the following reasons:

- Prevent accidental triggering of old upstream CI jobs after pushing the fork.
- Preserve institutional knowledge about how Dendron's release, testing, and automation systems worked.
- Allow deliberate, selective re-introduction of workflows later (if desired).

Many of these workflows reference internal secrets, environments (`plugin-production`, `plugin-development`), and custom bots that will no longer function outside the original `dendronhq` organization.

---

## Further Reading

- Original upstream repository: https://github.com/dendronhq/dendron
- Many of the release workflows were tied to Dendron's internal "patch / minor / nightly" release cadence.
- The issue labeling system evolved significantly over time as the team's mental model of "areas" vs "scopes" matured.

---

*This documentation was created as part of the personal fork maintenance effort in May 2026.*
