# Dendron CodeTours 🗺️

This directory contains a comprehensive suite of **CodeTour** guided walkthroughs for the Dendron monorepo.

## What is CodeTour?

[CodeTour](https://github.com/microsoft/codetour) (by Microsoft) is a VS Code extension that lets you record and play **interactive, step-by-step guided tours** of a codebase directly in the editor.

Each step:
- Opens a specific file (or directory, or virtual content step)
- Can highlight a precise selection of code
- Shows rich Markdown explanation (with custom CodeTour syntax for interactivity)
- Can auto-run VS Code commands, shell commands, focus views, etc.

## How to Use These Tours

1. **Install the extension** (if not already):
   - Search for "CodeTour" in VS Code Extensions (publisher: vsls-contrib)
   - Or click the recommendation when opening this workspace

2. **Open the CodeTour view**:
   - Go to the Explorer sidebar (or run `CodeTour: Focus on CodeTour View`)
   - You will see a list of available tours under this folder (organized in subdirectories)

3. **Start a tour**:
   - Click any tour title, or a specific step
   - Or run `CodeTour: Start Tour` from Command Palette (Cmd+Shift+P)
   - Keyboard: `Cmd+Right` / `Cmd+Left` to navigate steps while a tour is active

4. **Primary Tour**:
   - `00-core/00-dendron-onboarding.tour` is marked as the **primary tour**
   - On first open of this workspace (with the extension), you should be prompted to take it.

## Tour Organization

- **00-core/** — Foundational tours every developer (new or returning) should take first
  - `00-dendron-onboarding.tour` — **START HERE** (primary, comprehensive)
  - `01-architecture-mental-model.tour`
  - `02-extension-activation.tour`
- **01-debug/** — Everything about debugging, breakpoints, performance, doctor, attachment
  - `00-debugging-and-breakpoints.tour`
- **02-build/** — Build system, tasks, bootstrap scripts, watch modes, native modules
- **packages/** — Focused tours for each major package in `packages/`
  - One `.tour` file per package (or group for smaller ones)
  - Each highlights entry points, key classes, package.json scripts, README, and links to `docs/dev/packages/<pkg>.md`
- **advanced/** — Deep specialized tours (perf, testing, DI/tsyringe, TypeScript modernization, publishing pipeline, etc.)

## CodeTour Features Utilized Across These Tours

These tours deliberately exercise **every major feature** of CodeTour:

- **Content steps** (virtual steps with no file — great for intros/outros)
- **Directory steps** (focus entire folders in Explorer)
- **File + line + selection** steps (precise code highlighting)
- **Pattern-based steps** (resilient to line number shifts using regex)
- **Step titles** via `title` field or leading `# Heading` in description (auto-extracted)
- **Rich Markdown** in descriptions
- **File references**: `[Open README](./README.md)`
- **Step references**: `[#3]` or `[Skip to setup][#5]`
- **Tour references**: `[Debugging Tour][Debugging Dendron with Breakpoints]`
- **Code fences** with automatic **"Insert Code"** action
- **Shell commands**: `>> yarn bootstrap:build:fast` (click to run in integrated terminal named "CodeTour")
- **Command links**: `[Run compile task](command:workbench.action.tasks.runTask?["compile:plugin-core"])`, `[Open URL](command:vscode.open?...), Start other tour, etc.
- **Auto commands** on step entry via `commands` array (e.g. focus "debug:breakpoints" view)
- **`view`** property to auto-focus specific VS Code views (including all `debug:*` views)
- **`nextTour`** + numbered titles for automatic "Next Tour" / "Previous Tour" links at tour ends/starts
- **`isPrimary`** for the main onboarding tour
- **`when`** conditional visibility (example: macOS-only tour using `isMac`)
- **Git `ref`** (some tours pinned to `main` or `codetour` branch for stability)
- **Tour markers** in gutter (hover lines with markers to discover/jump into tours)
- Organized in **arbitrarily nested subdirectories** under `.tours/`

## Tips for Maximum Value

- Take the **Onboarding** tour first.
- When a step has a `>>` shell command, click it — it opens a dedicated "CodeTour" terminal and runs it.
- Use the CodeTour tree view (not just the comment UI) to jump between steps or tours.
- For debugging tour: have a second VS Code window or use the **Attach** configs while the tour walks you through launch.json and common breakpoint locations.
- Many steps link to the deep `docs/dev/*.md` files — read those for even more detail.
- Tours are versioned with `ref` where it makes sense so they don't drift too badly; rebase them as the `codetour` branch evolves.

## Maintaining These Tours

- After big refactors, run the CodeTour tree commands to edit/re-record steps.
- Consider adding the [CodeTour Watch](https://github.com/marketplace/actions/codetour-watch) GitHub Action to CI to detect tour drift on PRs.
- New contributors: add a new focused tour under the appropriate subdirectory and link it from the onboarding tour.

## Related Resources in This Repo

- `docs/dev/` — The canonical deep technical documentation (read in parallel with tours)
- `.vscode/launch.json` + `tasks.json` — The debugging heart
- `dendron-main.code-workspace` — Recommended multi-root workspace for development
- `FORK-README.md` + root `README.md`

Happy touring! This should take a new developer from zero to "I can actually contribute meaningful changes" in hours instead of weeks.

— The Dendron go-to-work fork maintainers
